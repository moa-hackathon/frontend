import { useEffect, useState } from "react";
import mascot from "./assets/brand/mascot.svg";
import wordmark from "./assets/brand/wordmark.svg";
import "./App.css";
import { EventChat } from "./pages/EventChat";
import { Dashboard } from "./pages/Dashboard";
import { EventDetail } from "./pages/EventDetail";
import { api, getInviteCode, setInviteCode } from "./services/api";
import { LiveChat } from "./pages/LiveChat";

function App() {
  const [route, setRoute] = useState(() => window.location.hash);
  const [eventPrompt, setEventPrompt] = useState("");
  const isConnecting = route === "#discord";
  const eventMatch = route.match(/^#events\/(\d+)$/);
  const [webhook, setWebhook] = useState("");
  const [invite, setInvite] = useState(getInviteCode);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    const syncScreen = () =>
      setRoute(window.location.hash);
    window.addEventListener("hashchange", syncScreen);
    return () => window.removeEventListener("hashchange", syncScreen);
  }, []);

  const handleConnectAndStart = async () => {
    if (connecting) return;
    setConnecting(true); setConnectionError(""); setInviteCode(invite);
    try { await api.connectDiscord(webhook); setWebhook(""); window.location.hash = "dashboard"; }
    catch (error) { setConnectionError(error instanceof Error ? error.message : "연결하지 못했어요."); }
    finally { setConnecting(false); }
  };

  const handleSkipDiscord = async () => {
    if (connecting) return;
    setConnecting(true); setConnectionError(""); setInviteCode(invite);
    try { await api.club(); window.location.hash = "dashboard"; }
    catch (error) { setConnectionError(error instanceof Error ? error.message : "초대 코드를 확인해 주세요."); }
    finally { setConnecting(false); }
  };

  return (
    <div className="app-shell">
      {eventMatch ? (
        <EventDetail key={eventMatch[1]} eventId={Number(eventMatch[1])} />
      ) : route === "#dashboard" ? (
        <Dashboard onCreateEvent={(prompt) => { setEventPrompt(prompt); window.location.hash = "events/new"; }} />
      ) : route === "#events/new?example=2" ? (
        <EventChat key="ready-preview" initialPrompt="" phase="ready" />
      ) : route === "#events/new" ? (
        <LiveChat initialPrompt={eventPrompt} />
      ) : isConnecting ? (
        <>
          <header className="site-header">
            <a
              className="brand brand--header"
              href="#"
              aria-label="모아 메인으로"
            >
              <img src={wordmark} alt="MOA" />
            </a>
          </header>
          <main className="connection-main">
            <section
              className="connection-card"
              aria-labelledby="connection-title"
            >
              <h1 id="connection-title">디스코드 연결</h1>
              <p className="connection-description">
                디스코드 채널 설정에서 복사한 웹훅 URL을 입력해 주세요.
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleConnectAndStart();
                }}
              >
                <label htmlFor="connection-invite">동아리 초대 코드</label>
                <input id="connection-invite" type="password" autoComplete="off" value={invite} onChange={(event) => setInvite(event.target.value)} required />
                <label htmlFor="discord-token">디스코드 웹훅 URL</label>
                <input
                  id="discord-token"
                  name="discord-token"
                  type="password"
                  placeholder="URL을 붙여넣어 주세요"
                  value={webhook}
                  onChange={(event) => setWebhook(event.target.value)}
                  required
                  autoComplete="off"
                  spellCheck={false}
                />
                {connectionError && <p role="alert">{connectionError}</p>}
                <button className="primary-button connect-button" type="submit" disabled={connecting}>
                  {connecting ? "연결 중…" : "연결하고 시작하기"}
                </button>
              </form>
              <button className="chat-revise connect-button" type="button" disabled={connecting} onClick={() => void handleSkipDiscord()}>디스코드는 나중에 연결하기</button>
            </section>
          </main>
        </>
      ) : (
        <main className="landing-main">
          <section className="landing-content" aria-labelledby="landing-title">
            <div className="mascot" aria-hidden="true">
              <img src={mascot} alt="" />
            </div>
            <div className="brand brand--hero">
              <img src={wordmark} alt="MOA" />
            </div>
            <h1 id="landing-title">행사 공지부터 신청 현황까지, 한 곳에서</h1>
            <p className="landing-description">
              행사 내용을 적으면 모아가 정리해 드려요.
            </p>
            <a className="primary-button start-button" href="#discord">
              시작하기
            </a>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
