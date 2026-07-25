import { apiClient, type ApiEnvelope } from './client'

export type LeadType = 'agent' | 'investment' | 'consult'
export type PublishStatus = 'draft' | 'published' | 'offline'
export type FormFieldType =
  | 'text'
  | 'number'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'

export interface LeadFormField {
  id?: string
  fieldKey: string
  label: string
  fieldType: FormFieldType
  placeholder?: string
  options: string[]
  required: boolean
  validation: Record<string, unknown>
  sortOrder: number
  isVisible: boolean
}

export interface LeadForm {
  id: string
  code: string
  name: string
  leadType: LeadType
  title: string
  subtitle?: string
  successMessage?: string
  status: PublishStatus
  version: number
  fields: LeadFormField[]
  updatedAt: string
}

export type SaveLeadFormPayload = Omit<LeadForm, 'id' | 'version' | 'updatedAt'>

export async function listForms() {
  const response = await apiClient.get<ApiEnvelope<LeadForm[]>>('/admin/forms')
  return response.data.data
}

export async function createForm(payload: SaveLeadFormPayload) {
  const response = await apiClient.post<ApiEnvelope<LeadForm>>('/admin/forms', payload)
  return response.data.data
}

export async function updateForm(id: string, payload: SaveLeadFormPayload) {
  const response = await apiClient.put<ApiEnvelope<LeadForm>>(`/admin/forms/${id}`, payload)
  return response.data.data
}

export async function deleteForm(id: string) {
  const response = await apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(`/admin/forms/${id}`)
  return response.data.data
}
