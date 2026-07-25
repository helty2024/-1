import { apiClient, type ApiEnvelope } from './client'

export type MediaKind = 'all' | 'image' | 'document'

export interface MediaAsset {
  id: string
  originalName: string
  objectKey: string
  mimeType: string
  extension: string | null
  sizeBytes: number
  width: number | null
  height: number | null
  sha256: string | null
  accessLevel: 'public' | 'private'
  status: 'processing' | 'ready' | 'blocked'
  altText: string | null
  createdAt: string
  updatedAt: string
  url: string
  isImage: boolean
}

export async function listMediaAssets(kind: MediaKind, search = '') {
  const response = await apiClient.get<ApiEnvelope<MediaAsset[]>>('/admin/media-assets', {
    params: { kind, search: search || undefined },
  })
  return response.data.data
}

export async function uploadMediaAsset(
  file: File,
  onProgress?: (percent: number) => void,
) {
  const form = new FormData()
  form.append('file', file)
  const response = await apiClient.post<ApiEnvelope<MediaAsset>>('/admin/media-assets/upload', form, {
    timeout: 60_000,
    onUploadProgress(event) {
      if (!event.total || !onProgress) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    },
  })
  return response.data.data
}

export async function updateMediaAsset(id: string, altText: string) {
  const response = await apiClient.patch<ApiEnvelope<MediaAsset>>(`/admin/media-assets/${id}`, {
    altText,
  })
  return response.data.data
}

export async function deleteMediaAsset(id: string) {
  const response = await apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(
    `/admin/media-assets/${id}`,
  )
  return response.data.data
}
