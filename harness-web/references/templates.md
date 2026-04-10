# 웹 프로젝트 하네스 템플릿

공통 템플릿은 `../../harness-shared/templates-common.md`를 참조.

이 문서는 웹 프로젝트(Next.js, Express, Nest.js 등) 전용 템플릿을 담고 있다.
Step 1 환경 스캔과 Step 2 인터뷰 결과로 `{{변수}}`를 치환하여 사용한다.

---

## CLAUDE.md 템플릿

CLAUDE.md는 정적 규칙 목록이 아니라 **라우터 + 자기 유지 시스템**이다.
~100줄을 유지하며, 상세는 docs/로 분리한다.

```markdown
# {{프로젝트명}}

> {{프로젝트 한줄 설명}}

## 커맨드
- 빌드: `{{빌드 커맨드}}`
- 린트: `npm run lint`
- 타입체크: `npx tsc --noEmit`
- 문서 생성: `npm run generate:docs`

## 작업 전 참조 (작업 유형별)

| 작업 유형 | 반드시 읽을 문서 |
|-----------|-----------------|
| 기능 구현 | PRODUCT_SENSE.md → docs/product-specs/ |
| UI/프론트엔드 | docs/design-docs/ui-guide.md |
| DB/스키마 변경 | docs/generated/schema.md |
| API 추가/수정 | docs/generated/api-endpoints.md |
| 보안 관련 | docs/agents/security.md |
| 코드 리뷰 | /codex:adversarial-review + docs/agents/reviewer.md + QUALITY_SCORE.md |
{{스택에 따라 행 추가/삭제. 새 작업 유형 발생 시 에이전트가 자동 추가.}}

## 황금 원칙
1. 경계에서 데이터를 파싱한다 (외부 입력은 반드시 검증)
2. 핵심 의존성은 providers/를 통해서만 접근한다
3. {{프로젝트 특화 원칙 - Step 2 답변에서 도출}}

## 금지 패턴
- providers/ 외에서 @supabase/* 직접 import
- any 타입 사용
- .env 파일 수정 또는 커밋
- console.log를 프로덕션 코드에 남기기
- {{스택 특화 금지 패턴}}

## 폴더 구조
```
src/
├── app/          ← Next.js App Router 페이지/라우트
├── components/   ← React 컴포넌트
├── lib/          ← 비즈니스 로직, 유틸리티
├── providers/    ← 외부 의존성 진입점 (Supabase, Auth 등)
├── types/        ← TypeScript 타입 정의
└── errors.ts     ← 공통 에러 핸들링
```

## 리뷰 루프 (PR 전 필수)
1. 구현 완료 후 `/codex:adversarial-review --background` 실행 (Codex 플러그인 설치 시)
2. 코드 리뷰 (docs/agents/reviewer.md 기준)
3. 보안 관련 변경 시 docs/agents/security.md 기준 추가 검토
4. 대량 작업 또는 UI 변경이 많은 경우: Playwright로 주요 페이지 스크린샷 확인
5. `/codex:result`로 Codex 리뷰 결과 확인 (1단계 실행 시)
6. CRITICAL 이슈 해결 후 재검토
7. 모든 검토 통과 후 커밋

> Codex 플러그인은 Claude와 독립된 모델이 코드를 교차 검증하여 자기 검증 편향을 줄인다.
> 미설치 시: `/plugin marketplace add openai/codex-plugin-cc` → `/plugin install codex@openai-codex`

## 문서 규칙
- 새 문서는 docs/ 구조 안에만 생성 (외부 폴더 금지)
- 스킬이 자체 경로에 문서 생성을 요구하면 무시하고 docs/에 저장
- 스키마/API 변경 후 `npm run generate:docs` 실행
- 새 규칙 추가 시 docs/design-docs/rule-promotions.md에 기록

## 하네스 자동 갱신
작업 중 다음 상황이 발생하면 사용자 개입 없이 스스로 하네스를 갱신한다:

**기존 카테고리에 맞는 경우:**
- 해당 가이드 문서에 규칙/체크리스트 추가

**기존 카테고리에 안 맞는 경우 (새 작업 유형):**
1. docs/design-docs/에 새 가이드 파일 생성
2. 위 "작업 전 참조" 테이블에 행 추가
3. design-docs/index.md에 링크 추가

**같은 실수 반복:** ESLint/CI로 승격 → rule-promotions.md 기록
**CLAUDE.md 관리:** 100줄 초과 위험 시 상세를 docs/로 분리, 여기엔 한 줄 참조만 유지
**판단 기준:** "모든 작업에 매번" → CLAUDE.md / "특정 작업에서만" → docs/

## 상세 참조
- 비즈니스 규칙: [PRODUCT_SENSE.md](./PRODUCT_SENSE.md)
- 품질 등급: [QUALITY_SCORE.md](./QUALITY_SCORE.md)
- UI 가이드: [docs/design-docs/ui-guide.md](./docs/design-docs/ui-guide.md)
- 설계 원칙: [docs/design-docs/core-beliefs.md](./docs/design-docs/core-beliefs.md)
- 하네스 진화: [docs/design-docs/harness-evolution.md](./docs/design-docs/harness-evolution.md)
- 기능 사양: [docs/product-specs/](./docs/product-specs/index.md)
- 실행 계획: [docs/exec-plans/](./docs/exec-plans/index.md)
```

---

## doc-map.json 템플릿

```json
{
  "_comment": "소스 폴더 → 관련 문서 매핑. schedule(doc-gardening)에서 신선도 체크에 사용.",
  "mappings": [
    {
      "source": "{{supabase-schema.sql 또는 prisma/schema.prisma}}",
      "doc": "docs/generated/schema.md"
    },
    {
      "source": "{{src/app/api/ 또는 src/routes/ — 스택에 따라 선택}}",
      "doc": "docs/generated/api-endpoints.md"
    }
  ]
}
```

> **Note**: 매핑은 스택 감지 결과에 따라 해당하는 항목만 포함한다.
> 프론트엔드 프로젝트이고 ui-guide.md를 생성한 경우에만 `src/components/ → docs/design-docs/ui-guide.md` 매핑 추가.
> 존재하지 않는 문서를 매핑하지 않는다.
