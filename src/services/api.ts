import type * as T from '../types/api'
import { assertFutureEvent } from '../utils/event-date'

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/moa-api' : 'https://moa-backend-b68k.onrender.com')).replace(/\/$/, '')
export function getInviteCode() { return sessionStorage.getItem('moa-invite-code') || import.meta.env.VITE_INVITE_CODE || '' }
export function setInviteCode(code: string) { sessionStorage.setItem('moa-invite-code', code.trim()) }

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const code = getInviteCode()
  if (!code) throw new Error('동아리 초대 코드를 먼저 입력해 주세요.')
  const headers = new Headers(init.headers)
  headers.set('X-Invite-Code', code)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(API_BASE + path, { ...init, headers })
  if (!response.ok) {
    let message = response.status === 401 || response.status === 403 ? '초대 코드를 확인해 주세요.' : `요청에 실패했어요. (${response.status})`
    try { const error = await response.json(); message = error.message || error.detail || message } catch { /* non-JSON server error */ }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}
const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
export const api = {
  club: () => apiRequest<T.ClubResponse>('/api/club'),
  connectDiscord: (webhookUrl: string) => apiRequest<T.ClubResponse>('/api/club/discord-webhook', json('PUT', { webhookUrl })),
  events: () => apiRequest<T.EventListResponse>('/api/events'),
  event: (id: number) => apiRequest<T.EventDetailResponse>(`/api/events/${id}`),
  dashboard: (id: number) => apiRequest<T.DashboardResponse>(`/api/events/${id}/dashboard`),
  applications: (id: number, filter = 'ALL') => apiRequest<T.ApplicationListResponse>(`/api/events/${id}/applications?filter=${encodeURIComponent(filter)}`),
  chat: (body: { messages: T.NoticeChatMessage[]; summary?: T.NoticeChatSummary; selectedExtraQuestions?: string[] }) => apiRequest<T.NoticeChatResponse>('/api/notices/chat', json('POST', body)),
  draft: (body: T.NoticeChatSummary & { previousDraft?: string; revisionRequest?: string }) => apiRequest<T.NoticeDraftResponse>('/api/notices/draft', json('POST', body)),
  createEvent: (body: T.NoticeChatSummary & { noticeText: string }) => {
    assertFutureEvent(body.eventAt)
    return apiRequest<T.EventCreateResponse>('/api/events', json('POST', body))
  },
  formQuestions: (id: number) => apiRequest<T.FormQuestionsResponse>(`/api/events/${id}/form-questions`),
  formLink: (id: number, formUrl: string) => apiRequest<T.FormLinkResponse>(`/api/events/${id}/form-link`, json('PUT', { formUrl })),
  notice: (id: number) => apiRequest<T.FinalNoticeResponse>(`/api/events/${id}/notice`),
  send: (id: number, signal?: AbortSignal) => apiRequest<T.NoticeSendResponse>(`/api/events/${id}/notice/send`, { ...json('POST'), signal }),
  followUp: (id: number) => apiRequest<T.FollowUpNoticeDraftResponse>(`/api/events/${id}/notice/follow-up/draft`, json('POST', {})),
  updateNotice: (id: number, noticeText: string) => apiRequest<T.FinalNoticeResponse>(`/api/events/${id}/notice`, json('PUT', { noticeText })),
  uploadCsv: (id: number, file: File) => {
    const data = new FormData(); data.append('file', file)
    return apiRequest<T.CsvUploadResponse>(`/api/events/${id}/applications/csv`, { method: 'POST', body: data })
  },
}
export async function exportApplications(id: number) {
  const response = await fetch(`${API_BASE}/api/events/${id}/applications/export`, { headers: { 'X-Invite-Code': getInviteCode() } })
  if (!response.ok) throw new Error('엑셀 다운로드에 실패했어요.')
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a'); link.href = url; link.download = `moa-${id}-applications.xlsx`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : value + '+09:00')
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}
