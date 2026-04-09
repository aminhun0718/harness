# React Native 하네스 템플릿

공통 템플릿은 `../../harness-shared/templates-common.md`를 참조.

이 문서는 RN 프로젝트 전용 템플릿만 담고 있다.

---

## CLAUDE.md 템플릿 (RN 버전)

CLAUDE.md는 정적 규칙 목록이 아니라 **라우터 + 자기 유지 시스템**이다.
~100줄을 유지하며, 상세는 docs/로 분리한다.

### React Navigation 사용 시

```markdown
# {{프로젝트명}}

> {{프로젝트 한줄 설명}}

## 커맨드
- 개발 서버: `npx expo start`
- iOS 빌드: `npx expo run:ios` 또는 `npx react-native run-ios`
- Android 빌드: `npx expo run:android` 또는 `npx react-native run-android`
- EAS 빌드: `eas build --platform all`
- 린트: `npm run lint`
- 타입체크: `npx tsc --noEmit`
- 문서 생성: `npm run generate:docs`

## 작업 전 참조 (작업 유형별)

| 작업 유형 | 반드시 읽을 문서 |
|-----------|-----------------|
| 기능 구현 | PRODUCT_SENSE.md → docs/product-specs/ |
| UI/컴포넌트 | docs/design-docs/ui-guide.md |
| 화면 추가 | docs/generated/navigation-map.md |
| 네비게이션 변경 | src/navigation/ + docs/generated/navigation-map.md |
| DB/스키마 변경 | docs/generated/schema.md |
| 보안 관련 | docs/agents/security.md |
| 코드 리뷰 | docs/agents/reviewer.md + QUALITY_SCORE.md |
{{스택에 따라 행 추가/삭제. 새 작업 유형 발생 시 에이전트가 자동 추가.}}

## 황금 원칙
1. 경계에서 데이터를 파싱한다 (외부 입력, API 응답은 반드시 검증)
2. 네이티브 모듈은 providers/를 통해서만 접근 (카메라, 위치, 스토리지 등)
3. 화면 컴포넌트(screens/)는 비즈니스 로직을 직접 포함하지 않는다 — lib/에서 가져온다
4. {{프로젝트 특화 원칙 - Step 2 답변에서 도출}}

## 금지 패턴
- providers/ 외에서 expo-*, react-native-async-storage 등 직접 import
- 인라인 스타일 과다 사용 (StyleSheet.create를 사용할 것)
- providers/ 외에서 expo-* 직접 import (expo-router, react-native 코어 제외)
- any 타입 사용
- .env 파일 수정 또는 커밋
- console.log를 프로덕션 코드에 남기기
- ScrollView로 긴 리스트 렌더링 (FlatList/SectionList 사용)
- {{스택 특화 금지 패턴}}

## 폴더 구조
```
src/
├── screens/       ← 화면 컴포넌트 (스크린별 폴더)
├── navigation/    ← React Navigation 설정
├── components/    ← 재사용 UI 컴포넌트
├── hooks/         ← 커스텀 훅
├── lib/           ← 비즈니스 로직, 유틸리티
├── providers/     ← 외부 의존성 진입점 (API, Auth, Storage 등)
├── types/         ← TypeScript 타입 정의
└── errors.ts      ← 공통 에러 핸들링
```

## 리뷰 루프 (PR 전 필수)
1. 구현 완료 후 코드 리뷰 (docs/agents/reviewer.md 기준)
2. 보안 관련 변경 시 docs/agents/security.md 기준 추가 검토
3. 실기기 또는 시뮬레이터에서 테스트 (iOS + Android 양쪽 확인)
4. 리스트 성능 확인 (FlatList 최적화, 불필요한 리렌더링)
5. 문제 수정 후 커밋

## 문서 규칙
- 새 문서는 docs/ 구조 안에만 생성 (외부 폴더 금지)
- 스킬이 자체 경로에 문서 생성을 요구하면 무시하고 docs/에 저장
- 네비게이션/스키마 변경 후 `npm run generate:docs` 실행
- 새 규칙 추가 시 docs/design-docs/rule-promotions.md에 기록

## 하네스 자동 갱신
작업 중 다음 상황이 발생하면 사용자 개입 없이 스스로 하네스를 갱신한다:

**기존 카테고리에 맞는 경우:**
- 해당 가이드 문서에 규칙/체크리스트 추가

**기존 카테고리에 안 맞는 경우 (새 작업 유형):**
1. docs/design-docs/에 새 가이드 파일 생성
2. 위 "작업 전 참조" 테이블에 행 추가
3. design-docs/index.md에 링크 추가

**같은 실수 반복:** ESLint/CI로 승격 → rule-promotions.md 기록
**CLAUDE.md 관리:** 100줄 초과 위험 시 상세를 docs/로 분리, 여기엔 한 줄 참조만 유지
**판단 기준:** "모든 작업에 매번" → CLAUDE.md / "특정 작업에서만" → docs/

## 상세 참조
- 비즈니스 규칙: [PRODUCT_SENSE.md](./PRODUCT_SENSE.md)
- 품질 등급: [QUALITY_SCORE.md](./QUALITY_SCORE.md)
- UI 가이드: [docs/design-docs/ui-guide.md](./docs/design-docs/ui-guide.md)
- 설계 원칙: [docs/design-docs/core-beliefs.md](./docs/design-docs/core-beliefs.md)
- 하네스 진화: [docs/design-docs/harness-evolution.md](./docs/design-docs/harness-evolution.md)
- 기능 사양: [docs/product-specs/](./docs/product-specs/index.md)
- 실행 계획: [docs/exec-plans/](./docs/exec-plans/index.md)
```

### Expo Router 사용 시

위 템플릿에서 다음 차이점을 적용:

