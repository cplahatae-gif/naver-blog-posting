# 네이버 블로그 마크다운 자동 포스팅 데스크톱 앱

## Context

마크다운으로 작성한 글을 네이버 블로그에 자동으로 포스팅하는 Electron 데스크톱 앱을 만든다.
네이버 블로그 공식 글쓰기 API(OpenAPI, XML-RPC 모두)는 2020년 5월에 종료되었으므로,
**Playwright 브라우저 자동화**로 네이버 블로그 글쓰기 페이지를 직접 조작하는 방식을 사용한다.

> **주의**: 네이버가 2025년부터 봇 탐지를 강화하고 있어, 랜덤 딜레이/자연스러운 입력 패턴 등
> 탐지 회피 로직이 필수이며, 과도한 사용 시 계정 제재 위험이 있음

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | **Electron + electron-vite** | Main/Preload/Renderer 3분할 빌드 |
| UI | **React 19 + TypeScript + Tailwind CSS 4** | |
| 마크다운 에디터 | **@uiw/react-codemirror + @codemirror/lang-markdown** | CodeMirror 6 기반 |
| 마크다운 파서 | **marked** | 커스텀 렌더러로 네이버 호환 HTML 생성 |
| 브라우저 자동화 | **playwright-core** | persistent context로 세션 유지 |
| 설정 저장 | **electron-store** | JSON 기반, 스키마 검증 |
| 자격증명 암호화 | **Electron safeStorage** | Windows DPAPI 활용, 별도 의존성 없음 |
| 패키지 매니저 | **pnpm** | |
| 패키징 | **electron-builder** | Windows NSIS 인스톨러 |

---

## 프로젝트 구조

```
naver-blog-poster/
├── electron.vite.config.ts
├── package.json
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── tailwind.config.ts
├── resources/                        # 앱 아이콘
├── src/
│   ├── main/                         # Main Process (Node.js)
│   │   ├── index.ts                  # 앱 진입점, BrowserWindow 생성
│   │   ├── ipc-handlers.ts           # IPC 핸들러 등록
│   │   ├── automation/
│   │   │   ├── browser-manager.ts    # Playwright 인스턴스/세션 관리
│   │   │   ├── naver-login.ts        # 네이버 로그인 자동화
│   │   │   ├── blog-poster.ts        # 블로그 글쓰기 자동화 (핵심)
│   │   │   ├── human-behavior.ts     # 봇 탐지 회피 유틸
│   │   │   └── types.ts
│   │   ├── services/
│   │   │   ├── credential-store.ts   # safeStorage 기반 암호화 저장
│   │   │   ├── settings-store.ts     # electron-store 설정 관리
│   │   │   └── markdown-converter.ts # 마크다운 → 네이버 호환 HTML
│   │   └── utils/
│   │       └── logger.ts
│   ├── preload/                      # Preload (Bridge)
│   │   ├── index.ts                  # contextBridge API 노출
│   │   └── index.d.ts
│   └── renderer/                     # Renderer (React 앱)
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── components/
│           │   ├── Editor/           # MarkdownEditor, HtmlPreview, EditorToolbar
│           │   ├── PostForm/         # TitleInput, CategorySelect, TagInput, PostActions
│           │   ├── Settings/         # SettingsDialog, AccountForm
│           │   ├── Status/           # StatusBar, AutomationLog
│           │   └── Layout/           # AppLayout
│           ├── hooks/                # useMarkdown, usePosting, useSettings, useAutomationStatus
│           ├── types/
│           └── styles/globals.css
├── electron-builder.yml
```

---

## 프로세스 역할 분리

- **Main Process**: Playwright 실행, 자격증명 암복호화, 마크다운→HTML 변환, IPC 핸들링
- **Preload**: contextBridge로 최소한의 API만 Renderer에 노출 (보안 격리)
- **Renderer**: UI 렌더링, 사용자 입력 수집, 자동화 상태 표시

---

## UI 레이아웃

