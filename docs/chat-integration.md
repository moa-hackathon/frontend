# 실제 백엔드 연동 (2026-11-14)

기준: https://moa-backend-b68k.onrender.com/v3/api-docs
이전 제안 API는 폐기하고 실제 Swagger 계약으로 교체했다.

## 설정
- API 기본 서버: https://moa-backend-b68k.onrender.com
- 인증: 모든 API에 X-Invite-Code. 연결 화면 또는 API 오류 영역에서 입력할 수 있으며 세션에 저장한다.
- .env.local의 로컬 설정은 Git에서 제외한다. 초대 코드/웹훅은 문서·예제 파일에 넣지 않는다.
- 개발 기본 경로 /moa-api는 Vite 프록시로 백엔드에 전달한다. 요청 인증은 그대로 유지한다.
- 직접 교차 출처 호출 시 백엔드가 CORS를 거절하는 것을 확인했다. 배포에서는 프론트 도메인을 백엔드 CORS에 등록하거나 같은 출처 리버스 프록시를 설정해야 한다.
- 배포 API 주소는 VITE_API_BASE_URL로 지정한다. 이 값과 VITE_INVITE_CODE는 클라이언트 설정이다. 봇 토큰 같은 서버 비밀을 넣으면 안 된다.

## 화면별 연결
| 화면/동작 | 실제 API |
|---|---|
| 디스코드 연결 | PUT /api/club/discord-webhook {webhookUrl} |
| 홈 행사 카드 | GET /api/events |
| 대화 | POST /api/notices/chat {messages, summary, selectedExtraQuestions} |
| 초안/수정 | POST /api/notices/draft |
| 이대로 확인 | POST /api/events (요약 + noticeText 저장) |
| 폼 문항 추천 | GET /api/events/{id}/form-questions |
| 링크 확인/저장 | PUT /api/events/{id}/form-link |
| 최종 공지 조회 | GET /api/events/{id}/notice |
| 디스코드 발송 | POST /api/events/{id}/notice/send |
| 행사 정보 | GET /api/events/{id} |
| 상세 집계 | GET /api/events/{id}/dashboard |
| CSV 업로드/재업로드 | POST /api/events/{id}/applications/csv, multipart file |
| 신청자 목록/필터 | GET /api/events/{id}/applications?filter=ALL/CONFIRMED/WAITING/NEEDS_CHECK |
| 엑셀 파일 | GET /api/events/{id}/applications/export |
| 다음 할 일 공지 초안 | POST /api/events/{id}/notice/follow-up/draft |
| 후속 공지 저장 | PUT /api/events/{id}/notice {noticeText} |

서버는 채팅을 저장하지 않으므로 누적 messages와 직전 summary를 클라이언트가 다시 보낸다.
complete=true일 때만 초안을 생성한다. 초안 확인 성공 시 받은 실제 id를 폼/발송/대시보드에 사용한다.
첫 입력이 있으면 진입 시 한 번 요청한다. 준비된 예시 데이터는 #events/new?example=2에서만 보이며 실제 저장·발송하지 않는다.
실제 채팅 API가 AI_RESPONSE_FAILED를 반환해 직접 입력 폼도 추가했다.
직접 입력 → 초안 API는 서버의 AI/TEMPLATE 정책을 사용하며 성공한 응답만 화면에 표시한다.
채팅/초안 실패 재시도, 처리 중 중복 클릭 방지, 링크 실패, 인증 실패를 표시한다.
발송 API에는 서버 중복 방지 계약이 없으므로 자동 재시도를 하지 않는다. 실패 후 수동 재시도 전 실제 채널 확인이 필요하다.

## CSV 이후 카드 매핑 — Figma 68:5399
| 디자인 요소 | Swagger 응답 |
|---|---|
| 제목·일시·장소·업데이트 시각 | dashboard.event / event detail |
| 진행 상태 배너 | progress.status / remainingToMin / remainingToCapacity |
| 현재 신청 / 정원 / 최소 인원 / 마감 | progress.applicantCount / capacity / minCapacity / daysUntilDeadline / deadlinePassed |
| 신청 진행률 / 최소 기준선 | progress.fillPercent / minCapacity ÷ capacity |
| 다음 할 일 | nextAction.message, 후속 초안 API |
| 조건별 집계 | answerStats[].question / options[].value,count,percent |
| 중복·미기입 확인 | checks.duplicateCount / missingCount / missingSummary |
| 신청자 표 | applications[].name,studentId,contact,answers,appliedAt,displayStatusLabel |
| 응답 필터 | applications?filter=... |
| 다시 업로드 결과 | insertedCount / skippedCount / failures[].rowNumber,reason |
| 엑셀 다운로드 | export 바이너리 응답, .xlsx 저장 |

업로드 후 dashboard·event·applications를 다시 조회한다. 서버의 중복 제거·확정/대기 계산을 사용한다.
lastSyncedAt 또는 기존 응답이 있으면 재진입 시에도 업로드 이후 화면을 표시한다.
정리하기/확인하기는 NEEDS_CHECK 필터로 전환한다. 중복 삭제/수정 API가 없어 자동 수정하지 않는다.
추가 질문은 고정된 뒤풀이 항목을 가정하지 않고 서버의 answers/statistics로 렌더링한다.
후속 공지는 생성 → 사용자 수정 → 저장 → 명시적 발송으로 처리한다.

## 실제 확인과 남은 사항
- 제공된 코드로 GET /api/club, GET /api/events 성공. 동아리는 존재하며 행사 목록은 비어 있고 Discord 미연결이었다.
- Vite 개발 프록시를 거친 실제 목록 조회 성공.
- 실제 POST /api/notices/chat는 502, {code: AI_RESPONSE_FAILED, message: AI 응답을 받지 못했습니다.}.
- 실제 디스코드 웹훅/폼이 없어 외부 발송은 수행하지 않았다.
- Google OAuth API는 localhost 전용 테스트 연결이고 현재 CSV 기반 사용자 흐름에서 사용하지 않아 UI에 연결하지 않는다.
- 대화와 생성 중 행사 ID는 현재 메모리 상태다. 새로고침 재개는 서버 대화 저장/복원 API가 없어 별도 설계가 필요하다.
- 다른 도메인 배포 CORS 허용과 백엔드 AI 제공자 설정은 백엔드에서 해결해야 한다.

추가 검증: 실제 POST /api/notices/draft는 source=TEMPLATE와 정상 공지 본문을 반환했다.
CSV 집계 화면과 NEEDS_CHECK 필터는 임시 로컬 서버 데이터로 브라우저 검증했다.
실제 서버에 테스트 행사를 만들거나 디스코드로 발송하지 않았다.
API 요청 계약은 인증 헤더, 채팅/행사 저장 JSON, 폼 PUT, 발송 POST, 목록 필터,
CSV FormData의 자동 Content-Type 경계, 서버 오류 메시지 처리를 모의 응답으로 검증했다.
