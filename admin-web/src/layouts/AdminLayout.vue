<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AppIcon,
  DashboardIcon,
  FileCopyIcon,
  FileIcon,
  ImageIcon,
  LayersIcon,
  LogoutIcon,
  SettingIcon,
  ShopIcon,
  UsergroupIcon,
} from 'tdesign-icons-vue-next'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activePath = computed(() => route.path)
const pageTitle = computed(() => String(route.meta.title ?? '仪表盘'))

const menuItems = [
  { path: '/', label: '仪表盘', icon: DashboardIcon },
  { path: '/content', label: '内容管理', icon: FileCopyIcon },
  { path: '/products', label: '产品管理', icon: ShopIcon },
  { path: '/cooperation', label: '招商合作', icon: UsergroupIcon },
  { path: '/forms', label: '表单管理', icon: FileIcon },
  { path: '/leads', label: '线索管理', icon: LayersIcon },
  { path: '/media', label: '媒体资料', icon: ImageIcon },
  { path: '/settings', label: '系统设置', icon: SettingIcon },
]

function navigate(value: string | number) {
  void router.push(String(value))
}

function logout() {
  auth.logout()
  void router.replace('/login')
}
</script>

<template>
  <t-layout class="admin-shell">
    <t-aside class="admin-sidebar">
      <div class="brand-block">
        <span class="brand-mark"><AppIcon /></span>
        <span>
          <strong>中康参芝</strong>
          <small>管理后台</small>
        </span>
      </div>

      <t-menu theme="dark" :value="activePath" class="admin-menu" @change="navigate">
        <t-menu-item v-for="item in menuItems" :key="item.path" :value="item.path">
          <template #icon><component :is="item.icon" /></template>
          {{ item.label }}
        </t-menu-item>
      </t-menu>
    </t-aside>

    <t-layout>
      <t-header class="admin-header">
        <div>
          <span class="header-label">ZHONG KANG</span>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-user">
          <span>{{ auth.user?.displayName ?? '管理员' }}</span>
          <t-button variant="text" shape="square" title="退出登录" @click="logout">
            <LogoutIcon />
          </t-button>
        </div>
      </t-header>
      <t-content class="admin-content">
        <router-view />
      </t-content>
    </t-layout>
  </t-layout>
</template>