```
+------------------------------------------------------------------+
|  [앱 제목]                                    [설정] [최소화/닫기] |
+------------------------------------------------------------------+
|  제목: [_____________________________]                            |
|  카테고리: [드롭다운 v]   태그: [태그1] [태그2] [+입력]            |
+------------------------------------------------------------------+
|                        |                                          |
|   마크다운 에디터       |          HTML 미리보기                   |
|   (CodeMirror)         |          (실시간 렌더링)                  |
|                        |                                          |
+------------------------------------------------------------------+
|  [상태: 준비 완료]  [로그인: ●]               [네이버에 포스팅 ▶]  |
+------------------------------------------------------------------+
```

포스팅 진행 시 → 프로그레스 오버레이로 단계별 상태 표시

---

## 핵심 모듈 설계

### 1. 마크다운 → 네이버 호환 HTML 변환기 (`markdown-converter.ts`)

`marked`의 **커스텀 렌더러**로 네이버 스마트에디터가 인식하는 HTML 구조 생성:

| 마크다운 | 변환 결과 |
|----------|-----------|
| `# 제목` | `<div class="se-module se-module-text"><p class="se-text-paragraph" style="font-size:32px"><b>제목</b></p></div>` |
| `**굵게**` | `<b>텍스트</b>` |
| 코드 블록 | `<div class="se-module se-module-code"><pre><code>...</code></pre></div>` |
| `![alt](url)` | `<div class="se-module se-module-image"><img src="url" /></div>` |
| 일반 문단 | `<div class="se-module se-module-text"><p class="se-text-paragraph">텍스트</p></div>` |

- 클래스명 매핑을 설정 파일로 분리 → 네이버 구조 변경 시 앱 업데이트 없이 대응 가능

### 2. Playwright 자동화 엔진

#### 브라우저 관리 (`browser-manager.ts`)
- `chromium.launchPersistentContext()` 사용 → 로그인 세션 자동 유지
- **headless: false** 필수 (네이버 headless 탐지)
- 사용자 PC Chrome이 있으면 `channel: 'chrome'` 우선 사용 (자연스러운 UA, 탐지 회피 유리)
- Chrome 없으면 Playwright Chromium을 `app.getPath('userData')` 하위에 다운로드
- `--disable-blink-features=AutomationControlled` 플래그로 자동화 감지 차단

#### 네이버 로그인 (`naver-login.ts`)
1. persistent context로 기존 세션 확인 → 로그인 상태면 스킵
2. 로그인 필요 시: **클립보드 붙여넣기 방식** (Ctrl+V)으로 ID/PW 입력
   - `page.type()`이나 `page.fill()`은 탐지되므로 사용하지 않음
3. 캡차/2FA 발생 시: headful 모드이므로 사용자가 직접 처리, 앱 UI에 "수동 확인 필요" 알림
4. `page.waitForNavigation({ timeout: 120000 })`으로 수동 처리 대기

#### 블로그 글쓰기 (`blog-poster.ts`) — **가장 핵심**
```
1. https://blog.naver.com/{blogId}/postwrite 접속
2. 팝업 처리 ("작성 중인 글이 있습니다" 등)
3. iframe 전환: page.frameLocator('#mainFrame')
4. 제목 입력 (humanType 적용)
5. 본문 HTML 입력 — 클립보드 HTML 붙여넣기 (text/html MIME)
   - 실패 시 폴백: JS evaluate()로 innerHTML 직접 설정
   - 최후 수단: 단락별 순차 타이핑
6. 외부 URL 이미지: 임시 다운로드 → 클립보드 복사 → 붙여넣기
7. 카테고리 드롭다운 선택
8. 태그 입력 (각 태그 사이 랜덤 딜레이)
9. "발행" 버튼 클릭 → 발행 설정 확인 → 최종 발행
10. 발행된 글 URL 반환
```

#### 봇 탐지 회피 (`human-behavior.ts`)
- 가우시안 분포 기반 랜덤 딜레이 (균일 분포보다 자연스러움)
- 문자별 랜덤 타이핑 속도 (50-200ms, 5% 확률로 300-500ms 긴 멈춤)
- 클릭 전 Bezier 곡선 마우스 이동, 좌표 오프셋
- 각 주요 동작 사이 1-5초 랜덤 딜레이

