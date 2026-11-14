export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface EventDraft {
  title: string | null
  startsAt: string | null
  location: string | null
  capacity: number | null
  minimumParticipants: number | null
  registrationDeadline: string | null
  additionalQuestions: string[]
}

// The server returns this state with each turn; free text must not select a phase.
export type ChatPhase = 'collecting' | 'ready'
export interface ChatTurnResult {
  message: ChatMessage
  draft: EventDraft
  missingFields: (keyof EventDraft)[]
  status: ChatPhase
  notice: string | null
  revision: number
}
