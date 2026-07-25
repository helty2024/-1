<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  AddIcon,
  DeleteIcon,
  EditIcon,
  LockOnIcon,
  RefreshIcon,
  SaveIcon,
  UserIcon,
  UsergroupIcon,
} from "tdesign-icons-vue-next";
import {
  DialogPlugin,
  MessagePlugin,
  type FormInstanceFunctions,
  type FormProps,
} from "tdesign-vue-next";
import { changeCurrentAdminPassword, updateCurrentAdmin } from "../api/auth";
import { resolveApiError } from "../api/client";
import {
  createManagedAdmin,
  createManagedRole,
  deleteManagedRole,
  listManagedAdmins,
  listManagedRoles,
  listPermissions,
  listRoleOptions,
  resetManagedAdminPassword,
  updateManagedAdmin,
  updateManagedAdminStatus,
  updateManagedRole,
  type AdminStatus,
  type ManagedAdmin,
  type ManagedRole,
  type PermissionItem,
  type RoleSummary,
} from "../api/system";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const activeTab = ref("account");
const profileFormRef = ref<FormInstanceFunctions>();
const passwordFormRef = ref<FormInstanceFunctions>();
const savingProfile = ref(false);
const savingPassword = ref(false);

const permissionSet = computed(() => new Set(auth.user?.permissions ?? []));
const canManageUsers = computed(() =>
  permissionSet.value.has("system:user_manage"),
);
const canManageRoles = computed(() =>
  permissionSet.value.has("system:role_manage"),
);

const profileForm = reactive({
  username: auth.user?.username ?? "",
  displayName: auth.user?.displayName ?? "",
});
const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

watch(
  () => auth.user,
  (user) => {
    if (!user) return;
    profileForm.username = user.username;
    profileForm.displayName = user.displayName;
  },
  { immediate: true },
);

const profileRules: FormProps["rules"] = {
  username: [
    { required: true, message: "请输入管理员账号" },
    { min: 3, max: 64, message: "账号长度为 3 至 64 个字符" },
    {
      pattern: /^[a-zA-Z0-9_.-]+$/,
      message: "仅支持字母、数字、下划线、点和短横线",
    },
  ],
  displayName: [
    { required: true, message: "请输入显示名称" },
    { min: 2, max: 80, message: "显示名称长度为 2 至 80 个字符" },
  ],
};

const passwordRules: FormProps["rules"] = {
  currentPassword: [{ required: true, message: "请输入当前密码" }],
  newPassword: [
    { required: true, message: "请输入新密码" },
    { min: 10, max: 128, message: "新密码长度为 10 至 128 个字符" },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
      message: "必须包含大写字母、小写字母、数字和特殊字符",
    },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码" },
    {
      validator: (value) => value === passwordForm.newPassword,
      message: "两次输入的新密码不一致",
    },
  ],
};

async function saveProfile() {
  if (savingProfile.value) return;
  const validation = await profileFormRef.value?.validate();
  if (validation !== true) return;
  savingProfile.value = true;
  try {
    await updateCurrentAdmin(profileForm);
    await auth.refreshUser();
    await MessagePlugin.success("登录信息已更新");
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    savingProfile.value = false;
  }
}

async function savePassword() {
  if (savingPassword.value) return;
  const validation = await passwordFormRef.value?.validate();
  if (validation !== true) return;
  savingPassword.value = true;
  try {
    await changeCurrentAdminPassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    auth.logout();
    await MessagePlugin.success("密码已修改，请使用新密码重新登录");
    await router.replace({ name: "login", query: { passwordChanged: "1" } });
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    savingPassword.value = false;
  }
}

const usersLoading = ref(false);
const users = ref<ManagedAdmin[]>([]);
const roleOptions = ref<RoleSummary[]>([]);
const usersTotal = ref(0);
const usersPage = ref(1);
const userSearch = ref("");
const userStatus = ref<AdminStatus | undefined>();
const userDialogVisible = ref(false);
const passwordDialogVisible = ref(false);
const userSaving = ref(false);
const passwordResetSaving = ref(false);
const userEditor = reactive({
  id: "",
  username: "",
  displayName: "",
  password: "",
  roleIds: [] as string[],
});
const passwordReset = reactive({ id: "", displayName: "", password: "" });

