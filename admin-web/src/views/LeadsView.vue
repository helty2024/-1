<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  ChatIcon,
  DownloadIcon,
  RefreshIcon,
  SearchIcon,
} from "tdesign-icons-vue-next";
import { MessagePlugin } from "tdesign-vue-next";
import { resolveApiError } from "../api/client";
import {
  addLeadFollowup,
  exportLeadRecords,
  getLeadRecord,
  listLeadRecords,
  updateLeadStatus,
  type FollowType,
  type LeadFilters,
  type LeadRecord,
  type LeadStatus,
} from "../api/leads";
import type { LeadType } from "../api/forms";

const loading = ref(false);
const exporting = ref(false);
const detailLoading = ref(false);
const savingStatus = ref(false);
const savingFollowup = ref(false);
const drawerVisible = ref(false);
const leads = ref<LeadRecord[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);
const detail = ref<LeadRecord | null>(null);

const filters = reactive<{
  type?: LeadType;
  status?: LeadStatus;
  page: number;
  pageSize: number;
}>({ page: 1, pageSize: 20 });

const detailStatus = ref<LeadStatus>("new");
const followup = reactive<{
  followType: Exclude<FollowType, "status_change">;
  content: string;
  nextStatus?: LeadStatus;
  nextFollowAt: string;
}>({
  followType: "note",
  content: "",
  nextStatus: undefined,
  nextFollowAt: "",
});

const typeOptions = [
  { label: "全部类型", value: "" },
  { label: "代理申请", value: "agent" },
  { label: "投资合作", value: "investment" },
  { label: "普通咨询", value: "consult" },
];
const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "新线索", value: "new" },
  { label: "已联系", value: "contacted" },
  { label: "重点跟进", value: "qualified" },
  { label: "已结束", value: "closed" },
  { label: "无效线索", value: "invalid" },
];
const editableStatusOptions = statusOptions.filter((item) => item.value);
const followTypeOptions = [
  { label: "跟进备注", value: "note" },
  { label: "电话沟通", value: "phone" },
  { label: "微信沟通", value: "wechat" },
  { label: "到访面谈", value: "visit" },
];

const detailFields = computed(() => {
  if (!detail.value) return [];
  return Object.entries(detail.value.values).map(([key, value]) => ({
    key,
    label: detail.value?.fieldLabels[key] ?? key,
    value: Array.isArray(value) ? value.join("、") : String(value ?? ""),
  }));
});

function currentFilters(): LeadFilters {
  return {
    type: filters.type || undefined,
    status: filters.status || undefined,
    dateFrom: dateRange.value[0]
      ? new Date(`${dateRange.value[0]}T00:00:00`).toISOString()
      : undefined,
    dateTo: dateRange.value[1]
      ? new Date(`${dateRange.value[1]}T23:59:59.999`).toISOString()
      : undefined,
  };
}

async function load() {
  loading.value = true;
  try {
    const result = await listLeadRecords({
      ...currentFilters(),
      page: filters.page,
      pageSize: filters.pageSize,
    });
    leads.value = result.items;
    total.value = result.total;
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    loading.value = false;
  }
}

