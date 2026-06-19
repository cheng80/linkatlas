# LinkAtlas Design Pack

Recall과 유사한 사용 경험을 목표로 하는 로컬 개인 지식 관리자 앱의 설계 자료다.

## 파일

- `docs/DESIGN.md`: 제품·아키텍처·데이터·보안·로드맵 통합 설계서
- `AGENTS.md`: Codex가 저장소에서 지켜야 할 개발 규칙
- `docs/CODEX_EXECUTION_PLAN.md`: 기능을 vertical slice로 구현하기 위한 단계별 Codex 요청문
- `schemas/document-analysis.schema.json`: Ollama 구조화 문서 분석 출력 스키마 초안

## 권장 사용법

1. 새 Git 저장소 루트에 `AGENTS.md`를 복사한다.
2. `docs/DESIGN.md`를 먼저 읽는다.
3. `docs/CODEX_EXECUTION_PLAN.md`의 Task 00부터 순서대로 Codex에 전달한다.
4. 각 Task는 별도 브랜치/worktree에서 수행한다.
5. 완료 조건과 테스트를 통과한 뒤 다음 Task로 이동한다.
