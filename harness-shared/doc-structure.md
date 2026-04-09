# docs/ 구조 상세

이 문서는 docs/ 디렉토리의 각 파일 역할과 작성 가이드를 설명한다.

---

## 전체 구조

```
docs/
├── design-docs/           ← 설계 원칙과 아키텍처
│   ├── index.md           ← 목차 (필수)
│   ├── core-beliefs.md    ← 황금 원칙
│   ├── harness-evolution.md ← 하네스 진화 프로세스
│   └── rule-promotions.md ← 문서→코드 승격 이력
├── product-specs/         ← 기능별 사양서
│   └── index.md           ← 목차 (필수)
├── exec-plans/            ← 실행 계획
│   ├── index.md           ← 목차 (필수)
│   ├── active/            ← 진행 중
│   ├── completed/         ← 완료
│   └── tech-debt-tracker.md
├── generated/             ← 코드에서 자동 생성
│   ├── schema.md
│   └── api-endpoints.md
├── references/            ← 외부 라이브러리 참조
└── agents/                ← 에이전트 역할 가이드라인
    ├── coder.md
    ├── reviewer.md
    └── security.md
```

---

## 각 디렉토리 역할

### design-docs/

**목적**: 에이전트가 "왜 이렇게 하는가?"를 이해하기 위한 설계 원칙.

- **index.md**: 목차. 각 문서의 한 줄 설명과 링크.
- **core-beliefs.md**: 검증된 황금 원칙. "경계에서 파싱", "providers 패턴" 등.
  에이전트가 의사결정 시 참조. CLAUDE.md에 요약이 있고 여기에 상세 근거.
- **harness-evolution.md**: 하네스 자체를 어떻게 개선하는지의 프로세스.
  문서→코드 승격 규칙, 에이전트 실패 대응 프로토콜 포함.
- **rule-promotions.md**: 승격 이력 로그. 언제, 무엇이, 왜 승격되었는지 추적.

**작성 규칙**:
- 모든 원칙에 "왜?"를 포함. 이유 없는 원칙은 에이전트가 판단 못 함.
- 검증 상태 표시 (초안 / 검증됨 / 폐기).

### product-specs/

**목적**: 각 기능의 사양서. "뭘 만들어야 하는지"를 정의.

- **index.md**: 목차. 기능별 문서 링크.
- **{{기능명}}.md**: 개별 기능 사양. 기술 구현보다 제품 맥락에 집중.

**작성 규칙**:
- 하네스 init 시에는 빈 index.md만 생성.
- 기능 설계 시 `superpowers:brainstorming` → 이 디렉토리에 저장.
- CPS 구조로 작성:
  - **Context**: 배경 + 목적 + 제약사항 (왜 만드는지, 뭘 쓰는지, 뭘 못 하는지)
  - **Problem**: 문제 + 사용자 시나리오 (사용자가 어떤 상황에서 뭘 겪는지)
  - **Solution**: 해결 방법 + 성공 기준 (어떻게 풀고, 뭐가 되면 성공인지)
- 기술 구현 세부사항은 exec-plans/에.

### exec-plans/

**목적**: 일급 아티팩트로서의 실행 계획. 모든 의사결정 기록.

