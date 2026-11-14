# 모아 (Moa)

> 흩어진 공지와 신청, 모아에서 한 번에

동아리·학생회 운영진을 위한 행사 관리 웹 서비스입니다. 행사 내용을 대화로 정리하고 공지 작성, 구글폼 연결, 디스코드 발송, 신청 현황 확인까지 한곳에서 처리합니다.

## 주요 기능

- **행사 작성**: AI 대화로 행사 정보를 정리하고 누락된 항목을 보완합니다. 직접 입력도 지원합니다.
- **공지 초안**: 행사 요약으로 초안을 만들고 수정 요청 후 확정합니다.
- **구글폼 연결**: 응답자용 링크를 검증하고 문항을 확인합니다. 폼이 없으면 추천 문항을 복사할 수 있습니다.
- **디스코드 발송**: 동아리에 등록한 웹훅으로 최종 공지를 발송합니다.
- **행사 대시보드**: 신청 인원, 정원, 진행 상태, 마감을 확인합니다.
- **CSV 업로드**: 구글폼 응답 CSV를 업로드·재업로드하고 실패한 행을 확인합니다.
- **응답 관리**: 조건별 집계, 중복·필수 항목 누락, 전체·확정·대기·확인 필요 목록과 엑셀 다운로드를 지원합니다.
- **후속 공지**: 신청 현황에 맞는 공지를 생성·수정·저장하고 발송합니다.

중복 처리와 확정·대기 계산은 백엔드 결과를 사용합니다. 중복 ‘정리하기’는 확인 필요 목록으로 이동하며 신청자를 자동 삭제하지 않습니다. 구글폼 생성·실시간 동기화는 지원하지 않고 CSV 업로드 시 현황을 갱신합니다.

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| UI | React 19, TypeScript |
| 개발·빌드 | Vite 8, React Compiler |
| 스타일 | CSS, 디자인 토큰, Pretendard 가변 폰트 |
| API | Fetch, JSON, multipart/form-data |
| 화면 이동 | URL 해시 라우팅 |
| 정적 검사 | ESLint, TypeScript |

## 실행 방법

**Node.js 22.12 이상**을 기준으로 실행합니다. Vite 지원 범위는 `^20.19.0 || >=22.12.0`입니다.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

터미널에 표시되는 주소로 접속합니다. 기본 포트는 `5173`이며 사용 중이면 다른 포트가 할당됩니다. 이미 `.env.local`이 있다면 덮어쓰지 말고 기존 설정을 사용합니다.

### 환경변수

```dotenv
VITE_API_BASE_URL=
VITE_INVITE_CODE=
```

| 변수 | 설명 |
| --- | --- |
| `VITE_API_BASE_URL` | API 기본 주소. 개발 모드에서 비워두면 `/moa-api` 개발 프록시를 사용합니다. |
| `VITE_INVITE_CODE` | 선택 사항인 모아 동아리 초대 코드. 비워두고 화면에서 입력할 수도 있습니다. |

- API 인증에는 **모아 동아리 초대 코드**가 필요하며 `X-Invite-Code` 헤더로 전송합니다. 디스코드 초대 링크와 다릅니다.
- 화면에서 입력한 코드는 현재 탭의 세션 저장소에 보관합니다.
- 디스코드는 **채널 설정 → 연동 → 웹후크**에서 복사한 웹훅 URL로 연결합니다. 나중에 연결하고 대시보드부터 사용할 수도 있습니다.
- `.env.local`은 Git에서 제외됩니다. `VITE_*` 값은 브라우저에 노출되므로 AI 키·봇 토큰 같은 서버 비밀을 넣지 않습니다.
- 환경변수를 변경하면 개발 서버를 다시 시작합니다.

### 명령어

```bash
npm run dev      # 개발 서버
npm run build    # TypeScript 검사 및 프로덕션 빌드
npm run lint     # ESLint 검사
npm run preview  # 빌드 결과 미리보기
```

빌드 결과는 `dist/`에 생성됩니다.

## 사용자 흐름

1. 시작 화면에서 동아리 초대 코드와 디스코드 웹훅을 연결합니다.
2. 대시보드에서 행사 내용을 입력하고 **새 행사 만들기**를 누릅니다.
3. 대화 또는 직접 입력으로 정보를 완성하고 공지 초안을 확인합니다.
4. **이대로 확인**을 눌러 행사를 저장합니다.
5. 구글폼 링크를 연결하고 디스코드로 공지를 발송합니다.
6. 행사 상세에서 CSV를 업로드하고 신청 현황을 확인합니다.

### 화면 주소

