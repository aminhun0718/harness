# 공통 하네스 템플릿

이 문서는 모든 스택에서 공유하는 템플릿을 담고 있다.
스택별 템플릿(CLAUDE.md, doc-map.json, CI 등)은 각 harness-*/references/templates.md를 참조.

---

## PRODUCT_SENSE.md 템플릿

```markdown
# Product Sense — {{프로젝트명}}

> 마지막 업데이트: {{날짜}}

## 제품 개요
{{Step 2 질문 1 답변}}

## 사용자 모델
- 대상: {{B2B / B2C / 내부용}}
- {{Step 2 질문 3 답변 기반 상세}}

## 인증 규칙
- 방식: {{이메일+비밀번호 / 소셜 / 매직링크}}
- 로그인 실패 시: {{기본값: 5회 실패 시 일시 잠금}}
- 세션 만료: {{기본값: 7일}}

## 과금 규칙 (해당 시)
{{Step 2 질문 5 답변 기반. 없으면 "현재 없음" 표기}}

## 기술 스택 결정
- 백엔드: {{Supabase / Firebase / 자체 서버 / 미정}}
- 배포: {{Vercel / EAS / AWS / 미정}}
- 외부 연동: {{Step 2 질문 10 답변. 없으면 "현재 없음"}}
- 미결정 항목은 "미정"으로 표기하고, 결정되면 이 섹션을 갱신한다

## 도메인별 비즈니스 규칙
{{Step 2 질문 2에서 나열한 기능별로 섹션 생성}}

### {{기능 1}}
- (기능 추가 시 여기에 규칙 작성)

### {{기능 2}}
- (기능 추가 시 여기에 규칙 작성)

## 에이전트를 위한 판단 기준
이 문서에 명시되지 않은 비즈니스 판단이 필요하면:
1. 사용자에게 먼저 확인한다
2. 확인된 규칙은 이 문서에 추가한다
3. 추측으로 구현하지 않는다
```

---

## QUALITY_SCORE.md 템플릿

```markdown
# Quality Score — {{프로젝트명}}

> 마지막 업데이트: {{날짜}}
> 다음 스캔 예정: {{schedule 설정에 따라}}

## 점수 기준
- A: 프로덕션 레디. 테스트 커버리지 높음, 타입 안전, 에러 핸들링 완비
- B: 대부분 양호. 사소한 개선 필요
- C: 작동하지만 품질 이슈 있음. 리팩터링 필요
- D: 기술 부채 심각. 우선 개선 대상
- N/A: 아직 평가 안 됨

## 자동 산출 기준 (garbage collection에서 사용)
- `tsc --noEmit` 에러 수: 0 → A, 1-5 → B, 6-20 → C, 20+ → D
- `eslint` 에러 수: 0 → A, 1-5 → B, 6-20 → C, 20+ → D
- `any` 타입 사용 횟수 (grep 기반): 0 → A, 1-3 → B, 4-10 → C, 10+ → D
- 테스트 커버리지 (있으면): 80%+ → A, 60-79% → B, 40-59% → C, <40% → D
- 영역별 최저 등급이 해당 영역의 점수가 된다

## 현재 점수

| 영역 | 점수 | 주요 이슈 | 마지막 평가 |
|------|------|----------|------------|
| {{영역 1}} | N/A | — | — |
| {{영역 2}} | N/A | — | — |

## 개선 이력

| 날짜 | 영역 | 이전 | 이후 | 변경 내용 |
|------|------|------|------|----------|
```

---

## 에이전트 가이드라인

### docs/agents/coder.md

```markdown
# 코더 에이전트 가이드라인

> 마지막 업데이트: {{날짜}}

## 역할
기능 구현, 버그 수정, 리팩터링을 담당한다.

## 작업 전 필수 확인
1. PRODUCT_SENSE.md에서 해당 기능의 비즈니스 규칙 확인
2. docs/product-specs/에서 기능 사양 확인 (없으면 사용자에게 요청)
3. docs/generated/schema.md에서 현재 DB 구조 확인
4. docs/generated/api-endpoints.md에서 기존 API 확인

## 코딩 규칙
- providers/를 통해서만 외부 의존성 접근
- 경계(API 라우트, 폼 입력)에서 데이터 검증
- any 타입 사용 금지
- 비즈니스 규칙이 불확실하면 추측하지 말고 사용자에게 확인

## 작업 후
- 리뷰 루프 실행 (CLAUDE.md 참조)
- 스키마 변경 시 `npm run generate:docs` 실행
- UI 변경 시 Playwright로 검증 (Playwright 설치 시)
```

### docs/agents/reviewer.md

