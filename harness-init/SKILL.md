---
name: harness-init
description: |
  프로젝트에 AI 에이전트 운영을 위한 하네스 인프라를 설치하는 라우터 스킬.
  환경을 스캔하고, 사용자를 인터뷰한 뒤, 스택에 맞는 하위 스킬로 라우팅한다.
  
  다음 상황에서 반드시 이 스킬을 사용하세요:
  - "하네스 세팅해줘", "프로젝트 초기 세팅", "개발 환경 구축"
  - "AI가 실수 못하게 환경 만들어줘", "에이전트용 환경 세팅"
  - "린터/CI/아키텍처 테스트 세팅", "CLAUDE.md 구조 잡아줘"
  - 새 프로젝트를 시작할 때
  - 기존 프로젝트에 에이전트 운영 체계를 도입할 때
  
  이 스킬은 "안내 데스크"다. 접수하고 전문 설치기사에게 넘긴다.
  실제 설치는 harness-web 또는 harness-rn이 담당한다.
---

# Harness Init — 라우터

비개발자가 AI 에이전트 팀을 운영하기 위한 인프라를 설치하는 진입점.
스캔 → 인터뷰 → 스택별 하위 스킬 호출의 3단계로 작동한다.

핵심 철학:
- **파일이 아니라 시스템을 설치한다** — 정적 문서 세트가 아니라, 스스로 진화하는 자기 유지 시스템
- **스택에 맞게 적응한다** — 스캔과 인터뷰 결과로 적합한 설치 스킬을 선택
- **지도를 줘라, 매뉴얼 말고** — CLAUDE.md는 ~100줄 라우터, 상세는 docs/에서 progressive disclosure
- **부탁이 아니라 강제** — 규칙은 문서가 아니라 린터/훅/CI로 구현
- **에이전트의 세계 = 레포지토리** — 모든 맥락을 파일로

---

## Step 1. 환경 스캔 (자동)

사용자 개입 없이 현재 상태를 파악한다.

```
확인 항목:
├── 글로벌 세팅 존재 여부 (.claude/settings.json 권한)
├── package.json 존재 여부 → 스택 감지
│   ├── 프레임워크: Next.js? Express? Nest.js? Remix? 순수 React? Expo? React Native?
│   ├── DB/ORM: Supabase? Prisma? Drizzle? TypeORM?
│   ├── 배포: Vercel? (vercel.json) / Docker? (Dockerfile) / EAS? (eas.json)
│   └── 테스트: vitest? jest? playwright-test? detox?
├── app.json / app.config.js 존재 여부 → Expo 프로젝트 감지
├── 패키지 매니저 감지 (package-lock.json / pnpm-lock.yaml / yarn.lock)
├── tsconfig.json → TypeScript strict 여부
├── 기존 CLAUDE.md 존재 여부 (이미 하네스가 있는 프로젝트인지)
├── src/ 하위 파일 수 카운트
├── .gitignore에 .env 포함 여부
├── eslint.config.mjs 또는 .eslintrc.* 존재 여부 + flat config 여부
└── .github/workflows/ 존재 여부
```

**빈 프로젝트 (package.json 없음)**: 스캔 결과를 "빈 프로젝트"로 보고하고,
Step 2 인터뷰에서 스택을 결정한다.

결과를 사용자에게 요약 보고한다:
```
"감지 결과:
 - 글로벌 세팅: ✅ 있음 / ❌ 없음 (생성 예정)
 - 스택: Next.js 15 + Supabase + Vercel / Expo + React Native / 빈 프로젝트
 - 패키지 매니저: npm / pnpm / yarn / 없음
 - 테스트 프레임워크: vitest / jest / 없음
 - TypeScript strict: ✅ / ❌ / tsconfig 없음
 - 기존 하네스: ❌ 없음
 - src/ 파일 수: 15개 / 없음
 - .gitignore: .env 포함 ✅ / ❌
 - ESLint: flat config 감지됨 / 없음"
```

---

## Step 2. 사용자 인터뷰 (1회)

이 질문들로 PRODUCT_SENSE.md 초안 + 도메인 분류 + 스택 결정을 한다.
비개발자도 답할 수 있는 언어로 질문한다.

**Step 1에서 이미 감지한 정보는 묻지 않는다.** 감지 결과를 먼저 보여주고, 
감지할 수 없는 항목만 질문한다.

