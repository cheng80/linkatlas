# LinkAtlas Codex 실행 계획

각 작업은 별도 브랜치 또는 worktree에서 수행하고, 완료 조건을 통과한 뒤 병합한다.

---

## Task 00 — 저장소 부트스트랩

### Codex 요청

```text
AGENTS.md와 DESIGN.md를 읽어라.

pnpm workspace 기반 LinkAtlas monorepo를 생성하라.
Electron main/preload/React renderer가 분리된 apps/desktop을 만들고,
packages/contracts와 packages/domain을 추가하라.

보안 기본값:
- nodeIntegration=false
- contextIsolation=true
- sandbox=true
- renderer에서 Node API 사용 금지

Vitest, ESLint, Prettier, TypeScript strict mode를 구성하고,
`pnpm lint`, `pnpm typecheck`, `pnpm test`가 통과하게 하라.

완료 후 변경 파일과 실행 명령을 보고하라.
```

### 완료 조건

- macOS에서 빈 Electron 앱 실행
- preload API 하나를 타입 안전하게 호출
- renderer bundle에 Node polyfill 없음
- 모든 검사 통과

---

## Task 01 — SQLite와 migration

### Codex 요청

```text
AGENTS.md, DESIGN.md의 데이터 모델 절을 읽어라.

packages/storage를 만들고 SQLite connection, migration runner,
Document/DocumentVersion/ContentBlock repository를 구현하라.

요구사항:
- migration은 순방향만 적용
- WAL mode
- foreign keys 활성화
- transaction helper
- 테스트용 임시 DB 지원
- 기존 migration 수정 금지

최소 스키마와 repository integration test를 작성하라.
```

### 완료 조건

- 새 DB 생성
- migration 재실행이 안전
- document round trip 테스트
- 앱 재시작 후 데이터 유지

---

## Task 02 — URL 입력과 안전한 fetch

### Codex 요청

```text
URL 입력 vertical slice를 구현하라.

Renderer에서 URL을 입력하면 preload 계약을 통해 main으로 전달하고,
main은 URL을 검증한 뒤 fixture HTTP server에서 HTML을 가져온다.

보안 요구사항:
- http/https만 허용
- localhost는 production 기본 차단이지만 test allowlist로 fixture 허용
- private/link-local/loopback 차단
- redirect 재검증
- timeout과 최대 응답 크기
- Zod 입력 검증

공용 인터넷을 사용하는 테스트는 만들지 마라.
```

### 완료 조건

- 유효 URL 작업 생성
- 금지 URL 거부
- timeout/oversize 테스트
- UI 오류 표시

---

## Task 03 — Readability 본문 추출

### Codex 요청

```text
packages/ingestion에 HTML extraction pipeline을 구현하라.
JSDOM과 Mozilla Readability를 사용하되 외부 HTML을 sanitize하라.

출력:
- title
- author
- publishedAt
- siteName
- language
- excerpt
- normalized HTML
- Markdown 또는 block list
- 안정적인 block IDs

한국어/영어/코드 블록/표/prompt injection fixture를 추가하라.
동일 입력은 동일 block ID를 생성해야 한다.
```

### 완료 조건

- 5종 이상 fixture 추출
- script/event handler 제거
- block ID 안정성
- DB 저장 및 Library 카드 표시

---

## Task 04 — 작업 큐

### Codex 요청

```text
DB 기반 durable job queue를 구현하라.

상태:
QUEUED, RUNNING, BLOCKED, FAILED, COMPLETED, CANCELLED

요구사항:
- stage와 progress
- lease
- 앱 재시작 복구
- AbortSignal 취소
- idempotency key
- 단계별 오류 코드

fetch/extract/store pipeline을 queue로 이동하라.
```

### 완료 조건

- 앱 종료 후 미완료 작업 재개
- 중복 enqueue 방지
- 취소/재시도 UI

---

## Task 05 — Ollama 어댑터

### Codex 요청

