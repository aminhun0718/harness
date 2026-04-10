# React Native ESLint 규칙 가이드

이 문서는 RN 스택별 ESLint 규칙 생성 가이드를 담고 있다.
모든 규칙은 **flat config (eslint.config.mjs)** 형식이다. 레거시 .eslintrc 사용 금지.

웹 공통 규칙(any 금지, console 경고 등)은 `../../harness-shared/templates-common.md`를 참조.

---

## 핵심 원칙

ESLint 에러 메시지는 단순한 에러가 아니라 **에이전트에게 수정 방법을 알려주는 컨텍스트 주입**이다.

나쁜 예:
```
"expo-secure-store import는 금지입니다"
```

좋은 예:
```
"expo-secure-store를 직접 import하지 마세요. 
 대신 providers/storage.ts에서 가져오세요. 
 예시: import { secureStorage } from '@/providers/storage'"
```

---

## Providers 패턴 강제 (no-restricted-imports)

providers/ 외부에서 네이티브 모듈/외부 의존성을 직접 import하는 것을 차단한다.

### 차단 대상 패키지

```javascript
const providerPatterns = [
  {
    group: ["expo-secure-store"],
    message: "SecureStore를 직접 import하지 마세요. 대신 providers/storage.ts를 사용하세요. 예시: import { secureStorage } from '@/providers/storage'"
  },
  {
    group: ["expo-camera", "expo-camera/*"],
    message: "Camera를 직접 import하지 마세요. 대신 providers/camera.ts를 사용하세요."
  },
  {
    group: ["expo-location", "expo-location/*"],
    message: "Location을 직접 import하지 마세요. 대신 providers/location.ts를 사용하세요."
  },
  {
    group: ["expo-notifications", "expo-notifications/*"],
    message: "Notifications를 직접 import하지 마세요. 대신 providers/notifications.ts를 사용하세요."
  },
  {
    group: ["expo-image-picker", "expo-image-picker/*"],
    message: "ImagePicker를 직접 import하지 마세요. 대신 providers/media.ts를 사용하세요."
  },
  {
    group: ["expo-file-system", "expo-file-system/*"],
    message: "FileSystem을 직접 import하지 마세요. 대신 providers/storage.ts를 사용하세요."
  },
  {
    group: ["@react-native-async-storage/async-storage"],
    message: "AsyncStorage를 직접 import하지 마세요. 대신 providers/storage.ts를 사용하세요. 예시: import { storage } from '@/providers/storage'"
  },
  {
    group: ["@react-native-community/netinfo"],
    message: "NetInfo를 직접 import하지 마세요. 대신 providers/network.ts를 사용하세요."
  },
  {
    group: ["react-native-gesture-handler"],
    message: "GestureHandler를 직접 import하지 마세요. 대신 providers/gesture.ts를 사용하세요."
  },
  {
    group: ["react-native-reanimated"],
    message: "Reanimated를 직접 import하지 마세요. 대신 providers/animation.ts를 사용하세요."
  }
];
```

> **Note**: 위 목록은 일반적인 RN 네이티브 모듈이다. 프로젝트에서 사용하는 패키지만 포함한다.
> Step 1 환경 스캔에서 package.json의 dependencies를 확인하여 해당하는 것만 생성한다.

### 허용 예외

다음은 providers 패턴 제한에서 **제외**한다:

1. **react-native 코어 import** - `View`, `Text`, `StyleSheet`, `Platform`, `FlatList` 등 react-native 패키지의 코어 컴포넌트는 어디서든 허용
2. **expo-router** - `app/` 디렉토리에서 expo-router import 허용 (Expo Router 프로젝트)
3. **providers/ 내부** - providers/ 폴더 자체는 당연히 외부 패키지 직접 import 허용

---

## 전체 eslint.config.mjs 예시

