/**
 * 하네스 설치 검증 스크립트 (스택 공통)
 *
 * 하네스가 올바르게 설치되었는지 확인한다.
 * 사용: npx tsx scripts/validate-harness.ts [--stack web|rn]
 *
 * --stack 옵션:
 *   web (기본값) — Next.js, Express 등 웹 프로젝트
 *   rn           — React Native / Expo 프로젝트
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// --- CLI 인자 파싱 ---

type Stack = "web" | "rn";

function parseStack(): Stack {
  const args = process.argv.slice(2);
  const stackIdx = args.indexOf("--stack");
  if (stackIdx === -1 || stackIdx + 1 >= args.length) return "web";
  const value = args[stackIdx + 1];
  if (value === "rn") return "rn";
  if (value === "web") return "web";
  console.warn(`알 수 없는 스택: "${value}". 기본값 "web" 사용.`);
  return "web";
}

const stack = parseStack();
const root = process.cwd();
const results: { name: string; pass: boolean; detail: string }[] = [];

function check(name: string, fn: () => string | true) {
  try {
    const result = fn();
    if (result === true) {
      results.push({ name, pass: true, detail: "OK" });
    } else {
      results.push({ name, pass: false, detail: result });
    }
  } catch (e: any) {
    results.push({ name, pass: false, detail: e.message });
  }
}

// --- 파일 존재 체크 ---

const requiredFiles = [
  "CLAUDE.md",
  "PRODUCT_SENSE.md",
  "QUALITY_SCORE.md",
  "doc-map.json",
  "docs/design-docs/index.md",
  "docs/design-docs/core-beliefs.md",
  "docs/design-docs/harness-evolution.md",
  "docs/design-docs/rule-promotions.md",
  "docs/product-specs/index.md",
  "docs/exec-plans/index.md",
  "docs/exec-plans/tech-debt-tracker.md",
  "docs/agents/coder.md",
  "docs/agents/reviewer.md",
  "docs/agents/security.md",
];

for (const file of requiredFiles) {
  check(`파일 존재: ${file}`, () => {
    return existsSync(join(root, file)) ? true : `${file} 없음`;
  });
}

// --- CLAUDE.md 줄 수 ---

check("CLAUDE.md 120줄 이내", () => {
  const content = readFileSync(join(root, "CLAUDE.md"), "utf-8");
  const lines = content.split("\n").length;
  if (lines <= 100) return true;
  if (lines <= 120) return true; // 100-120줄은 허용 범위 (worktree/리뷰 루프 포함 시)
  return `${lines}줄 (120줄 이내 권장 — 초과 시 상세를 docs/로 분리)`;
});

// --- 마지막 업데이트 날짜 ---

const docsWithDates = [
  "PRODUCT_SENSE.md",
  "QUALITY_SCORE.md",
  "docs/design-docs/core-beliefs.md",
  "docs/agents/coder.md",
  "docs/agents/reviewer.md",
  "docs/agents/security.md",
];

for (const file of docsWithDates) {
  check(`날짜 포함: ${file}`, () => {
    if (!existsSync(join(root, file))) return `${file} 없음`;
    const content = readFileSync(join(root, file), "utf-8");
    return /마지막 업데이트|last updated/i.test(content)
      ? true
      : "마지막 업데이트 날짜 없음";
  });
}

// --- .gitignore ---

check(".gitignore에 .env 포함", () => {
  const gitignorePath = join(root, ".gitignore");
  if (!existsSync(gitignorePath)) return ".gitignore 없음";
  const content = readFileSync(gitignorePath, "utf-8");
  return /^\.env/m.test(content) ? true : ".env가 .gitignore에 없음. 민감 정보 노출 위험";
});

// --- tsconfig strict ---

check("TypeScript strict 모드", () => {
  const tsconfigPath = join(root, "tsconfig.json");
  if (!existsSync(tsconfigPath)) return "tsconfig.json 없음";
  const content = readFileSync(tsconfigPath, "utf-8");
  try {
    const tsconfig = JSON.parse(content);
    return tsconfig.compilerOptions?.strict === true
      ? true
      : "strict 모드가 비활성. any 타입 남발 방지를 위해 활성화 권장";
  } catch {
    return "tsconfig.json 파싱 실패";
  }
});

// --- ESLint 설정 ---

check("ESLint 설정 존재", () => {
  const flat = existsSync(join(root, "eslint.config.mjs"));
  const flatJs = existsSync(join(root, "eslint.config.js"));
  const legacy = existsSync(join(root, ".eslintrc.js"));
  const legacyJson = existsSync(join(root, ".eslintrc.json"));

  if (flat || flatJs) return true;
  if (legacy || legacyJson)
    return "레거시 .eslintrc 감지. flat config (eslint.config.mjs) 권장";
  return "ESLint 설정 없음";
});

check("no-restricted-imports 규칙 존재", () => {
  const configPath = existsSync(join(root, "eslint.config.mjs"))
    ? "eslint.config.mjs"
    : existsSync(join(root, "eslint.config.js"))
      ? "eslint.config.js"
      : null;

  if (!configPath) return "ESLint flat config 없음";
  const content = readFileSync(join(root, configPath), "utf-8");
  return content.includes("no-restricted-imports")
    ? true
    : "no-restricted-imports 규칙 없음. Providers 패턴이 강제되지 않음";
});

// --- ESLint 실행 테스트 ---

check("npm run lint 실행", () => {
  try {
    execSync("npm run lint", { cwd: root, stdio: "pipe" });
    return true;
  } catch (e: any) {
    const output = e.stdout?.toString() || e.stderr?.toString() || "";
    return `lint 실패: ${output.slice(0, 200)}`;
  }
});

// --- husky ---

check("husky pre-commit hook 존재", () => {
  const hookPath = join(root, ".husky", "pre-commit");
  return existsSync(hookPath) ? true : ".husky/pre-commit 없음";
});

// --- 스택별 디렉토리 체크 ---

if (stack === "web") {
  // 웹 스택: 스택에 맞는 메인 디렉토리 확인
  check("웹 프로젝트 구조 확인", () => {
    const hasApp = existsSync(join(root, "src", "app")); // Next.js App Router
    const hasRoutes = existsSync(join(root, "src", "routes")); // Express/Nest.js
    const hasLib = existsSync(join(root, "src", "lib")); // 기타 스택
    if (hasApp || hasRoutes || hasLib) return true;
    return "src/app/ 또는 src/routes/ 또는 src/lib/ 없음. 웹 프로젝트 구조를 확인하세요";
  });
} else {
  // RN 스택: React Navigation 또는 Expo Router 구조 확인
  check("RN 프로젝트 구조 확인", () => {
    const hasScreens = existsSync(join(root, "src", "screens")); // React Navigation
    const hasExpoApp = existsSync(join(root, "app")); // Expo Router
    if (hasScreens || hasExpoApp) return true;
    return "src/screens/ (React Navigation) 또는 app/ (Expo Router) 없음";
  });
}

// --- providers/ ---

check("providers/ 디렉토리 존재", () => {
  return existsSync(join(root, "src", "providers"))
    ? true
    : "src/providers/ 없음. 핵심 의존성 진입점이 없음";
});

// --- errors.ts ---

check("공통 에러 핸들링 존재", () => {
  const flat = existsSync(join(root, "src", "errors.ts"));
  const domain = existsSync(join(root, "src", "shared", "errors.ts"));
  return flat || domain ? true : "src/errors.ts 없음. 공통 에러 핸들링이 없음";
});

// --- generated/ (스택에 따라 불필요할 수 있음) ---

check("generated/ 문서 존재", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
  if (!pkg.scripts?.["generate:docs"]) {
    return true; // generate:docs 스크립트가 없으면 generated/ 불필요 — 스킵
  }
  const schema = existsSync(join(root, "docs", "generated", "schema.md"));
  const api = existsSync(
    join(root, "docs", "generated", "api-endpoints.md")
  );
  if (schema || api) return true; // 하나라도 있으면 OK
  return "generate:docs 스크립트는 있지만 generated/ 문서가 없음. npm run generate:docs를 실행하세요";
});

// --- package.json scripts (DB/ORM 의존성이 있으면 generate:docs 필요) ---

check("generate:docs 스크립트 존재", () => {
  const pkg = JSON.parse(
    readFileSync(join(root, "package.json"), "utf-8")
  );
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  // DB/ORM 패키지가 있으면 generate:docs가 필요한 스택
  const dbPackages = [
    "@supabase/supabase-js",
    "@supabase/ssr",
    "@prisma/client",
    "prisma",
    "drizzle-orm",
    "typeorm",
    "sequelize",
    "knex",
    "mongoose",
  ];

  const hasDbDep = dbPackages.some((dep) => dep in allDeps);
  if (!hasDbDep) {
    return true; // DB/ORM 의존성 없음 — generate:docs 불필요, 스킵
  }

  return pkg.scripts?.["generate:docs"]
    ? true
    : "DB/ORM 의존성이 감지되었으나 generate:docs 스크립트가 없음. 스키마 문서 자동 생성을 위해 추가 권장";
});

// --- CI ---

check("CI 워크플로우 존재", () => {
  return existsSync(join(root, ".github", "workflows", "ci.yml"))
    ? true
    : ".github/workflows/ci.yml 없음";
});

// --- 결과 출력 ---

console.log(`\n=== 하네스 검증 결과 (스택: ${stack}) ===\n`);

let passed = 0;
let failed = 0;

for (const r of results) {
  const icon = r.pass ? "✅" : "❌";
  console.log(`${icon} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
  if (r.pass) passed++;
  else failed++;
}

console.log(`\n총 ${results.length}개 항목: ✅ ${passed}개 통과, ❌ ${failed}개 실패\n`);

if (failed > 0) {
  console.log("위 실패 항목을 수정한 후 다시 실행하세요.");
  console.log(`npx tsx scripts/validate-harness.ts --stack ${stack}`);
}

process.exit(failed > 0 ? 1 : 0);
