import { useEffect, useRef, useState } from 'react'
import { Header } from '../components/Header'
import { ManualEventForm } from '../components/ManualEventForm'
import { ApiAccess } from '../components/ApiAccess'
import { api, formatDate } from '../services/api'
import type { NoticeChatMessage, NoticeChatSummary } from '../types/api'
import type { EventDraft } from '../types/chat'
import { NoticeFlow } from './NoticeFlow'
import avatar from '../assets/chat/avatar.png'
import './EventChat.css'

export function LiveChat({ initialPrompt }: { initialPrompt: string }) {
  const [manual, setManual] = useState(false)
  const [messages, setMessages] = useState<NoticeChatMessage[]>([])
  const [summary, setSummary] = useState<NoticeChatSummary>()
  const [notice, setNotice] = useState('')
  const [complete, setComplete] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<number>()
  const [retryDraft, setRetryDraft] = useState(false)
  const initialSent = useRef(false)
  const lock = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const end = useRef<HTMLDivElement>(null)

  async function submit(content: string) {
    if (!content.trim() || lock.current) return
    if (content.length > 2000) { setError('메시지는 2,000자 이내로 입력해 주세요.'); return }
    lock.current = true; setPending(true); setError(''); setRetryDraft(false)
    const nextMessages: NoticeChatMessage[] = [...messages, { role: 'user', content }]
    if (nextMessages.length > 39) { setError('대화가 길어졌어요. 새 행사 작성을 시작해 주세요.'); lock.current = false; setPending(false); return }
    try {
      if (notice && summary && complete) {
        const result = await api.draft({ ...summary, extraQuestions: selected, previousDraft: notice, revisionRequest: content })
        setNotice(result.noticeText)
        setMessages([...nextMessages, { role: 'assistant', content: '요청한 내용으로 공지 초안을 수정했어요.' }])
      } else {
        const result = await api.chat({ messages: nextMessages, summary, selectedExtraQuestions: selected })
        setMessages([...nextMessages, { role: 'assistant', content: result.reply }])
        setSummary(result.summary); setSelected(result.summary.extraQuestions ?? [])
        setSuggestions(result.suggestedExtraQuestions ?? []); setComplete(result.complete)
        if (result.complete) {
          try {
            const draft = await api.draft(result.summary)
            setNotice(draft.noticeText)
          } catch (cause) {
            setRetryDraft(true)
            throw cause
          }
        }
      }
      setInput('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : '응답을 받지 못했어요. 다시 시도해 주세요.'); setInput(content) }
    finally { lock.current = false; setPending(false) }
  }

  useEffect(() => {
    if (!initialSent.current && initialPrompt.trim()) {
      initialSent.current = true
      void submit(initialPrompt.trim())
    }
    // Initial home input is sent exactly once on entry, including StrictMode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { if (messages.length) end.current?.scrollIntoView({ block: 'nearest' }) }, [messages.length, notice])

  async function confirm() {
    if (!summary || !notice || !complete || lock.current) return
    lock.current = true; setPending(true); setError('')
    try {
      const event = await api.createEvent({ ...summary, extraQuestions: selected, noticeText: notice })
      setCreatedId(event.id)
    } catch (cause) { setError(cause instanceof Error ? cause.message : '행사를 저장하지 못했어요.') }
    finally { lock.current = false; setPending(false) }
  }

  async function regenerate() {
    if (!summary || lock.current) return
    lock.current = true; setPending(true); setError('')
    try { const result = await api.draft({ ...summary, extraQuestions: selected }); setNotice(result.noticeText); setRetryDraft(false); setInput('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : '초안을 만들지 못했어요.') }
    finally { lock.current = false; setPending(false) }
  }

  async function submitManual(values: NoticeChatSummary) {
    if (lock.current) return
    lock.current = true; setPending(true); setError('')
    setSummary(values); setSelected(values.extraQuestions); setComplete(true)
    try { const result = await api.draft(values); setNotice(result.noticeText); setManual(false) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '공지 생성에 실패했어요.'); setRetryDraft(true) }
    finally { lock.current = false; setPending(false) }
  }

  if (createdId && summary) {
    const draft: EventDraft = { title: summary.title, startsAt: summary.eventAt, location: summary.location, capacity: summary.capacity, minimumParticipants: summary.minCapacity, registrationDeadline: summary.applyDeadline, additionalQuestions: selected }
    return <NoticeFlow eventId={createdId} draft={draft} notice={notice} />
  }
  const fields = summary ? [
    ['행사명', summary.title], ['일시', summary.eventAt ? formatDate(summary.eventAt) : null],
    ['장소', summary.location], ['정원', summary.capacity === null ? null : `${summary.capacity}명`],
    ['최소 필수 인원', summary.minCapacity === null ? null : `${summary.minCapacity}명`],
    ['신청 마감', summary.applyDeadline ? formatDate(summary.applyDeadline) : null],
  ] : []

  return <div className="chat-page">
    <Header eventName="새 행사 만들기" />
    <main className="chat-main" aria-label="새 행사 만들기 대화">
      <h1 className="visually-hidden">모아와 새 행사 만들기</h1>
      <div className="chat-message chat-message--bot"><img className="chat-avatar" src={avatar} alt="" /><p className="chat-bubble">행사 내용을 편하게 적어 주세요. 공지로 정리해 드릴게요.</p></div>
      <div role="log" className="live-chat-history" aria-live="polite">
        {messages.map((message, index) => <div className={`chat-message chat-message--${message.role === 'user' ? 'user' : 'bot'}`} key={index}>{message.role === 'assistant' && <img className="chat-avatar" src={avatar} alt="" />}<p className="chat-bubble">{message.content}</p></div>)}
      </div>
      {summary && <div className="chat-live-results chat-stack">
        <section className="chat-summary"><h2>행사 요약 <span className="feature-tag">F1</span></h2><dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? <span className="chat-missing">입력 필요</span>}</dd></div>)}</dl></section>
        {!notice && <><p className="chat-bubble">신청받을 때 추가로 물어볼 게 있나요? (선택)</p><div className="chat-questions">{[...new Set([...suggestions, ...selected])].map((question) => <button key={question} type="button" disabled={pending} aria-pressed={selected.includes(question)} onClick={() => setSelected((current) => current.includes(question) ? current.filter((item) => item !== question) : [...current, question])}>{question}</button>)}<button type="button" disabled={pending} aria-pressed={selected.length === 0} onClick={() => setSelected([])}>없어요</button></div></>}
        {notice && <section className="chat-summary"><h2>공지 초안 <span className="feature-tag">F2</span></h2><p className="chat-notice-text">{notice}</p><div className="chat-notice-actions"><button className="chat-revise" type="button" disabled={pending} onClick={() => inputRef.current?.focus()}>수정 요청</button><button className="primary-button" type="button" disabled={pending} onClick={() => void confirm()}>이대로 확인</button></div></section>}
      </div>}
      {pending && <p role="status">모아가 정리하고 있어요…</p>}
      {error && <div className="api-error" role="alert"><p>{error}</p><ApiAccess onSave={() => setError('')} />{retryDraft && <button className="primary-button" type="button" disabled={pending} onClick={() => void regenerate()}>공지 초안 다시 만들기</button>}</div>}
      {error && <button className="notice-line-button" type="button" onClick={() => setManual((value) => !value)}>행사 정보 직접 입력하기</button>}
      {manual && <ManualEventForm disabled={pending} onSubmit={(values) => void submitManual(values)} />}
      <div ref={end} />
    </main>
    <footer className="chat-composer"><form onSubmit={(event) => { event.preventDefault(); void submit(input.trim()) }}><input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} aria-label="행사 정보 메시지" placeholder="행사 내용을 입력하거나 수정할 부분을 알려 주세요" maxLength={2000} disabled={pending} onKeyDown={(event) => { if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault() }} /><button className="primary-button" type="submit" disabled={pending || !input.trim()}>전송</button></form></footer>
  </div>
}