async function loadUsers() {
  if (!canManageUsers.value) return;
  usersLoading.value = true;
  try {
    const result = await listManagedAdmins({
      search: userSearch.value || undefined,
      status: userStatus.value,
      page: usersPage.value,
      pageSize: 20,
    });
    users.value = result.items;
    usersTotal.value = result.total;
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    usersLoading.value = false;
  }
}

async function loadUserRoleOptions() {
  if (!canManageUsers.value) return;
  try {
    roleOptions.value = await listRoleOptions();
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  }
}

function openNewUser() {
  Object.assign(userEditor, {
    id: "",
    username: "",
    displayName: "",
    password: "",
    roleIds: [],
  });
  userDialogVisible.value = true;
}

function openEditUser(user: ManagedAdmin) {
  Object.assign(userEditor, {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    password: "",
    roleIds: user.roles.map((role) => role.id),
  });
  userDialogVisible.value = true;
}

function validPassword(value: string) {
  return (
    value.length >= 10 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z\d]/.test(value)
  );
}

async function saveUser() {
  if (!/^[a-zA-Z0-9_.-]{3,64}$/.test(userEditor.username)) {
    await MessagePlugin.warning("管理员账号格式不正确");
    return;
  }
  if (
    userEditor.displayName.trim().length < 2 ||
    userEditor.roleIds.length === 0
  ) {
    await MessagePlugin.warning("请填写显示名称并至少选择一个角色");
    return;
  }
  if (!userEditor.id && !validPassword(userEditor.password)) {
    await MessagePlugin.warning(
      "初始密码至少 10 位，并包含大小写字母、数字和特殊字符",
    );
    return;
  }
  userSaving.value = true;
  try {
    if (userEditor.id) {
      await updateManagedAdmin(userEditor.id, {
        username: userEditor.username,
        displayName: userEditor.displayName,
        roleIds: userEditor.roleIds,
      });
    } else {
      await createManagedAdmin({
        username: userEditor.username,
        displayName: userEditor.displayName,
        password: userEditor.password,
        roleIds: userEditor.roleIds,
      });
    }
    userDialogVisible.value = false;
    await MessagePlugin.success(
      userEditor.id ? "管理员已更新" : "管理员已创建",
    );
    await loadUsers();
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    userSaving.value = false;
  }
}

function confirmStatusChange(user: ManagedAdmin) {
  const nextStatus: AdminStatus =
    user.status === "active" ? "disabled" : "active";
  const dialog = DialogPlugin.confirm({
    header: nextStatus === "disabled" ? "停用管理员" : "启用管理员",
    body:
      nextStatus === "disabled"
        ? `停用“${user.displayName}”后，该账号将立即无法登录。`
        : `确认重新启用“${user.displayName}”吗？`,
    confirmBtn: nextStatus === "disabled" ? "确认停用" : "确认启用",
    cancelBtn: "取消",
    onConfirm: async () => {
      try {
        await updateManagedAdminStatus(user.id, nextStatus);
        dialog.destroy();
        await MessagePlugin.success(
          nextStatus === "disabled" ? "管理员已停用" : "管理员已启用",
        );
        await loadUsers();
      } catch (error) {
        await MessagePlugin.error(resolveApiError(error));
      }
    },
  });
}

function openPasswordReset(user: ManagedAdmin) {
  Object.assign(passwordReset, {
    id: user.id,
    displayName: user.displayName,
    password: "",
  });
  passwordDialogVisible.value = true;
}

async function savePasswordReset() {
  if (!validPassword(passwordReset.password)) {
    await MessagePlugin.warning(
      "新密码至少 10 位，并包含大小写字母、数字和特殊字符",
    );
    return;
  }
  passwordResetSaving.value = true;
  try {
    await resetManagedAdminPassword(passwordReset.id, passwordReset.password);
    passwordDialogVisible.value = false;
    await MessagePlugin.success("密码已重置");
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    passwordResetSaving.value = false;
  }
}