```javascript
// eslint.config.mjs
import tseslint from "typescript-eslint";

// --- providers 패턴 (프로젝트에 맞게 조정) ---
const providerPatterns = [
  {
    group: ["expo-secure-store"],
    message: "SecureStore를 직접 import하지 마세요. 대신 providers/storage.ts를 사용하세요."
  },
  {
    group: ["@react-native-async-storage/async-storage"],
    message: "AsyncStorage를 직접 import하지 마세요. 대신 providers/storage.ts를 사용하세요."
  }
  // ... 프로젝트에서 사용하는 네이티브 모듈만 추가
];

// --- 공통 하네스 규칙 ---
const harnessRules = {
  "@typescript-eslint/no-explicit-any": "error",
  "no-console": ["warn", { allow: ["warn", "error"] }],
};

export default tseslint.config(
  // 1. 기본 규칙 (모든 파일)
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: harnessRules,
  },

  // 2. providers/ — 외부 패키지 직접 import 허용 (제한 없음)
  //    providers/는 별도 규칙 블록 불필요 (전역 providerPatterns에서 제외되므로)

  // 3. types/ — 순수 타입만, providers 패턴도 함께 포함
  //    주의: @/ alias 패턴이 아닌 **상대경로 glob** 패턴을 사용한다.
  //    대부분의 RN 프로젝트는 path alias 없이 상대경로로 import하므로
  //    @/lib/* 같은 alias 패턴은 매칭되지 않는다.
  {
    files: ["src/types/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["**/lib/**", "**/providers/**", "**/components/**", "**/screens/**", "**/hooks/**", "**/navigation/**"],
            message: "types/는 순수 타입 정의만 포함해야 합니다. 다른 모듈을 import하지 마세요."
          },
          ...providerPatterns
        ]
      }]
    }
  },

  // 4. screens/ — DB/API 직접 접근 금지 + providers 패턴
  //    providers/ 전체를 차단하여 screens→providers 직접 의존을 방지한다.
  //    screens는 lib/ 또는 hooks/를 통해서만 데이터에 접근해야 한다.
  {
    files: ["src/screens/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["**/providers/**"],
            message: "화면 컴포넌트에서 providers/를 직접 접근하지 마세요. lib/의 서비스 함수 또는 hooks/를 통해 접근하세요."
          },
          ...providerPatterns
        ]
      }]
    }
  },

  // 5. 나머지 src/ 파일 — providers 패턴만
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/types/**", "src/screens/**", "src/providers/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: providerPatterns }]
    }
  }
);
```

### Expo Router 프로젝트 변형

Expo Router 사용 시 다음을 변경한다:

```javascript
// app/ 디렉토리에서 expo-router는 허용
{
  files: ["app/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        {
          group: ["**/providers/supabase*", "**/providers/db*", "**/providers/firebase*"],
          message: "라우트 파일에서 DB/API를 직접 접근하지 마세요. lib/의 서비스 함수 또는 hooks/를 통해 접근하세요."
        },
        // expo-router는 app/에서 허용하므로 providerPatterns에서 제외
        ...providerPatterns.filter(p => !p.group.includes("expo-router"))
      ]
    }]
  }
}
```

---

## flat config 병합 주의

ESLint flat config에서 같은 파일에 매칭되는 여러 config 블록이 `no-restricted-imports`를
각각 정의하면, **마지막 매칭 블록이 이전 것을 덮어쓴다** (merge가 아님).

### 문제 상황

```javascript
export default [
  // 블록 1: types/ 전용 규칙
  {
    files: ["src/types/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ group: ["@/lib/*"], message: "types/는 순수 타입만" }]
      }]
    }
  },
  // 블록 2: 전역 providers 규칙
  {
    rules: providerRules  // no-restricted-imports 포함
  }
];
```

이 경우 `src/types/foo.ts`에서는 블록 2의 providerRules만 적용되고,
블록 1의 "types/는 순수 타입만" 규칙은 **무시된다**.

### 해결 방법: files별 블록에서 전역 patterns를 명시적으로 포함

```javascript
// providers 패턴을 변수로 추출
const providerPatterns = [
  { group: ["@react-native-async-storage/async-storage"], message: "providers/storage.ts를 사용하세요" }
];

export default [
  // 기본 규칙
  { rules: harnessRules },

  // types/ 전용 — providers 패턴도 함께 포함
  //   주의: @/ alias가 아닌 **상대경로 glob** 패턴을 사용한다.
  {
    files: ["src/types/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/lib/**", "**/providers/**", "**/components/**", "**/screens/**"], message: "types/는 순수 타입만" },
          ...providerPatterns
        ]
      }]
    }
  },

  // screens/ 전용 — providers 패턴도 함께 포함
  {
    files: ["src/screens/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/providers/**"], message: "lib/의 서비스 함수 또는 hooks/를 사용하세요" },
          ...providerPatterns
        ]
      }]
    }
  },

  // 나머지 파일 — providers 패턴만
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/types/**", "src/screens/**", "src/providers/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: providerPatterns }]
    }
  }
];
```

