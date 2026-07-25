<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
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
} from "tdesign-icons-vue-next";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const activePath = computed(() => route.path);
const pageTitle = computed(() => String(route.meta.title ?? "仪表盘"));
const grantedPermissions = computed(
  () => new Set(auth.user?.permissions ?? []),
);

const menuGroups = [
  {
    title: "小程序页面",
    items: [
      {
        path: "/content",
        label: "首页内容",
        icon: FileCopyIcon,
        permissions: ["content:read"],
      },
      {
        path: "/product-content",
        label: "产品页内容",
        icon: FileCopyIcon,
        permissions: ["content:read"],
      },
      {
        path: "/strength-content",
        label: "实力页内容",
        icon: FileCopyIcon,
        permissions: ["content:read"],
      },
      {
        path: "/cooperation",
        label: "合作页内容",
        icon: UsergroupIcon,
        permissions: ["content:read"],
      },
    ],
  },
  {
    title: "业务资料",
    items: [
      {
        path: "/products",
        label: "产品管理",
        icon: ShopIcon,
        permissions: ["product:read"],
      },
      {
        path: "/media",
        label: "媒体管理",
        icon: ImageIcon,
        permissions: ["media:read"],
      },
    ],
  },
  {
    title: "客户跟进",
    items: [
      {
        path: "/forms",
        label: "表单管理",
        icon: FileIcon,
        permissions: ["form:read"],
      },
      {
        path: "/leads",
        label: "客户线索",
        icon: LayersIcon,
        permissions: ["lead:read_all", "lead:read_assigned"],
      },
    ],
  },
  {
    title: "系统管理",
    items: [
      {
        path: "/settings",
        label: "账号与权限",
        icon: SettingIcon,
        permissions: [],
      },
      {
        path: "/audit-logs",
        label: "审计日志",
        icon: FileIcon,
        permissions: ["audit:read"],
      },
    ],
  },
];

const visibleMenuGroups = computed(() =>
  menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.permissions.length === 0 ||
          item.permissions.some((permission) =>
            grantedPermissions.value.has(permission),
          ),
      ),
    }))
    .filter((group) => group.items.length > 0),
);

function navigate(value: string | number) {
  void router.push(String(value));
}

function logout() {
  auth.logout();
  void router.replace("/login");
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

      <t-menu
        theme="dark"
        :value="activePath"
        class="admin-menu"
        @change="navigate"
      >
        <t-menu-item value="/">
          <template #icon><DashboardIcon /></template>
          工作台
        </t-menu-item>
        <t-menu-group
          v-for="group in visibleMenuGroups"
          :key="group.title"
          :title="group.title"
        >
          <t-menu-item
            v-for="item in group.items"
            :key="item.path"
            :value="item.path"
          >
            <template #icon><component :is="item.icon" /></template>
            {{ item.label }}
          </t-menu-item>
        </t-menu-group>
      </t-menu>
    </t-aside>

    <t-layout>
      <t-header class="admin-header">
        <div>
          <span class="header-label">ZHONG KANG</span>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-user">
          <span>{{ auth.user?.displayName ?? "管理员" }}</span>
          <t-button
            variant="text"
            shape="square"
            title="退出登录"
            @click="logout"
          >
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
