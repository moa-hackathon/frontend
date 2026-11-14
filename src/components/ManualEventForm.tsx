import { useState } from 'react'
import type { NoticeChatSummary } from '../types/api'

export function ManualEventForm({ disabled, onSubmit }: { disabled: boolean; onSubmit: (summary: NoticeChatSummary) => void }) {
  const [error, setError] = useState('')
  return <form className="glass-panel manual-event-form" onSubmit={(event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const capacity = Number(form.get('capacity'))
    const minCapacity = Number(form.get('minimum'))
    const eventAt = String(form.get('eventAt'))
    const applyDeadline = String(form.get('deadline'))
    if (minCapacity > capacity || new Date(applyDeadline) >= new Date(eventAt)) { setError('최소 인원은 정원 이하, 신청 마감은 행사 일시 이전이어야 해요.'); return }
    setError('')
    onSubmit({ title: String(form.get('title')), eventAt: eventAt + ':00', location: String(form.get('location')), capacity, minCapacity, applyDeadline: applyDeadline + ':00', extraQuestions: String(form.get('questions')).split(',').map((value) => value.trim()).filter(Boolean), description: String(form.get('description')) })
  }}>
    <h2>행사 정보 직접 입력</h2>
    <fieldset disabled={disabled}>
      <label>행사명<input name="title" required maxLength={100} /></label>
      <label>행사 일시 (한국 시간)<input name="eventAt" type="datetime-local" required /></label>
      <label>장소<input name="location" required /></label>
      <label>정원<input name="capacity" type="number" min="1" required /></label>
      <label>최소 필수 인원<input name="minimum" type="number" min="0" defaultValue="0" required /></label>
      <label>신청 마감 (한국 시간)<input name="deadline" type="datetime-local" required /></label>
      <label>추가 질문 (쉼표로 구분)<input name="questions" placeholder="뒤풀이 참석 여부, 알레르기" /></label>
      <label>추가 안내<input name="description" placeholder="준비물, 음식 등" /></label>
    </fieldset>
    {error && <p role="alert">{error}</p>}
    <button className="primary-button" disabled={disabled}>이 정보로 공지 만들기</button>
  </form>
}
