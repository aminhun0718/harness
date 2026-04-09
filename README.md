# Harness Init — Claude Code 스킬

AI 에이전트 운영을 위한 하네스 인프라 스킬 모음.  
스캔 → 인터뷰 → 스택별 하위 스킬 호출로 프로젝트에 가드레일을 설치한다.

## 설치

```bash
git clone https://github.com/aminhun0718/harness-init.git ~/.claude/skills/harness
```

## 업데이트

```bash
cd ~/.claude/skills/harness
git pull
```

## 스킬 수정 후 반영

```bash
cd ~/.claude/skills/harness
git add .
git commit -m "fix: 수정 내용"
git push
```

## 구조

```
~/.claude/skills/harness/
├── harness-init/      ← 라우터: 스캔 + 인터뷰 + 스택별 라우팅
├── harness-web/       ← 웹 전용 설치 (Next.js, Express, Nest.js)
├── harness-rn/        ← React Native 전용 설치 (Expo)
└── harness-shared/    ← 공통 참조 (템플릿, 검증 스크립트)
```

## 사용법

Claude Code에서:
```
/harness-init
```
