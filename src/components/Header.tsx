import wordmark from '../assets/brand/wordmark.svg'

export function Header({ eventName }: { eventName?: string }) {
  return (
    <header className="site-header">
      <a className="brand brand--header" href="#dashboard" aria-label="모아 대시보드로">
        <img src={wordmark} alt="MOA" />
      </a>
      {eventName && <span className="header-event-name">{eventName}</span>}
    </header>
  )
}