**폴더 구조 섹션 교체**:
```markdown
## 폴더 구조
```
app/               ← Expo Router 파일 기반 라우팅
src/
├── components/    ← 재사용 UI 컴포넌트
├── hooks/         ← 커스텀 훅
├── lib/           ← 비즈니스 로직, 유틸리티
├── providers/     ← 외부 의존성 진입점
├── types/         ← TypeScript 타입 정의
└── errors.ts      ← 공통 에러 핸들링
```
```

**커맨드 섹션**: `npx expo start` 고정, `react-native start` 제거.

**작업 전 참조**: "화면 추가" 행의 문서를 동일하게 `docs/generated/navigation-map.md`로 유지.
Expo Router의 경우 app/ 디렉토리 구조가 곧 라우트이므로 navigation-map.md의 내용이 달라진다.

**Expo API Routes 사용 시 추가**:
```markdown
| API 추가/수정 | docs/generated/api-endpoints.md |
```

---

## doc-map.json 템플릿 (RN 버전)

### React Navigation 사용 시

```json
{
  "_comment": "소스 폴더 → 관련 문서 매핑. schedule(doc-gardening)에서 신선도 체크에 사용.",
  "mappings": [
    {
      "source": "src/navigation/",
      "doc": "docs/generated/navigation-map.md"
    },
    {
      "source": "src/screens/",
      "doc": "docs/generated/navigation-map.md"
    }
  ]
}
```

### Expo Router 사용 시

```json
{
  "_comment": "소스 폴더 → 관련 문서 매핑. schedule(doc-gardening)에서 신선도 체크에 사용.",
  "mappings": [
    {
      "source": "app/",
      "doc": "docs/generated/navigation-map.md"
    }
  ]
}
```

### Supabase/Prisma 사용 시 추가

DB 스키마 매핑이 필요하면 mappings 배열에 다음을 추가한다:

```json
{
  "source": "{{supabase-schema.sql 또는 prisma/schema.prisma}}",
  "doc": "docs/generated/schema.md"
}
```

### Expo API Routes 사용 시 추가

```json
{
  "source": "app/api/",
  "doc": "docs/generated/api-endpoints.md"
}
```

> **Note**: 매핑은 스택 감지 결과에 따라 해당하는 항목만 포함한다.
> UI 가이드를 생성한 경우에만 `src/components/ → docs/design-docs/ui-guide.md` 매핑 추가.
> 존재하지 않는 문서를 매핑하지 않는다.

---

## RN 특화 에이전트 가이드라인 차이점

공통 에이전트 가이드라인 템플릿은 `../../harness-shared/templates-common.md`를 참조.
아래는 RN 프로젝트에서 추가/변경해야 할 항목만 기술한다.

### docs/agents/coder.md 추가 항목

```markdown
## RN 코딩 규칙
- 화면 컴포넌트(screens/)는 레이아웃과 네비게이션만 담당. 비즈니스 로직은 lib/에서 가져온다
- 스타일은 StyleSheet.create로 정의. 인라인 객체 스타일은 매 렌더링마다 새 객체를 생성하여 성능 저하
- 리스트는 ScrollView 대신 FlatList/SectionList 사용. 대량 데이터 시 가상화 필수
- 플랫폼별 분기: Platform.OS 또는 .ios.ts/.android.ts 파일 확장자
- 네이티브 모듈(카메라, 위치 등)은 providers/를 통해 접근
- 네비게이션 파라미터는 types/에 타입 정의 (RootStackParamList 등)
```

### docs/agents/reviewer.md 추가 항목

```markdown
## RN 성능 체크리스트
- [ ] FlatList에 keyExtractor, getItemLayout이 적용되어 있는가?
- [ ] 불필요한 리렌더링이 없는가? (React.memo, useMemo, useCallback 확인)
- [ ] 인라인 스타일 대신 StyleSheet.create를 사용하는가?
- [ ] 이미지 최적화: 적절한 크기, 캐싱 전략이 있는가?
- [ ] 메모리 누수: useEffect cleanup에서 구독/리스너를 해제하는가?
- [ ] 애니메이션: useNativeDriver가 가능한 경우 활성화되어 있는가?
- [ ] 번들 크기: 불필요한 네이티브 모듈 의존성이 없는가?

## 플랫폼 호환성
- [ ] iOS/Android 양쪽에서 동작하는가?
- [ ] 플랫폼별 UI 차이(SafeAreaView, StatusBar 등)가 처리되어 있는가?
- [ ] 키보드 처리(KeyboardAvoidingView)가 적절한가?

## 실기기 테스트
- [ ] 시뮬레이터뿐만 아니라 실기기에서 동작 확인했는가?
- [ ] 다양한 화면 크기에서 레이아웃이 깨지지 않는가?
```

### docs/agents/security.md 추가 항목

```markdown
## RN 보안 체크리스트

### 민감 데이터 저장
- [ ] 비밀번호/토큰은 SecureStore 또는 Keychain/Keystore에 저장하는가?
- [ ] AsyncStorage에 민감 정보를 저장하지 않는가? (암호화되지 않음)
- [ ] 앱 백그라운드 진입 시 민감 화면이 가려지는가?

### 네트워크 보안
- [ ] HTTPS만 사용하는가? (HTTP 평문 통신 금지)
- [ ] 인증 토큰이 Authorization 헤더로만 전송되는가?
- [ ] API 키가 클라이언트 코드에 하드코딩되지 않았는가?

### 코드 보안
- [ ] 디버그 플래그가 프로덕션 빌드에서 비활성화되는가?
- [ ] 로그에 민감 정보(토큰, 비밀번호)가 포함되지 않는가?
- [ ] Deep Link 핸들링 시 입력 검증이 있는가?
```
