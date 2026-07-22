import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import ModulePlaceholderView from '../views/ModulePlaceholderView.vue'

const moduleRoutes: RouteRecordRaw[] = [
  {
    path: 'content',
    name: 'content',
    component: ModulePlaceholderView,
    meta: { title: '内容管理', description: '企业展示、品牌背书与页面内容' },
  },
  {
    path: 'products',
    name: 'products',
    component: ModulePlaceholderView,
    meta: { title: '产品管理', description: '明星产品与结构化产品详情' },
  },
  {
    path: 'cooperation',
    name: 'cooperation',
    component: ModulePlaceholderView,
    meta: { title: '招商合作', description: '招商政策与投资合作内容' },
  },
  {
    path: 'forms',
    name: 'forms',
    component: ModulePlaceholderView,
    meta: { title: '表单管理', description: '代理、投资与咨询表单' },
  },
  {
    path: 'leads',
    name: 'leads',
    component: ModulePlaceholderView,
    meta: { title: '线索管理', description: '筛选、分配、跟进与导出' },
  },
  {
    path: 'media',
    name: 'media',
    component: ModulePlaceholderView,
    meta: { title: '媒体资料', description: '图片、证书、报告与资料文件' },
  },
  {
    path: 'settings',
    name: 'settings',
    component: ModulePlaceholderView,
    meta: { title: '系统设置', description: '管理员、角色、权限与审计' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true, title: '登录' } },
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', name: 'dashboard', component: DashboardView, meta: { title: '仪表盘' } },
        ...moduleRoutes,
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_access_token')
  if (!to.meta.public && !token) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.name === 'login' && token) return { name: 'dashboard' }
  document.title = `${String(to.meta.title ?? '后台')} - 中康参芝`
  return true
})

export default router
