<script setup lang="ts">
import { CheckCircleIcon, DataBaseIcon, LockOnIcon, ServerIcon } from 'tdesign-icons-vue-next'

const metrics = [
  { label: '已发布内容', value: '--', note: '等待内容模块接入' },
  { label: '明星产品', value: '--', note: '等待产品模块接入' },
  { label: '今日新增线索', value: '--', note: '等待线索模块接入' },
  { label: '待跟进线索', value: '--', note: '等待线索模块接入' },
]

const foundations = [
  { title: 'API 服务', status: '已建立', icon: ServerIcon },
  { title: 'MySQL 数据模型', status: '已建立', icon: DataBaseIcon },
  { title: '角色权限', status: '已建立', icon: LockOnIcon },
  { title: '统一日志与审计', status: '已预留', icon: CheckCircleIcon },
]
</script>

<template>
  <div class="dashboard-page">
    <section class="metric-grid" aria-label="业务概览">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.note }}</small>
      </article>
    </section>

    <section class="section-panel">
      <div class="section-heading">
        <div>
          <span class="section-kicker">FOUNDATION</span>
          <h2>阶段 A 基础状态</h2>
        </div>
        <t-tag theme="success" variant="light">正常</t-tag>
      </div>
      <div class="foundation-list">
        <div v-for="item in foundations" :key="item.title" class="foundation-item">
          <component :is="item.icon" class="foundation-icon" />
          <span>{{ item.title }}</span>
          <strong>{{ item.status }}</strong>
        </div>
      </div>
    </section>
  </div>
</template>
