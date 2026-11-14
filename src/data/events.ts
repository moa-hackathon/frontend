export type EventStatus = 'minimum' | 'ready' | 'almost' | 'closed'

export const statusLabels: Record<EventStatus, string> = {
  minimum: '필수 인원 미달',
  ready: '진행 가능',
  almost: '정원 임박',
  closed: '정원 마감',
}

// Design fixtures until the event API is connected.
export const events = [
  { id: 'networking', title: '모아 네트워킹 행사', schedule: '11/21(금) 19:00', location: '공학관 302호', count: 34, capacity: 40, minimum: 20, deadline: 'D-5', status: 'almost' as EventStatus, note: '정원까지 6명 남음' },
  { id: 'study', title: '알고리즘 스터디 발표회', schedule: '11/25(화) 18:30', location: '[장소]', count: 9, capacity: 30, minimum: 15, deadline: 'D-3', status: 'minimum' as EventStatus, note: '필수 15명까지 6명 남음' },
  { id: 'welcome', title: '신입 부원 환영회', schedule: '11/28(금) 18:00', location: '[장소]', count: 31, capacity: 60, minimum: 20, deadline: 'D-10', status: 'ready' as EventStatus, note: '필수 인원 달성' },
  { id: 'hackathon', title: '해커톤 OT', schedule: '11/20(목) 19:00', location: '[장소]', count: 50, capacity: 50, minimum: 20, deadline: null, status: 'closed' as EventStatus, note: '구글폼 응답 닫기 필요' },
]
export type MoaEvent = (typeof events)[number]