```markdown
# 리뷰어 에이전트 가이드라인

> 마지막 업데이트: {{날짜}}

## 역할
코드 리뷰를 담당한다. QUALITY_SCORE.md의 기준으로 평가한다.

## 리뷰 체크리스트
### 아키텍처
- [ ] providers/ 외에서 핵심 의존성 직접 import하지 않았는가?
- [ ] 레이어 방향을 위반하지 않았는가? (types→lib→components→app)
- [ ] 비즈니스 로직이 컴포넌트에 섞이지 않았는가?

### 타입 안전성
- [ ] any 타입이 없는가?
- [ ] API 응답/외부 데이터를 경계에서 파싱하는가?
- [ ] null/undefined 처리가 되어 있는가?

### 비즈니스 규칙
- [ ] PRODUCT_SENSE.md의 규칙을 따르는가?
- [ ] 사양에 없는 동작을 추가하지 않았는가?

### 코드 품질
- [ ] 중복 코드가 없는가? (3번 이상 반복되면 추출)
- [ ] 함수/변수 이름이 명확한가?
- [ ] 에러 핸들링이 적절한가?

## 리뷰 결과 포맷
리뷰 후 다음 형태로 피드백:
- 🔴 차단: 반드시 수정 필요 (아키텍처 위반, 보안 문제)
- 🟡 권장: 수정하면 좋음 (코드 품질, 가독성)
- 🟢 승인: 문제 없음

## QUALITY_SCORE 갱신
리뷰 완료 후 해당 영역의 QUALITY_SCORE.md를 갱신한다.
```

### docs/agents/security.md

```markdown
# 보안 에이전트 가이드라인

> 마지막 업데이트: {{날짜}}

## 역할
보안 관련 변경사항을 검토한다.

## 검토 체크리스트

### 인증/인가
- [ ] 인증이 필요한 라우트에 인증 체크가 있는가?
- [ ] 다른 사용자의 데이터에 접근할 수 없는가?
- [ ] API 라우트에 적절한 권한 검증이 있는가?

### {{Supabase 사용 시에만}} Supabase RLS
- [ ] 새 테이블에 RLS가 활성화되어 있는가?
- [ ] RLS 정책이 의도한 대로 작동하는가?
- [ ] service_role 키를 클라이언트에서 사용하지 않는가?

### 데이터 보안
- [ ] 민감 정보(비밀번호, 토큰)가 로그에 노출되지 않는가?
- [ ] .env 파일이 커밋되지 않는가?
- [ ] API 응답에 불필요한 데이터가 포함되지 않는가?

### 입력 검증
- [ ] 사용자 입력을 신뢰하지 않고 검증하는가?
- [ ] SQL injection, XSS 가능성이 없는가?
- [ ] 파일 업로드 시 타입/크기 검증이 있는가?
```

---

## Claude Code 권한 설정

`update-config` 스킬을 사용하여 다음 권한을 적용한다:

```
허용 (allow):
- Bash(npm run:*)
- Bash(npx lint-staged)
- Bash(npx tsc:*)
- Bash(npx depcruise:*)
- Edit(path:src/**)
- Edit(path:docs/**)

차단 (deny):
- Edit(path:.env*)
- Edit(path:.claude/settings.json)
- Bash(rm -rf:*)
- Bash(DROP TABLE:*)
- Bash(git push --force:*)
```

실제 적용 시 프로젝트 구조에 맞게 경로를 조정한다.

---

## design-docs/core-beliefs.md 템플릿

```markdown
# Core Beliefs — {{프로젝트명}}

> 마지막 업데이트: {{날짜}}
> 검증 상태: 초안 (하네스 진화 과정에서 갱신)

이 문서는 에이전트가 의사결정 시 참조하는 황금 원칙을 정의한다.
CLAUDE.md에 요약이 있고, 여기에 상세 근거를 기록한다.

## 스택 공통 원칙

### 1. 경계에서 데이터를 파싱한다
- API 라우트, 폼 입력, 외부 API 응답 등 경계에서 반드시 데이터 형태를 검증
- 내부 코드 간에는 타입을 신뢰 (이중 검증 불필요)
- 라이브러리: zod, valibot 등 선택은 자유

### 2. 핵심 의존성은 providers/를 통한다
- Supabase, 인증, 스토리지 등은 providers/에서만 import
- 라이브러리 교체 시 한 곳만 수정하면 됨
- React, Next.js 같은 프레임워크는 예외 (어디서든 import)

### 3. 직접 만든 헬퍼보다 공유 유틸리티를 선호한다
- 같은 로직을 여러 곳에서 복사하지 않는다
- 3번 이상 쓰이면 lib/에 공유 유틸리티로 추출

### 4. 에이전트가 읽을 수 있는 형태로 기록한다
- 모든 의사결정은 코드/마크다운으로 기록
- "왜 이렇게 했는지"가 빠지면 다음 에이전트 세션에서 되돌릴 수 있다
- 커밋 메시지에 의도를 명확히

## 프로젝트 특화 원칙

### {{Step 2 인터뷰에서 도출된 원칙}}
- {{근거}}
- {{적용 범위}}
```

---

## 하네스 진화 문서 템플릿

### docs/design-docs/harness-evolution.md

