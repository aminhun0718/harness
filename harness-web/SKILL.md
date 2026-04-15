---
name: harness-web
description: |
  웹 프로젝트(Next.js, Express, Nest.js 등)용 하네스 설치 스킬.
  harness-init 라우터에서 웹 스택 감지 시 호출된다. 직접 호출하지 않는다.
  
  이 스킬은 harness-init이 수행한 환경 스캔 결과와 인터뷰 답변을 
  컨텍스트로 받아서 실행한다.
---

# Harness Web

이 스킬은 harness-init 라우터에서 호출된다. 스캔 결과와 인터뷰 답변이 현재 대화에 이미 있다.

공통 템플릿(PRODUCT_SENSE, QUALITY_SCORE, 에이전트 가이드라인, doc-structure, evolution 등)은
`../harness-shared/`를 참조한다. 웹 전용 템플릿(CLAUDE.md, eslint-rules, ci-templates)은
`references/`를 참조한다.

---

## 실행 흐름

### Step 3. 글로벌 세팅 (없을 때만)

이미 존재하면 스킵한다. 글로벌 세팅은 모든 프로젝트에 공통.

생성 항목:
- `.claude/settings.json` 권한 설정 — **`update-config` 스킬을 사용하여 적용**

권한 설정 상세는 `../harness-shared/templates-common.md`의 "Claude Code 권한" 섹션을 참조.

> **Note**: 에이전트 가이드라인(agents/)은 프로젝트별로 스택에 맞게 생성해야 하므로
> Step 4에서 처리한다.

### Step 3.5. UI 접근 방식 결정 (프론트엔드 프로젝트일 때만)

순수 백엔드(Next.js API-only, Express, Nest.js로 페이지/라우트 감지 안 됨)면 이 단계 전체 스킵.
Step 1 스캔에서 기존 UI lib(mui, chakra, mantine 등)가 감지되면 그대로 유지.
없으면 인터뷰 답변 기반으로 에이전트가 추천 — **특별한 이유 없으면 shadcn/ui + Tailwind 우선.** 근거는 답변에서 인용한 키워드로, 사용자가 한 단어로 거부 가능.

선택 결과는 Step 4(ui-guide.md 템플릿 선택)와 Step 5(shadcn init 실행 여부)에 영향을 준다.

### Step 4. 프로젝트 구조 + 컨텍스트 생성

Step 2 답변과 Step 1 스캔 결과를 조합하여 코드 폴더와 문서를 생성한다.

**코드 폴더 구조 생성**:

Step 1에서 감지한 스택에 따라 폴더 구조를 선택한다. 한번 정하면 바꾸지 않는다.

**Next.js App Router** (Step 1에서 Next.js 감지 시):
```
src/
├── app/           ← Next.js App Router 페이지/라우트
├── components/    ← React 컴포넌트
├── lib/           ← 비즈니스 로직, 유틸리티
├── providers/     ← 외부 의존성 진입점 (Supabase, Auth 등)
├── types/         ← TypeScript 타입 정의
└── errors.ts      ← 공통 에러 핸들링
```

**Express / Nest.js / 백엔드 중심**:
```
src/
├── routes/        ← API 라우트 정의
├── services/      ← 비즈니스 로직
├── middlewares/    ← 미들웨어
├── providers/     ← 외부 의존성 진입점 (DB, 외부 API 등)
├── types/         ← TypeScript 타입 정의
└── errors.ts      ← 공통 에러 핸들링
```

**기타 스택 (최소 구조)**:
```
src/
├── lib/           ← 비즈니스 로직
├── providers/     ← 외부 의존성 진입점
├── types/         ← TypeScript 타입 정의
└── errors.ts      ← 공통 에러 핸들링
```

공통 규칙:
- 이미 존재하는 폴더는 건드리지 않는다
- 빈 폴더에는 `.gitkeep` 또는 `index.ts` (barrel export) 생성
- providers/ 폴더는 Step 5에서 내용을 채운다
- `errors.ts`에는 프로젝트 공통 에러 클래스 기본 템플릿 생성 (`../harness-shared/templates-common.md` 참조)

**CLAUDE.md** (~100줄) — 정적 규칙 목록이 아니라 **라우터 + 자기 유지 시스템**:

