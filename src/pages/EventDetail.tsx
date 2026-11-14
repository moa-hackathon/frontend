import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { Header } from '../components/Header'
import { ApiAccess } from '../components/ApiAccess'
import { api, exportApplications, formatDate } from '../services/api'
import type { ApplicationListResponse, CsvUploadResponse, DashboardResponse, EventDetailResponse } from '../types/api'
import { NoticeFlow } from './NoticeFlow'
import './EventDetail.css'

const statusLabels = { BELOW_MIN: '필수 인원 미달', AVAILABLE: '진행 가능', NEAR_CAPACITY: '진행 가능 · 정원 임박', FULL: '정원 마감' }
const filters = { ALL: '전체', CONFIRMED: '확정', WAITING: '대기', NEEDS_CHECK: '확인 필요' }

export function EventDetail({ eventId }: { eventId: number }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const busy = useRef(false)
  const [dashboard, setDashboard] = useState<DashboardResponse>()
  const [event, setEvent] = useState<EventDetailResponse>()
  const [applications, setApplications] = useState<ApplicationListResponse>()
  const [upload, setUpload] = useState<CsvUploadResponse>()
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [filter, setFilter] = useState<keyof typeof filters>('ALL')
  const [revision, setRevision] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [configureNotice, setConfigureNotice] = useState<string | null>(null)
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [followBusy, setFollowBusy] = useState(false)
  const [followSaved, setFollowSaved] = useState(false)
  const [followSent, setFollowSent] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([api.dashboard(eventId), api.event(eventId), api.applications(eventId, filter)])
      .then(([board, details, list]) => { if (active) { setDashboard(board); setEvent(details); setApplications(list); setError('') } })
      .catch((cause) => { if (active) setError(cause.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [eventId, revision, filter])

  async function importFile(file?: File) {
    if (!file || busy.current) return
    if (!/\.csv$/i.test(file.name) || file.size > 10 * 1024 * 1024) { setError('10MB 이하의 CSV 파일을 선택해 주세요.'); return }
    busy.current = true; setReading(true); setError('')
    try { const result = await api.uploadCsv(eventId, file); setUpload(result); setRevision((current) => current + 1) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'CSV를 불러오지 못했어요.') }
    finally { busy.current = false; setReading(false); if (fileInput.current) fileInput.current.value = '' }
  }
  function handleDrop(dragEvent: DragEvent<HTMLDivElement>) {
    dragEvent.preventDefault(); setDragging(false)
    if (dragEvent.dataTransfer.files.length !== 1) { setError('CSV 파일을 한 개씩 선택해 주세요.'); return }
    void importFile(dragEvent.dataTransfer.files[0])
  }
  async function download() {
    if (exporting) return
    setExporting(true)
    try { await exportApplications(eventId) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '다운로드에 실패했어요.') }
    finally { setExporting(false) }
  }
  async function generateFollowUp() {
    if (followBusy) return
    setFollowBusy(true); setError('')
    try { const result = await api.followUp(eventId); setFollowUp(result.noticeText); setFollowSaved(false); setFollowSent(false) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '공지를 만들지 못했어요.') }
    finally { setFollowBusy(false) }
  }
  async function saveFollowUp() {
    if (followBusy || !followUp?.trim()) return
    setFollowBusy(true)
    try { await api.updateNotice(eventId, followUp); setFollowSaved(true) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '공지 저장에 실패했어요.') }
    finally { setFollowBusy(false) }
  }
  async function sendFollowUp() {
    if (followBusy || !followSaved || followSent) return
    setFollowBusy(true)
    try { const result = await api.send(eventId); if (!result.sentAt) throw new Error('발송 결과를 확인해 주세요.'); setFollowSent(true) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '발송에 실패했어요.') }
    finally { setFollowBusy(false) }
  }

  async function openNotice() {
    try { const result = await api.notice(eventId); setConfigureNotice(result.noticeText) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '공지를 불러오지 못했어요.') }
  }
  if (configureNotice !== null && event) return <NoticeFlow eventId={eventId} notice={configureNotice} draft={{ title: event.title, startsAt: event.eventAt, location: event.location, capacity: event.capacity, minimumParticipants: event.minCapacity, registrationDeadline: event.applyDeadline, additionalQuestions: event.extraQuestions ?? [] }} />

  const progress = dashboard?.progress
  const hasResponses = !!(dashboard?.event.lastSyncedAt || upload?.lastSyncedAt || progress?.applicantCount)
  const count = progress?.applicantCount ?? 0
  const capacity = progress?.capacity ?? event?.capacity ?? 0
  const minimum = progress?.minCapacity ?? event?.minCapacity ?? 0
  const minMet = count >= minimum
  const summary = progress?.status === 'BELOW_MIN' ? `최소 인원까지 ${progress.remainingToMin}명 남았어요.` : progress?.status === 'FULL' ? '정원이 모두 찼어요.' : `최소 인원은 넘었고, 정원까지 ${progress?.remainingToCapacity ?? 0}명 남았어요.`

  return <div className={hasResponses ? 'response-page' : ''}>
    <Header eventName={event?.title ?? dashboard?.event.title} />
    <main className={`detail-main${hasResponses ? ' response-main' : ''}`}>
      <div className="response-heading">
        <div className="detail-title"><h1>행사 진행 대시보드</h1><p>{formatDate(event?.eventAt ?? dashboard?.event.eventAt)} · {event?.location ?? dashboard?.event.location}{hasResponses && ` · 마지막 업데이트 ${formatDate(dashboard?.event.lastSyncedAt)} (구글폼 기준)`}</p></div>
        {hasResponses && <div className="response-actions"><button className="notice-line-button" type="button" disabled={reading} onClick={() => fileInput.current?.click()}>CSV 다시 불러오기 <span className="feature-tag">F5</span></button><button className="notice-line-button" type="button" disabled={exporting} onClick={() => void download()}>{exporting ? '다운로드 중…' : '엑셀 다운로드 (.xlsx)'} <span className="feature-tag">F10</span></button></div>}
      </div>
      <input ref={fileInput} className="visually-hidden" type="file" accept=".csv,text/csv" tabIndex={-1} aria-label="신청 응답 CSV 파일" onChange={(inputEvent) => void importFile(inputEvent.target.files?.[0])} />
      {loading && <p role="status">행사 정보를 불러오고 있어요…</p>}
      {error && <div className="api-error glass-panel"><p role="alert">{error}</p><button className="notice-line-button" onClick={() => setRevision((current) => current + 1)}>다시 불러오기</button><ApiAccess onSave={() => setRevision((current) => current + 1)} /></div>}
      {upload && <div role="status" className="csv-upload-result">새 응답 {upload.insertedCount}건 · 기존 응답 {upload.skippedCount}건 건너뜀 · 실패 {upload.failures.length}건{upload.failures.length > 0 && <details><summary>실패한 행 확인</summary><ul>{upload.failures.map((failure) => <li key={failure.rowNumber}>{failure.rowNumber}행: {failure.reason}</li>)}</ul></details>}</div>}
      {reading && <p role="status">CSV 응답을 서버에 반영하고 있어요…</p>}
      {event?.noticeReady && !event.noticeSentAt && <button className="notice-line-button" type="button" onClick={() => void openNotice()}>공지·신청 링크 설정</button>}
      {dashboard && <>
        <div className={`minimum-banner${minMet ? ' minimum-banner--met' : ''}`}><span className="status-dot" /><strong>{statusLabels[dashboard.progress.status]}</strong><span>{summary}</span><span className="feature-tag">F6</span></div>
        <dl className="metrics-grid">
          <div className="glass-panel metric"><dt>현재 신청 <span className="feature-tag">F7</span></dt><dd>{count}명</dd></div>
          <div className="glass-panel metric"><dt>정원</dt><dd>{capacity}명</dd></div>
          <div className="glass-panel metric"><dt>최소 필수 인원</dt><dd>{minimum}명 <span className={`status-badge status-badge--${minMet ? 'ready' : 'minimum'}`}><span className="status-dot" />{minMet ? '달성' : '미달'}</span></dd></div>
          <div className="glass-panel metric"><dt>신청 마감</dt><dd>{progress?.deadlinePassed ? '마감됨' : `D-${progress?.daysUntilDeadline}`}</dd></div>
        </dl>
        {hasResponses ? <>
          <section className="glass-panel response-progress" aria-label="신청 인원 진행률"><div><span>{count} / {capacity}명 ({progress?.fillPercent}%)</span><span>최소 {minimum}명 · 정원 {capacity}명</span></div><div className="response-progress-track" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={Math.max(capacity, count)}><span style={{ width: `${Math.min(progress?.fillPercent ?? 0, 100)}%` }} /><i style={{ left: `${capacity ? Math.min(minimum / capacity * 100, 100) : 0}%` }} /></div><p>세로선 = 최소 필수 인원({minimum}명)</p></section>
          <section className="response-next"><p><strong>다음 할 일 · </strong>{dashboard.nextAction?.message ?? summary}</p><div><span className="feature-tag">F11</span><button className="primary-button" type="button" disabled={followBusy} onClick={() => void generateFollowUp()}>{followBusy ? '생성 중…' : '공지 만들기'}</button></div></section>
          {followUp !== null && <section className="glass-panel followup-editor"><h2>후속 공지 초안</h2><textarea aria-label="후속 공지 내용" value={followUp} onChange={(inputEvent) => { setFollowUp(inputEvent.target.value); setFollowSaved(false); setFollowSent(false) }} disabled={followBusy} /><div className="response-actions"><button className="notice-line-button" onClick={() => setFollowUp(null)}>닫기</button><button className="primary-button" disabled={followBusy || !followUp.trim() || followSaved} onClick={() => void saveFollowUp()}>{followSaved ? '저장 완료' : '공지 저장'}</button><button className="primary-button" disabled={followBusy || !followSaved || followSent} onClick={() => void sendFollowUp()}>{followSent ? '발송 완료' : '디스코드 발송'}</button></div></section>}
          <div className="response-summary-grid">
            <section className="glass-panel response-stat-card"><h2>조건별 응답 집계 <span className="feature-tag">F8</span></h2>{dashboard.answerStats.length === 0 && <p>집계할 추가 응답이 없어요.</p>}{dashboard.answerStats.map((stat) => <div key={stat.question} className="answer-group"><h3>{stat.question}</h3>{stat.options.map((option) => <div className="answer-option" key={option.value}><p><span>{option.value}</span><strong>{option.count}명 · {option.percent}%</strong></p><div className="event-progress"><span style={{ width: `${Math.min(option.percent, 100)}%` }} /></div></div>)}</div>)}</section>
            <section className="glass-panel response-stat-card"><h2>확인 필요 항목 <span className="feature-tag">F9</span></h2><div className="response-check"><p><strong>중복 신청 {dashboard.checks.duplicateCount}건</strong> · 같은 학번으로 두 번 응답</p><button className="notice-line-button" onClick={() => setFilter('NEEDS_CHECK')}>정리하기</button></div><div className="response-check"><p><strong>필수 항목 미기입 {dashboard.checks.missingCount}건</strong> · {dashboard.checks.missingSummary || '누락 없음'}</p><button className="notice-line-button" onClick={() => setFilter('NEEDS_CHECK')}>확인하기</button></div></section>
          </div>
          <section className="glass-panel applications-panel">
            <div className="applications-heading"><h2>신청자 응답 ({count}명) <span className="feature-tag">F10</span></h2><div role="group" aria-label="신청자 필터" className="application-filters">{Object.entries(filters).map(([key, label]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key as keyof typeof filters)}>{label}</button>)}</div></div>
            <div className="applications-scroll"><table><thead><tr><th>이름</th><th>학번</th><th>연락처</th><th>추가 응답</th><th>신청 시각</th><th>상태</th></tr></thead><tbody>{applications?.applications.map((row) => <tr key={row.id} className={row.duplicate || row.missingFields?.length ? 'application-row--check' : ''}><td>{row.name || '-'}</td><td>{row.studentId || '-'}</td><td>{row.contact || '-'}</td><td>{Object.entries(row.answers ?? {}).map(([question, answer]) => <p key={question}><span className="answer-question">{question}: </span>{answer || '-'}</p>)}</td><td>{formatDate(row.appliedAt)}</td><td><span className={`application-status application-status--${row.displayStatus.toLowerCase()}`}><span />{row.displayStatusLabel}</span></td></tr>)}</tbody></table></div>
            {applications?.applications.length === 0 && <p>해당 조건의 신청자가 없어요.</p>}<p className="application-count">{applications?.totalCount ?? 0}명 표시</p>
          </section>
        </> : <section className="glass-panel csv-panel"><h2>구글폼 응답 불러오기 <span className="feature-tag">F5</span></h2><ol className="csv-instructions"><li>구글폼 응답 탭에서 CSV로 다운로드해요.</li><li>아래에 파일을 올리면 신청자 목록이 만들어져요.</li></ol><div className={`csv-dropzone${dragging ? ' csv-dropzone--dragging' : ''}`} onDragOver={(dragEvent) => { dragEvent.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} aria-busy={reading}><div className="csv-status"><h3>아직 응답이 없어요</h3><p>CSV 파일을 끌어다 놓거나 선택해 주세요.</p></div><button className="primary-button" type="button" disabled={reading} onClick={() => fileInput.current?.click()}>CSV 파일 선택</button></div></section>}
      </>}
    </main>
  </div>
}
