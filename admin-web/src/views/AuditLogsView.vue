<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { RefreshIcon, SearchIcon } from "tdesign-icons-vue-next";
import { MessagePlugin } from "tdesign-vue-next";
import {
  getAuditOptions,
  listAuditLogs,
  type AuditLogItem,
  type AuditOptions,
} from "../api/system";
import { resolveApiError } from "../api/client";
import { auditActionLabel, auditResourceLabel } from "../utils/audit";

const loading = ref(false);
const logs = ref<AuditLogItem[]>([]);
const options = ref<AuditOptions>({ actions: [], resources: [], admins: [] });
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const drawerVisible = ref(false);
const selected = ref<AuditLogItem | null>(null);
const filters = reactive<{
  search: string;
  action?: string;
  resource?: string;
  adminUserId?: string;
  dates: string[];
}>({
  search: "",
  action: undefined,
  resource: undefined,
  adminUserId: undefined,
  dates: [],
});

const actionOptions = computed(() =>
  options.value.actions.map((value) => ({
    label: auditActionLabel(value),
    value,
  })),
);
const resourceOptions = computed(() =>
  options.value.resources.map((value) => ({
    label: auditResourceLabel(value),
    value,
  })),
);
const adminOptions = computed(() =>
  options.value.admins.map((item) => ({
    label: `${item.displayName} · ${item.username}`,
    value: item.id,
  })),
);

async function loadOptions() {
  try {
    options.value = await getAuditOptions();
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  }
}

async function load() {
  loading.value = true;
  try {
    const result = await listAuditLogs({
      search: filters.search || undefined,
      action: filters.action,
      resource: filters.resource,
      adminUserId: filters.adminUserId,
      dateFrom: filters.dates[0]
        ? `${filters.dates[0]}T00:00:00+08:00`
        : undefined,
      dateTo: filters.dates[1]
        ? `${filters.dates[1]}T23:59:59+08:00`
        : undefined,
      page: page.value,
      pageSize,
    });
    logs.value = result.items;
    total.value = result.total;
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    loading.value = false;
  }
}

function search() {
  page.value = 1;
  void load();
}

function resetFilters() {
  Object.assign(filters, {
    search: "",
    action: undefined,
    resource: undefined,
    adminUserId: undefined,
    dates: [],
  });
  page.value = 1;
  void load();
}

function onPageChange(nextPage: number) {
  page.value = nextPage;
  void load();
}

function openDetail(item: AuditLogItem) {
  selected.value = item;
  drawerVisible.value = true;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) return "无记录";
  return JSON.stringify(value, null, 2);
}

onMounted(async () => {
  await Promise.all([loadOptions(), load()]);
});
</script>

<template>
  <section class="business-page audit-page">
    <div class="module-toolbar">
      <div>
        <span class="section-kicker">AUDIT LOG</span>
        <h2>审计日志</h2>
        <p>追踪管理员登录、内容维护、线索处理和权限调整记录。</p>
      </div>
      <t-button variant="outline" :loading="loading" @click="load">
        <template #icon><RefreshIcon /></template>
        刷新
      </t-button>
    </div>

    <div class="audit-page-filter">
      <t-input
        v-model="filters.search"
        placeholder="搜索对象编号或管理员"
        clearable
        @enter="search"
      />
      <t-select
        v-model="filters.adminUserId"
        :options="adminOptions"
        placeholder="全部管理员"
        clearable
        filterable
      />
      <t-select
        v-model="filters.action"
        :options="actionOptions"
        placeholder="全部操作"
        clearable
        filterable
      />
      <t-select
        v-model="filters.resource"
        :options="resourceOptions"
        placeholder="全部模块"
        clearable
      />
      <t-date-range-picker v-model="filters.dates" clearable />
      <div class="audit-filter-actions">
        <t-button theme="primary" @click="search"
          ><template #icon><SearchIcon /></template>筛选</t-button
        >
        <t-button variant="outline" @click="resetFilters">重置</t-button>
      </div>
    </div>

    <div class="data-table-wrap" :class="{ 'is-loading': loading }">
      <table class="data-table audit-log-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>管理员</th>
            <th>操作</th>
            <th>业务模块</th>
            <th>对象编号</th>
            <th>IP</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in logs" :key="item.id">
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>
              <strong>{{ item.adminUser?.displayName || "系统" }}</strong
              ><small>{{ item.adminUser?.username || "-" }}</small>
            </td>
            <td>{{ auditActionLabel(item.action) }}</td>
            <td>{{ auditResourceLabel(item.resource) }}</td>
            <td class="audit-object-id">{{ item.resourceId || "-" }}</td>
            <td>{{ item.ip || "-" }}</td>
            <td>
              <t-button size="small" variant="text" @click="openDetail(item)"
                >查看详情</t-button
              >
            </td>
          </tr>
          <tr v-if="!logs.length">
            <td colspan="7" class="empty-cell">暂无符合条件的审计记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-bar">
      <span>共 {{ total }} 条记录</span>
      <t-pagination
        :current="page"
        :page-size="pageSize"
        :total="total"
        :show-page-size="false"
        @current-change="onPageChange"
      />
    </div>
  </section>

  <t-drawer
    v-model:visible="drawerVisible"
    header="审计详情"
    size="760px"
    :footer="false"
  >
    <div v-if="selected" class="audit-detail">
      <div class="audit-detail-heading">
        <div>
          <span class="section-kicker">{{ selected.id }}</span>
          <h2>{{ auditActionLabel(selected.action) }}</h2>
        </div>
        <t-tag theme="primary" variant="light">{{
          auditResourceLabel(selected.resource)
        }}</t-tag>
      </div>

      <dl class="audit-meta-grid">
        <div>
          <dt>操作时间</dt>
          <dd>{{ formatDate(selected.createdAt) }}</dd>
        </div>
        <div>
          <dt>操作管理员</dt>
          <dd>
            {{ selected.adminUser?.displayName || "系统"
            }}<small>{{ selected.adminUser?.username || "-" }}</small>
          </dd>
        </div>
        <div>
          <dt>对象编号</dt>
          <dd>{{ selected.resourceId || "-" }}</dd>
        </div>
        <div>
          <dt>IP 地址</dt>
          <dd>{{ selected.ip || "-" }}</dd>
        </div>
        <div class="span-2">
          <dt>请求编号</dt>
          <dd>{{ selected.requestId || "-" }}</dd>
        </div>
        <div class="span-2">
          <dt>终端信息</dt>
          <dd>{{ selected.userAgent || "-" }}</dd>
        </div>
      </dl>

      <div class="audit-change-grid">
        <section>
          <h3>变更前</h3>
          <pre>{{ formatJson(selected.beforeJson) }}</pre>
        </section>
        <section>
          <h3>变更后</h3>
          <pre>{{ formatJson(selected.afterJson) }}</pre>
        </section>
      </div>
    </div>
  </t-drawer>
</template>