필수 섹션:
1. 커맨드 (빌드/린트/타입체크/문서생성)
2. **작업 유형별 참조 테이블** — 에이전트가 작업 시작 전 어떤 docs/를 읽어야 하는지 즉시 판단
   ```
   | 작업 유형 | 반드시 읽을 문서 |
   |-----------|-----------------|
   | 기능 구현 | PRODUCT_SENSE.md → docs/product-specs/ |
   | UI/프론트엔드 | docs/design-docs/ui-guide.md |
   | DB/스키마 변경 | docs/generated/schema.md |
   | API 추가/수정 | docs/generated/api-endpoints.md |
   | 보안 관련 | docs/agents/security.md |
   | 코드 리뷰 | docs/agents/reviewer.md + QUALITY_SCORE.md |
   ```
   초기에는 프로젝트 스택에 맞는 행만 생성. 새 작업 유형이 생기면 에이전트가 자동 추가.
3. 황금 원칙 (5개 이내, 핵심만)
4. 금지 패턴
5. 폴더 구조
6. 리뷰 루프 (Playwright 검증 포함 — MCP 설치 시)
7. 문서 규칙 (docs/ 외부 생성 금지, 스킬 경로 충돌 방지)
8. **하네스 자동 갱신 규칙** — 사용자 개입 없이 docs/ 확장하는 메커니즘:
   ```
   기존 카테고리에 맞는 경우:
   → 해당 가이드 문서에 규칙/체크리스트 추가

   기존 카테고리에 안 맞는 경우 (새 작업 유형):
   1. docs/design-docs/에 새 가이드 파일 생성
   2. "작업 전 참조" 테이블에 행 추가
   3. design-docs/index.md에 링크 추가

   같은 실수 반복: ESLint/CI로 승격 → rule-promotions.md 기록
   CLAUDE.md 관리: 100줄 초과 위험 시 상세를 docs/로 분리
   판단 기준: "모든 작업에 매번" → CLAUDE.md / "특정 작업에서만" → docs/
   ```
9. 상세 참조 링크

핵심: CLAUDE.md는 **에이전트가 매 세션 읽는 라우터**이면서 **스스로 확장되는 시스템**.
규칙 자체는 직접 기재하되, 상세/예시는 docs/로. 링크만 걸면 에이전트가 안 읽을 수 있다.

CLAUDE.md 템플릿은 `references/templates.md`를 참조.

**docs/ 구조**:
각 파일의 역할과 내용 가이드는 `../harness-shared/doc-structure.md`를 참조.

```
docs/
├── design-docs/                  ← 확장 가능한 가이드 시스템
│   ├── index.md                  ← 설계 문서 목차 (새 가이드 추가 시 자동 갱신)
│   ├── core-beliefs.md           ← 황금 원칙 (스택 기반 + 프로젝트 특화)
│   ├── ui-guide.md               ← UI/UX 가이드 (프론트엔드 프로젝트 시)
│   ├── harness-evolution.md      ← 하네스 자기 유지 프로세스
│   └── rule-promotions.md        ← 문서→코드 승격 이력
│   └── (새 작업 유형 발생 시 에이전트가 자동 추가: payment-guide.md, seo-guide.md 등)
├── product-specs/
│   └── index.md                  ← 기능 사양 목차 (빈 템플릿)
├── exec-plans/
│   ├── index.md                  ← 실행 계획 목차
│   ├── active/                   ← 진행 중인 계획
│   ├── completed/                ← 완료된 계획
│   └── tech-debt-tracker.md      ← 기술 부채 추적
├── generated/
│   ├── schema.md                 ← DB 스키마 (자동 생성)
│   └── api-endpoints.md          ← API 엔드포인트 (자동 생성)
├── references/                   ← 외부 라이브러리 참조 (context7 보완)
└── agents/
    ├── coder.md
    ├── reviewer.md
    └── security.md
```

**에이전트 가이드라인** (프로젝트별 생성):

두 가지 에이전트 계층이 있다. 혼동하지 않는다:
- `~/.claude/agents/` — **글로벌 오케스트레이션** 도구. 모든 프로젝트 공통의 에이전트 타입 정의 (planner, code-reviewer, tdd-guide 등). 이 스킬에서 건드리지 않는다.
- `docs/agents/` — **프로젝트별 도메인 가이드라인**. 이 프로젝트의 스택, 비즈니스 규칙, 체크리스트를 담는다. 이 스킬에서 생성한다.

생성 파일:
- `docs/agents/coder.md` — 코더 에이전트 가이드라인
- `docs/agents/reviewer.md` — 리뷰어 에이전트 가이드라인
- `docs/agents/security.md` — 보안 에이전트 가이드라인
- 스택에 따라 내용을 맞춤 생성 (예: Supabase 프로젝트면 RLS 체크리스트 포함, 없으면 제외)
- 에이전트 가이드라인 템플릿은 `../harness-shared/templates-common.md`의 "에이전트 가이드라인" 섹션 참조

