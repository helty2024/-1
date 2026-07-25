import { apiClient, type ApiEnvelope } from "./client";

export type AdminStatus = "active" | "disabled";

export interface RoleSummary {
  id: string;
  code: string;
  name: string;
}

export interface ManagedAdmin {
  id: string;
  username: string;
  displayName: string;
  status: AdminStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: RoleSummary[];
}

export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
}

export interface ManagedRole extends RoleSummary {
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: PermissionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  beforeJson: unknown;
  afterJson: unknown;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
  adminUser: { id: string; username: string; displayName: string } | null;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listManagedAdmins(params: {
  search?: string;
  status?: AdminStatus;
  page: number;
  pageSize: number;
}) {
  const response = await apiClient.get<ApiEnvelope<PageResult<ManagedAdmin>>>(
    "/admin/system/users",
    { params },
  );
  return response.data.data;
}

export async function createManagedAdmin(payload: {
  username: string;
  displayName: string;
  password: string;
  roleIds: string[];
}) {
  const response = await apiClient.post<ApiEnvelope<ManagedAdmin>>(
    "/admin/system/users",
    payload,
  );
  return response.data.data;
}

export async function updateManagedAdmin(
  id: string,
  payload: { username: string; displayName: string; roleIds: string[] },
) {
  const response = await apiClient.put<ApiEnvelope<ManagedAdmin>>(
    `/admin/system/users/${id}`,
    payload,
  );
  return response.data.data;
}

export async function updateManagedAdminStatus(
  id: string,
  status: AdminStatus,
) {
  const response = await apiClient.patch<ApiEnvelope<ManagedAdmin>>(
    `/admin/system/users/${id}/status`,
    { status },
  );
  return response.data.data;
}

export async function resetManagedAdminPassword(
  id: string,
  newPassword: string,
) {
  const response = await apiClient.patch<ApiEnvelope<{ changed: boolean }>>(
    `/admin/system/users/${id}/password`,
    { newPassword },
  );
  return response.data.data;
}

export async function listManagedRoles() {
  const response = await apiClient.get<ApiEnvelope<ManagedRole[]>>(
    "/admin/system/roles",
  );
  return response.data.data;
}

export async function listRoleOptions() {
  const response = await apiClient.get<ApiEnvelope<RoleSummary[]>>(
    "/admin/system/role-options",
  );
  return response.data.data;
}

export async function listPermissions() {
  const response = await apiClient.get<ApiEnvelope<PermissionItem[]>>(
    "/admin/system/permissions",
  );
  return response.data.data;
}

export async function createManagedRole(payload: {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
}) {
  const response = await apiClient.post<ApiEnvelope<ManagedRole>>(
    "/admin/system/roles",
    payload,
  );
  return response.data.data;
}

export async function updateManagedRole(
  id: string,
  payload: { name: string; description?: string; permissionIds: string[] },
) {
  const response = await apiClient.put<ApiEnvelope<ManagedRole>>(
    `/admin/system/roles/${id}`,
    payload,
  );
  return response.data.data;
}

export async function deleteManagedRole(id: string) {
  const response = await apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(
    `/admin/system/roles/${id}`,
  );
  return response.data.data;
}

export async function listAuditLogs(params: {
  search?: string;
  action?: string;
  resource?: string;
  adminUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}) {
  const response = await apiClient.get<ApiEnvelope<PageResult<AuditLogItem>>>(
    "/admin/system/audit-logs",
    { params },
  );
  return response.data.data;
}

export interface AuditOptions {
  actions: string[];
  resources: string[];
  admins: Array<{ id: string; username: string; displayName: string }>;
}

export async function getAuditOptions() {
  const response = await apiClient.get<ApiEnvelope<AuditOptions>>(
    "/admin/system/audit-options",
  );
  return response.data.data;
}
