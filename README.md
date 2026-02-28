# 네이버 블로그 포스터

마크다운으로 작성한 글을 네이버 블로그에 자동으로 포스팅하는 Windows 데스크톱 앱입니다.

## 주요 기능

- **마크다운 에디터** — 코드 하이라이팅 지원 에디터로 글 작성
- **실시간 미리보기** — 네이버 블로그에 올라갈 HTML을 실시간 확인
- **자동 포스팅** — 버튼 한 번으로 네이버 블로그에 자동 발행
- **계정 보안** — OS 보안 저장소(DPAPI)로 비밀번호 암호화 저장
- **세션 유지** — 한 번 로그인하면 브라우저 세션 캐시로 자동 로그인

## 기술 스택

- **Electron** + **electron-vite** — 데스크톱 앱 프레임워크
- **React 19** + **TypeScript** — UI
- **Tailwind CSS** — 스타일링
- **Playwright** — 네이버 블로그 자동화 (브라우저 제어)
- **CodeMirror** — 마크다운 에디터
- **marked** — 마크다운 → HTML 변환

## 요구사항

- Windows 10/11 (x64)
- **Google Chrome** 브라우저 설치 필수 (Playwright가 Chrome을 사용)

## 설치 및 실행

### 설치 파일로 실행

1. [Releases](../../releases)에서 `naver-blog-poster-x.x.x-setup.exe` 다운로드
2. 설치 프로그램 실행
3. 바탕화면 또는 시작 메뉴에서 "네이버 블로그 포스터" 실행

### 개발 모드

```bash
# 의존성 설치
pnpm install

# 개발 모드 실행 (HMR 지원)
pnpm dev
```

### 빌드

```bash
# 프로덕션 빌드
pnpm build

# Windows 설치 파일(.exe) 생성
pnpm build:win
```

빌드 결과물:
- `dist/naver-blog-poster-x.x.x-setup.exe` — 설치 프로그램
- `dist/win-unpacked/` — 포터블 버전 (설치 없이 실행 가능)

## 사용법

1. 앱 첫 실행 시 **네이버 아이디, 비밀번호, 블로그 ID** 입력
2. 마크다운으로 글 작성 (왼쪽 에디터)
3. 오른쪽 미리보기에서 결과 확인
4. 제목, 카테고리, 태그 입력
5. **"네이버에 포스팅"** 버튼 클릭
6. Chrome 브라우저가 열리며 자동으로 포스팅 진행

> 첫 로그인 시 캡차나 2단계 인증이 나타나면 120초 내에 수동으로 처리해주세요.

## 프로젝트 구조

```
src/
├── main/                    # Main Process (Node.js)
│   ├── index.ts             # BrowserWindow 생성
│   ├── ipc-handlers.ts      # IPC 핸들러 등록
│   ├── automation/          # Playwright 자동화
│   │   ├── browser-manager.ts  # 브라우저 관리
│   │   ├── naver-login.ts      # 네이버 로그인
│   │   ├── blog-poster.ts      # 블로그 포스팅
│   │   └── human-behavior.ts   # 봇 탐지 회피 딜레이
│   └── services/            # 데이터 저장
│       ├── credential-store.ts # 계정 정보 (암호화)
│       ├── settings-store.ts   # 앱 설정
│       └── markdown-converter.ts
├── preload/                 # Preload (contextBridge)
└── renderer/                # Renderer (React)
    └── src/
        ├── App.tsx
        ├── components/      # UI 컴포넌트
        └── hooks/           # 커스텀 훅
```

## 데이터 저장 위치

| 데이터 | 경로 |
|--------|------|
| 계정 정보 (암호화) | `%APPDATA%\naver-blog-poster\credentials.json` |
| 앱 설정 | `%APPDATA%\naver-blog-poster\config.json` |
| 브라우저 세션 | `%APPDATA%\naver-blog-poster\playwright-session\` |

## 삭제 방법

1. **프로그램 제거**: Windows 설정 → 앱 → "네이버 블로그 포스터" → 제거
2. **개인정보 삭제**: `%APPDATA%\naver-blog-poster\` 폴더 수동 삭제

## 라이선스

MIT
