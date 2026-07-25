import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { DataProtectionService } from '../../common/security/data-protection.service';
import { isSafeValidationPattern } from '../../common/security/safe-validation-pattern';
import type { Prisma } from '../../generated/prisma/client';
import {
  FollowType,
  FormFieldType,
  LeadStatus,
  LeadType,
  PublishStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateFollowupDto } from './dto/create-followup.dto';
import type { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import type {
  LeadStatusInput,
  ListLeadsQueryDto,
} from './dto/list-leads-query.dto';
import { FormSubmissionSecurityService } from './form-submission-security.service';

const leadTypeMap = {
  agent: LeadType.AGENT,
  investment: LeadType.INVESTMENT,
  consult: LeadType.CONSULT,
} as const;

const leadStatusMap = {
  new: LeadStatus.NEW,
  contacted: LeadStatus.CONTACTED,
  qualified: LeadStatus.QUALIFIED,
  closed: LeadStatus.CLOSED,
  invalid: LeadStatus.INVALID,
} as const;

const followTypeMap = {
  phone: FollowType.PHONE,
  wechat: FollowType.WECHAT,
  visit: FollowType.VISIT,
  note: FollowType.NOTE,
} as const;

const exportLimit = 10_000;
const baseExportKeys = new Set(['name', 'phone', 'mobile', 'city', 'region']);

type LeadWithDetails = Prisma.LeadGetPayload<{
  include: {
    form: { include: { fields: true } };
    followups: {
      include: { adminUser: { select: { id: true; displayName: true } } };
    };
  };
}>;

const detailInclude = {
  form: { include: { fields: { orderBy: { sortOrder: 'asc' as const } } } },
  followups: {
    include: { adminUser: { select: { id: true, displayName: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly protection: DataProtectionService,
    private readonly submissionSecurity: FormSubmissionSecurityService,
  ) {}

  async createPublicLead(dto: CreatePublicLeadDto, request: RequestWithId) {
    const requestSecurity = await this.submissionSecurity.inspectRequest(
      dto,
      request,
    );
    const form = await this.prisma.leadForm.findFirst({
      where: {
        code: dto.formCode,
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        fields: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!form) throw new NotFoundException('表单不存在或尚未发布');

    const values = this.validateValues(form.fields, dto.values);
    const reservation = await this.submissionSecurity.reserve(
      form.id,
      dto,
      values,
    );
    if (reservation.existingLeadId) {
      const existing = await this.prisma.lead.findFirst({
        where: { id: reservation.existingLeadId, deletedAt: null },
        include: detailInclude,
      });
      if (existing) return this.serializeLead(existing);
      await this.submissionSecurity.invalidate(reservation);
      throw new BadRequestException('原提交记录已失效，请重新填写后提交');
    }

    const nameField = form.fields.find((field) => field.fieldKey === 'name');
    const mobileField = form.fields.find(
      (field) =>
        field.fieldType === FormFieldType.PHONE ||
        ['phone', 'mobile'].includes(field.fieldKey),
    );
    const name = nameField ? this.stringValue(values[nameField.fieldKey]) : '';
    const mobile = mobileField
      ? this.stringValue(values[mobileField.fieldKey]).replace(/\s+/g, '')
      : '';
    const payload = { ...values };
    if (nameField) delete payload[nameField.fieldKey];
    if (mobileField) delete payload[mobileField.fieldKey];
    const sourceDetail = {
      ...requestSecurity.sourceDetail,
      formVersion: form.version,
      formStartedAt: dto.formStartedAt ?? null,
      submitIpHash: requestSecurity.ipHash,
      userAgent: String(request.headers['user-agent'] ?? '').slice(0, 500),
      fieldLabels: Object.fromEntries(
        form.fields.map((field) => [field.fieldKey, field.label]),
      ),
    };

    try {
      const lead = await this.prisma.lead.create({
        data: {
          leadNo: this.createLeadNo(),
          formId: form.id,
          leadType: form.leadType,
          nameEncrypted: name ? this.protection.encrypt(name) : null,
          mobileEncrypted: mobile ? this.protection.encrypt(mobile) : null,
          mobileHash: mobile ? this.protection.searchableHash(mobile) : null,
          mobileMasked: mobile ? this.protection.maskMobile(mobile) : null,
          region: this.readRegion(values),
          source: requestSecurity.source,
          sourceDetail: sourceDetail,
          payloadJson: payload,
        },
        include: detailInclude,
      });
      await this.submissionSecurity.complete(reservation, lead.id);
      return this.serializeLead(lead);
    } catch (error) {
      await this.submissionSecurity.release(reservation);
      throw error;
    }
  }

  async list(query: ListLeadsQueryDto) {
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        include: detailInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.lead.count({ where }),
    ]);
    return {
      items: items.map((lead) => this.serializeLead(lead)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async exportCsv(
    query: ListLeadsQueryDto,
    adminUserId: string,
    request: RequestWithId,
  ) {
    const where = this.buildWhere(query);
    const total = await this.prisma.lead.count({ where });
    if (total > exportLimit) {
      throw new BadRequestException(
        `当前筛选结果共 ${total} 条，请缩小时间范围后再导出（单次最多 ${exportLimit} 条）`,
      );
    }

    const leads = await this.prisma.lead.findMany({
      where,
      include: detailInclude,
      orderBy: { createdAt: 'desc' },
    });
    const serialized = leads.map((lead) => this.serializeLead(lead));
    const dynamicColumns = new Map<string, string>();
    for (const lead of serialized) {
      for (const key of Object.keys(lead.values)) {
        if (!baseExportKeys.has(key) && !dynamicColumns.has(key)) {
          dynamicColumns.set(key, lead.fieldLabels[key] ?? key);
        }
      }
    }

    const headers = [
      '线索编号',
      '申请类型',
      '姓名',
      '手机号',
      '所在地区',
      '状态',
      '来源',
      '提交时间',
      '最近跟进时间',
      '下次跟进时间',
      '最近跟进记录',
      ...dynamicColumns.values(),
    ];
    const rows = serialized.map((lead) => [
      lead.leadNo,
      lead.typeLabel,
      lead.name ?? lead.values.name ?? '',
      lead.mobile ?? lead.values.phone ?? lead.values.mobile ?? '',
      lead.region ?? '',
      this.statusLabel(lead.status),
      lead.source ?? '',
      this.exportDate(lead.createdAt),
      this.exportDate(lead.lastFollowedAt),
      this.exportDate(lead.nextFollowAt),
      lead.followNote,
      ...[...dynamicColumns.keys()].map((key) => lead.values[key] ?? ''),
    ]);
    const content = `\uFEFF${[headers, ...rows]
      .map((row) => row.map((value) => this.csvCell(value)).join(','))
      .join('\r\n')}\r\n`;

    await this.prisma.auditLog.create({
      data: {
        adminUserId,
        action: 'lead_export',
        resource: 'lead',
        afterJson: {
          filters: {
            type: query.type ?? null,
            status: query.status ?? null,
            dateFrom: query.dateFrom ?? null,
            dateTo: query.dateTo ?? null,
          },
          count: total,
          format: 'csv',
        },
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        requestId: request.requestId ?? request.id,
      },
    });

    return {
      filename: `leads-${this.filenameTimestamp(new Date())}.csv`,
      content,
      count: total,
    };
  }

  async get(id: string) {
    return this.serializeLead(await this.findLead(id));
  }

  async updateStatus(
    id: string,
    status: LeadStatusInput,
    adminUserId: string,
    request: RequestWithId,
  ) {
    const current = await this.findLead(id);
    const nextStatus = leadStatusMap[status];
    if (current.status === nextStatus) return this.serializeLead(current);

    await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id },
        data: { status: nextStatus, lastFollowedAt: new Date() },
      }),
      this.prisma.leadFollowup.create({
        data: {
          leadId: id,
          adminUserId,
          followType: FollowType.STATUS_CHANGE,
          content: `线索状态调整为 ${status}`,
          previousStatus: current.status,
          nextStatus,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId,
          action: 'lead_status_update',
          resource: 'lead',
          resourceId: id,
          beforeJson: { status: current.status.toLowerCase() },
          afterJson: { status },
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          requestId: request.requestId ?? request.id,
        },
      }),
    ]);
    return this.get(id);
  }

  async addFollowup(
    id: string,
    dto: CreateFollowupDto,
    adminUserId: string,
    request: RequestWithId,
  ) {
    const current = await this.findLead(id);
    const nextStatus = dto.nextStatus
      ? leadStatusMap[dto.nextStatus]
      : current.status;
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.leadFollowup.create({
        data: {
          leadId: id,
          adminUserId,
          followType: followTypeMap[dto.followType],
          content: dto.content,
          previousStatus: current.status,
          nextStatus,
          nextFollowAt: dto.nextFollowAt ? new Date(dto.nextFollowAt) : null,
        },
      }),
      this.prisma.lead.update({
        where: { id },
        data: {
          status: nextStatus,
          lastFollowedAt: now,
          nextFollowAt: dto.nextFollowAt ? new Date(dto.nextFollowAt) : null,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId,
          action: 'lead_followup_create',
          resource: 'lead',
          resourceId: id,
          afterJson: {
            followType: dto.followType,
            nextStatus: dto.nextStatus ?? current.status.toLowerCase(),
            nextFollowAt: dto.nextFollowAt ?? null,
          },
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          requestId: request.requestId ?? request.id,
        },
      }),
    ]);
    return this.get(id);
  }

  async remove(id: string, adminUserId: string, request: RequestWithId) {
    await this.findLead(id);
    await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId,
          action: 'lead_delete',
          resource: 'lead',
          resourceId: id,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          requestId: request.requestId ?? request.id,
        },
      }),
    ]);
    return { deleted: true };
  }

  private async findLead(id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    });
    if (!lead) throw new NotFoundException('线索不存在');
    return lead;
  }

  private buildWhere(query: ListLeadsQueryDto): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = { deletedAt: null };
    if (query.type) where.leadType = leadTypeMap[query.type];
    if (query.status) where.status = leadStatusMap[query.status];
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined,
      };
    }
    return where;
  }

  private validateValues(
    fields: Array<{
      fieldKey: string;
      label: string;
      fieldType: FormFieldType;
      required: boolean;
      optionsJson: unknown;
      validationJson: unknown;
    }>,
    input: Record<string, unknown>,
  ) {
    const allowedKeys = new Set(fields.map((field) => field.fieldKey));
    const unknownKey = Object.keys(input).find((key) => !allowedKeys.has(key));
    if (unknownKey)
      throw new BadRequestException(`表单包含未知字段：${unknownKey}`);

    const values: Record<string, string | string[]> = {};
    for (const field of fields) {
      const raw = input[field.fieldKey];
      const empty =
        raw === undefined ||
        raw === null ||
        raw === '' ||
        (Array.isArray(raw) && raw.length === 0);
      if (field.required && empty) {
        throw new BadRequestException(`请填写${field.label}`);
      }
      if (empty) continue;

      if (field.fieldType === FormFieldType.CHECKBOX) {
        if (
          !Array.isArray(raw) ||
          !raw.every((item) => typeof item === 'string')
        ) {
          throw new BadRequestException(`${field.label}格式不正确`);
        }
        if (raw.length > 20) {
          throw new BadRequestException(`${field.label}选择数量过多`);
        }
        const selectedValues = raw.map((item) => item.trim());
        if (
          selectedValues.some((item) => !item || item.length > 100) ||
          new Set(selectedValues).size !== selectedValues.length
        ) {
          throw new BadRequestException(`${field.label}格式不正确`);
        }
        values[field.fieldKey] = selectedValues;
      } else {
        if (typeof raw !== 'string' && typeof raw !== 'number') {
          throw new BadRequestException(`${field.label}格式不正确`);
        }
        values[field.fieldKey] = String(raw).trim();
      }

      const normalized = values[field.fieldKey];
      const normalizedEmpty = Array.isArray(normalized)
        ? normalized.length === 0
        : normalized.length === 0;
      if (field.required && normalizedEmpty) {
        throw new BadRequestException(`请填写${field.label}`);
      }

      const options = Array.isArray(field.optionsJson)
        ? field.optionsJson.filter(
            (item): item is string => typeof item === 'string',
          )
        : [];
      const selected = values[field.fieldKey];
      if (
        options.length &&
        (Array.isArray(selected)
          ? selected.some((item) => !options.includes(item))
          : !options.includes(selected))
      ) {
        throw new BadRequestException(`${field.label}选项无效`);
      }

      const validation =
        field.validationJson && typeof field.validationJson === 'object'
          ? (field.validationJson as Record<string, unknown>)
          : {};
      const text = Array.isArray(selected) ? selected.join(',') : selected;
      const defaultMaxLength =
        field.fieldType === FormFieldType.TEXTAREA
          ? 2000
          : field.fieldType === FormFieldType.FILE
            ? 500
            : 200;
      if (text.length > defaultMaxLength) {
        throw new BadRequestException(`${field.label}内容过长`);
      }
      if (field.fieldType === FormFieldType.PHONE) {
        const normalizedPhone = text.replace(/[\s()-]/g, '');
        if (!/^\+?\d{6,20}$/.test(normalizedPhone)) {
          throw new BadRequestException(`${field.label}格式不正确`);
        }
      }
      if (field.fieldType === FormFieldType.NUMBER) {
        const numericValue = Number(text);
        if (!Number.isFinite(numericValue)) {
          throw new BadRequestException(`${field.label}格式不正确`);
        }
        if (
          typeof validation.min === 'number' &&
          numericValue < validation.min
        ) {
          throw new BadRequestException(
            `${field.label}不能小于${validation.min}`,
          );
        }
        if (
          typeof validation.max === 'number' &&
          numericValue > validation.max
        ) {
          throw new BadRequestException(
            `${field.label}不能大于${validation.max}`,
          );
        }
      }
      if (
        typeof validation.minLength === 'number' &&
        text.length < validation.minLength
      ) {
        throw new BadRequestException(`${field.label}内容过短`);
      }
      if (
        typeof validation.maxLength === 'number' &&
        text.length > validation.maxLength
      ) {
        throw new BadRequestException(`${field.label}内容过长`);
      }
      if (typeof validation.pattern === 'string') {
        if (!isSafeValidationPattern(validation.pattern)) {
          throw new BadRequestException('表单校验规则异常，请联系管理员');
        }
        if (!new RegExp(validation.pattern).test(text)) {
          throw new BadRequestException(`${field.label}格式不正确`);
        }
      }
    }
    return values;
  }

  private serializeLead(lead: LeadWithDetails) {
    const payload =
      lead.payloadJson &&
      typeof lead.payloadJson === 'object' &&
      !Array.isArray(lead.payloadJson)
        ? { ...(lead.payloadJson as Record<string, unknown>) }
        : {};
    const nameField = lead.form.fields.find(
      (field) => field.fieldKey === 'name',
    );
    const mobileField = lead.form.fields.find(
      (field) =>
        field.fieldType === FormFieldType.PHONE ||
        ['phone', 'mobile'].includes(field.fieldKey),
    );
    const name = this.protection.decrypt(lead.nameEncrypted);
    const mobile = this.protection.decrypt(lead.mobileEncrypted);
    if (nameField && name) payload[nameField.fieldKey] = name;
    if (mobileField && mobile) payload[mobileField.fieldKey] = mobile;
    const sourceDetail =
      lead.sourceDetail &&
      typeof lead.sourceDetail === 'object' &&
      !Array.isArray(lead.sourceDetail)
        ? (lead.sourceDetail as Record<string, unknown>)
        : {};
    const snapshotLabels =
      sourceDetail.fieldLabels &&
      typeof sourceDetail.fieldLabels === 'object' &&
      !Array.isArray(sourceDetail.fieldLabels)
        ? (sourceDetail.fieldLabels as Record<string, string>)
        : {};
    const fieldLabels = lead.form.fields.reduce<Record<string, string>>(
      (labels, field) => {
        labels[field.fieldKey] = field.label;
        return labels;
      },
      {},
    );
    Object.assign(fieldLabels, snapshotLabels);

    return {
      ...lead,
      leadType: lead.leadType.toLowerCase(),
      type: lead.leadType.toLowerCase(),
      typeLabel: lead.form.name,
      title: lead.form.title,
      status: lead.status.toLowerCase(),
      level: lead.level.toLowerCase(),
      values: payload,
      fieldLabels,
      name,
      mobile,
      followNote: lead.followups[0]?.content ?? '',
      followups: lead.followups.map((followup) => ({
        ...followup,
        followType: followup.followType.toLowerCase(),
        previousStatus: followup.previousStatus?.toLowerCase() ?? null,
        nextStatus: followup.nextStatus?.toLowerCase() ?? null,
      })),
      form: {
        id: lead.form.id,
        code: lead.form.code,
        name: lead.form.name,
        fields: lead.form.fields.map((field) => ({
          fieldKey: field.fieldKey,
          label: field.label,
          fieldType: field.fieldType.toLowerCase(),
        })),
      },
      nameEncrypted: undefined,
      mobileEncrypted: undefined,
      mobileHash: undefined,
      payloadJson: undefined,
    };
  }

  private readRegion(values: Record<string, string | string[]>) {
    const value = values.city ?? values.region;
    return typeof value === 'string' ? value : null;
  }

  private stringValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value.join(',') : (value ?? '');
  }

  private csvCell(value: unknown) {
    let text = Array.isArray(value)
      ? value.join('、')
      : value && typeof value === 'object'
        ? JSON.stringify(value)
        : String(value ?? '');
    if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  private statusLabel(status: string) {
    return (
      {
        new: '新线索',
        contacted: '已联系',
        qualified: '重点跟进',
        closed: '已结束',
        invalid: '无效线索',
      }[status] ?? status
    );
  }

  private exportDate(value?: Date | null) {
    if (!value) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .format(value)
      .replaceAll('/', '-');
  }

  private filenameTimestamp(value: Date) {
    const parts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(value);
    const read = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';
    return `${read('year')}${read('month')}${read('day')}-${read('hour')}${read('minute')}${read('second')}`;
  }

  private createLeadNo() {
    const date = new Date();
    const parts = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
      String(date.getHours()).padStart(2, '0'),
      String(date.getMinutes()).padStart(2, '0'),
      String(date.getSeconds()).padStart(2, '0'),
    ].join('');
    return `L${parts}${randomBytes(3).toString('hex').toUpperCase()}`;
  }
}
