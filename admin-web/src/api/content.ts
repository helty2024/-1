import { apiClient, type ApiEnvelope } from './client'

export type ContentStatus = 'draft' | 'published' | 'offline'

export interface ContentStat {
  value: string
  label: string
}

export interface ContentCard {
  title: string
  desc: string
  image?: string
  fileUrl?: string
  fileName?: string
  actionText?: string
  url?: string
  tab?: boolean
}

export interface ContentBlock {
  title: string
  body: string
  image: string
  cards: ContentCard[]
  showProductCards?: boolean
  actionText?: string
  actionUrl?: string
  actionTab?: boolean
  secondaryActionText?: string
  secondaryActionUrl?: string
  secondaryActionTab?: boolean
}

export interface ContentTimelineItem {
  year: string
  text: string
}

export interface ContentCase {
  name: string
  type: string
  result: string
}

export interface ContentFaq {
  q: string
  a: string
}

export interface ContentAction {
  text: string
  url: string
  tab?: boolean
}

export interface ContentPage {
  id: string
  slug: string
  pageType: string
  navTitle: string
  label: string
  title: string
  subtitle: string
  coverImage: string
  status: ContentStatus
  version: number
  publishedAt?: string | null
  updatedAt: string
  stats: ContentStat[]
  sections: ContentBlock[]
  timeline: ContentTimelineItem[]
  cases: ContentCase[]
  faq: ContentFaq[]
  primaryAction?: ContentAction | null
  secondaryAction?: ContentAction | null
  cardActionText?: string
}

export type SaveContentPagePayload = Omit<
  ContentPage,
  'id' | 'status' | 'version' | 'publishedAt' | 'updatedAt'
>

export async function listContentPages() {
  const response = await apiClient.get<ApiEnvelope<ContentPage[]>>('/admin/content-pages')
  return response.data.data
}

export async function createContentPage(payload: SaveContentPagePayload) {
  const response = await apiClient.post<ApiEnvelope<ContentPage>>('/admin/content-pages', payload)
  return response.data.data
}

export async function updateContentPage(id: string, payload: SaveContentPagePayload) {
  const response = await apiClient.put<ApiEnvelope<ContentPage>>(
    `/admin/content-pages/${id}`,
    payload,
  )
  return response.data.data
}

export async function updateContentPageStatus(id: string, status: ContentStatus) {
  const response = await apiClient.patch<ApiEnvelope<ContentPage>>(
    `/admin/content-pages/${id}/status`,
    { status },
  )
  return response.data.data
}

export async function deleteContentPage(id: string) {
  const response = await apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(
    `/admin/content-pages/${id}`,
  )
  return response.data.data
}
