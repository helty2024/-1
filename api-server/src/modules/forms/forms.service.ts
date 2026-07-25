import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  FormFieldType,
  LeadType,
  PublishStatus,
} from '../../generated/prisma/enums';
import { isSafeValidationPattern } from '../../common/security/safe-validation-pattern';
import { PrismaService } from '../prisma/prisma.service';
import type { SaveFormDto } from './dto/save-form.dto';

const leadTypeMap = {
  agent: LeadType.AGENT,
  investment: LeadType.INVESTMENT,
  consult: LeadType.CONSULT,
} as const;

const statusMap = {
  draft: PublishStatus.DRAFT,
  published: PublishStatus.PUBLISHED,
  offline: PublishStatus.OFFLINE,
} as const;

const fieldTypeMap = {
  text: FormFieldType.TEXT,
  number: FormFieldType.NUMBER,
  phone: FormFieldType.PHONE,
  textarea: FormFieldType.TEXTAREA,
  select: FormFieldType.SELECT,
  radio: FormFieldType.RADIO,
  checkbox: FormFieldType.CHECKBOX,
  file: FormFieldType.FILE,
} as const;

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdminForms() {
    const forms = await this.prisma.leadForm.findMany({
      where: { deletedAt: null },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    return forms.map((form) => this.serialize(form));
  }

  async getAdminForm(id: string) {
    const form = await this.prisma.leadForm.findFirst({
      where: { id, deletedAt: null },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!form) throw new NotFoundException('表单不存在');
    return this.serialize(form);
  }

  async listPublicForms(leadType?: string) {
    let normalizedLeadType: LeadType | undefined;
    if (leadType) {
      if (!(leadType in leadTypeMap)) {
        throw new BadRequestException('不支持的表单类型');
      }
      normalizedLeadType = leadTypeMap[leadType as keyof typeof leadTypeMap];
    }

    const forms = await this.prisma.leadForm.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
        ...(normalizedLeadType ? { leadType: normalizedLeadType } : {}),
      },
      include: {
        fields: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return forms.map((form) => {
      const { fields, ...summary } = this.serialize(form);
      return { ...summary, fieldCount: fields.length };
    });
  }

  async getPublicForm(code: string) {
    const form = await this.prisma.leadForm.findFirst({
      where: { code, status: PublishStatus.PUBLISHED, deletedAt: null },
      include: {
        fields: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!form) throw new NotFoundException('表单不存在或尚未发布');
    return this.serialize(form);
  }

  async create(dto: SaveFormDto) {
    const exists = await this.prisma.leadForm.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });
    if (exists) throw new ConflictException('表单编码已存在');
    this.ensureUniqueFieldKeys(dto);

    const form = await this.prisma.leadForm.create({
      data: {
        code: dto.code,
        name: dto.name,
        leadType: leadTypeMap[dto.leadType],
        title: dto.title,
        subtitle: dto.subtitle,
        successMessage: dto.successMessage,
        status: statusMap[dto.status],
        fields: { create: this.mapFields(dto) },
      },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
    });
    return this.serialize(form);
  }

  async update(id: string, dto: SaveFormDto) {
    const current = await this.prisma.leadForm.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, code: true, version: true },
    });
    if (!current) throw new NotFoundException('表单不存在');
    const duplicate = await this.prisma.leadForm.findFirst({
      where: { code: dto.code, id: { not: id } },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('表单编码已存在');
    this.ensureUniqueFieldKeys(dto);

    const form = await this.prisma.leadForm.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        leadType: leadTypeMap[dto.leadType],
        title: dto.title,
        subtitle: dto.subtitle,
        successMessage: dto.successMessage,
        status: statusMap[dto.status],
        version: { increment: 1 },
        fields: {
          deleteMany: {},
          create: this.mapFields(dto),
        },
      },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
    });
    return this.serialize(form);
  }

  async remove(id: string) {
    const current = await this.prisma.leadForm.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('表单不存在');
    await this.prisma.leadForm.update({
      where: { id },
      data: { deletedAt: new Date(), status: PublishStatus.OFFLINE },
    });
    return { deleted: true };
  }

  private ensureUniqueFieldKeys(dto: SaveFormDto) {
    const keys = dto.fields.map((field) => field.fieldKey);
    if (new Set(keys).size !== keys.length) {
      throw new ConflictException('同一个表单内不能出现重复字段标识');
    }
    for (const field of dto.fields) {
      const validation = field.validation;
      if (
        validation?.minLength !== undefined &&
        validation.maxLength !== undefined &&
        validation.minLength > validation.maxLength
      ) {
        throw new BadRequestException(`${field.label}的长度范围设置不正确`);
      }
      if (
        validation?.min !== undefined &&
        validation.max !== undefined &&
        validation.min > validation.max
      ) {
        throw new BadRequestException(`${field.label}的数字范围设置不正确`);
      }
      if (validation?.pattern && !isSafeValidationPattern(validation.pattern)) {
        throw new BadRequestException(`${field.label}的格式校验规则不安全`);
      }
      if (
        field.options &&
        new Set(field.options.map((option) => option.trim())).size !==
          field.options.length
      ) {
        throw new BadRequestException(`${field.label}不能包含重复选项`);
      }
    }
  }

  private mapFields(
    dto: SaveFormDto,
  ): Prisma.LeadFormFieldCreateWithoutFormInput[] {
    return dto.fields.map((field) => ({
      fieldKey: field.fieldKey,
      label: field.label,
      fieldType: fieldTypeMap[field.fieldType],
      placeholder: field.placeholder,
      optionsJson: field.options,
      required: field.required,
      validationJson: field.validation as Prisma.InputJsonValue | undefined,
      sortOrder: field.sortOrder,
      isVisible: field.isVisible,
    }));
  }

  private serialize<
    T extends {
      leadType: LeadType;
      status: PublishStatus;
      fields: Array<{
        fieldType: FormFieldType;
        optionsJson: unknown;
        validationJson: unknown;
      }>;
    },
  >(form: T) {
    return {
      ...form,
      leadType: form.leadType.toLowerCase(),
      status: form.status.toLowerCase(),
      fields: form.fields.map((field) => ({
        ...field,
        fieldType: field.fieldType.toLowerCase(),
        options: Array.isArray(field.optionsJson) ? field.optionsJson : [],
        validation:
          field.validationJson && typeof field.validationJson === 'object'
            ? field.validationJson
            : {},
        optionsJson: undefined,
        validationJson: undefined,
      })),
    };
  }
}