**PRODUCT_SENSE.md**: Step 2 답변 기반 초안 생성. 템플릿은 `../harness-shared/templates-common.md` 참조.
**QUALITY_SCORE.md**: 모든 영역을 N/A로 초기화. 첫 garbage collection 스케줄에서 실제 점수를 산출한다. 템플릿은 `../harness-shared/templates-common.md` 참조.
**design-docs/ui-guide.md**: 프론트엔드 프로젝트일 때만 생성. 순수 백엔드(Step 3.5에서 스킵됨)에서는 생성하지 않는다.
- Step 3.5에서 **shadcn/ui + Tailwind** 선택 시: `references/templates.md`의 "ui-guide.md 템플릿 (shadcn+Tailwind)" 섹션 사용
- 다른 UI lib 선택 시: `../harness-shared/templates-common.md`의 기본 "ui-guide.md 템플릿" 사용 (토큰 위치를 선택된 lib에 맞춰 치환)

QUALITY_SCORE 자동 산출 기준 (garbage collection에서 사용):
```
영역 정의: src/ 하위 1단계 디렉토리를 영역으로 삼는다.
예: src/app/, src/lib/, src/components/, src/providers/ 각각이 하나의 영역.
src/ 직속 파일(errors.ts 등)은 "공통" 영역으로 묶는다.

| 측정 항목 | A | B | C | D |
|-----------|---|---|---|---|
| tsc --noEmit 에러 | 0 | 1-5 | 6-20 | 20+ |
| eslint 에러 | 0 | 1-5 | 6-20 | 20+ |
| any 타입 사용 (grep) | 0 | 1-3 | 4-10 | 10+ |
| 테스트 커버리지 (있으면) | 80%+ | 60-79% | 40-59% | <40% |
영역별 최저 등급이 해당 영역의 점수가 된다.
```

**doc-map.json**: 소스 폴더 <-> 문서 매핑 (최소 버전). 템플릿은 `references/templates.md` 참조.

### Step 5. 가드레일 설치

**TypeScript strict 모드**:
- tsconfig.json의 `strict`가 false이거나 없으면 true로 활성화
- 에이전트가 any를 남발하는 것을 컴파일러 레벨에서 차단
- .gitignore에 .env가 없으면 추가
- .gitignore에 tsconfig.tsbuildinfo가 없으면 추가 (빌드 캐시)

**ESLint no-restricted-imports**:
- 스택 감지 결과에 맞는 규칙 추가
- Providers 패턴 강제 (핵심 의존성만: Supabase, Auth, Storage 등)
- 에러 메시지에 수정 가이드를 포함 — 이것이 에이전트 컨텍스트 주입의 핵심
- 기존 ESLint 설정이 있으면 병합, 없으면 새로 생성
- **반드시 flat config (eslint.config.mjs) 형식으로** — 레거시 .eslintrc 형식 사용 금지

상세 규칙은 `references/eslint-rules.md`를 참조.

**주의**: ESLint flat config에서 `no-restricted-imports`를 여러 config 블록에서 정의하면
마지막 매칭 블록이 이전 것을 덮어쓴다 (merge가 아님). 병합 패턴은 `references/eslint-rules.md`의
"flat config 병합 주의" 섹션을 반드시 참조.

**dependency-cruiser** (조건부):
- 플랫 구조에서는 기본 스킵 — ESLint no-restricted-imports로 레이어 위반 차단 가능
- src/ 파일 50개 초과 시 설치 권장 — 순환참조 감지, 의존성 그래프 시각화 등 ESLint로 불가능한 검증
- 스킵 시 CLAUDE.md에 "프로젝트가 커지면 dependency-cruiser 추가 권장" 메모
- 설치 시 `references/ci-templates.md`의 설정을 기반으로 생성

**husky + lint-staged**:
- `npm install -D husky lint-staged` 실행
- `npx husky init` 실행
- pre-commit: ESLint만 (`npx lint-staged`)
- typecheck(tsc --noEmit)는 CI로 이동 — pre-commit에서는 느려서 비효율
- **Windows 주의**: 설치 후 반드시 테스트 커밋으로 훅 작동 확인. 
  Windows에서 훅이 조용히 깨질 수 있으므로 검증 필수.
- lint-staged 설정은 package.json에 추가