| 해시 경로 | 화면 |
| --- | --- |
| `#` | 시작 화면 |
| `#discord` | 동아리·디스코드 연결 |
| `#dashboard` | 실제 행사 목록 |
| `#events/new` | 행사 작성 챗봇 |
| `#events/{숫자 ID}` | 실제 행사 상세·CSV·신청 현황 |
| `#events/new?example=2` | 디자인 검토용 공지 초안 예시 |

일반 작성 화면은 실제 API를 사용합니다. 예시 화면의 고정 데이터로는 실제 행사를 저장하거나 발송하지 않습니다.

## API 연동

- [Swagger UI](https://moa-backend-b68k.onrender.com/swagger-ui/index.html#/)
- [OpenAPI JSON](https://moa-backend-b68k.onrender.com/v3/api-docs)
- [화면별 API·카드 매핑 및 검증 기록](docs/chat-integration.md)

중앙 API 클라이언트는 `src/services/api.ts`, API 타입은 `src/types/api.ts`에 있습니다.

| 기능 | 대표 엔드포인트 |
| --- | --- |
| 디스코드 연결 | `PUT /api/club/discord-webhook` |
| 행사 목록·생성 | `GET /api/events`, `POST /api/events` |
| 대화·공지 초안 | `POST /api/notices/chat`, `POST /api/notices/draft` |
| 폼 검증·연결 | `PUT /api/events/{id}/form-link` |
| 최종 공지·발송 | `GET /api/events/{id}/notice`, `POST /api/events/{id}/notice/send` |
| 진행 현황 | `GET /api/events/{id}/dashboard` |
| CSV 업로드 | `POST /api/events/{id}/applications/csv` |
| 신청자·필터 | `GET /api/events/{id}/applications?filter=...` |
| 엑셀 다운로드 | `GET /api/events/{id}/applications/export` |

### 개발 프록시와 배포

개발 서버는 `/moa-api/*`를 백엔드로 전달하며 인증 헤더를 유지합니다. 로컬 테스트 서버를 쓸 때는 개발 서버 프로세스의 `MOA_BACKEND_TARGET`으로 프록시 대상을 변경할 수 있습니다.

프로덕션에서 `VITE_API_BASE_URL`을 비워두면 기본 백엔드 주소로 직접 요청합니다. **배포 도메인을 백엔드 CORS 허용 목록에 등록**하거나 같은 출처 리버스 프록시를 구성하고 해당 경로를 `VITE_API_BASE_URL`로 지정해야 합니다. Vite 개발 프록시는 정적 배포에 포함되지 않습니다.

`npm run preview`에서 프록시까지 검증하려면 빌드 전에 `VITE_API_BASE_URL=/moa-api`로 설정합니다. 환경변수는 빌드 시 반영됩니다.

## 프로젝트 구조

```text
src/
├── assets/          # 로고·캐릭터·Figma 배경
├── components/      # 헤더, 초대 코드 입력, 직접 입력 폼
├── data/            # 디자인 미리보기 데이터
├── pages/
│   ├── Dashboard.tsx
│   ├── LiveChat.tsx
│   ├── EventChat.tsx   # 디자인 예시
│   ├── NoticeFlow.tsx
│   └── EventDetail.tsx
├── services/        # API 클라이언트·링크 검증
├── styles/          # 색상·반응형 타이포그래피 토큰
├── types/           # API 및 화면 데이터 타입
└── utils/           # CSV 파싱 유틸리티
public/fonts/        # Pretendard 폰트·라이선스
docs/                # 연동·카드 매핑 기록
```

## 검증 및 현재 제한

- `npm run build`, `npm run lint` 통과.
- 실제 서버 인증·행사 목록 조회와 템플릿 공지 생성 확인.
- API 요청 계약·오류 처리, CSV 집계 카드·필터를 모의 응답으로도 검증.
- **2026-11-14 검증 당시 AI 대화 API는 `502 AI_RESPONSE_FAILED`를 반환했습니다.** 현재 동작은 백엔드 설정에 따라 달라질 수 있습니다. 실패 시 직접 입력 경로를 사용할 수 있고 초안 API의 `TEMPLATE` 응답은 정상 동작했습니다.
- 실제 디스코드 발송과 실제 행사 CSV 업로드는 유효한 웹훅·행사·폼으로 추가 검증해야 합니다.
- 작성 중 대화는 메모리에 보관하므로 새로고침하면 복원되지 않습니다. 저장된 행사는 API 목록에서 다시 조회합니다.
- 로그인·결제·자동 알림·신청자 삭제/수정은 현재 범위에 포함하지 않습니다.

## 디자인·폰트

[Figma 디자인](https://www.figma.com/design/N7iJPCzRrNFg6gxIqRsZ4G/)의 색상·타이포그래피와 화면 구성을 기준으로 구현했습니다.

Pretendard는 로컬에서 제공하며 라이선스는 [public/fonts/OFL.txt](public/fonts/OFL.txt)에 포함되어 있습니다.