const rolesLoading = ref(false);
const roles = ref<ManagedRole[]>([]);
const permissions = ref<PermissionItem[]>([]);
const roleDialogVisible = ref(false);
const roleSaving = ref(false);
const roleEditor = reactive({
  id: "",
  code: "",
  name: "",
  description: "",
  permissionIds: [] as string[],
});
const resourceNames: Record<string, string> = {
  auth: "登录安全",
  dashboard: "工作台",
  content: "页面内容",
  content_page: "页面内容",
  product: "产品管理",
  form: "表单管理",
  lead: "客户线索",
  media: "媒体资料",
  media_asset: "媒体资料",
  admin_user: "管理员",
  role: "角色权限",
  system: "管理员与角色",
  audit: "操作审计",
};
const permissionGroups = computed(() => {
  const groups = new Map<string, PermissionItem[]>();
  for (const permission of permissions.value) {
    const items = groups.get(permission.resource) ?? [];
    items.push(permission);
    groups.set(permission.resource, items);
  }
  return [...groups.entries()].map(([resource, items]) => ({
    resource,
    name: resourceNames[resource] ?? resource,
    options: items.map((item) => ({ label: item.name, value: item.id })),
  }));
});

async function loadRoles() {
  if (!canManageRoles.value) return;
  rolesLoading.value = true;
  try {
    const [roleItems, permissionItems] = await Promise.all([
      listManagedRoles(),
      listPermissions(),
    ]);
    roles.value = roleItems;
    roleOptions.value = roleItems.map(({ id, code, name }) => ({
      id,
      code,
      name,
    }));
    permissions.value = permissionItems;
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    rolesLoading.value = false;
  }
}

function openNewRole() {
  Object.assign(roleEditor, {
    id: "",
    code: "",
    name: "",
    description: "",
    permissionIds: [],
  });
  roleDialogVisible.value = true;
}

function openEditRole(role: ManagedRole) {
  Object.assign(roleEditor, {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description ?? "",
    permissionIds: role.permissions.map((permission) => permission.id),
  });
  roleDialogVisible.value = true;
}

async function saveRole() {
  if (!roleEditor.id && !/^[a-z][a-z0-9_:-]*$/.test(roleEditor.code)) {
    await MessagePlugin.warning(
      "角色编码需以小写字母开头，只能使用小写字母、数字和下划线",
    );
    return;
  }
  if (
    roleEditor.name.trim().length < 2 ||
    roleEditor.permissionIds.length === 0
  ) {
    await MessagePlugin.warning("请填写角色名称并至少选择一项权限");
    return;
  }
  roleSaving.value = true;
  try {
    if (roleEditor.id) {
      await updateManagedRole(roleEditor.id, {
        name: roleEditor.name,
        description: roleEditor.description,
        permissionIds: roleEditor.permissionIds,
      });
    } else {
      await createManagedRole({
        code: roleEditor.code,
        name: roleEditor.name,
        description: roleEditor.description,
        permissionIds: roleEditor.permissionIds,
      });
    }
    roleDialogVisible.value = false;
    await MessagePlugin.success(
      roleEditor.id ? "角色权限已更新" : "角色已创建",
    );
    await loadRoles();
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error));
  } finally {
    roleSaving.value = false;
  }
}

function confirmDeleteRole(role: ManagedRole) {
  const dialog = DialogPlugin.confirm({
    header: "删除角色",
    body: `确认删除“${role.name}”吗？`,
    confirmBtn: "删除",
    cancelBtn: "取消",
    onConfirm: async () => {
      try {
        await deleteManagedRole(role.id);
        dialog.destroy();
        await MessagePlugin.success("角色已删除");
        await loadRoles();
      } catch (error) {
        await MessagePlugin.error(resolveApiError(error));
      }
    },
  });
}