```markdown
# 하네스 자기 유지 프로세스

> 마지막 업데이트: {{날짜}}

이 문서는 하네스가 스스로 진화하는 메커니즘을 정의한다.
CLAUDE.md의 "하네스 자동 갱신" 섹션과 연동된다.

## 1. 일상적 자기 유지 (에이전트가 자동 수행)

작업 중 새 패턴/엣지케이스를 발견하면:

| 상황 | 행동 |
|------|------|
| 기존 가이드에 해당 | 해당 docs/design-docs/*.md에 규칙 추가 |
| 새 작업 유형 | docs/design-docs/에 새 가이드 생성 + CLAUDE.md 라우팅 테이블에 행 추가 |
| CLAUDE.md 비대화 | 상세를 docs/로 분리, CLAUDE.md에는 한 줄 참조만 |

판단 기준: "모든 작업에 매번 적용" → CLAUDE.md / "특정 작업에서만" → docs/

## 2. 문서 → 코드 승격

| 단계 | 트리거 | 액션 |
|------|--------|------|
| 1단계 | 에이전트가 처음 실수 (1회) | 해당 가이드(ui-guide.md 등) 또는 PRODUCT_SENSE.md에 규칙 추가 |
| 2단계 | 동일 패턴 실수 2회 이상 | ESLint 규칙으로 승격 |
| 3단계 | 구조적 위반 3회 이상 또는 다른 영역에서도 동일 위반 | CI 검증 추가 |

"동일 패턴"의 판단: 같은 규칙 위반이 다른 파일/세션에서 다시 발생하면 반복으로 간주.
승격 시 반드시 rule-promotions.md에 기록한다 (날짜, 규칙, 반복 횟수, 출발지, 도착지).

## 3. 에이전트 실패 대응

에이전트가 작업에 실패하면:
1. "더 열심히"가 아니라 "어떤 정보/도구가 빠졌는가?" 진단
2. 빠진 것을 하네스에 추가:
   - 정보 부족 → docs/에 문서 추가
   - 도구 부족 → 스크립트 추가 또는 MCP 도구 검토
   - 규칙 부족 → ESLint/CI 규칙 추가
3. 하네스를 업데이트한 후 다시 시도

## 4. 주기적 관리

### doc-gardening (권장 주기: 주 1회)
- doc-map.json 기반 문서 신선도 체크
- 오래된 문서 갱신 또는 갱신 필요 알림
- `/schedule`로 설정

### garbage collection (권장 주기: 주 1회)
- QUALITY_SCORE.md 기준으로 코드 스캔
- 품질 하락 영역 식별
- 리팩터링 태스크 생성
- `/schedule`로 설정
```

### docs/design-docs/rule-promotions.md

```markdown
# 규칙 승격 이력

> 마지막 업데이트: {{날짜}}

| 날짜 | 규칙 | 출발지 | 도착지 | 이유 |
|------|------|--------|--------|------|
| {{날짜}} | (예시) providers/ 외 Supabase import 금지 | core-beliefs.md | ESLint no-restricted-imports | 에이전트가 2회 직접 import |
```

---

## product-specs/ 템플릿

### docs/product-specs/index.md

```markdown
# 기능 사양 목차

> 마지막 업데이트: {{날짜}}

## 기능 목록
- (기능 추가 시 여기에 링크)

## 사용법
- 새 기능 설계: `superpowers:brainstorming` 스킬 사용 → 이 디렉토리에 저장
- CPS 구조로 작성 (Context / Problem / Solution)
```

### docs/product-specs/{{기능명}}.md (CPS 템플릿)

```markdown
# {{기능명}}

> 마지막 업데이트: {{날짜}}

## Context
- 배경: {{이 기능이 왜 필요한지}}
- 목적: {{이 기능이 달성하려는 것}}
- 제약: {{기술적/비즈니스 제약사항}}

## Problem
- {{사용자가 겪는 구체적 문제}}
- {{문제가 발생하는 시나리오}}

## Solution
- {{해결 방법}}
- {{성공 기준: 뭐가 되면 완성인지}}
```

---

## exec-plans/ 템플릿

### docs/exec-plans/index.md

```markdown
# 실행 계획 목차

> 마지막 업데이트: {{날짜}}

## 진행 중 (active/)
- (계획 추가 시 여기에 링크)

## 완료 (completed/)
- (완료된 계획 이동)

## 기술 부채
- [tech-debt-tracker.md](./tech-debt-tracker.md)

## 사용법
- 새 계획: `superpowers:writing-plans` 스킬 사용 → active/에 저장
- 완료 시: completed/로 이동
- 부채 발견 시: tech-debt-tracker.md에 기록
```

### docs/exec-plans/tech-debt-tracker.md

```markdown
# 기술 부채 추적

> 마지막 업데이트: {{날짜}}

| 우선순위 | 영역 | 설명 | 발견일 | 상태 |
|----------|------|------|--------|------|
```

---

## errors.ts 공통 에러 핸들링 템플릿

```typescript
// src/errors.ts
// 프로젝트 공통 에러 클래스

export class AppError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} '${id}'을(를) 찾을 수 없습니다` : `${resource}을(를) 찾을 수 없습니다`,
      "NOT_FOUND"
    );
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "인증이 필요합니다") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "권한이 없습니다") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

// 웹 프로젝트(API 라우트가 있는 경우)에서는 statusCode를 추가한다:
// export class HttpError extends AppError {
//   constructor(message: string, code: string, public statusCode: number) {
//     super(message, code);
//     this.name = "HttpError";
//   }
// }
```