- **index.md**: 목차. active/completed/tech-debt 링크.
- **active/**: 현재 진행 중인 계획. `superpowers:writing-plans`로 생성.
- **completed/**: 완료된 계획. active/에서 이동.
- **tech-debt-tracker.md**: 기술 부채 목록. garbage collection에서 참조.

**작성 규칙**:
- 계획은 세션 간에 지속되어야 함. 에이전트가 대화가 끊겨도 이어서 작업 가능.
- 각 계획에 진행 상황 체크리스트 포함.
- 결정 로그: "A 대신 B를 선택한 이유"를 기록.

### generated/

**목적**: 코드에서 자동 생성되는 문서. 코드와 문서의 불일치 방지.

- **schema.md**: DB 스키마. 테이블, 컬럼, 관계, RLS 정책.
- **api-endpoints.md**: API 엔드포인트 목록. 경로, 메서드, 설명.

**작성 규칙**:
- 절대 수동 편집하지 않는다. 스크립트로만 생성.
- `npm run generate:docs`로 재생성.
- 스키마나 API가 변경될 때마다 실행. CLAUDE.md에 명시.

### references/

**목적**: 외부 라이브러리의 LLM용 참조 문서. context7 스킬과 보완적.

- context7은 최신 문서를 실시간 조회.
- references/는 프로젝트에 특화된 사용법, 커스텀 설정, 주의사항을 기록.

**초기 생성 시 반드시 README.md를 포함한다**:
```markdown
# References

이 디렉토리는 외부 라이브러리/서비스의 프로젝트 특화 참조 문서를 보관합니다.
공식 문서 복사가 아니라, "우리 프로젝트에서 이걸 어떻게 쓰는가"를 기록합니다.

## 예시
- Supabase RLS 정책 설계 가이드
- EAS Build 프로필 설정
- 외부 API 연동 계약서 (엔드포인트, 인증 방식, 응답 형태)

## 작성 시 주의
- context7 스킬이 공식 문서 조회를 담당하므로, 공식 문서를 통째로 복사하지 않는다
- 프로젝트 맞춤 설정, 커스텀 사용법, 주의사항만 기록한다
```

**작성 규칙**:
- 라이브러리 공식 문서를 복사하지 않는다 (context7이 처리).
- "우리 프로젝트에서 이 라이브러리를 어떻게 쓰는가"만 기록.
- 예: Supabase RLS 정책 설계 가이드, Vercel 배포 설정 등.

### agents/

**목적**: 에이전트 역할별 가이드라인.

- **coder.md**: 구현 담당. 작업 전 확인 사항, 코딩 규칙, 작업 후 절차.
- **reviewer.md**: 코드 리뷰. 체크리스트, 피드백 포맷, QUALITY_SCORE 갱신.
- **security.md**: 보안 검토. 인증/인가, RLS, 데이터 보안 체크리스트.

**작성 규칙**:
- CLAUDE.md에 역할 요약을 직접 기재하고 상세는 여기를 참조하도록.
- 가이드라인은 명령형으로 작성 ("확인한다", "검증한다").
- 왜 그 규칙이 필요한지 설명 포함.

---

## 문서 관리 규칙

### 마지막 업데이트 날짜
모든 docs/ 파일에 `> 마지막 업데이트: YYYY-MM-DD` 를 포함한다.
에이전트가 문서를 수정할 때 이 날짜를 갱신한다.

### 목차 (index.md)
design-docs/와 product-specs/에는 반드시 index.md를 포함한다.
index.md는 각 문서의 한 줄 설명과 파일 링크를 담는다.
새 문서가 추가되면 index.md도 갱신한다.

### 교차 링크
문서 간 참조는 이름 기반 상대 경로로 한다.
```
좋은 예: [core-beliefs.md](./core-beliefs.md)
나쁜 예: https://github.com/user/repo/blob/main/docs/design-docs/core-beliefs.md
```

### 신선도 관리
doc-map.json으로 소스↔문서 매핑을 관리한다.
schedule(doc-gardening)에서 scripts/check-doc-freshness.mjs가 주기적으로 신선도를 체크한다.
schedule로 doc-gardening을 주기적으로 실행하여 오래된 문서를 갱신한다.

---

## Progressive Disclosure 패턴

에이전트가 모든 문서를 한번에 읽지 않도록:

1. **CLAUDE.md** (~100줄): 매 세션 시작 시 자동 로드. 핵심 규칙 + 링크만.
2. **docs/ 상위 index.md**: 필요할 때 읽음. 각 영역의 목차.
3. **개별 문서**: 특정 작업에 필요할 때만 읽음.

CLAUDE.md의 **"작업 전 참조" 라우팅 테이블**이 이 구조를 연결한다:
```
| 작업 유형 | 반드시 읽을 문서 |
|-----------|-----------------|
| 기능 구현 | PRODUCT_SENSE.md → docs/product-specs/ |
| UI/프론트엔드 | docs/design-docs/ui-guide.md |
| DB/스키마 변경 | docs/generated/schema.md |
```

**자동 확장**: 새 작업 유형이 발생하면 에이전트가:
1. docs/design-docs/에 새 가이드 파일 생성
2. CLAUDE.md 라우팅 테이블에 행 추가
3. design-docs/index.md에 링크 추가
