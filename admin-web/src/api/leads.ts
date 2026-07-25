import { apiClient, type ApiEnvelope } from "./client";
import type { LeadType } from "./forms";

export type LeadStatus =
  "new" | "contacted" | "qualified" | "closed" | "invalid";
export type FollowType =
  "phone" | "wechat" | "visit" | "note" | "status_change";

export interface LeadFollowup {
  id: string;
  followType: FollowType;
  content: string;
  previousStatus?: LeadStatus | null;
  nextStatus?: LeadStatus | null;
  nextFollowAt?: string | null;
  createdAt: string;
  adminUser: { id: string; displayName: string };
}

export interface LeadRecord {
  id: string;
  leadNo: string;
  type: LeadType;
  typeLabel: string;
  title: string;
  status: LeadStatus;
  level: string;
  values: Record<string, unknown>;
  fieldLabels: Record<string, string>;
  region?: string | null;
  source?: string | null;
  createdAt: string;
  updatedAt: string;
  followNote: string;
  followups: LeadFollowup[];
}

export interface LeadListResult {
  items: LeadRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LeadFilters {
  type?: LeadType;
  status?: LeadStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function listLeadRecords(filters: LeadFilters) {
  const response = await apiClient.get<ApiEnvelope<LeadListResult>>(
    "/admin/leads",
    {
      params: filters,
    },
  );
  return response.data.data;
}

export async function exportLeadRecords(filters: LeadFilters) {
  const response = await apiClient.get<Blob>("/admin/leads/export", {
    params: {
      type: filters.type,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
    responseType: "blob",
  });
  return response.data;
}

export async function getLeadRecord(id: string) {
  const response = await apiClient.get<ApiEnvelope<LeadRecord>>(
    `/admin/leads/${id}`,
  );
  return response.data.data;
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const response = await apiClient.patch<ApiEnvelope<LeadRecord>>(
    `/admin/leads/${id}/status`,
    {
      status,
    },
  );
  return response.data.data;
}

export async function addLeadFollowup(
  id: string,
  payload: {
    followType: Exclude<FollowType, "status_change">;
    content: string;
    nextStatus?: LeadStatus;
    nextFollowAt?: string;
  },
) {
  const response = await apiClient.post<ApiEnvelope<LeadRecord>>(
    `/admin/leads/${id}/followups`,
    payload,
  );
  return response.data.data;
}
