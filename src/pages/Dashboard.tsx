import { useEffect, useState } from 'react'
import { statusLabels } from '../data/events'
import { api, formatDate } from '../services/api'
import { ApiAccess } from '../components/ApiAccess'
import type { EventCardResponse } from '../types/api'
import { Header } from '../components/Header'

export function Dashboard({ onCreateEvent }: { onCreateEvent: (prompt: string) => void }) {
  const [cards, setCards] = useState<EventCardResponse[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    api.events().then((result) => { if (active) { setCards(result.events); setError('') } })
      .catch((error) => { if (active) setError(error.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])
  const statusMap = { BELOW_MIN: 'minimum', AVAILABLE: 'ready', NEAR_CAPACITY: 'almost', FULL: 'closed' } as const
  const events = cards.map((card) => ({
    id: card.id, title: card.title, schedule: formatDate(card.eventAt), location: card.location,
    count: card.applicantCount, capacity: card.capacity, status: statusMap[card.status],
    deadline: card.deadlinePassed ? null : `D-${card.daysUntilDeadline}`, note: card.hint,
  }))
  const [prompt, setPrompt] = useState('')
  const handleCreateEvent = () => onCreateEvent(prompt)

  return (
    <>
      <Header />
      <main className="dashboard-main">
        {error && <div className="glass-panel api-error"><p role="alert">{error}</p><ApiAccess onSave={() => { setLoading(true); setRevision((value) => value + 1) }} /></div>}
        {loading && <p role="status">행사 목록을 불러오고 있어요…</p>}
        <section className="glass-panel create-event-panel" aria-labelledby="create-title">
          <h1 id="create-title">어떤 행사를 준비하세요?</h1>
          <p>행사 내용을 편하게 적으면 공지부터 신청 현황까지 정리해 드려요.</p>
          <form onSubmit={(event) => { event.preventDefault(); handleCreateEvent() }}>
            <input
              aria-label="준비할 행사 내용"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="예: 다음 주 금요일 저녁 7시 공학관에서 네트워킹 행사, 정원 40명"
            />
            <button className="primary-button" type="submit">새 행사 만들기</button>
          </form>
        </section>
        <section aria-labelledby="events-title">
          <div className="events-heading">
            <h2 id="events-title">진행 중인 행사 {events.length}</h2>
            <ul className="status-legend" aria-label="행사 상태 안내">
              {Object.entries(statusLabels).map(([status, label]) => (
                <li key={status}><span className={`status-dot status-dot--${status}`} />{label}</li>
              ))}
            </ul>
          </div>
          {!loading && !error && events.length === 0 && <p>아직 행사가 없어요. 첫 행사를 만들어 보세요.</p>}
          <div className="event-grid">
            {events.map((event) => (
              <a className={`glass-panel event-card event-card--${event.status}`} href={`#events/${event.id}`} key={event.id} aria-label={`${event.title} 대시보드 보기`}>
                <div className="event-card-heading">
                  <h3>{event.title}</h3>
                  <span className={`status-badge status-badge--${event.status}`}><span className="status-dot" />{statusLabels[event.status]}</span>
                </div>
                <p className="event-schedule">{event.schedule} · {event.location}</p>
                <div className="event-count-row">
                  <p><strong>{event.count}</strong> / {event.capacity}명</p>
                  <span>{event.deadline ? `마감 ${event.deadline}` : '마감됨'}</span>
                </div>
                <div className="event-progress" role="progressbar" aria-label={`${event.title} 신청 인원`} aria-valuenow={event.count} aria-valuemin={0} aria-valuemax={event.capacity}>
                  <span style={{ width: `${Math.min(event.count / event.capacity, 1) * 100}%` }} />
                </div>
                <p className="event-note">{event.note} · 대시보드 보기</p>
              </a>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