**Providers 폴더**:
- 스택에 맞는 providers/ 생성 (예: providers/supabase.ts, providers/auth.ts)
- 이미 lib/supabase.ts 등이 있으면 providers/로 이동하거나 re-export
- ESLint에서 providers/ 외의 직접 import 차단

**UI 라이브러리 설치** (Step 3.5 결과에 따라 분기):
- **shadcn/ui + Tailwind 선택 시**:
  - Tailwind 없으면 설치: `npm install -D tailwindcss postcss autoprefixer` + `npx tailwindcss init -p` (v3) 또는 Tailwind v4 설치 가이드 따름
  - shadcn init: `npx shadcn@latest init` (globals.css, tailwind.config.ts, src/lib/utils.ts 생성)
  - 기본 primitives: `npx shadcn@latest add button input card dialog skeleton form alert`
  - `eslint-plugin-tailwindcss` 설치 + `tailwindcss/no-arbitrary-value` 규칙 활성화
  - ESLint `ignores`에 `tailwind.config.*`, `src/components/ui/**` 추가 (`references/eslint-rules.md` 참조)
- **다른 UI lib 선택 시**: 해당 lib의 표준 설치 명령 실행, `references/eslint-rules.md`의 "디자인 토큰 강제" 섹션에서 `ignores` 경로 조정
- **UI lib 없음 (순수 백엔드)**: 이 하위 단계 스킵

### Step 6. CI/CD 설정

`.github/workflows/ci.yml` 생성:
```
push + PR 트리거 (main, master 양쪽):
├── lint (ESLint)
├── typecheck (tsc --noEmit)
├── architecture check (dependency-cruiser — 설치된 경우에만)
└── build (next build 등)
```

**트리거 주의**: `pull_request`만으로는 직접 push 시 CI가 안 돌아간다.
반드시 `push:` 트리거도 포함하고, `main`과 `master` 양쪽 브랜치를 감시한다.

- test 단계는 테스트 프레임워크가 설치되어 있을 때만 포함
- Vercel과 겹치는 build 단계는 유지 — Vercel은 lint/architecture check를 안 함
- 문서 신선도는 CI가 아닌 schedule(doc-gardening)에서 관리 — CI에서 경고만 하는 건 무시됨
- 템플릿은 `references/ci-templates.md`를 참조

### Step 7. 에이전트 운영 체계

**CLAUDE.md 리뷰 루프**:
리뷰 루프 템플릿은 `references/templates.md`의 CLAUDE.md 템플릿 참조.
Claude 사이드 리뷰(reviewer.md + QUALITY_SCORE.md 기준) + UX/통합(Playwright)으로 구성한다.

**schedule 설정 안내**:
- doc-gardening: 주기적 문서 신선도 체크 → 문서 갱신 또는 갱신 필요 알림
- garbage collection: 주기적 QUALITY_SCORE 갱신 → 품질 하락 영역 식별 → 리팩터링 제안
- 이 스케줄은 `schedule` 스킬로 설정하며, API 크레딧을 소비하므로 주기를 안내
- 스킬이 직접 schedule을 생성하지 않고, 사용자에게 설정 방법을 안내하고 확인을 받는다

### Step 8. 앱 가독성 + 하네스 진화 문서

`../harness-shared/templates-common.md`의 해당 섹션을 참조하여 다음을 생성한다:

- CLAUDE.md에 Playwright 검증 워크플로우 추가 (MCP 설치 확인 후)
- CLAUDE.md에 worktree 격리 작업 가이드 추가
- core-beliefs.md에 구조화된 로깅 원칙 추가
- `docs/design-docs/harness-evolution.md` 생성 (문서→코드 승격 규칙, 에이전트 실패 대응)
  - 하네스 진화 템플릿은 `../harness-shared/templates-common.md` 참조
- `docs/design-docs/rule-promotions.md` 생성 (빈 승격 이력 로그)

### Step 9. 유틸리티 스크립트

스택 감지 결과에 따라 해당하는 스크립트만 생성:

| 스택 | 스크립트 | 소스 |
|------|---------|------|
| Supabase | scripts/generate-schema-doc.ts | supabase-schema.sql 파싱 |
| Next.js App Router | scripts/generate-api-doc.ts | src/app/api/ 디렉토리 스캔 |
| Prisma | scripts/generate-schema-doc.ts | prisma/schema.prisma 파싱 |
| 기타 | 없음 | generated/README.md 가이드만 |

