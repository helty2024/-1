<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => String(route.meta.title ?? '模块'))
const description = computed(() => String(route.meta.description ?? ''))
</script>

<template>
  <section class="module-page">
    <div class="module-toolbar">
      <div>
        <span class="section-kicker">V1 MODULE</span>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
      <t-button theme="primary" disabled>新建</t-button>
    </div>

    <div class="module-table-shell">
      <t-empty title="模块骨架已建立" description="业务列表和编辑功能将在下一阶段接入" />
    </div>
  </section>
</template>
