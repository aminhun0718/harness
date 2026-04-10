# ESLint 규칙 가이드

이 문서는 스택별 ESLint 규칙 생성 가이드를 담고 있다.
모든 규칙은 **flat config (eslint.config.mjs)** 형식이다. 레거시 .eslintrc 사용 금지.

---

## 핵심 원칙

ESLint 에러 메시지는 단순한 에러가 아니라 **에이전트에게 수정 방법을 알려주는 컨텍스트 주입**이다.

나쁜 예:
```
"@supabase/supabase-js import는 금지입니다"
```

좋은 예:
```
"@supabase/supabase-js를 직접 import하지 마세요. 
 대신 providers/supabase.ts에서 가져오세요. 
 예시: import { supabase } from '@/providers/supabase'"
```

---

## 공통 규칙 (모든 스택)

```javascript
// eslint.config.mjs에 추가할 rules 객체

const harnessRules = {
  // any 타입 금지
  "@typescript-eslint/no-explicit-any": "error",
  
  // console.log 경고 (프로덕션 코드에서)
  "no-console": ["warn", { 
    allow: ["warn", "error"] 
  }],
};
```

---

## Providers 패턴 강제

### Next.js + Supabase

```javascript
const providerRules = {
  "no-restricted-imports": ["error", {
    patterns: [
      {
        group: ["@supabase/supabase-js", "@supabase/*"],
        message: "Supabase 클라이언트를 직접 import하지 마세요. 대신 providers/supabase.ts를 사용하세요. 예시: import { supabase } from '@/providers/supabase'"
      },
      {
        group: ["@supabase/auth-helpers-nextjs", "@supabase/ssr"],
        message: "인증 헬퍼를 직접 import하지 마세요. 대신 providers/auth.ts를 사용하세요. 예시: import { getSession } from '@/providers/auth'"
      }
    ]
  }]
};
```

### Next.js + Prisma

```javascript
const providerRules = {
  "no-restricted-imports": ["error", {
    patterns: [
      {
        group: ["@prisma/client"],
        message: "Prisma 클라이언트를 직접 import하지 마세요. 대신 providers/db.ts를 사용하세요. 예시: import { prisma } from '@/providers/db'"
      }
    ]
  }]
};
```

---

## 레이어 위반 차단

### 기본 레이어 구조 (플랫)

```
types/ → lib/ → providers/ → components/ → app/
```

각 레이어는 자신보다 "왼쪽"의 레이어만 import할 수 있다.

```javascript
const layerRules = {
  "no-restricted-imports": ["error", {
    patterns: [
      // types/에서 다른 레이어 import 금지
      // (types는 순수 타입이므로 어디도 import하면 안 됨)
      
      // components/에서 DB 직접 접근 금지
      {
        group: ["**/providers/supabase*", "**/providers/db*", "**/lib/db*"],
        message: "컴포넌트에서 DB를 직접 접근하지 마세요. lib/의 서비스 함수를 통해 접근하세요."
      }
    ]
  }]
};
```

**주의**: `no-restricted-imports`는 파일 위치 기반 조건부 적용이 안 된다.
특정 폴더에서만 규칙을 적용하려면 eslint.config.mjs의 `files` 패턴을 사용:

```javascript
export default [
  // 기본 규칙
  { rules: harnessRules },
  
  // components/ 전용 규칙
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["**/providers/supabase*", "**/providers/db*"],
            message: "컴포넌트에서 DB를 직접 접근하지 마세요. lib/의 서비스 함수를 사용하세요."
          }
        ]
      }]
    }
  },
  
  // types/ 전용 규칙 — 다른 내부 모듈 import 금지
  //   주의: @/ alias 패턴이 아닌 **상대경로 glob** 패턴을 사용한다.
  //   프로젝트에 tsconfig paths alias가 설정되어 있으면 @/ 패턴도 추가하되,
  //   대부분의 프로젝트는 상대경로로 import하므로 **/ glob이 기본이다.
  //   @/ alias가 있는 프로젝트(Next.js 등)에서는 양쪽 모두 포함한다.
  {
    files: ["src/types/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["**/lib/**", "**/providers/**", "**/components/**", "**/app/**"],
            message: "types/는 순수 타입 정의만 포함해야 합니다. 다른 모듈을 import하지 마세요."
          }
          // @/ alias가 있는 프로젝트에서는 아래도 추가:
          // { group: ["@/lib/*", "@/providers/*", "@/components/*", "@/app/*"], message: "..." }
        ]
      }]
    }
  },

  // Providers 패턴 (전역)
  { rules: providerRules }
];

> **다른 스택**: 위 예시는 Supabase/Prisma 기준이다. Step 1에서 감지한 핵심 의존성 패키지에 맞춰
> group과 message를 조정한다. 예: Firebase → `["firebase/*"]`, Drizzle → `["drizzle-orm"]`.
```

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

## flat config에서 no-restricted-imports 병합 주의

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
  { group: ["@supabase/supabase-js"], message: "providers/supabase.ts를 사용하세요" }
];

