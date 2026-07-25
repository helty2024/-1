import { apiClient, type ApiEnvelope } from './client'

export interface AdminUser {
  id: string
  username: string
  displayName: string
  roles: string[]
  permissions: string[]
}

export interface LoginResult {
  accessToken: string
  expiresIn: string
  user: AdminUser
}

export async function loginAdmin(payload: { username: string; password: string }) {
  const response = await apiClient.post<ApiEnvelope<LoginResult>>('/admin/auth/login', payload)
  return response.data.data
}

export async function getCurrentAdmin() {
  const response = await apiClient.get<ApiEnvelope<AdminUser>>('/admin/auth/me')
  return response.data.data
}

export async function updateCurrentAdmin(payload: { username: string; displayName: string }) {
  const response = await apiClient.patch<ApiEnvelope<AdminUser>>('/admin/auth/profile', payload)
  return response.data.data
}

export async function changeCurrentAdminPassword(payload: {
  currentPassword: string
  newPassword: string
}) {
  const response = await apiClient.patch<
    ApiEnvelope<{ changed: boolean; reloginRequired: boolean }>
  >('/admin/auth/password', payload)
  return response.data.data
}
