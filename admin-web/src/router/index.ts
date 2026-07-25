import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import AdminLayout from "../layouts/AdminLayout.vue";
import AuditLogsView from "../views/AuditLogsView.vue";
import ContentView from "../views/ContentView.vue";
import CooperationView from "../views/CooperationContentView.vue";
import DashboardView from "../views/DashboardView.vue";
import FormsView from "../views/FormsView.vue";
import LeadsView from "../views/LeadsView.vue";
import LoginView from "../views/LoginView.vue";
import MediaView from "../views/MediaView.vue";
import ProductsView from "../views/ProductsView.vue";
import ProductContentView from "../views/ProductContentView.vue";
import StrengthContentView from "../views/StrengthContentView.vue";
import SystemSettingsView from "../views/SystemSettingsView.vue";

const moduleRoutes: RouteRecordRaw[] = [
  {
    path: "content",
    name: "content",
    component: ContentView,
    meta: {
      title: "首页内容",
      description: "维护小程序首页及首页点击进入的企业和品牌内容",
      permissions: ["content:read"],
    },
  },
  {
    path: "product-content",
    name: "product-content",
    component: ProductContentView,
    meta: {
      title: "产品页内容",
      description: "产品页首屏、销售场景与申请入口",
      permissions: ["content:read"],
    },
  },
  {
    path: "strength-content",
    name: "strength-content",
    component: StrengthContentView,
    meta: {
      title: "实力页内容",
      description: "维护实力页首屏、实力背书、图册和合作入口",
      permissions: ["content:read"],
    },
  },
  {
    path: "products",
    name: "products",
    component: ProductsView,
    meta: {
      title: "产品管理",
      description: "维护单个明星产品的卡片资料和产品详情",
      permissions: ["product:read"],
    },
  },
  {
    path: "cooperation",
    name: "cooperation",
    component: CooperationView,
    meta: {
      title: "合作页内容",
      description: "维护合作首页、招商代理和投资合作页面",
      permissions: ["content:read"],
    },
  },
  {
    path: "forms",
    name: "forms",
    component: FormsView,
    meta: {
      title: "表单管理",
      description: "设置代理、投资与普通咨询表单",
      permissions: ["form:read"],
    },
  },
  {
    path: "leads",
    name: "leads",
    component: LeadsView,
    meta: {
      title: "客户线索",
      description: "查看、筛选和跟进客户提交的信息",
      permissions: ["lead:read_all", "lead:read_assigned"],
    },
  },
  {
    path: "media",
    name: "media",
    component: MediaView,
    meta: {
      title: "媒体管理",
      description: "统一管理页面图片、证书、报告和资料文件",
      permissions: ["media:read"],
    },
  },
  {
    path: "settings",
    name: "settings",
    component: SystemSettingsView,
    meta: {
      title: "账号与权限",
      description: "管理登录信息、管理员和角色权限",
    },
  },
  {
    path: "audit-logs",
    name: "audit-logs",
    component: AuditLogsView,
    meta: {
      title: "审计日志",
      description: "查看管理员操作、业务变更和安全审计记录",
      permissions: ["audit:read"],
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { public: true, title: "登录" },
    },
    {
      path: "/",
      component: AdminLayout,
      children: [
        {
          path: "",
          name: "dashboard",
          component: DashboardView,
          meta: { title: "工作台" },
        },
        ...moduleRoutes,
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem("admin_access_token");
  if (!to.meta.public && !token)
    return { name: "login", query: { redirect: to.fullPath } };
  if (to.name === "login" && token) return { name: "dashboard" };
  const required = (to.meta.permissions as string[] | undefined) ?? [];
  if (required.length > 0) {
    try {
      const user = JSON.parse(localStorage.getItem("admin_user") ?? "{}") as {
        permissions?: string[];
      };
      const granted = new Set(user.permissions ?? []);
      if (!required.some((permission) => granted.has(permission)))
        return { name: "dashboard" };
    } catch {
      return { name: "dashboard" };
    }
  }
  document.title = `${String(to.meta.title ?? "后台")} - 中康参芝`;
  return true;
});

export default router;