```text
packages/llm에 OllamaGenerationProvider와 OllamaEmbeddingProvider를 구현하라.

기능:
- health
- model list
- structured generation
- streaming chat
- batch embeddings
- timeout/cancel
- model missing 오류
- mock transport

Ollama HTTP 응답을 그대로 도메인에 노출하지 말고 인터페이스로 감싸라.
실제 Ollama가 없어도 모든 기본 테스트가 통과해야 한다.
```

### 완료 조건

- mock 기반 unit/integration test
- health/model missing UI
- cancellation
- 요청/응답 로그에 본문 미기록

---

## Task 06 — 구조화 문서 분석

### Codex 요청

```text
schemas/document-analysis.schema.json을 기준으로 문서 분석 파이프라인을 구현하라.

요구사항:
- chunk summary → document reduce
- JSON Schema 요청
- Zod 검증
- evidenceBlockIds 존재 검증
- 1회 교정 재시도
- prompt version 저장
- 사용자 수정 요약 보호

prompt injection fixture를 모델 mock으로 테스트하라.
```

### 완료 조건

- Summary UI
- schema 실패 안전 처리
- 근거 블록 링크
- 모델/프롬프트 버전 표시

---

## Task 07 — 청킹·임베딩·검색

### Codex 요청

```text
heading-aware chunker, embedding pipeline, FTS5 index,
VectorIndex interface와 초기 구현을 추가하라.

검색은 BM25 결과와 vector 결과를 RRF로 합쳐라.
한국어와 영어 fixture 질의를 포함하라.
인덱스 버전과 rebuild 기능을 구현하라.
```

### 완료 조건

- keyword 검색
- semantic 검색
- hybrid 결과
- 필터
- reindex 후 동일 결과

---

## Task 08 — 주제·엔티티·관계

### Codex 요청

```text
주제 후보 정규화, 엔티티 병합, 관련 문서 점수 계산을 구현하라.
LLM은 후보를 제안하지만 최종 매핑은 기존 topic/entity 검색과 규칙을 사용하라.

관련 문서 설명에는 semantic/topic/entity 점수를 표시하라.
전체 문서 pairwise 비교는 금지하고 후보 집합만 평가하라.
```

### 완료 조건

- Topic 화면
- 태그 병합
- 관련 자료 상위 5개
- 관련 이유 표시
- 사용자 관계 고정/제거

---

## Task 09 — 근거형 Ask

### Codex 요청

```text
Ask vertical slice를 구현하라.

단계:
- intent classification
- query expansion
- hybrid retrieval
- context diversity
- streaming structured answer
- citation validation

답변에 없는 citation 또는 컨텍스트 밖 citation을 거부하라.
근거가 없으면 확인 불가로 답하게 하라.
```

### 완료 조건

- 스트리밍 답변
- citation badge
- 원문 block 이동
- unsupported question test
- compare/synthesis test

---

## Task 10 — 브라우저 확장

### Codex 요청

```text
Manifest V3 Chrome/Edge extension을 추가하라.
현재 페이지를 Readability로 추출하고 Native Messaging을 통해 데스크톱에 전달하라.

권한은 최소화하고, 앱 미설치/미실행/중복 URL 상태를 사용자에게 보여줘라.
확장과 앱의 메시지 계약을 packages/contracts에서 공유하라.
```

### 완료 조건

- 한 번 클릭 저장
- 선택 영역 저장
- 앱 미실행 오류
- 메시지 schema 검증

---

## Task 11 — Export, backup, packaging

### Codex 요청

```text
Markdown export, JSONL export, ZIP backup/restore를 구현하라.
Electron macOS .app/.dmg 빌드를 구성하고 first-run wizard를 추가하라.

Ollama 상태, 하드웨어 메모리, 권장 모델, 모델 pull 진행을 표시하라.
복원 후 검색 인덱스를 검증하고 필요 시 rebuild하라.
```

### 완료 조건

- export/import round trip
- 새 Vault 복원
- dmg 생성
- 샘플 URL 진단