### 3. 설정 관리
- **자격증명**: `safeStorage.encryptString(password)` → Base64 인코딩 → electron-store에 저장
- **일반 설정**: 블로그 URL, 기본 카테고리/태그, 딜레이 범위, 에디터 테마 등

---

## IPC 통신 채널

| 방향 | 채널 | 용도 |
|------|------|------|
| Renderer→Main | `posting:start` | 포스팅 시작 (title, markdown, category, tags) |
| Renderer→Main | `posting:cancel` | 진행 중 취소 |
| Renderer→Main | `auth:login-test` | 로그인 상태 확인 |
| Renderer→Main | `settings:get/set` | 설정 읽기/쓰기 |
| Renderer→Main | `credential:save/get` | 자격증명 저장/확인 |
| Renderer→Main | `markdown:convert` | HTML 변환 미리보기 |
| Renderer→Main | `category:fetch` | 카테고리 목록 조회 |
| Main→Renderer | `posting:status` | 자동화 진행 상태 (step, progress, message) |
| Main→Renderer | `posting:manual-required` | 캡차/2FA 수동 처리 알림 |

---

## 보안 설정

- `contextIsolation: true` + `sandbox: true` + `nodeIntegration: false`
- 비밀번호는 Main Process에서만 복호화, Renderer에는 `hasPassword` 플래그만 전달
- Playwright 세션 데이터: `app.getPath('userData')` 하위, "세션 초기화" 버튼 제공

---

## 구현 단계

### Phase 1: 프로젝트 기반 구축
1. `pnpm create @electron-vite/app naver-blog-poster --template react-ts`
2. Tailwind CSS 4 설정
3. Main/Preload/Renderer IPC 통신 프레임워크
4. electron-store + safeStorage 기반 설정/자격증명 관리
5. 기본 AppLayout UI

### Phase 2: 에디터 및 변환기
6. CodeMirror 마크다운 에디터 통합
7. marked 커스텀 렌더러로 네이버 호환 HTML 변환기
8. 실시간 미리보기 연동
9. 제목/카테고리/태그 입력 UI

### Phase 3: Playwright 자동화 엔진
10. browser-manager.ts (Playwright persistent context)
11. naver-login.ts (클립보드 방식 로그인, 캡차/2FA 대응)
12. blog-poster.ts (iframe 전환, 본문 입력, 발행)
13. human-behavior.ts (봇 탐지 회피)
14. 오류 처리 및 복구 로직

### Phase 4: 통합 및 완성
15. 자동화 진행 상태 실시간 표시 (프로그레스 오버레이)
16. 외부 URL 이미지 처리 (다운로드 → 붙여넣기)
17. 전체 E2E 테스트

### Phase 5: 패키징
18. electron-builder 설정 (Windows NSIS)
19. Playwright 브라우저 번들링 (사용자 Chrome 우선 → 없으면 다운로드)

---

## 검증 방법

1. **마크다운 변환 테스트**: 다양한 마크다운 문법(제목, 리스트, 코드블록, 이미지, 인용, 표) → 네이버 호환 HTML이 올바르게 생성되는지 단위 테스트
2. **로그인 테스트**: 실제 네이버 계정으로 로그인 성공/실패/캡차 시나리오 확인
3. **포스팅 E2E 테스트**: 테스트용 블로그에 실제 글 발행 후, 발행된 글의 제목/본문/이미지/태그가 원본 마크다운과 일치하는지 확인
4. **봇 탐지 테스트**: 연속 3-5회 포스팅 시 계정 제재 없이 정상 동작하는지 확인
5. **빌드 테스트**: electron-builder로 Windows 인스톨러 생성 → 클린 환경에서 설치/실행 확인

---

## 주요 리스크

| 리스크 | 대응 |
|--------|------|
| 네이버 에디터 DOM 변경 | 선택자를 설정 파일로 분리, 업데이트 가능하게 |
| 봇 탐지 계정 제재 | human-behavior 고도화, 사용 빈도 제한 |
| 클립보드 HTML 붙여넣기 실패 | JS 직접 조작 → 단락별 타이핑 폴백 체인 |
| Playwright 번들 크기 (300MB+) | 사용자 Chrome 우선 활용, 필요시만 다운로드 |
