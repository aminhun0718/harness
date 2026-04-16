# Harness — Claude Code 스킬

AI 에이전트 운영을 위한 하네스 인프라 스킬 모음.
스캔 → 인터뷰 → 스택별 하위 스킬 호출로 프로젝트에 가드레일을 설치한다.

## 핵심 기능

- **스택 자동 감지**: Next.js, Express, Nest.js, React Native, Expo 등 자동 인식
- **CLAUDE.md 라우터**: ~100줄 라우터 + docs/ progressive disclosure 구조
- **가드레일 설치**: ESLint flat config, husky, CI, TypeScript strict 자동 세팅
- **에이전트 운영 체계**: docs/agents/ 기반 역할 분리 (coder/reviewer/security)
- **자기 유지 시스템**: 문서 갱신, 규칙 승격, 품질 점수 자동 관리
- **단독 작동**: 외부 스킬/플러그인 없이 완전 동작, 권장 스킬은 있으면 더 좋음

## 설치

### 방법 1: 플랫 구조 (추천, 다른 스킬들과 공존)

`.claude/skills/` 루트에 git 레포를 초기화하고 `.gitignore`로 harness-* 폴더만 추적합니다. 다른 스킬들은 영향받지 않습니다.

```bash
cd ~/.claude/skills
git init
git remote add origin https://github.com/aminhun0718/harness.git
git fetch origin
git reset --mixed origin/main
git checkout origin/main -- README.md
git branch -m main
```

그리고 `.claude/skills/.gitignore`를 생성:

```gitignore
# 모든 파일/폴더 무시
*
# harness-* 4개 폴더만 추적
!harness-init/
!harness-init/**
!harness-web/
!harness-web/**
!harness-rn/
!harness-rn/**
!harness-shared/
!harness-shared/**
.git/
```

### 방법 2: 단순 clone (신규 환경, 스킬 탐색 미작동)

```bash
git clone https://github.com/aminhun0718/harness.git ~/harness-src
# 4개 폴더를 .claude/skills/ 루트로 복사 또는 symlink
```

## 업데이트

```bash
cd ~/.claude/skills
git pull
```

## 스킬 수정 후 반영

```bash
cd ~/.claude/skills
git add harness-*
git commit -m "fix: 수정 내용"
git push
```

## 구조

```
~/.claude/skills/
├── harness-init/      ← 라우터: 스캔 + 인터뷰 + 스택별 라우팅
├── harness-web/       ← 웹 전용 설치 (Next.js, Express, Nest.js)
├── harness-rn/        ← React Native 전용 설치 (Expo)
└── harness-shared/    ← 공통 참조 (템플릿, 검증 스크립트, 에이전트 가이드라인)
```

## 사용법

Claude Code에서:

```
/harness-init
```

`harness-web`, `harness-rn`, `harness-shared`는 단독 실행하지 마세요. `harness-init`이 스택을 감지하여 적절한 하위 스킬을 자동 호출합니다.

## 권장 스킬

하네스는 외부 스킬 없이 단독 작동합니다. 아래 스킬이 설치되어 있으면 하네스가 생성하는 워크플로우가 더 효과적입니다. `harness-init` 실행 시 자동으로 설치 여부를 체크하고, 최종 리포트에서 안내합니다.

### ★★★ 강력 권장

하네스가 생성하는 문서(product-specs/, exec-plans/, CLAUDE.md 리뷰 루프)에서 직접 참조합니다.

| 스킬 | 용도 | 없을 때 |
|------|------|---------|
| `superpowers:brainstorming` | 기능 설계 진입점 | 직접 CPS 템플릿으로 작성 |
| `superpowers:writing-plans` | 실행 계획 작성 | 직접 계획 문서 작성 |
| `superpowers:verification-before-completion` | 완료 전 검증 강제 | 수동 체크리스트로 검증 |

### ★★☆ 권장

| 스킬 | 용도 |
|------|------|
| `superpowers:dispatching-parallel-agents` | 코더/리뷰어 병렬 실행 |
| `superpowers:using-git-worktrees` | 격리된 환경에서 작업 |
| `schedule` | doc-gardening, garbage collection 자동화 |

### ★☆☆ 선택

사용자가 필요할 때 직접 호출하거나, 에이전트에게 활용을 지시하면 됩니다.

| 스킬 | 용도 |
|------|------|
| `context7` MCP | 외부 라이브러리 최신 문서 조회 |
| `frontend-design` | 토큰 기반 프로덕션 UI 생성 |
| `audit` | 접근성/성능/디자인 종합 점검 |
| `polish` | PR 전 마이크로 디테일 마감 |
| `simplify` | 코드 정리, 중복/비효율 체크 |

## 리뷰 워크플로우

설치된 프로젝트의 CLAUDE.md에 다음 리뷰 루프가 포함됩니다:

1. 코드 리뷰 (docs/agents/reviewer.md 기준)
2. 보안 관련 변경 시 docs/agents/security.md 기준 추가 검토
3. 대량 작업 또는 UI 변경 시 브라우저 검증 (Playwright MCP 설치 시)
4. CRITICAL 이슈 해결 후 재검토
5. 모든 검토 통과 후 커밋

## 철학

- **파일이 아니라 시스템을 설치한다** — 정적 문서가 아니라 스스로 진화하는 자기 유지 시스템
- **지도를 줘라, 매뉴얼 말고** — CLAUDE.md는 ~100줄 라우터, 상세는 docs/에서 progressive disclosure
- **부탁이 아니라 강제** — 규칙은 문서가 아니라 린터/훅/CI로 구현
- **에이전트의 세계 = 레포지토리** — 모든 맥락을 파일로
- **단독 작동, 확장 가능** — 외부 의존 0으로 동작하되, 권장 스킬 설치 시 자동 연동
