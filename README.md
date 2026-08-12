# SKALA Vue 날씨 과제

Vue 3, Vue Router, Pinia로 구성한 단계별 날씨 과제입니다. 기본 주소(`/`)에서는 과제 5까지 누적 적용된 완성형 **날씨한입** 화면을 표시하고, 각 실습 단계는 별도 URL에서 독립적으로 검증할 수 있습니다.

## 과제별 실행 URL

개발 서버를 실행한 뒤 아래 주소로 접속합니다. 과제 링크는 완성형 앱의 디자인을 유지하기 위해 화면 메뉴에는 추가하지 않았습니다.

| 단계 | URL | 핵심 구현 | 주요 파일 |
|---|---|---|---|
| 최종 화면 | [`/`](http://localhost:3000/) | 과제 5 완성형 화면 | `PracticeFiveView.vue` |
| 과제 1 | [`/practice1`](http://localhost:3000/practice1) | Mock 배열, `v-for`, `:key`, `v-if`/`v-else` | `WeatherMockup.vue` |
| 과제 2 | [`/practice2`](http://localhost:3000/practice2) | `ref`, `computed`, `watch`, `watchEffect` | `WeatherComposition.vue` |
| 과제 3 | [`/practice3`](http://localhost:3000/practice3) | Components, props, emits, slot, scoped style | `WeatherParent.vue` 및 자식 컴포넌트 |
| 과제 4 | [`/practice4`](http://localhost:3000/practice4) | Router 완성형 화면, 섭씨 고정 | `WeatherHomeView.vue` |
| 과제 5 | [`/practice5`](http://localhost:3000/practice5) | Pinia 섭씨/화씨 단위 전환 | `PracticeFiveView.vue`, `configStore.js` |

Router 검증용 추가 주소는 다음과 같습니다.

- `/about`: 서비스 소개
- `/weather/:cityId`: 지역 상세 날씨. 예: `/weather/seoul`
- 존재하지 않는 주소: Catch-all 404 화면

## 과제 3 컴포넌트 구조

```text
WeatherParent.vue
├── BaseDashboardCard.vue  # 검색·목록 공통 디자인과 slot
│   ├── SearchBar.vue      # currentQuery prop / update-query emit
│   └── WeatherCard.vue    # cityItem prop / select-card, click-detail emits
└── WeatherStatusBar.vue   # 개인 Customization 추가 컴포넌트
```

반응형 데이터, 검색 필터, 선택 상태와 상세 처리 함수는 `WeatherParent.vue`가 소유합니다. Slot으로 주입되는 자식 컴포넌트와도 부모가 직접 props/emits로 통신합니다.

## 프로젝트 실행

```sh
npm install
npm run dev
```

프로덕션 빌드와 정적 검사는 다음과 같이 실행합니다.

```sh
npm run build
npx eslint .
npx oxlint .
```

## 실시간 날씨 설정

완성형 화면은 서버 프록시 `/api/weather`를 통해 OpenWeather 데이터를 요청합니다. 키가 없거나 요청이 실패하면 기존 Mock 데이터를 유지합니다.

1. `.env.example`을 참고하여 `.env`에 `WEATHER_API_KEY`를 설정합니다.
2. API 키에는 `VITE_` 접두사를 붙이지 않습니다.
3. 키는 브라우저 번들에 포함되지 않고 개발·배포 서버의 프록시에서만 사용됩니다.

보안 및 배포 관련 상세 내용은 `SECURITY.md`, `vercel.json`, `api/weather.js`를 참고하세요.
