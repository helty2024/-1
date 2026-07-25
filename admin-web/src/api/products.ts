import { apiClient, type ApiEnvelope } from './client'

export type ProductStatus = 'draft' | 'published' | 'offline'

export interface ProductImages {
  main: string
  detail: string
  scene: string
  material: string
  other: string
}

export interface ProductSpec {
  label: string
  value: string
}

export interface ProductEvidenceItem {
  no: string
  title: string
  desc: string
}

export interface ProductEvidence {
  title: string
  intro: string
  image: string
  items: ProductEvidenceItem[]
}

export interface Product {
  id: string
  slug: string
  categoryCode: string
  name: string
  shortName: string
  subtitle: string
  category: string
  position: string
  people: string
  channels: string
  role: string
  listNote: string
  listScene: string
  coverImage: string
  images: ProductImages
  sellingPoints: string[]
  evidence: ProductEvidence | null
  material: string
  craft: string
  specs: ProductSpec[]
  scenarios: string[]
  agencyValue: string[]
  compliance: string
  sortOrder: number
  status: ProductStatus
  version: number
  publishedAt?: string | null
  updatedAt: string
}

export type SaveProductPayload = Omit<
  Product,
  'id' | 'status' | 'version' | 'publishedAt' | 'updatedAt'
>

export async function listProducts() {
  const response = await apiClient.get<ApiEnvelope<Product[]>>('/admin/products')
  return response.data.data
}

export async function createProduct(payload: SaveProductPayload) {
  const response = await apiClient.post<ApiEnvelope<Product>>('/admin/products', payload)
  return response.data.data
}

export async function updateProduct(id: string, payload: SaveProductPayload) {
  const response = await apiClient.put<ApiEnvelope<Product>>(`/admin/products/${id}`, payload)
  return response.data.data
}

export async function updateProductStatus(id: string, status: ProductStatus) {
  const response = await apiClient.patch<ApiEnvelope<Product>>(`/admin/products/${id}/status`, {
    status,
  })
  return response.data.data
}

export async function deleteProduct(id: string) {
  const response = await apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(
    `/admin/products/${id}`,
  )
  return response.data.data
}