```
제품 맥락:
1. "이 프로젝트가 뭐하는 건가요?" (한 줄)
2. "주요 기능 3~5개를 나열해주세요"
3. "사용자는 누구인가요? (B2B / B2C / 내부용)"
4. "인증 방식은? (이메일+비밀번호 / 소셜 로그인 / 매직링크)"
5. "결제나 과금이 있나요?"
6. "지금 가장 걱정되는 부분이 있나요?"
   (예: "보안이 걱정", "느려질까봐", "결제가 복잡할 것 같아")

기술 맥락 (자동 감지 불가한 항목):
7. "배포는 어디에 하나요? (Vercel / AWS / Docker / App Store / 아직 미정)"
8. "팀에서 이미 정해진 규칙이 있나요? (코드 스타일, 브랜치 전략, 네이밍 컨벤션 등)"
9. "성능/확장성 요구사항이 있나요?"
   (예: "동시 접속 1000명", "응답시간 200ms 이내", "아직 신경 안 써도 됨")
10. "외부 API나 서드파티 연동이 있나요?"
    (예: "Stripe 결제", "SendGrid 이메일", "OpenAI API")
```

**빈 프로젝트일 때 추가 질문**:
```
11. "웹 프로젝트인가요, 모바일 앱인가요?"
    (웹: Next.js / Express 등 → harness-web)
    (앱: React Native / Expo → harness-rn)
```

답변이 "모르겠다" / "아직 미정"이면 합리적 기본값으로 진행하고 PRODUCT_SENSE.md에 "미정" 표기.

**이것이 마지막 사용자 입력이다. 이후로는 사용자 개입 없이 진행.**

---

## Step 3. 라우팅

스캔 결과 + 인터뷰 답변을 조합하여 스택을 결정하고, 해당 하위 스킬을 호출한다.

### 판단 기준

| 감지 신호 | 스택 | 호출 스킬 |
|-----------|------|----------|
| `react-native` 또는 `expo` in package.json | React Native | `harness-rn` |
| `app.json` 또는 `app.config.js` 존재 | Expo (React Native) | `harness-rn` |
| `next`, `express`, `@nestjs/*`, `remix` in package.json | 웹 | `harness-web` |
| 빈 프로젝트 + 인터뷰 "앱" | React Native | `harness-rn` |
| 빈 프로젝트 + 인터뷰 "웹" | 웹 | `harness-web` |
| 판단 불가 | — | 사용자에게 직접 확인 |

### 호출 방법

**Skill 도구를 사용하여 하위 스킬을 호출한다.**

호출 전에 다음 정보를 현재 대화에 정리해둔다 (하위 스킬이 참조):
- Step 1 스캔 결과 전체
- Step 2 인터뷰 답변 전체
- 빈 프로젝트 여부
- 감지된 스택 요약

```
예시:
"스캔 결과와 인터뷰 답변이 정리되었습니다.
 웹 프로젝트(Next.js + Supabase)로 판단합니다.
 harness-web 스킬을 호출하여 하네스를 설치합니다."
→ Skill 도구로 harness-web 호출
```

---

## 하위 스킬 구조

```
~/.claude/skills/
├── harness-init/          ← 이 스킬 (라우터: 스캔 + 인터뷰 + 라우팅)
├── harness-web/           ← 웹 전용 설치: Step 3-11
├── harness-rn/            ← React Native 전용 설치: Step 3-11
└── harness-shared/        ← 공통 참조 (스킬 아님)
    ├── doc-structure.md
    ├── templates-common.md
    └── validate-harness.ts
```

하위 스킬이 수행하는 작업 (Step 3-11):
- 글로벌 세팅
- 프로젝트 구조 + 컨텍스트 생성 (CLAUDE.md, docs/, PRODUCT_SENSE.md 등)
- 가드레일 설치 (ESLint, husky, TypeScript strict)
- CI/CD 설정
- 에이전트 운영 체계
- 하네스 진화 문서
- 유틸리티 스크립트
- 검증 + 최종 리포트

---

## 기존 하네스가 있는 프로젝트

이미 CLAUDE.md나 docs/가 있는 프로젝트에서 실행하면:
1. 기존 파일을 덮어쓰지 않는다
2. 빠진 항목만 추가 제안한다
3. 기존 ESLint 설정은 병합한다
4. 충돌이 있으면 사용자에게 선택권을 준다

---

## 주의사항

- 이 스킬은 라우터 역할만 한다. 실제 파일 생성/설치는 하위 스킬이 담당.
- Step 1-2는 스택 중립적이다. 어떤 프로젝트에서든 동일하게 작동.
- 하위 스킬을 직접 호출하지 않는다. 반드시 이 라우터를 통해 진입.
- .env 파일은 절대 수정/커밋하지 않는다.
- settings.json은 직접 편집하지 않고 update-config 스킬을 사용한다.
