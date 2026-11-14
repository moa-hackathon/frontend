import { useEffect, useRef, useState } from 'react'
import { Header } from '../components/Header'
import avatar from '../assets/chat/avatar.png'
import { readyPreview } from '../data/chat-preview'
import type { ChatMessage, EventDraft, ChatPhase } from '../types/chat'
import { NoticeFlow } from './NoticeFlow'
import './EventChat.css'

const examplePrompt = '다음 주 금요일 저녁 7시에 네트워킹 행사 해요. 20명은 넘어야 진행해요.'
const exampleDraft: EventDraft = {
  title: '모아 네트워킹 행사',
  startsAt: '11/21(금) 19:00',
  minimumParticipants: 20,
  location: null,
  capacity: null,
  registrationDeadline: null,
  additionalQuestions: ['뒤풀이 참석 여부'],
}
const questionOptions = ['뒤풀이 참석 여부', '알레르기', '없어요']

function BotAvatar() {
  return <img className="chat-avatar" src={avatar} alt="" />
}

function MissingValue() {
  return <span className="chat-missing"><span />입력 필요</span>
}

export function EventChat({ initialPrompt, phase = 'collecting' }: { initialPrompt: string; phase?: ChatPhase }) {
  const isReady = phase === 'ready'
  const composerInput = useRef<HTMLInputElement>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [questions, setQuestions] = useState(exampleDraft.additionalQuestions)
  const bottom = useRef<HTMLDivElement>(null)
  const hasCustomPrompt = initialPrompt.trim() !== ''
  const draft: EventDraft = isReady ? readyPreview.draft : hasCustomPrompt
    ? { title: null, startsAt: null, minimumParticipants: null, location: null, capacity: null, registrationDeadline: null, additionalQuestions: questions }
    : { ...exampleDraft, additionalQuestions: questions }

  useEffect(() => {
    if (messages.length) bottom.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length])

  function handleSendMessage() {
    const content = input.trim()
    if (!content) return
    setIsConfirmed(false)
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content }])
    setInput('')
  }

  function toggleQuestion(question: string) {
    setQuestions((current) => question === '없어요'
      ? (current.includes(question) ? [] : [question])
      : current.includes(question)
        ? current.filter((item) => item !== question)
        : [...current.filter((item) => item !== '없어요'), question])
  }

  const collectingFields = [
    ['행사명', draft.title],
    ['일시', draft.startsAt],
    ['필수 인원', draft.minimumParticipants === null ? null : `${draft.minimumParticipants}명`],
    ['장소', draft.location],
    ['정원', draft.capacity === null ? null : `${draft.capacity}명`],
    ['신청 마감일', draft.registrationDeadline],
  ]

  const fields = isReady ? [
    ['행사명', draft.title],
    ['일시', draft.startsAt],
    ['장소', draft.location],
    ['정원 / 최소 인원', `${draft.capacity}명 / ${draft.minimumParticipants}명`],
    ['신청 마감', draft.registrationDeadline],
    ['추가 질문', draft.additionalQuestions.join(', ') || '없어요'],
  ] : collectingFields

  function handleRequestRevision() {
    setIsConfirmed(false)
    composerInput.current?.focus()
  }

  function handleConfirmDraft() {
    // Continue with link collection; API persistence remains a separate integration.
    setIsConfirmed(true)
  }

  if (isConfirmed) return <NoticeFlow draft={draft} notice={readyPreview.notice} />

  return (
    <div className={`chat-page${isReady ? ' chat-page--ready' : ''}`}>
      <Header eventName="새 행사 만들기" />
      <main className="chat-main" aria-label="새 행사 만들기 대화">
        <h1 className="visually-hidden">모아와 새 행사 만들기</h1>
        <div className="chat-message chat-message--bot">
          <BotAvatar />
          <p className="chat-bubble">행사 내용을 편하게 적어 주세요. 공지로 정리해 드릴게요.</p>
        </div>
        <div className="chat-message chat-message--user">
          <p className="chat-bubble">{isReady ? readyPreview.prompt : initialPrompt.trim() || examplePrompt}</p>
        </div>
        <div className="chat-message chat-message--bot">
          <BotAvatar />
          <div className="chat-stack">
            <p className="chat-bubble">{isReady ? '이렇게 정리했어요.' : hasCustomPrompt ? '행사 내용을 확인해 주세요.' : '거의 다 됐어요. 아래 항목만 더 알려 주세요.'}</p>
            <section className="chat-summary" aria-labelledby="summary-title">
              <h2 id="summary-title">행사 요약 <span className="feature-tag">F1</span></h2>
              <dl>
                {fields.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value ?? <MissingValue />}</dd>
                  </div>
                ))}
              </dl>
            </section>
            {isReady ? (
              <section className="chat-summary chat-notice" aria-labelledby="notice-title">
                <h2 id="notice-title">공지 초안 <span className="feature-tag">F2</span></h2>
                <p className="chat-notice-text">{readyPreview.notice}</p>
                <div className="chat-notice-actions">
                  <button className="chat-revise" type="button" onClick={handleRequestRevision}>수정 요청</button>
                  <button className="primary-button" type="button" onClick={handleConfirmDraft} disabled={isConfirmed}>{isConfirmed ? '확인 완료' : '이대로 확인'}</button>
                </div>
                {isConfirmed && <p className="chat-confirmation" role="status">공지 초안을 확인했어요.</p>}
              </section>
            ) : (
              <>
            <p className="chat-bubble">신청받을 때 추가로 물어볼 게 있나요? (선택)</p>
            <div className="chat-questions" role="group" aria-label="추가 신청 질문">
              {questionOptions.map((question) => (
                <button key={question} type="button" aria-pressed={questions.includes(question)} onClick={() => toggleQuestion(question)}>{question}</button>
              ))}
            </div>
              </>
            )}
          </div>
        </div>
        <div className="chat-new-messages" role="log" aria-label="추가 대화" aria-live="polite">
          {messages.map((message) => (
            <div className="chat-message chat-message--user" key={message.id}><p className="chat-bubble">{message.content}</p></div>
          ))}
        </div>
        <div ref={bottom} />
      </main>
      <footer className="chat-composer">
        <form onSubmit={(event) => { event.preventDefault(); handleSendMessage() }}>
          <input
            ref={composerInput}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label="행사 정보 메시지"
            placeholder={isReady ? "행사 내용을 입력하거나 수정할 부분을 알려 주세요" : "장소, 정원, 신청 마감일을 알려 주세요"}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault()
            }}
          />
          <button className="primary-button" type="submit">전송</button>
        </form>
      </footer>
    </div>
  )
}
