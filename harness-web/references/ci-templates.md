# CI/CD 및 훅 템플릿

---

## GitHub Actions CI 워크플로우

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
  architecture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx depcruise src --config .dependency-cruiser.cjs

  # 문서 신선도는 CI가 아닌 schedule(doc-gardening)에서 관리

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

  # 테스트 프레임워크가 설치된 경우에만 포함
  # {{조건부: vitest/jest/playwright-test가 있을 때만}}
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

## doc-freshness 체크 스크립트

> 이 스크립트는 CI가 아닌 schedule(doc-gardening)에서 주기적으로 실행된다.

### scripts/check-doc-freshness.mjs

순수 Node 스크립트로 통합 (bash/jq 의존성 제거, Windows 호환).

```javascript
#!/usr/bin/env node
// doc-map.json 기반 문서 신선도 체크
// 소스의 마지막 커밋이 문서의 마지막 커밋보다 새로우면 경고

import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

const DOC_MAP = "doc-map.json";

if (!existsSync(DOC_MAP)) {
  console.log("doc-map.json not found, skipping freshness check");
  process.exit(0);
}

const { mappings } = JSON.parse(readFileSync(DOC_MAP, "utf-8"));
let warnings = 0;

for (const { source, doc } of mappings) {
  if (!existsSync(source) && !existsSync(doc)) continue;

  const getLastCommit = (path) => {
    try {
      return parseInt(execSync(`git log -1 --format="%ct" -- "${path}"`, { encoding: "utf-8" }).trim()) || 0;
    } catch { return 0; }
  };

  const sourceTime = getLastCommit(source);
  const docTime = getLastCommit(doc);

  if (sourceTime > docTime) {
    console.log(`⚠️  ${doc} is outdated (source: ${source} was modified more recently)`);
    warnings++;
  }
}

if (warnings > 0) {
  console.log(`\n📋 ${warnings} document(s) may need updating.`);
  console.log("Run 'npm run generate:docs' or update the docs manually.");
  // 경고만, 실패시키지 않음 (초기에는)
  // 엄격 모드를 원하면 process.exit(1)로 변경
} else {
  console.log("✅ All documents are up to date.");
}
```

---

## dependency-cruiser 설정 (50파일+ 시)

### .dependency-cruiser.cjs (플랫 구조용)

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // 순환 참조 금지
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true }
    },
    // components/에서 providers/ 직접 접근 금지
    {
      name: "no-db-in-components",
      severity: "error",
      comment: "컴포넌트에서 DB/외부 서비스에 직접 접근하지 마세요. lib/의 서비스 함수를 통해 접근하세요.",
      from: { path: "^src/components/" },
      to: { path: "^src/providers/" }
    },
    // types/는 다른 내부 모듈 의존 금지
    {
      name: "types-must-be-pure",
      severity: "error",
      comment: "types/는 순수 타입 정의만 포함해야 합니다. lib/, providers/, components/를 import하지 마세요.",
      from: { path: "^src/types/" },
      to: { path: "^src/(lib|providers|components|app)/" }
    },
    // 외부 패키지는 providers/ 통해서만 (Supabase 등)
    {
      name: "external-via-providers-only",
      severity: "error",
      comment: "핵심 외부 패키지는 providers/를 통해서만 사용하세요.",
      from: { pathNot: "^src/providers/" },
      to: { 
        path: "@supabase",
        dependencyTypesNot: ["type-only"]
      }
    }
  ],
  options: {
    doNotFollow: {
      path: "node_modules"
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"]
    }
  }
};
```

### 도메인별 구조용 추가 규칙 (50파일+ 전환 시)

```javascript
// 도메인 간 직접 참조 금지
{
  name: "no-cross-domain",
  severity: "error",
  comment: "도메인 간 직접 참조 금지. 공유 인터페이스(providers/)를 통해서 소통하세요.",
  from: { path: "^src/domains/([^/]+)/" },
  to: { 
    path: "^src/domains/([^/]+)/",
    pathNot: "^src/domains/$1/"  // 같은 도메인은 허용
  }
}
```
