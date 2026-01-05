# AI 주식 스크리너 Pro

한국투자증권 API를 사용한 주식 스크리닝 애플리케이션입니다.

## 설치 및 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 참고하여 `.env` 파일을 생성하고 한국투자증권 API 키를 입력하세요.

```bash
cp .env.example .env
```

`.env` 파일 내용:

```env
VITE_KIS_APP_KEY=your_app_key_here
VITE_KIS_APP_SECRET=your_app_secret_here
VITE_KIS_BASE_URL=https://openapi.koreainvestment.com:9443
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:8000](http://localhost:8000)로 접속합니다.

## 주요 기능

- **저녁 분석**: 장 마감 후 다음날 매수할 종목을 분석
- **실시간 데이터**: 한국투자증권 API를 통한 실시간 주가 정보
- **기술적 분석**: 이동평균선, 거래량, 모멘텀 등 다양한 지표 분석
- **자금 배분**: 총 투자금액에 따른 종목별 자금 배분 계산
- **매수 체크리스트**: 다음날 아침 매수할 종목 목록 및 손절가/목표가

## 사용 방법

1. **저녁 분석 버튼 클릭**: 시장 종목을 스캔하여 매수 후보 종목을 선정
2. **내일 매수 탭**: Top 5 종목의 진입가, 손절가, 목표가 확인
3. **자금배분 탭**: 총 투자금액을 입력하여 종목별 배분 금액 확인
4. **전체분석 탭**: 모든 통과 종목의 점수 확인

## 보안 주의사항

- `.env` 파일은 절대 공개 저장소에 커밋하지 마세요
- API 키는 한국투자증권 홈페이지에서 발급받을 수 있습니다
- `.env` 파일은 `.gitignore`에 포함되어 있어 자동으로 Git에서 제외됩니다

## 기술 스택

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (아이콘)
- 한국투자증권 OpenAPI

## 면책 조항

이 애플리케이션은 투자 참고용으로만 사용해야 하며, 투자 판단의 책임은 사용자에게 있습니다.