- 위 테이블에서 해당하는 스크립트가 있을 때만 package.json에 `"generate:docs"` 스크립트 추가
- "기타" 스택(스크립트 없음)에서는 generate:docs를 추가하지 않는다
- tsx 설치 필요 시 `npm install -D tsx` 실행
- generate:docs가 생성된 경우 CLAUDE.md에 "스키마/API 변경 후 `npm run generate:docs` 실행" 명시

### Step 10. 검증

모든 설치가 끝나면 자동으로 검증을 실행한다.

```
검증 항목:
├── npm run lint → 통과 확인
├── 의도적 위반 코드 작성 → ESLint가 차단하는지 확인 → 위반 코드 삭제
├── generated/ 스크립트 실행 → 문서 생성 확인 (해당 스크립트가 있을 때만)
├── husky 테스트 → 테스트 커밋으로 hook 작동 확인 (Windows 주의)
├── CLAUDE.md 줄 수 확인 → 100줄 이내인지
└── 모든 docs/ 파일에 마지막 업데이트 날짜가 있는지
```

검증 실패 시 자동 수정 시도. 수정 불가한 문제만 사용자에게 보고.

### Step 11. 최종 리포트

```
"하네스 세팅 완료:
 ✅ CLAUDE.md (XX줄)
 ✅ docs/ 구조 (XX개 파일)
 ✅ PRODUCT_SENSE.md 초안 생성
 ✅ QUALITY_SCORE.md 초기 점수 산출
 ✅ ESLint no-restricted-imports 규칙 X개
 ✅ husky pre-commit hook 활성
 ✅ CI 워크플로우 생성
 ✅ generated/ 문서 생성됨
 ⚠️ PRODUCT_SENSE.md는 초안입니다 — 기능 추가 시마다 갱신됩니다
 ⚠️ 주기적 품질 관리를 위해 /schedule로 doc-gardening, garbage collection 설정을 권장합니다

 다음 단계 추천:
 - /brainstorming으로 제품 설계 시작
 - /writing-plans로 구현 계획 수립"
```

---

## 기존 스킬 연동

이 스킬은 단독으로 작동하지만, 다음 스킬과 함께 사용하면 하네스가 더 효과적이다:

| 스킬 | 연동 시점 | 설명 |
|------|----------|------|
| `superpowers:writing-plans` | exec-plans/ 작성 시 | 실행 계획을 docs/exec-plans/에 저장 |
| `superpowers:verification-before-completion` | 작업 완료 전 | 검증 없이 완료 선언 방지 |
| `superpowers:dispatching-parallel-agents` | 코더/리뷰어 병렬 실행 시 | docs/agents/ 가이드라인 참조하도록 프롬프트 |
| `superpowers:using-git-worktrees` | 큰 변경 시 | 격리된 환경에서 작업 |
| `context7` | references/ 문서 수집 시 | 외부 라이브러리 최신 문서 가져오기 |
| `update-config` | settings.json 수정 시 | 직접 JSON 편집 대신 스킬로 안전하게 |
| `schedule` | 주기적 관리 설정 시 | doc-gardening, garbage collection 스케줄 |
| `simplify` | 코드 정리 시 | 생성된 설정 파일 중복/비효율 체크 |
| `frontend-design` | 새 화면/컴포넌트 설계 시 | 제네릭한 AI 디자인 지양, 토큰 기반 프로덕션 UI 생성 |
| `audit` | 기능 완성 직후 | 접근성/성능/디자인 일관성 종합 점검 (P0-P3 리포트) |
| `polish` | PR 올리기 전 | 정렬/간격/마이크로 디테일 마감 |

---

## 기존 하네스가 있는 프로젝트

이미 CLAUDE.md나 docs/가 있는 프로젝트에서 실행하면:
1. 기존 파일을 덮어쓰지 않는다
2. 빠진 항목만 추가 제안한다
3. 기존 ESLint 설정은 병합한다
4. 충돌이 있으면 사용자에게 선택권을 준다

---

## 주의사항

- CLAUDE.md는 반드시 ~100줄 이내. 넘으면 에이전트 성능 저하.
- ESLint는 반드시 flat config 형식 (eslint.config.mjs). 레거시 .eslintrc 사용 금지.
- .env 파일은 절대 수정/커밋하지 않는다.
- settings.json은 직접 편집하지 않고 update-config 스킬을 사용한다.
- 생성된 모든 docs/ 파일에는 마지막 업데이트 날짜를 표시한다.
- design-docs/와 product-specs/에는 반드시 index.md (목차)를 포함한다.
