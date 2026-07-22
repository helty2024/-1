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
