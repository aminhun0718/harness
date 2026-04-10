# Harness — Claude Code 스킬

AI 에이전트 운영을 위한 하네스 인프라 스킬 모음.
스캔 → 인터뷰 → 스택별 하위 스킬 호출로 프로젝트에 가드레일을 설치한다.

## 핵심 기능

- **스택 자동 감지**: Next.js, Express, Nest.js, React Native, Expo 등 자동 인식
- **CLAUDE.md 라우터**: ~100줄 라우터 + docs/ progressive disclosure 구조
- **가드레일 설치**: ESLint flat config, husky, CI, TypeScript strict 자동 세팅
- **에이전트 운영 체계**: docs/agents/ 기반 역할 분리 (coder/reviewer/security)
- **Codex 교차 검증**: `codex-plugin-cc` 통합으로 독립 모델 코드 리뷰 (self-bias 완화)
- **자기 유지 시스템**: 문서 갱신, 규칙 승격, 품질 점수 자동 관리

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

### Codex 플러그인 설치 (권장)

Codex 교차 검증을 사용하려면 플러그인을 설치:

```
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/codex:setup
```

ChatGPT 구독자는 추가 비용 없이 사용 가능.

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

## 리뷰 워크플로우 (Codex 통합 후)

설치된 프로젝트의 CLAUDE.md에 다음 리뷰 루프가 포함됩니다:

1. 구현 완료 후 `/codex:adversarial-review --background` 실행 (Codex 플러그인 설치 시)
2. 코드 리뷰 (docs/agents/reviewer.md 기준)
3. 보안 관련 변경 시 docs/agents/security.md 기준 추가 검토
4. 대량 작업 또는 UI 변경 시 Playwright로 주요 페이지 확인
5. `/codex:result`로 Codex 리뷰 결과 확인
6. CRITICAL 이슈 해결 후 재검토
7. 모든 검토 통과 후 커밋

### 2-레이어 리뷰 원칙

- **Codex** (독립 모델): 코드 품질, 아키텍처, 로직 검증 — 자기 검증 편향 없음
- **Claude** (메인): UX/통합 검증, Playwright 기반 동작 확인

같은 모델의 서브에이전트는 독립성이 환상에 가깝기 때문에, 실제 다른 모델(GPT-5 계열)로 교차 검증하여 구조적으로 편향을 줄인다.

## 철학

- **파일이 아니라 시스템을 설치한다** — 정적 문서가 아니라 스스로 진화하는 자기 유지 시스템
- **지도를 줘라, 매뉴얼 말고** — CLAUDE.md는 ~100줄 라우터, 상세는 docs/에서 progressive disclosure
- **부탁이 아니라 강제** — 규칙은 문서가 아니라 린터/훅/CI로 구현
- **에이전트의 세계 = 레포지토리** — 모든 맥락을 파일로
- **독립 검증** — 같은 모델 자기 검증은 편향, 다른 모델 교차 검증이 진짜 리뷰
