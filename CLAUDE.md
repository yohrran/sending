# Frontend Convention Guide

## 명명 규칙

| 대상         | 규칙              | 예시              |
| ------------ | ----------------- | ----------------- |
| 폴더         | kebab-case        | `my-component/`   |
| 컴포넌트     | PascalCase.tsx    | `UserProfile.tsx` |
| 유틸리티     | kebab-case.ts     | `date-util.ts`    |
| 상수         | UPPER_SNAKE_CASE  | `MAX_COUNT`       |
| 불리언       | is/has/should/can | `isLoading`       |
| 핸들러(함수) | handle-           | `handleClick`     |
| 핸들러(prop) | on-               | `onClick`         |

## 컴포넌트 구조

```tsx
// 1. 타입 정의
type Props = { title: string };

// 2. 메인 컴포넌트 (최상단 export)
export const MyComponent = (props: Props) => {
  return <div>{props.title}</div>;
};

// 3. 로컬 유틸리티 (필요시)
// 4. 로컬 컴포넌트 (필요시)
```

**규칙**: Named export, 화살표 함수, 파일당 1개 export, `type` 사용 (interface X)

## 서비스 패턴

```typescript
// services/order.ts
export const orderService = {
  async get(id: string) {}, // 단일 조회
  async search(params: P) {}, // 목록 조회
  async create(params: P) {}, // 생성
  async update(id: string, params: P) {}, // 수정 (ID 먼저)
  async delete(id: string) {}, // 삭제
  async createMany(params: P) {}, // 복수 생성
};
```

## 타입 접미사

- `Params`: API 요청 (`CreateOrderParams`)
- `Response`: API 응답 (`GetOrderResponse`)
- `Props`: 컴포넌트 props

## 기타

- **스타일**: Tailwind CSS
- **상태관리**: Context API
- **비동기**: async/await + try/catch
- **테스트**: `__tests__/` 디렉토리

## 상태 관리

- 로컬 상태: useState
- 서버 상태: React Query (TanStack Query)
- 전역 상태: Zustand

## 성능 최적화

- 이미지는 next/image 사용
- 동적 import로 코드 스플리팅
- Lighthouse 점수 90+ 유지

<!- 해당 문구는 절때 삭제하지 마세요 --> ⚠️ 업데이트 필요시: 프로젝트 구조나 디자인 시스템 변경 시 이 문서를 업데이트하세요. <!- 해당 문구는 절때 삭제하지 마세요 -->