export default [
  // 기본 규칙
  { rules: harnessRules },

  // types/ 전용 — providers 패턴도 함께 포함
  //   주의: @/ alias가 아닌 상대경로 glob 패턴을 기본으로 사용한다.
  //   @/ alias가 있는 프로젝트(Next.js 등)에서는 양쪽 패턴 모두 포함한다.
  {
    files: ["src/types/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/lib/**", "**/providers/**", "**/components/**"], message: "types/는 순수 타입만" },
          // @/ alias가 있는 프로젝트에서는 아래도 추가:
          // { group: ["@/lib/*", "@/providers/*", "@/components/*"], message: "types/는 순수 타입만" },
          ...providerPatterns
        ]
      }]
    }
  },

  // components/ 전용 — providers 패턴도 함께 포함
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/providers/supabase*", "**/providers/db*"], message: "lib/의 서비스 함수를 사용하세요" },
          ...providerPatterns
        ]
      }]
    }
  },

  // 나머지 파일 — providers 패턴만
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/types/**", "src/components/**", "src/providers/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: providerPatterns }]
    }
  }
];
```

핵심: `no-restricted-imports`를 쓰는 모든 files 블록에서
필요한 전역 patterns를 **명시적으로 스프레드**해야 한다.

---

## 디자인 토큰 강제 (UI 작업 시)

색상을 디자인 토큰 외에 하드코딩하는 것을 차단한다.
`ignores` 경로는 Step 3.5에서 선택된 UI lib에 따라 조정한다.

```javascript
const designRules = {
  "no-restricted-syntax": ["error",
    {
      // hex 색상 리터럴 차단 (#fff, #3b82f6, #3b82f680 등)
      selector: "Literal[value=/^#([0-9a-fA-F]{3}){1,2}([0-9a-fA-F]{2})?$/]",
      message: "색상을 하드코딩하지 마세요. Tailwind 토큰(tailwind.config의 theme 또는 globals.css @theme)을 사용하세요."
    },
    {
      // rgb(), rgba() 문자열 차단
      selector: "Literal[value=/^rgba?\\(/]",
      message: "색상을 하드코딩하지 마세요. Tailwind 토큰을 사용하세요."
    }
  ]
};

export default [
  { rules: harnessRules },

  // 디자인 토큰 강제 — 토큰 소스 + 생성 컴포넌트 제외
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      // shadcn+Tailwind 선택 시 (Step 3.5 기본):
      "tailwind.config.*",         // Tailwind v3 토큰 소스
      "src/components/ui/**",      // shadcn primitives (생성 파일)
      // 다른 UI lib 선택 시 해당 lib의 토큰/theme 파일 경로로 교체
      // 예: "src/theme/**" (CSS Modules / 커스텀)
      "src/**/*.stories.tsx",
      "src/**/*.test.{ts,tsx}"
    ],
    rules: designRules
  },

  // ... 기존 providers/layer 규칙
];
```

**Note**: Tailwind v4의 `@theme {}` 블록은 `globals.css`에 있는데, CSS 파일은 ESLint가 기본 스캔하지 않으므로 별도 ignores가 필요 없다.

### Tailwind 임의값 차단 (shadcn+Tailwind 선택 시 기본 활성화)

Tailwind의 `[12px]`, `text-[#fff]` 같은 임의값은 토큰을 우회하는 경로다.
`eslint-plugin-tailwindcss`의 `no-arbitrary-value` 규칙으로 차단한다:

```bash
npm install -D eslint-plugin-tailwindcss
```

```javascript
import tailwind from "eslint-plugin-tailwindcss";

export default [
  ...tailwind.configs["flat/recommended"],
  {
    rules: {
      "tailwindcss/no-arbitrary-value": "error"
    }
  }
];
```

Step 3.5에서 shadcn+Tailwind를 선택한 경우 Step 5의 UI 라이브러리 설치 단계에서 자동 활성화된다.

### 주의: no-restricted-syntax도 flat config에서 override 된다

`no-restricted-syntax` 여러 블록이 매칭되면 마지막 것이 이전 것을 덮어쓴다
(`no-restricted-imports`와 동일한 문제). 해결 방법도 동일 — 각 files 블록에서
전역 design selectors를 스프레드로 명시 포함한다.

```javascript
const designSelectors = [
  { selector: "Literal[value=/^#.../]", message: "..." },
  { selector: "Literal[value=/^rgba?\\(/]", message: "..." }
];

// types/ 같은 다른 files 블록에서도:
"no-restricted-syntax": ["error", ...designSelectors]
```

---

## dependency-cruiser가 담당하는 것 (50파일 이상 시)

ESLint `no-restricted-imports`는 단순 패턴만 차단한다.
프로젝트가 커지면(50파일+) dependency-cruiser가 다음을 추가로 담당:

- **순환 참조 감지**: A→B→C→A 같은 circular dependency
- **도메인 격리**: domains/payments/가 domains/auth/를 직접 참조 금지
- **Providers 통과 검증**: 외부 패키지가 providers/ 통해서만 사용되는지 그래프 레벨에서 검증
- **고아 모듈 감지**: 아무도 import하지 않는 파일

이것들은 ESLint로 불가능하고 dependency-cruiser만 가능하다.
