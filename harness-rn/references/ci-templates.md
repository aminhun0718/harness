# React Native CI/CD 및 훅 템플릿

---

## GitHub Actions CI 워크플로우

RN 프로젝트의 CI는 **린트 + 타입체크만** 수행한다.
빌드 단계는 포함하지 않는다 — RN 빌드는 EAS Build 또는 로컬에서 수행하며, CI에서 실행하기엔 비용이 너무 높다.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  # dependency-cruiser가 설치된 경우에만 포함
  # {{조건부: 50파일 이상일 때만}}
  # architecture:
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - uses: actions/setup-node@v4
  #       with:
  #         node-version: '20'
  #         cache: 'npm'
  #     - run: npm ci
  #     - run: npx depcruise src --config .dependency-cruiser.cjs

  # 문서 신선도는 CI가 아닌 schedule(doc-gardening)에서 관리

  # RN 빌드는 CI에 포함하지 않는다
  # iOS/Android 네이티브 빌드는 EAS Build 또는 로컬에서 수행
  # - macOS runner 필요 (iOS) → 비용 10배
  # - Android SDK 설치 필요 → 설정 복잡, 시간 과도
  # - Expo 프로젝트는 EAS Build가 훨씬 효율적

  # 테스트 프레임워크가 설치된 경우에만 포함
  # {{조건부: jest/vitest가 있을 때만}}
  # test:
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - uses: actions/setup-node@v4
  #       with:
  #         node-version: '20'
  #         cache: 'npm'
  #     - run: npm ci
  #     - run: npm test
```

---

## husky + lint-staged 설정

### 설치 명령

```bash
npm install -D husky lint-staged
npx husky init
```

### .husky/pre-commit

```bash
npx lint-staged
```

### package.json에 추가

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix"
    ]
  }
}
```

### Windows 주의사항

1. husky의 hook 파일(.husky/pre-commit)은 LF 줄바꿈이어야 한다. CRLF로 변환되면 hook이 조용히 실패.
2. 설치 후 반드시 테스트:
   ```bash
   # 의도적으로 lint 에러를 만들고 커밋 시도
   # → pre-commit hook이 차단하는지 확인
   # → 차단되면 에러 코드 롤백
   ```
3. hook이 작동하지 않으면:
   - `.husky/pre-commit` 파일의 줄바꿈 확인 (LF여야 함)
   - `git config core.hooksPath` 확인 (.husky여야 함)
   - Git Bash에서 `bash .husky/pre-commit` 직접 실행하여 에러 확인

---

## EAS Build 설정 가이드

Expo 프로젝트에서는 [EAS Build](https://docs.expo.dev/build/introduction/)를 사용하여
클라우드에서 iOS/Android 빌드를 수행한다.
CI에서 빌드하는 것보다 비용과 설정 면에서 훨씬 효율적이다.

### 초기 설정

```bash
# EAS CLI 설치 (글로벌)
npm install -g eas-cli

# EAS 프로젝트 초기화
eas init

# 빌드 프로필 설정 (eas.json 생성)
eas build:configure
```

### eas.json 기본 구조

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 주요 빌드 명령

```bash
# 개발용 빌드 (시뮬레이터/에뮬레이터)
eas build --profile development --platform all

# 내부 배포용 빌드 (실기기 테스트)
eas build --profile preview --platform all

# 프로덕션 빌드 (스토어 제출용)
eas build --profile production --platform all

# 특정 플랫폼만
eas build --profile production --platform ios
eas build --profile production --platform android

# 스토어 제출
eas submit --platform ios
eas submit --platform android
```

### EAS Build + GitHub Actions 자동화 (선택)

빌드 자체는 EAS 클라우드에서 수행하되, 트리거만 GitHub Actions에서 하는 패턴.
자동 설치하지 않고 사용자에게 안내만 한다.

```yaml
# .github/workflows/eas-build.yml (선택 사항 — 수동으로 트리거)
name: EAS Build

on:
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform (ios/android/all)'
        required: true
        default: 'all'
      profile:
        description: 'Build profile (development/preview/production)'
        required: true
        default: 'preview'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --profile ${{ inputs.profile }} --platform ${{ inputs.platform }} --non-interactive
```

> **Note**: EXPO_TOKEN 시크릿 설정이 필요하다.
> expo.dev 대시보드에서 액세스 토큰을 생성하고 GitHub Secrets에 등록한다.

---

## E2E 테스트 (선택 사항)

E2E 테스트 프레임워크(Detox, Maestro)는 하네스에서 **자동 설치하지 않는다**.
필요 시 사용자가 명시적으로 요청하면 설정을 도와준다.

### 자동 설치하지 않는 이유

- **Detox**: 네이티브 빌드 의존성이 복잡하고 설정에 시간이 많이 걸림
- **Maestro**: 별도 CLI 설치 필요, CI 환경 설정이 플랫폼별로 다름
- 두 도구 모두 시뮬레이터/에뮬레이터가 필요하여 CI 비용이 높음

### Detox 선택 시 참고

React Native 전용 E2E 테스트 프레임워크. 회색 박스 테스트로 네이티브 동작 검증.

```bash
npm install -D detox @types/detox
npx detox init
```

장점: RN에 특화, 동기화 메커니즘 내장
단점: 설정 복잡 (특히 Android), iOS는 macOS 필수

### Maestro 선택 시 참고

플랫폼 독립적 모바일 UI 테스트 도구. YAML로 테스트 시나리오 작성.

```yaml
# .maestro/login-flow.yaml (안내용)
appId: com.example.app
---
- launchApp
- tapOn: "이메일"
- inputText: "test@example.com"
- tapOn: "비밀번호"
- inputText: "password123"
- tapOn: "로그인"
- assertVisible: "홈"
```

장점: 설정 간단, YAML 기반, Expo와 잘 통합
단점: 네이티브 수준 검증 한계, 세밀한 제어 어려움

> **권장**: 초기에는 E2E 없이 단위 테스트(Jest)에 집중하고,
> 핵심 사용자 플로우가 안정화된 후 Maestro(간편) 또는 Detox(정밀)를 도입한다.
