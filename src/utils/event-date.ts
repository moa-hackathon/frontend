/** Backend LocalDateTime values are in Asia/Seoul, regardless of browser timezone. */
export function assertFutureEvent(eventAt: string | null, now = Date.now()): void {
  if (!eventAt) throw new Error('행사 일시를 입력해 주세요.')
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(eventAt) ? eventAt : eventAt + '+09:00'
  const timestamp = Date.parse(zoned)
  if (!Number.isFinite(timestamp)) throw new Error('행사 일시를 올바르게 입력해 주세요.')
  if (timestamp <= now) throw new Error('이미 지난 행사 일시예요. 진행 중인 행사 목록에 표시되려면 미래 날짜로 변경해 주세요.')
}
