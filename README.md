# 🦎 게코노트 (Gecko Note)

크레스티드 게코(Crested Gecko)를 키우는 사람들을 위한 개인용 관리 웹 서비스입니다.
내가 기르는 게코들의 프로필(이름, 모프, 부화일, 무게, 사진, 메모)을 한곳에 기록하고,
사진 한 장으로 모프를 AI에게 물어볼 수 있도록 만들었습니다.

> 🔗 **배포 URL: [https://gecko-note-qste.vercel.app](https://gecko-note-qste.vercel.app)**

---

## 📖 서비스 소개

- **목적**: 여러 마리의 크레스티드 게코를 키우는 집사가 개체별 정보를 흩어진 메모/사진첩 대신 한 화면에서 등록·조회할 수 있게 하고, 모프 감별에 대한 참고 의견을 빠르게 얻을 수 있게 합니다.
- **타겟 사용자**: 크레스티드 게코를 반려동물로 기르는 초보~중급 사육자 및 애호가. 별도 회원가입 없이 브라우저에서 바로 사용할 수 있는 가벼운 개인 기록 도구를 지향합니다.
- **기획 배경**: 실제로 여러 마리의 크레스티드 게코를 키우면서, 개체 수가 늘어날수록 이름·모프·부모 모프·나이 같은 정보를 기록해두지 않으면 헷갈리는 상황이 잦았습니다. 특히 모프가 비슷해 보이는 개체를 육안으로 구분하기 어려운 경우가 많아, 다마릿수 사육 환경에서의 개체 관리를 돕기 위해 직접 기획했습니다.

## 🧭 페이지 구성

상단 네비게이션(모바일에서는 햄버거 메뉴)으로 이동하는 3개 화면으로 구성된 단일 페이지 앱(SPA)입니다.

| # | 화면 | 설명 | 관련 파일 |
| --- | --- | --- | --- |
| 1 | 🏠 홈 | 서비스 소개, 주요 기능 카드(클릭 시 해당 화면으로 이동), 등록된 게코 수/모프 종류 수 요약 통계 | [index.html](index.html) |
| 2 | 📋 내 게코 등록·목록 | 게코 등록/수정 폼과 등록된 게코들을 카드 형태로 보여주는 목록 (`localStorage` 기반 저장) | [js/main.js](js/main.js) |
| 3 | 🤖 모프 AI 분석 | 사진을 업로드(또는 등록된 게코 사진 중 선택)하면 Gemini AI가 모프 후보와 근거를 분석해서 보여주는 화면 | [api/analyze_morph.py](api/analyze_morph.py) |

## 🖼️ 스크린샷

| 홈 | 내 게코 등록·목록 | 모프 AI 분석 |
| --- | --- | --- |
| ![홈 화면](docs/screenshots/home.png) | ![게코 목록 화면](docs/screenshots/gecko-list.png) | ![모프 AI 분석 화면](docs/screenshots/morph-analysis.png) |

## 🤖 AI 기능 — 모프 AI 분석

게코 사진 한 장으로 가능성이 높은 모프 후보를 참고 삼아 확인할 수 있는 기능입니다.

| 항목 | 내용 |
| --- | --- |
| 입력 | 사용자가 업로드했거나 등록된 게코 중에서 선택한 사진 (이미지 파일 → base64 인코딩) |
| 처리 | `POST /api/analyze_morph`에서 Google Gemini API(Vision 지원 모델, `gemini-1.5-flash`)로 이미지를 전송해 색상·패턴 분석 |
| 출력 | 모프 후보 최대 3개(이름·신뢰도 %·판단 근거)와 전체 분석 요약을 JSON으로 응답 |
| 제공 가치 | 사용자가 스스로 판단하기 어려운 모프 구분을 AI의 도움으로 참고할 수 있음 (정확한 감별은 전문 브리더 확인 권장 문구 포함) |

### ⚠️ 실패 처리 기준

| 상황 | 처리 방식 |
| --- | --- |
| 사진 없이 요청 | `"사진을 업로드해주세요"` 안내 메시지 표시 |
| 이미지 용량 초과(8MB 초과) | `"사진 용량이 너무 커요. 더 작은 사진으로 시도해주세요"` 안내 메시지 표시 |
| Gemini API 오류 / 서버 오류(4xx·5xx) | `"잠시 후 다시 시도해주세요"` 안내 메시지 표시 |
| 응답 대기 중 | 분석 중 로딩 상태(`"분석 중..."`) 표시 |

## 🛠 기술 스택

| 영역 | 기술 |
| --- | --- |
| 프론트엔드 | 순수 HTML / CSS / JavaScript (프레임워크·빌드 도구 없음) |
| 백엔드 | Vercel Serverless Functions (Python) |
| AI 모델 | Google Gemini API (Vision 지원 모델, `gemini-1.5-flash`, 무료 티어) |
| 데이터 저장 | 브라우저 `localStorage` (게코 프로필/사진은 클라이언트에만 저장) |
| 배포 | GitHub + Vercel |
| 개발 도구 | VS Code, [Claude Code](https://claude.com/claude-code) (AI 코딩 도구) |

## 💻 로컬 실행 방법

이 프로젝트는 [Vercel CLI](https://vercel.com/docs/cli)의 `vercel dev`로 프론트엔드와 서버리스 함수를 함께 로컬 실행하도록 구성되어 있습니다.

```bash
# 1. Vercel CLI 설치 (최초 1회)
npm install -g vercel

# 2. Python 의존성 설치
pip install -r requirements.txt

# 3. 환경 변수 설정 (.env 파일, 아래 "환경 변수 설정" 참고)

# 4. 로컬 개발 서버 실행
vercel dev
```

실행 후 안내되는 로컬 주소(기본값 `http://localhost:3000`)로 접속하면 됩니다.

## 🔑 환경 변수 설정

모프 AI 분석 기능은 Google Gemini API 키가 있어야 동작합니다.

1. 프로젝트 루트에 `.env` 파일을 만들고 아래와 같이 키 이름만 설정합니다. (`.env`는 `.gitignore`에 포함되어 있어 저장소에 커밋되지 않습니다.)

   ```
   GEMINI_API_KEY=발급받은_API_키를_여기에_입력
   ```

2. Vercel에 배포할 때는 Vercel 프로젝트의 **Settings → Environment Variables**에 동일한 이름(`GEMINI_API_KEY`)으로 키 값을 등록해야 합니다. `.env` 파일은 배포 시 함께 올라가지 않습니다.

> ⚠️ 실제 API 키 값은 이 README나 저장소에 절대 커밋하지 마세요.

## 🧑‍💻 개발 과정

이 프로젝트는 VS Code와 AI 코딩 도구인 [Claude Code](https://claude.com/claude-code)를 활용해, 프론트엔드 뼈대 구성부터 Gemini API 연동, Vercel 배포까지 전 과정을 대화형으로 진행했습니다.

1. **정적 페이지 뼈대 구성** — "게코노트" 서비스 요구사항(홈 / 내 게코 등록·목록 / 모프 AI 분석 3메뉴, 모바일 반응형)을 전달해 순수 HTML/CSS/JS로 SPA 구조와 게코 등록·목록 CRUD(`localStorage` 기반)를 우선 구현했습니다. 이 단계의 모프 분석은 실제 AI 없이 사진 평균 색상을 비교하는 간이 데모 로직이었습니다.
2. **실제 AI 분석 백엔드 연동** — `api/analyze_morph.py`를 Vercel Serverless Function(Python)으로 작성해 Google Gemini API와 연결하고, 프론트엔드의 색상 비교 로직을 실제 `fetch('/api/analyze_morph')` 호출로 교체했습니다. 사진 미입력/외부 API 오류에 대한 사용자 친화적 에러 메시지도 함께 반영했습니다.
3. **Vercel 배포 및 트러블슈팅** — 배포 과정에서 아래와 같은 문제를 겪었고, Claude Code와 함께 원인을 하나씩 좁혀가며 해결했습니다.

### 🐛 겪었던 문제와 해결 과정

| 문제 | 원인 및 해결 |
| --- | --- |
| Windows에서 `vercel dev` 실행 시 경로 인코딩 오류 | 프로젝트 경로 문자열이 잘못 해석되며 로컬 서버가 뜨지 않음 → 프로젝트 폴더를 특수문자 없는 단순 경로로 이동해 해결 |
| `pyproject.toml` 설정 문제 | 처음에는 설정 파일 자체가 없어 Vercel이 Python 함수를 인식하지 못함 → `[project]`/의존성을 추가하며 `[tool.vercel] entrypoint`도 함께 넣었으나, 이 설정이 오히려 **모든 경로를 하나의 Python 함수로 캐치올 라우팅**시키는 부작용을 일으켜 루트(`/`)에서도 API 에러 메시지가 뜨는 문제로 재발 → 해당 설정을 제거하고, Vercel의 표준 규칙(`api/*.py` 파일 자동 인식)만으로 동작하도록 정리해 해결 |
| GitHub 저장소 비공개(Private)로 인한 배포 차단 | Vercel 무료 플랜에서 비공개 저장소 배포가 제한됨 → 저장소를 공개(Public)로 전환한 뒤 재배포해 해결 |
| `vercel.json` 라우팅 설정 문제 | 정적 파일(`index.html`, `css`, `js`)과 `/api/analyze_morph` 함수 라우팅이 충돌해 정적 파일이 정상 서빙되지 않음 → `vercel.json`에 `framework: null`과 `/api/analyze_morph` 전용 rewrite를 명시해 정적 파일과 API 함수 라우팅을 분리 (이 과정에서 빈 `functions` 설정으로 인한 배포 오류도 함께 수정) |
