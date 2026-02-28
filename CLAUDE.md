# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 규칙

- 응답, 코드 주석, 커밋 메시지, 문서: 한국어
- 변수명/함수명: 영어
- 들여쓰기: 2칸
- TypeScript, React, Tailwind CSS 사용

## 개발 명령어

```bash
pnpm dev          # 개발 모드 (Vite HMR + Electron)
pnpm build        # 프로덕션 빌드 (main + preload + renderer)
pnpm build:win    # Windows NSIS 인스톨러 생성
```

## 아키텍처

Electron 3-프로세스 구조 (electron-vite 5 기반):

```
Main Process (src/main/)          ← Node.js, Playwright, electron-store
    ↕ IPC (ipcMain.handle / webContents.send)
Preload (src/preload/)            ← contextBridge로 window.api 노출
    ↕ window.api (타입: src/preload/index.d.ts)
Renderer (src/renderer/src/)      ← React 19 + Tailwind CSS
```

**Main Process** (`src/main/`):
- `index.ts` — BrowserWindow 생성, `contextIsolation: true` + `sandbox: true`
- `ipc-handlers.ts` — 모든 IPC 핸들러 등록 (posting, settings, auth, markdown)
- `automation/` — Playwright 기반 네이버 블로그 자동화
  - `browser-manager.ts` — persistent context 관리, 사용자 Chrome 우선 사용
  - `naver-login.ts` — 클립보드 방식 로그인, 120초 캡차/2FA 대기
  - `blog-poster.ts` — 7단계 포스팅 워크플로우 (iframe 전환, HTML 붙여넣기, 발행)
  - `human-behavior.ts` — 가우시안 랜덤 딜레이, 자연스러운 타이핑/클릭
- `services/` — credential-store (safeStorage 암호화), settings-store, markdown-converter (marked 커스텀 렌더러)

**Preload** (`src/preload/`):
- `index.d.ts`가 `ElectronAPI` 인터페이스 정의 → Renderer에서 `window.api.*` 타입 안전하게 사용
- invoke 패턴 (요청-응답) + on 패턴 (실시간 상태 업데이트)

**Renderer** (`src/renderer/src/`):
- 커스텀 훅: `useMarkdown` (300ms 디바운스 변환), `usePosting` (상태+취소), `useSettings` (설정+자격증명)
- 경로 별칭: `@` → `src/renderer/src`

## IPC 채널

| 채널 | 방향 | 용도 |
|------|------|------|
| `posting:start/cancel` | R→M | 포스팅 시작/취소 |
| `posting:status` | M→R | 실시간 진행 상태 |
| `settings:get/set` | R→M | 앱 설정 |
| `credential:save/get` | R→M | 자격증명 (PW는 Main에서만 복호화) |
| `markdown:convert` | R→M | 마크다운 → 네이버 호환 HTML |
| `auth:login-test` | R→M | 로그인 상태 확인 |

## 빌드 설정 주의사항

- `electron-store`는 ESM 전용 → `externalizeDepsPlugin({ exclude: ['electron-store'] })`로 번들에 포함
- `playwright-core`는 external로 유지 (node_modules에서 직접 로드)
- Tailwind 스캔 경로: `src/renderer/src/**/*.{js,ts,jsx,tsx}`

## 네이버 블로그 자동화 핵심

- 공식 API 없음 (2020년 종료) → Playwright 브라우저 자동화만 가능
- 글쓰기 페이지는 `#mainFrame` iframe 안에 있음 → `frameLocator()` 필수
- 본문 입력: 클립보드 HTML 붙여넣기 → 실패 시 JS DOM 조작 폴백
- 네이버 선택자(`.se-module`, `.se-text-paragraph` 등)는 업데이트로 변경 가능 → `blog-poster.ts` 수정 필요
- 봇 탐지 회피: headful 모드, `--disable-blink-features=AutomationControlled`, 가우시안 랜덤 딜레이
