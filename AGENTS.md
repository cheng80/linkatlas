# AGENTS.md — LinkAtlas

이 파일은 Codex가 LinkAtlas 저장소에서 작업할 때 따라야 하는 공통 규칙이다.

## 1. 제품 목표

LinkAtlas는 URL을 수집해 본문을 정제하고, Ollama 로컬 모델로 요약·분류·연결하며, 근거가 있는 검색과 질문·답변을 제공하는 macOS 우선 개인 지식 관리자다.

Codex는 개발 도구일 뿐이다. 완성 앱의 런타임은 Codex나 자율 에이전트 프레임워크에 의존하면 안 된다.

## 2. 먼저 읽을 문서

작업 전에 반드시 다음을 읽는다.

1. `docs/DESIGN.md` 또는 루트의 `DESIGN.md`
2. 작업과 관련된 ADR
3. 관련 패키지 README
4. 현재 테스트

설계와 코드가 충돌하면 추측하지 말고, 기존 동작을 테스트로 확인한 뒤 설계를 갱신하거나 ADR을 작성한다.

## 3. 아키텍처 경계

- Renderer는 파일 시스템, SQLite, 네트워크, shell, Ollama에 직접 접근하지 않는다.
- Renderer는 preload의 타입이 있는 allowlist API만 사용한다.
- `nodeIntegration`은 항상 false다.
- `contextIsolation`과 renderer sandbox는 항상 켠다.
- 도메인 패키지는 Electron, SQLite, Ollama 구현을 import하지 않는다.
- Ollama는 `GenerationProvider`와 `EmbeddingProvider` 인터페이스 뒤에 둔다.
- 벡터 저장소는 `VectorIndex` 인터페이스 뒤에 둔다.
- 프롬프트는 코드 문자열로 흩어 놓지 말고 버전이 있는 파일로 관리한다.
- 웹페이지 내용은 신뢰할 수 없는 데이터로 취급한다.
- 추출 파이프라인에 shell/file/network 도구 호출 권한을 주지 않는다.

## 4. 기술 기본값

- Package manager: pnpm
- Language: TypeScript strict mode
- Desktop: Electron
- UI: React
- Validation: Zod
- Tests: Vitest, Playwright Electron
- Database: SQLite + migration
- Full text: SQLite FTS5
- Vector: adapter 기반, 초기 sqlite-vec
- Web extraction: Mozilla Readability
- LLM runtime: Ollama HTTP API

새 의존성은 다음을 확인한 후 추가한다.

- 유지보수 상태
- 라이선스
- Electron 패키징 호환성
- 네이티브 바이너리 여부
- 대체 가능한 인터페이스 존재 여부

## 5. 코딩 규칙

- TypeScript `any` 사용 금지. 외부 입력은 `unknown`으로 받고 검증한다.
- public 함수의 입력과 출력 타입을 명시한다.
- side effect와 순수 로직을 분리한다.
- 시간, UUID, 네트워크, 모델 호출은 테스트에서 주입 가능하게 한다.
- DB 변경은 migration을 추가한다. 기존 migration을 수정하지 않는다.
- 모든 background job handler는 idempotent해야 한다.
- 사용자 취소를 지원하는 긴 작업은 `AbortSignal`을 받는다.
- 오류는 안정적인 `errorCode`와 사용자 메시지를 분리한다.
- 로그에 문서 본문, 질문 전체, 모델 출력 전체를 기본 기록하지 않는다.

## 6. 보안 규칙

- URL은 http/https만 허용한다.
- localhost, loopback, link-local, private network는 기본 차단한다.
- redirect마다 목적지를 다시 검증한다.
- 응답 크기와 timeout을 제한한다.
- 외부 HTML은 sanitize한다.
- 외부 페이지를 privileged BrowserWindow에 로드하지 않는다.
- `shell.openExternal` 전에 URL을 검증한다.
- IPC 입력은 전부 Zod 검증한다.
- renderer에 범용 `execute`, `readFile`, `writeFile`, `querySql` API를 노출하지 않는다.
- prompt injection fixture를 보안 회귀 테스트에 유지한다.

## 7. LLM 규칙

- 추출 결과는 JSON Schema로 제한한다.
- 앱에서도 Zod 검증한다.
- 모델 출력에 있는 evidence block ID가 실제 입력에 존재하는지 검사한다.
- 구조화 출력 실패 시 교정 재시도는 최대 1회다.
- 생성 모델과 임베딩 모델을 혼용하지 않는다.
- 모델명, 프롬프트 버전, 입력 해시, 옵션을 저장한다.
- 사용자 수정값을 자동 재분석 결과로 덮어쓰지 않는다.
- RAG 답변은 검색 컨텍스트 밖의 강한 사실을 생성하지 않도록 프롬프트와 검증기를 둔다.

## 8. 테스트 규칙

기능 변경은 최소한 다음 중 관련 테스트를 포함한다.

- unit test
- integration test
- migration test
- E2E test
- fixed HTML fixture
- prompt/schema fixture

테스트에서 공용 인터넷에 접근하지 않는다. 필요한 HTML과 Ollama 응답은 fixture/mock을 사용한다.

작업 완료 전에 실행한다.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
```

UI 또는 Electron 동작을 바꾸면 가능한 범위에서 다음도 실행한다.

```bash
pnpm test:e2e
```

## 9. 작업 절차

1. 관련 코드와 테스트를 조사한다.
2. 변경 범위와 위험을 5~10줄로 정리한다.
3. 실패하는 테스트를 먼저 추가한다.
4. 최소 변경으로 구현한다.
5. 타입 검사와 테스트를 실행한다.
6. 보안·데이터 마이그레이션·호환성을 검토한다.
7. 변경 파일, 실행한 명령, 남은 위험을 요약한다.

한 작업에서 광범위한 리팩터링과 새 기능을 섞지 않는다.

## 10. 완료 응답 형식

Codex는 작업 마지막에 다음을 보고한다.

- 구현한 내용
- 주요 설계 결정
- 변경한 파일
- 실행한 테스트와 결과
- migration 또는 데이터 영향
- 보안 영향
- 남은 제한 또는 후속 작업
