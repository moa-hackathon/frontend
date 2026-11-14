import type { EventDraft } from '../types/chat'

// Figma 68:6160: design fixture only, never inferred from user messages.
export const readyPreview = {
  prompt: '다음 주 금요일 11/21 저녁 7시에 공학관 302호에서 네트워킹 행사 해요. 정원 40명이고 20명은 넘어야 진행해요. 신청은 11/19까지 받고, 피자 나와요. 뒤풀이 참석 여부도 받아야 해요.',
  draft: {
    title: '모아 네트워킹 행사',
    startsAt: '11/21(금) 19:00',
    location: '공학관 302호',
    capacity: 40,
    minimumParticipants: 20,
    registrationDeadline: '11/19(수)',
    additionalQuestions: ['뒤풀이 참석 여부'],
  } satisfies EventDraft,
  notice: '[모아] 네트워킹 행사 안내\n일시: 11/21(금) 19:00\n장소: 공학관 302호\n정원: 40명 (선착순)\n신청 마감: 11/19(수)\n피자가 준비되어 있어요!\n신청 링크: [구글폼 링크]',
}