function searchUsers() {
  usersPage.value = 1;
  void loadUsers();
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

onMounted(async () => {
  await auth.refreshUser();
  await Promise.all([loadUsers(), loadUserRoleOptions(), loadRoles()]);
});
</script>

<template>
  <section class="settings-page system-management-page">
    <header class="settings-heading">
      <span class="section-kicker">ACCOUNT & ACCESS</span>
      <h2>账号与权限</h2>
      <p>维护登录安全、管理员账号和角色权限。</p>
    </header>

    <t-tabs v-model="activeTab" class="settings-tabs">
      <t-tab-panel value="account" label="我的账号">
        <div class="settings-grid">
          <section class="settings-panel">
            <div class="settings-panel-title">
              <UserIcon />
              <div>
                <h3>登录信息</h3>
                <p>修改账号后，下次登录请使用新账号。</p>
              </div>
            </div>
            <t-form
              ref="profileFormRef"
              :data="profileForm"
              :rules="profileRules"
              label-align="top"
              @submit="saveProfile"
            >
              <t-form-item label="管理员账号" name="username">
                <t-input
                  v-model="profileForm.username"
                  placeholder="请输入管理员账号"
                  clearable
                />
              </t-form-item>
              <t-form-item label="后台显示名称" name="displayName">
                <t-input
                  v-model="profileForm.displayName"
                  placeholder="请输入显示名称"
                  clearable
                />
              </t-form-item>
              <t-button theme="primary" type="submit" :loading="savingProfile">
                <template #icon><SaveIcon /></template>保存登录信息
              </t-button>
            </t-form>
          </section>

          <section class="settings-panel">
            <div class="settings-panel-title">
              <LockOnIcon />
              <div>
                <h3>修改密码</h3>
                <p>密码修改成功后，当前登录会立即退出。</p>
              </div>
            </div>
            <t-form
              ref="passwordFormRef"
              :data="passwordForm"
              :rules="passwordRules"
              label-align="top"
              @submit="savePassword"
            >
              <t-form-item label="当前密码" name="currentPassword"
                ><t-input
                  v-model="passwordForm.currentPassword"
                  type="password"
              /></t-form-item>
              <t-form-item label="新密码" name="newPassword"
                ><t-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="至少 10 位且包含四类字符"
              /></t-form-item>
              <t-form-item label="确认新密码" name="confirmPassword"
                ><t-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
              /></t-form-item>
              <t-button theme="primary" type="submit" :loading="savingPassword">
                <template #icon><LockOnIcon /></template>修改密码
              </t-button>
            </t-form>
          </section>
        </div>
      </t-tab-panel>

      <t-tab-panel v-if="canManageUsers" value="users" label="管理员">
        <div class="module-toolbar settings-tab-toolbar">
          <div>
            <h2>管理员</h2>
            <p>新增后台账号、分配角色，并控制账号是否可以登录。</p>
          </div>
          <div class="toolbar-actions">
            <t-button
              variant="outline"
              :loading="usersLoading"
              @click="loadUsers"
              ><template #icon><RefreshIcon /></template>刷新</t-button
            >
            <t-button theme="primary" @click="openNewUser"
              ><template #icon><AddIcon /></template>新增管理员</t-button
            >
          </div>
        </div>
        <div class="system-filter-bar">
          <t-input
            v-model="userSearch"
            placeholder="搜索账号或姓名"
            clearable
            @enter="searchUsers"
          />
          <t-select
            v-model="userStatus"
            :options="[
              { label: '启用', value: 'active' },
              { label: '停用', value: 'disabled' },
            ]"
            placeholder="全部状态"
            clearable
          />
          <t-button theme="primary" @click="searchUsers">筛选</t-button>
        </div>
        <div class="data-table-wrap" :class="{ 'is-loading': usersLoading }">
          <table class="data-table system-user-table">
            <thead>
              <tr>
                <th>管理员</th>
                <th>角色</th>
                <th>状态</th>
                <th>最近登录</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>
                  <strong>{{ user.displayName }}</strong
                  ><small>{{ user.username }}</small>
                </td>
                <td>
                  <div class="tag-list">
                    <t-tag
                      v-for="role in user.roles"
                      :key="role.id"
                      variant="light"
                      >{{ role.name }}</t-tag
                    >
                  </div>
                </td>
                <td>
                  <t-tag
                    :theme="user.status === 'active' ? 'success' : 'danger'"
                    >{{ user.status === "active" ? "启用" : "停用" }}</t-tag
                  >
                </td>
                <td>{{ formatDate(user.lastLoginAt) }}</td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>
                  <div class="row-actions system-row-actions">
                    <t-button
                      v-if="user.id !== auth.user?.id"
                      size="small"
                      variant="text"
                      @click="openEditUser(user)"
                      ><template #icon><EditIcon /></template>编辑</t-button
                    >
                    <span
                      v-if="user.id === auth.user?.id"
                      class="protected-role-label"
                      >在“我的账号”中修改</span
                    >
                    <t-button
                      v-if="user.id !== auth.user?.id"
                      size="small"
                      variant="text"
                      @click="openPasswordReset(user)"
                      ><template #icon><LockOnIcon /></template
                      >重置密码</t-button
                    >
                    <t-button
                      v-if="user.id !== auth.user?.id"
                      size="small"
                      variant="text"
                      :theme="user.status === 'active' ? 'danger' : 'success'"
                      @click="confirmStatusChange(user)"
                      >{{
                        user.status === "active" ? "停用" : "启用"
                      }}</t-button
                    >
                  </div>
                </td>
              </tr>
              <tr v-if="!users.length">
                <td colspan="6" class="empty-cell">暂无管理员</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination-bar">
          <span>共 {{ usersTotal }} 个管理员</span
          ><t-pagination
            :current="usersPage"
            :page-size="20"
            :total="usersTotal"
            :show-page-size="false"
            @current-change="
              (page: number) => {
                usersPage = page;
                loadUsers();
              }
            "
          />
        </div>
      </t-tab-panel>

      <t-tab-panel v-if="canManageRoles" value="roles" label="角色权限">
        <div class="module-toolbar settings-tab-toolbar">
          <div>
            <h2>角色权限</h2>
            <p>角色是一组可分配给管理员的操作权限。</p>
          </div>
          <div class="toolbar-actions">
            <t-button
              variant="outline"
              :loading="rolesLoading"
              @click="loadRoles"
              ><template #icon><RefreshIcon /></template>刷新</t-button
            >
            <t-button theme="primary" @click="openNewRole"
              ><template #icon><AddIcon /></template>新增角色</t-button
            >
          </div>
        </div>
        <div class="data-table-wrap" :class="{ 'is-loading': rolesLoading }">
          <table class="data-table role-table">
            <thead>
              <tr>
                <th>角色</th>
                <th>用途说明</th>
                <th>权限数量</th>
                <th>管理员</th>
                <th>类型</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in roles" :key="role.id">
                <td>
                  <strong>{{ role.name }}</strong
                  ><small>{{ role.code }}</small>
                </td>
                <td>{{ role.description || "-" }}</td>
                <td>{{ role.permissions.length }} 项</td>
                <td>{{ role.userCount }} 人</td>
                <td>
                  <t-tag :theme="role.isSystem ? 'primary' : 'default'">{{
                    role.isSystem ? "系统角色" : "自定义角色"
                  }}</t-tag>
                </td>
                <td>
                  <div class="row-actions">
                    <t-button
                      v-if="role.code !== 'super_admin'"
                      size="small"
                      variant="text"
                      @click="openEditRole(role)"
                      ><template #icon><EditIcon /></template>编辑</t-button
                    >
                    <span v-else class="protected-role-label">权限固定</span>
                    <t-button
                      v-if="!role.isSystem"
                      size="small"
                      variant="text"
                      theme="danger"
                      @click="confirmDeleteRole(role)"
                      ><template #icon><DeleteIcon /></template>删除</t-button
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </t-tab-panel>
    </t-tabs>
  </section>

  <t-dialog
    v-model:visible="userDialogVisible"
    :header="userEditor.id ? '编辑管理员' : '新增管理员'"
    width="620px"
    :footer="false"
    :close-on-overlay-click="false"
  >
    <div class="system-dialog-form">
      <t-form-item label="管理员账号"
        ><t-input
          v-model="userEditor.username"
          placeholder="例如 content_editor_01"
      /></t-form-item>
      <t-form-item label="后台显示名称"
        ><t-input
          v-model="userEditor.displayName"
          placeholder="例如 内容运营小李"
      /></t-form-item>
      <t-form-item v-if="!userEditor.id" label="初始密码"
        ><t-input
          v-model="userEditor.password"
          type="password"
          placeholder="至少 10 位，包含大小写、数字和特殊字符"
      /></t-form-item>
      <t-form-item label="分配角色"
        ><t-select
          v-model="userEditor.roleIds"
          multiple
          :options="
            roleOptions.map((role) => ({ label: role.name, value: role.id }))
          "
          placeholder="至少选择一个角色"
      /></t-form-item>
      <div class="dialog-actions">
        <t-button variant="outline" @click="userDialogVisible = false"
          >取消</t-button
        ><t-button theme="primary" :loading="userSaving" @click="saveUser"
          ><template #icon><SaveIcon /></template>保存管理员</t-button
        >
      </div>
    </div>
  </t-dialog>

  <t-dialog
    v-model:visible="roleDialogVisible"
    :header="roleEditor.id ? `编辑角色 · ${roleEditor.name}` : '新增角色'"
    width="760px"
    :footer="false"
    :close-on-overlay-click="false"
  >
    <div class="system-dialog-form role-dialog-form">
      <div class="role-base-fields">
        <t-form-item label="角色编码"
          ><t-input
            v-model="roleEditor.code"
            :disabled="Boolean(roleEditor.id)"
            placeholder="例如 regional_manager"
        /></t-form-item>
        <t-form-item label="角色名称"
          ><t-input v-model="roleEditor.name" placeholder="例如 区域负责人"
        /></t-form-item>
      </div>
      <t-form-item label="用途说明"
        ><t-input
          v-model="roleEditor.description"
          placeholder="说明该角色负责的工作"
      /></t-form-item>
      <div class="permission-editor">
        <div class="permission-editor-heading">
          <UsergroupIcon />
          <div>
            <strong>选择权限</strong>
            <p>只勾选该角色实际需要使用的功能。</p>
          </div>
        </div>
        <section
          v-for="group in permissionGroups"
          :key="group.resource"
          class="permission-group"
        >
          <h4>{{ group.name }}</h4>
          <t-checkbox-group
            v-model="roleEditor.permissionIds"
            :options="group.options"
          />
        </section>
      </div>
      <div class="dialog-actions">
        <t-button variant="outline" @click="roleDialogVisible = false"
          >取消</t-button
        ><t-button theme="primary" :loading="roleSaving" @click="saveRole"
          ><template #icon><SaveIcon /></template>保存角色权限</t-button
        >
      </div>
    </div>
  </t-dialog>

  <t-dialog
    v-model:visible="passwordDialogVisible"
    :header="`重置密码 · ${passwordReset.displayName}`"
    width="520px"
    :footer="false"
    :close-on-overlay-click="false"
  >
    <div class="system-dialog-form password-reset-field">
      <p>重置后，该账号现有登录会立即失效。</p>
      <t-form-item label="新密码"
        ><t-input
          v-model="passwordReset.password"
          type="password"
          placeholder="至少 10 位，包含大小写、数字和特殊字符"
      /></t-form-item>
      <div class="dialog-actions">
        <t-button variant="outline" @click="passwordDialogVisible = false"
          >取消</t-button
        ><t-button
          theme="primary"
          :loading="passwordResetSaving"
          @click="savePasswordReset"
          ><template #icon><LockOnIcon /></template>重置密码</t-button
        >
      </div>
    </div>
  </t-dialog>
</template>
