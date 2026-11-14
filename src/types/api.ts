// Generated from the supplied MOA OpenAPI schema.
export interface NoticeUpdateRequest {
  noticeText: string
}
export interface FinalNoticeResponse {
  eventId: number
  noticeText: string
  formUrl: string | null
  formLinkMissing: boolean
  discordConnected: boolean
  sentAt: string | null
}
export interface FormLinkRequest {
  formUrl: string | null
}
export interface FormLinkResponse {
  eventId: number
  formUrl: string | null
  formTitle: string
  questions: Array<FormQuestionResponse>
  message: string
}
export interface FormQuestionResponse {
  title: string
  required: boolean
}
export interface DiscordWebhookConnectRequest {
  webhookUrl: string
}
export interface ClubResponse {
  id: number
  name: string
  description: string | null
  discordConnected: boolean
}
export interface NoticeDraftRequest {
  title: string
  eventAt: string
  location: string
  capacity: number
  minCapacity: number
  applyDeadline: string
  extraQuestions: Array<string>
  description: string
  previousDraft: string
  revisionRequest: string
  revision: boolean
}
export interface NoticeDraftResponse {
  noticeText: string
  source: "AI" | "TEMPLATE"
}
export interface NoticeChatMessage {
  role: "user" | "assistant"
  content: string
}
export interface NoticeChatRequest {
  messages: Array<NoticeChatMessage>
  summary: NoticeChatSummary
  selectedExtraQuestions: Array<string>
}
export interface NoticeChatSummary {
  title: string | null
  eventAt: string | null
  location: string | null
  capacity: number | null
  minCapacity: number | null
  applyDeadline: string | null
  extraQuestions: Array<string>
  description: string | null
}
export interface NoticeChatResponse {
  reply: string
  summary: NoticeChatSummary
  missingFields: Array<"title" | "eventAt" | "location" | "capacity" | "minCapacity" | "applyDeadline">
  suggestedExtraQuestions: Array<string>
  complete: boolean
}
export interface EventCreateRequest {
  title: string
  eventAt: string
  location: string
  capacity: number
  minCapacity: number
  applyDeadline: string
  extraQuestions: Array<string>
  description: string
  noticeText: string
}
export interface EventCreateResponse {
  id: number
  shareCode: string
  title: string
  eventAt: string
  location: string
  capacity: number
  minCapacity: number
  applyDeadline: string
  extraQuestions: Array<string>
  description: string
  noticeText: string
}
export interface NoticeSendResponse {
  eventId: number
  channel: string
  sentAt: string | null
  messageCount: number
}
export interface FollowUpNoticeDraftRequest {
  type: "RECRUIT_MORE" | "ENCOURAGE" | "CLOSING_SOON" | "ANNOUNCE_CLOSED"
}
export interface FollowUpNoticeDraftResponse {
  type: "RECRUIT_MORE" | "ENCOURAGE" | "CLOSING_SOON" | "ANNOUNCE_CLOSED"
  noticeText: string
  source: "AI" | "TEMPLATE"
}
export interface CsvRowFailureResponse {
  rowNumber: number
  reason: string
}
export interface CsvUploadResponse {
  totalRows: number
  insertedCount: number
  skippedCount: number
  failures: Array<CsvRowFailureResponse>
  confirmedCount: number
  waitingCount: number
  lastSyncedAt: string | null
}
export interface EventCardResponse {
  id: number
  title: string
  eventAt: string
  location: string
  applicantCount: number
  capacity: number
  minCapacity: number
  applyDeadline: string
  status: "BELOW_MIN" | "AVAILABLE" | "NEAR_CAPACITY" | "FULL"
  remainingToMin: number
  remainingToCapacity: number
  fillPercent: number
  daysUntilDeadline: number
  deadlinePassed: boolean
  hint: string
}
export interface EventListResponse {
  count: number
  events: Array<EventCardResponse>
}
export interface EventDetailResponse {
  id: number
  title: string
  description: string
  eventAt: string
  location: string
  capacity: number
  minCapacity: number
  applyDeadline: string
  extraQuestions: Array<string>
  formUrl: string | null
  noticeReady: boolean
  noticeSentAt: string | null
  lastSyncedAt: string | null
}
export interface FormQuestionsResponse {
  questions: Array<FormQuestionResponse>
  copyText: string
}
export interface AnswerStat {
  question: string
  answeredCount: number
  options: Array<Option>
}
export interface CheckSummaryResponse {
  duplicateCount: number
  missingCount: number
  missingFields: Array<MissingFieldCount>
  missingSummary: string
}
export interface DashboardResponse {
  event: EventSummaryResponse
  progress: EventProgress
  nextAction: NextAction
  answerStats: Array<AnswerStat>
  checks: CheckSummaryResponse
}
export interface EventProgress {
  applicantCount: number
  capacity: number
  minCapacity: number
  status: "BELOW_MIN" | "AVAILABLE" | "NEAR_CAPACITY" | "FULL"
  remainingToMin: number
  remainingToCapacity: number
  fillPercent: number
  daysUntilDeadline: number
  deadlinePassed: boolean
}
export interface EventSummaryResponse {
  id: number
  title: string
  eventAt: string
  location: string
  lastSyncedAt: string | null
}
export interface MissingFieldCount {
  field: "NAME" | "STUDENT_ID" | "CONTACT"
  label: string
  count: number
}
export interface NextAction {
  type: "RECRUIT_MORE" | "ENCOURAGE" | "CLOSING_SOON" | "ANNOUNCE_CLOSED"
  message: string
}
export interface Option {
  value: string
  count: number
  percent: number
}
export interface ApplicationListResponse {
  filter: "ALL" | "CONFIRMED" | "WAITING" | "NEEDS_CHECK"
  totalCount: number
  applications: Array<ApplicationRowResponse>
}
export interface ApplicationRowResponse {
  id: number
  name: string
  studentId: string
  contact: string
  answers: Record<string, string>
  appliedAt: string
  status: "CONFIRMED" | "WAITING" | "CANCELED"
  displayStatus: "CANCELED" | "DUPLICATE" | "MISSING" | "CONFIRMED" | "WAITING"
  displayStatusLabel: string
  duplicate: boolean
  missingFields: Array<"NAME" | "STUDENT_ID" | "CONTACT">
}
