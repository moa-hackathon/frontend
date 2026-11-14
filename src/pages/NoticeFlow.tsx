import { useEffect, useRef, useState } from 'react'
import { Header } from '../components/Header'
import avatar from '../assets/chat/avatar.png'
import type { EventDraft } from '../types/chat'
import { validateFormUrl } from '../services/notices'
import { api } from '../services/api'
import type { FormQuestionResponse } from '../types/api'
import './EventChat.css'
import './NoticeFlow.css'

export function NoticeFlow({ draft, notice, eventId }: { draft: EventDraft; notice: string; eventId?: number }) {
  const [serverQuestions, setServerQuestions] = useState<FormQuestionResponse[]>([])
  const [recommendedQuestions, setRecommendedQuestions] = useState<FormQuestionResponse[]>([])
  const [serverNotice, setServerNotice] = useState('')
  const [linkMessage, setLinkMessage] = useState('')
  const [checkingLink, setCheckingLink] = useState(false)
  const [discordConnected, setDiscordConnected] = useState(true)
  const linkBusy = useRef(false)
  const [step, setStep] = useState<'link' | 'send'>('link')
  const [formUrl, setFormUrl] = useState('')
  const [confirmedUrl, setConfirmedUrl] = useState('')
  const [mode, setMode] = useState<'link' | 'questions'>('link')
  const [channel, setChannel] = useState<'discord' | null>('discord')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const linkInput = useRef<HTMLInputElement>(null)
  const questionCard = useRef<HTMLElement>(null)
  const request = useRef<AbortController | null>(null)
  // The documented send endpoint has no idempotency contract; never auto-retry.
  const busy = useRef(false)

  useEffect(() => {
    if (!eventId) return
    let active = true
    api.formQuestions(eventId).then((result) => { if (active) setRecommendedQuestions(result.questions) }).catch((cause) => { if (active) setError(cause.message) })
    return () => { active = false }
  }, [eventId])

  useEffect(() => () => request.current?.abort(), [])
  useEffect(() => { window.scrollTo(0, 0) }, [step])

  const fallbackQuestions = ['이름', '학번', '연락처', ...draft.additionalQuestions.filter((item) => item !== '없어요')]
  const questions = (step === 'send' ? serverQuestions : recommendedQuestions).length
    ? (step === 'send' ? serverQuestions : recommendedQuestions).map((question) => question.title) : fallbackQuestions
  const content = serverNotice || notice.replace('[구글폼 링크]', confirmedUrl)

  async function confirmLink() {
    if (linkBusy.current) return
    linkBusy.current = true; setCheckingLink(true); setError('')
    try {
      const url = validateFormUrl(formUrl)
      if (!eventId) throw new Error('미리보기예요. 실제 행사를 만든 뒤 연결해 주세요.')
      const result = await api.formLink(eventId, url)
      const final = await api.notice(eventId)
      if (final.formLinkMissing) throw new Error('구글폼 링크가 아직 연결되지 않았어요.')
      setConfirmedUrl(result.formUrl ?? url); setServerQuestions(result.questions); setLinkMessage(result.message)
      setServerNotice(final.noticeText); setDiscordConnected(final.discordConnected)
      setStep('send')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '링크를 확인해 주세요.')
      linkInput.current?.focus()
    } finally { linkBusy.current = false; setCheckingLink(false) }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('복사했어요.')
    } catch {
      setCopyStatus('복사하지 못했어요. 내용을 직접 선택해서 복사해 주세요.')
    }
  }

  async function handleSend() {
    if (!channel || busy.current || status === 'sent') return
    busy.current = true
    setStatus('sending')
    setError('')
    const controller = new AbortController()
    request.current = controller
    try {
      if (!eventId) throw new Error('실제 행사를 먼저 만들어 주세요.')
      const result = await api.send(eventId, controller.signal)
      if (!result.sentAt || result.messageCount < 1) throw new Error('발송 결과를 확인하지 못했어요.')
      if (!controller.signal.aborted) setStatus('sent')
    } catch (cause) {
      if (!controller.signal.aborted) {
        setStatus('error')
        setError(cause instanceof Error ? cause.message : '발송하지 못했어요. 다시 시도해 주세요.')
      }
    } finally {
      busy.current = false
    }
  }

  return (
    <div className={`chat-page notice-flow notice-flow--${step}`}>
      <Header eventName={draft.title ?? '새 행사 만들기'} />
      <main className="chat-main notice-flow-main">
        <h1 className="visually-hidden">{step === 'link' ? '구글폼 링크 연결' : '공지 채널 선택 및 발송'}</h1>
        {step === 'link' ? (
          <>
            <p className="notice-confirmed-pill">공지 초안 확인 완료</p>
            <div className="chat-message chat-message--bot">
              <img className="chat-avatar" src={avatar} alt="" />
              <div className="chat-stack">
                <p className="chat-bubble">신청받을 구글폼 링크가 있나요? 공지에 넣어 드릴게요.</p>
                <div className="chat-questions" role="group" aria-label="구글폼 준비 상태">
                  <button type="button" aria-pressed={mode === 'link'} onClick={() => { setMode('link'); linkInput.current?.focus() }}>링크 붙여넣기</button>
                  <button type="button" aria-pressed={mode === 'questions'} onClick={() => { setMode('questions'); questionCard.current?.scrollIntoView({ block: 'nearest' }) }}>아직 없어요 · 폼 문항 추천받기</button>
                </div>
              </div>
            </div>
            <div className="notice-link-grid">
              <section className="chat-summary" aria-labelledby="form-link-title">
                <h2 id="form-link-title">링크가 있어요 <span className="feature-tag">F3</span></h2>
                <form onSubmit={(event) => { event.preventDefault(); void confirmLink() }} noValidate>
                  <label htmlFor="google-form-url">구글폼 링크</label>
                  <input ref={linkInput} id="google-form-url" type="url" value={formUrl} onChange={(event) => { setFormUrl(event.target.value); setError('') }} placeholder="https://forms.gle/..." aria-invalid={!!error} aria-describedby="form-url-help form-url-error" />
                  <button className="notice-line-button" type="submit" disabled={checkingLink}>{checkingLink ? "확인 중…" : "링크 확인"}</button>
                  <p id="form-url-help" className="notice-helper">확인한 링크를 공지의 [구글폼 링크]에 넣어요.</p>
                  <p id="form-url-error" role="alert" className="notice-error">{error}</p>
                </form>
              </section>
              <section className="chat-summary" ref={questionCard} aria-labelledby="form-questions-title">
                <h2 id="form-questions-title">아직 없어요 <span className="feature-tag">F3</span></h2>
                <p className="notice-helper">이 행사에 맞는 폼 문항을 추천해요.</p>
                <ul className="form-question-list">
                  {questions.map((question, index) => <li key={question}><span>{question}</span><span className="question-requirement"><span />{(recommendedQuestions[index]?.required ?? index < 3) ? '필수' : '선택'}</span></li>)}
                </ul>
                <button className="notice-line-button" type="button" onClick={() => void copyText(questions.map((question, index) => `${question} (${(recommendedQuestions[index]?.required ?? index < 3) ? '필수' : '선택'})`).join('\n'))}>문항 복사하기</button>
                <p className="notice-helper">폼을 만든 뒤 링크를 왼쪽에 붙여넣어 주세요.</p>
              </section>
            </div>
            <p role="status" className="notice-copy-status">{copyStatus}</p>
            <div className="notice-next"><button className="primary-button" type="button" onClick={() => void confirmLink()} disabled={checkingLink}>다음 · 채널 선택</button></div>
          </>
        ) : (
          <div className="chat-message chat-message--bot">
            <img className="chat-avatar" src={avatar} alt="" />
            <div className="chat-stack">
              <p className="chat-bubble">{linkMessage || `링크를 확인했어요. 응답 항목: ${questions.join(', ')}`}. 어디에 공지할까요?</p>
              <div className="chat-questions" role="group" aria-label="발송 채널 선택">
                <button type="button" disabled title="현재 디스코드만 지원해요">카카오톡</button>
                <button type="button" aria-pressed={channel === 'discord'} disabled={status === 'sending' || status === 'sent'} onClick={() => setChannel((current) => current ? null : 'discord')}>디스코드</button>
                <button type="button" disabled title="현재 디스코드만 지원해요">노션</button>
              </div>
              <section className="chat-summary chat-notice" aria-labelledby="final-notice-title">
                <div className="final-notice-heading"><h2 id="final-notice-title">최종 공지 <span className="feature-tag">F4</span></h2><span>{channel ? '디스코드' : '채널을 선택해 주세요'}</span></div>
                <p className="chat-notice-text">{content}</p>
                <div className="chat-notice-actions">
                  <button className="notice-line-button" type="button" onClick={() => void copyText(content)}>복사하기</button>
                  <button className="primary-button" type="button" disabled={!channel || !discordConnected || status === 'sending' || status === 'sent'} onClick={() => void handleSend()}>{status === 'sending' ? '발송 중…' : status === 'sent' ? '발송 완료' : '발송하기'}</button>
                </div>
                <p role="status" className="notice-copy-status">{copyStatus}</p>
                {!discordConnected && <p role="alert">동아리에 디스코드 웹훅을 먼저 연결해 주세요. <a href="#discord">연결하기</a></p>}
                {error && <p role="alert" className="notice-error">{error}</p>}
              </section>
              <section className="chat-summary notice-result" aria-label="발송 현황">
                <div role="status"><p className="notice-helper">{status === 'sent' ? '발송 후' : status === 'sending' ? '발송 중' : '발송 전'}</p><p>{status === 'sent' ? <><strong>발송 완료!</strong> 응답이 들어오면 대시보드에서 확인할 수 있어요.</> : status === 'sending' ? '디스코드로 공지를 보내고 있어요.' : '디스코드를 선택하고 공지를 발송해 주세요.'}</p></div>
                <a className="primary-button" href="#dashboard">대시보드 가기</a>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