핵심: `no-restricted-imports`를 쓰는 모든 files 블록에서
필요한 전역 patterns를 **명시적으로 스프레드**해야 한다.

---

## 기존 ESLint 설정과 병합

기존 eslint.config.mjs가 있을 때:

1. 기존 파일을 읽는다
2. 기존 `no-restricted-imports` 규칙이 있으면 patterns를 합친다 (덮어쓰지 않음)
3. 기존에 없는 규칙만 추가한다
4. 기존 plugins, extends는 그대로 유지

병합 시 주의:
- `no-restricted-imports`의 patterns 배열은 **합집합**으로 병합
- 같은 group이 이미 있으면 message만 업데이트
- 사용자의 커스텀 규칙은 절대 삭제하지 않는다

---

## 디자인 토큰 강제 (UI 작업 시)

RN에서는 StyleSheet.create 내부에 색상을 하드코딩하는 것을 차단한다.
`src/theme/` 내부 파일은 예외로 허용한다.

```javascript
const designRules = {
  "no-restricted-syntax": ["error",
    {
      // hex 색상 리터럴 차단 (#fff, #3b82f6, #3b82f680 등)
      selector: "Literal[value=/^#([0-9a-fA-F]{3}){1,2}([0-9a-fA-F]{2})?$/]",
      message: "색상을 하드코딩하지 마세요. src/theme/tokens.ts의 토큰을 사용하세요. 예시: tokens.color.primary"
    },
    {
      // rgb(), rgba() 차단
      selector: "Literal[value=/^rgba?\\(/]",
      message: "색상을 하드코딩하지 마세요. src/theme/tokens.ts의 토큰을 사용하세요."
    }
    // 주의: RN의 padding/margin 숫자 리터럴은 차단하지 않는다.
    // 이유: 레이아웃 변수(flexGrow, 동적 계산값 등)와 섞여 있어 false positive가 많다.
    // 대신 reviewer.md 체크리스트에서 토큰 사용을 검토한다.
  ]
};

export default tseslint.config(
  { files: ["src/**/*.{ts,tsx}"], rules: harnessRules },

  // 디자인 토큰 강제 — theme/ 제외
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/theme/**", "src/**/*.test.{ts,tsx}"],
    rules: designRules
  },

  // ... 기존 providers/layer 규칙
);
```

### 인라인 스타일 금지 (권장 플러그인)

RN에서 인라인 style 객체(`<View style={{ padding: 16 }} />`)는 매 렌더링마다
새 객체를 생성하여 성능 저하를 유발한다. `eslint-plugin-react-native`로 차단한다:

```javascript
import reactNative from "eslint-plugin-react-native";

export default tseslint.config(
  {
    plugins: { "react-native": reactNative },
    rules: {
      "react-native/no-inline-styles": "warn",
      "react-native/no-color-literals": "warn" // StyleSheet.create 내 색상 리터럴 경고
    }
  }
);
```

플러그인 설치: `npm install -D eslint-plugin-react-native`

### 주의: no-restricted-syntax도 flat config에서 override 된다

`no-restricted-syntax` 여러 블록이 매칭되면 마지막 것이 이전 것을 덮어쓴다
(`no-restricted-imports`와 동일한 문제). 해결 방법도 동일 — 각 files 블록에서
전역 design selectors를 스프레드로 명시 포함한다.

---

## dependency-cruiser가 담당하는 것 (50파일 이상 시)

ESLint `no-restricted-imports`는 단순 패턴만 차단한다.
프로젝트가 커지면(50파일+) dependency-cruiser가 다음을 추가로 담당:

- **순환 참조 감지**: A→B→C→A 같은 circular dependency
- **Providers 통과 검증**: 외부 패키지가 providers/ 통해서만 사용되는지 그래프 레벨에서 검증
- **고아 모듈 감지**: 아무도 import하지 않는 파일
- **screens→providers 직접 의존 감지**: 화면 컴포넌트가 providers를 직접 사용하는지 그래프 분석

이것들은 ESLint로 불가능하고 dependency-cruiser만 가능하다.