async function exportCurrentResults() {
  exporting.value = true;
  try {
    const blob = await exportLeadRecords(currentFilters());
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    const filename = `中康参芝线索-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    await MessagePlugin.success(`已导出 ${total.value} 条线索`);
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    exporting.value = false;
  }
}

async function openDetail(id: string) {
  drawerVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await getLeadRecord(id);
    detailStatus.value = detail.value.status;
    followup.content = "";
    followup.followType = "note";
    followup.nextStatus = undefined;
    followup.nextFollowAt = "";
  } catch (error) {
    drawerVisible.value = false;
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    detailLoading.value = false;
  }
}

async function saveStatus() {
  if (!detail.value || detail.value.status === detailStatus.value) return;
  savingStatus.value = true;
  try {
    detail.value = await updateLeadStatus(detail.value.id, detailStatus.value);
    await MessagePlugin.success("线索状态已更新");
    await load();
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    savingStatus.value = false;
  }
}

async function saveFollowup() {
  if (!detail.value || !followup.content.trim()) {
    await MessagePlugin.warning("请填写跟进内容");
    return;
  }
  savingFollowup.value = true;
  try {
    detail.value = await addLeadFollowup(detail.value.id, {
      followType: followup.followType,
      content: followup.content.trim(),
      nextStatus: followup.nextStatus,
      nextFollowAt: followup.nextFollowAt
        ? new Date(followup.nextFollowAt).toISOString()
        : undefined,
    });
    detailStatus.value = detail.value.status;
    followup.content = "";
    followup.nextStatus = undefined;
    followup.nextFollowAt = "";
    await MessagePlugin.success("跟进记录已添加");
    await load();
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    savingFollowup.value = false;
  }
}

function search() {
  filters.page = 1;
  void load();
}

function resetFilters() {
  filters.type = undefined;
  filters.status = undefined;
  filters.page = 1;
  dateRange.value = [];
  void load();
}

function onPageChange(page: number) {
  filters.page = page;
  void load();
}

function statusLabel(status: LeadStatus) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

function statusTheme(status: LeadStatus) {
  if (status === "qualified") return "danger";
  if (status === "contacted") return "primary";
  if (status === "closed") return "success";
  if (status === "invalid") return "default";
  return "warning";
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function leadName(lead: LeadRecord) {
  return String(lead.values.name ?? "未填写姓名");
}

function leadMobile(lead: LeadRecord) {
  return String(lead.values.phone ?? lead.values.mobile ?? "未填写手机号");
}

onMounted(load);
</script>

<template>
  <section class="business-page leads-page">
    <div class="module-toolbar">
      <div>
        <span class="section-kicker">LEAD PIPELINE</span>
        <h2>客户线索</h2>
        <p>查看申请详情、调整跟进状态并沉淀每次沟通记录。</p>
      </div>
      <div class="toolbar-actions">
        <t-button
          theme="primary"
          :loading="exporting"
          :disabled="loading || total === 0"
          @click="exportCurrentResults"
        >
          <template #icon><DownloadIcon /></template>
          导出当前结果
        </t-button>
        <t-button variant="outline" :loading="loading" @click="load">
          <template #icon><RefreshIcon /></template>
          刷新
        </t-button>
      </div>
    </div>

    <div class="filter-bar">
      <t-select
        v-model="filters.type"
        :options="typeOptions"
        placeholder="全部类型"
        clearable
      />
      <t-select
        v-model="filters.status"
        :options="statusOptions"
        placeholder="全部状态"
        clearable
      />
      <t-date-range-picker v-model="dateRange" clearable />
      <t-button theme="primary" @click="search"
        ><template #icon><SearchIcon /></template>筛选</t-button
      >
      <t-button variant="text" @click="resetFilters">重置</t-button>
    </div>

    <div class="data-table-wrap" :class="{ 'is-loading': loading }">
      <table class="data-table">
        <thead>
          <tr>
            <th>线索编号</th>
            <th>申请人</th>
            <th>类型</th>
            <th>地区/来源</th>
            <th>状态</th>
            <th>提交时间</th>
            <th class="actions-column">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lead in leads" :key="lead.id">
            <td>
              <strong>{{ lead.leadNo }}</strong>
            </td>
            <td>
              <strong>{{ leadName(lead) }}</strong>
              <small>{{ leadMobile(lead) }}</small>
            </td>
            <td>{{ lead.typeLabel }}</td>
            <td>
              {{ lead.region || "-" }}<small>{{ lead.source || "-" }}</small>
            </td>
            <td>
              <t-tag :theme="statusTheme(lead.status)">{{
                statusLabel(lead.status)
              }}</t-tag>
            </td>
            <td>{{ formatDate(lead.createdAt) }}</td>
            <td>
              <t-button
                variant="text"
                theme="primary"
                @click="openDetail(lead.id)"
                >查看详情</t-button
              >
            </td>
          </tr>
          <tr v-if="!loading && !leads.length">
            <td colspan="7" class="empty-cell">当前筛选条件下暂无线索。</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-bar">
      <span>共 {{ total }} 条线索</span>
      <t-pagination
        :current="filters.page"
        :page-size="filters.pageSize"
        :total="total"
        :show-page-size="false"
        @current-change="onPageChange"
      />
    </div>
  </section>

  <t-drawer
    v-model:visible="drawerVisible"
    header="线索详情"
    size="760px"
    :footer="false"
  >
    <div
      v-if="detail"
      class="lead-drawer"
      :class="{ 'is-loading': detailLoading }"
    >
      <div class="lead-summary">
        <div>
          <span class="section-kicker">{{ detail.leadNo }}</span>
          <h2>{{ leadName(detail) }}</h2>
          <p>{{ detail.typeLabel }} · {{ formatDate(detail.createdAt) }}</p>
        </div>
        <t-tag :theme="statusTheme(detail.status)">{{
          statusLabel(detail.status)
        }}</t-tag>
      </div>

      <section class="drawer-section">
        <h3>提交信息</h3>
        <dl class="lead-field-grid">
          <div v-for="field in detailFields" :key="field.key">
            <dt>{{ field.label }}</dt>
            <dd>{{ field.value || "-" }}</dd>
          </div>
        </dl>
      </section>

      <section class="drawer-section status-editor">
        <h3>跟进状态</h3>
        <div class="inline-editor">
          <t-select v-model="detailStatus" :options="editableStatusOptions" />
          <t-button theme="primary" :loading="savingStatus" @click="saveStatus"
            >保存状态</t-button
          >
        </div>
      </section>

      <section class="drawer-section">
        <h3>添加跟进</h3>
        <div class="followup-controls">
          <t-select
            v-model="followup.followType"
            :options="followTypeOptions"
          />
          <t-select
            v-model="followup.nextStatus"
            :options="editableStatusOptions"
            placeholder="同步调整状态（可选）"
            clearable
          />
          <t-date-picker
            v-model="followup.nextFollowAt"
            enable-time-picker
            clearable
            placeholder="下次跟进时间（可选）"
          />
        </div>
        <t-textarea
          v-model="followup.content"
          placeholder="填写沟通情况、客户意向和下一步安排"
          :autosize="{ minRows: 3, maxRows: 6 }"
        />
        <t-button
          theme="primary"
          :loading="savingFollowup"
          @click="saveFollowup"
        >
          <template #icon><ChatIcon /></template>
          添加跟进记录
        </t-button>
      </section>

      <section class="drawer-section">
        <h3>跟进记录</h3>
        <div v-if="detail.followups.length" class="followup-list">
          <article v-for="item in detail.followups" :key="item.id">
            <div>
              <strong>{{ item.adminUser.displayName }}</strong>
              <span>{{ formatDate(item.createdAt) }}</span>
            </div>
            <p>{{ item.content }}</p>
          </article>
        </div>
        <t-empty v-else title="暂无跟进记录" />
      </section>
    </div>
  </t-drawer>
</template>
