# 괴수 사냥꾼 (beast-hunter) 작업 메모

모바일 가로 전용 2D 액션 RPG 웹게임. 빌드 없는 순수 ES 모듈이고 `dist/`를 정적 호스팅한다. 원래 OpenAI Codex "Sites" 환경에서 개발되어 Codex 전용 경로·환경변수 흔적이 많다.
답변·문서·커밋 메시지는 한국어로 쓴다.

## 저장소 성격 (2026-10-23 분석, 커밋 43d1196)
- Sites 저장 버전 166, 원본 커밋 90a0324의 **전체 내보내기**(Windows에서 추출). 원본 1,362개 파일, 약 643MB. 체크아웃 약 617MB.
- `SOURCE_MANIFEST.json`의 SHA-256과 대조하면 1,361개가 내용 일치. 빠진 것은 `.openai/hosting.json` 하나(정적 디렉터리를 dist로 지정하는 2줄 설정). 텍스트 602개는 줄바꿈(CRLF/LF)만 다르다.
- 코드·테스트·도구·문서는 자매 저장소 `Ashegyu/beast-hunter-motion`과 바이트 단위로 같다. 그쪽은 바이너리 어셋 업로드가 중단되어 실행 불가 상태이므로 **실제 작업은 이 저장소에서 한다.**
- 내보내기 때 추가된 파일: `serve-local.mjs`(127.0.0.1 전용 정적 서버, dist만 제공, Range 지원), `RUN_GAME.cmd`, `README_LOCAL.md`, `SOURCE_MANIFEST.json`, `LOCAL_VERIFICATION.json`, `LOCAL_TEST_RESULTS.txt`.

## 실행
- 게임: `PORT=8090 node serve-local.mjs` 후 `http://127.0.0.1:8090/` (기본 포트 8080). file:// 로는 안 된다.
- 헤드리스 확인: 전역 playwright(`/opt/node22/lib/node_modules/playwright`)를 createRequire로 불러 Chromium 실행. 844×390에서 거점 → 사냥터 → 전투 준비 → 전투까지 콘솔 오류·404 없이 동작 확인함.
- 테스트: `npm test` = `node --experimental-vm-modules --test tests/*.test.mjs` (약 55초). **776개 중 744 통과 / 32 실패** (원작자 기록과 동일).

## 실패 테스트 32건 (원인 확인됨)
1. **로직 변경 후 기대값 미갱신 9건**
   - 고대 드롭이 0으로 바뀜: ancient-boundaries:10, codex-replay:24
   - 고대 도감 60→75종: codex-replay:10
   - 신규 고대 15종 원화 프레임 없음: rarity-visuals:7
   - 9스테이지가 special(전원 skitter)로 바뀜: monsters065:15
   - strict 스테이지 이탈 시 totalKills 롤백: horde072:36
   - 카메라 세로 기준 .5→.6 (world.js:11): world.test:25/37/53
2. **lab 테스트 링커 13건** (ui.test.mjs:131~286): `lab.js:1`이 `./chapters.js?v=0.97.0`을 import하는데 링커(ui.test.mjs:96-100)가 쿼리 없는 경로만 허용.
3. **game-ui 그리기 크기 10건** (game-ui.test.mjs:724, 929, 969, 1032~1096, 1149): 캐릭터가 기대치의 약 2/3 크기로 그려짐(84≠126, 58.96≠88 등). 가로 화면 논리 폭을 1800으로 넓힌 변경(view-controls.js `viewportFor`, 기존 1200)이 원인으로 보이며 테스트는 예전 배율을 기대.

## 구조
- `dist/index.html` (389KB, 정적 DOM 3704 id, CSS 45개 순차 로드) → `menu-pages.js`, `app.js`.
- `dist/app.js` (207KB, 1469줄 압축형): UI 컨트롤러. DOM을 생성하지 않고 기존 노드 재사용. rAF `tick`(app.js:1078) → `game.advanceGame` → Canvas2D `draw()` + 매 프레임 DOM `updateHud()`. 화면 전환은 `modal()`(:887) 단일 오버레이 상태기계 + `campDrawer`, `navigateCamp()`(:1280).
- `dist/game-engine.js` (108KB, 허브): 순수 로직(DOM·저장소 없음). 다른 로직 모듈을 import하고, 시각 모듈(skill-vfx, skill-image-fx, monster-fx, combat-feedback, ultimate-video)과 combat-skills 등을 `export *`로 재노출.
- 로직 모듈: loot, equipment-progression/slots/synergies, crafting, chapters, battle-plans, battle-progress(정산 저널), dungeons, hunt-modes(난이도), combat-skills(35종), skill-motion, ancient-powers, unique-effects, build-effects(각인), profile-backup, world(카메라·좌표), terrain, motion.
- `engine.js` + `lab.html/lab.js`: 구형 모션 검사 도구(MOTION LAB). 실게임과 무관.
- `sound.js`: 오디오 파일 없이 WebAudio로 효과음 합성 (동시 10음).
- 어셋 로딩: `dist/assets/manifest.json`(클립 415개, png→webp `delivery` 매핑). 거점 3장 → 공유 전투 18장 → 지역별 4장(한 번에 한 지역만 상주). 폰트는 `dist/assets/fonts/`.
- CSS: 버전별로 파일을 뒤에 덧붙여 덮어쓰는 레이어 구조 → **로드 순서 = 우선순위**. `#game-shell` 접두 + `data-panel`/`data-camp-view`/`data-phase` 속성 선택자. `!important` 약 900개 + index.html 인라인 474개(tools/apply-common-ui-v2.py가 주입). 세로용 규칙 다수는 가로 전용 전환 뒤 사실상 죽은 코드.
- `art/`: 원화 원본, 생성 프롬프트, 검수 자료. `tools/reports/`: 버전별 측정·검수 결과(394개).

## 버전 표기
- README 0.97.0, `index.html`은 `app.js?v=0.103.1`, 모듈 import 쿼리는 0.70~0.99 혼재, `PROFILE_VERSION=13`(README는 v11이라 적음). 코드가 문서보다 앞서 있다. README_LOCAL은 폴더 이름 때문에 "Alpha 0.45"라고 부른다.
- 파일명 버전: 점 제거(063=0.63, 0844=0.84.4, v0970=0.97.0, v01002=0.100.2). 단 alpha09/alpha091은 0.9/0.9.1.

## 게임 규칙 요약
- 캐릭터: 리리안 1명(검사, 엔진 역할 ID는 hunter). 3챕터(붉은 숲/망자의 폐성/서리 왕좌, 보스 780/1280/1900 HP) × 10스테이지 × 난이도 3(일반/정예/악몽: HP ×1/1.5/2.2).
- 스테이지 60초 제한. 1~9는 웨이브 3개, 10은 보스 단독. 4·9 special, 8 elite, 10 boss. 동시 적 최대 32.
- `advanceGame`: dt ≤0.1s, 0.025s 고정 서브스텝. RNG는 LCG 5개 스트림(전투·전리품·재료·재련·승급), `Math.random` 미사용 → 결정적.
- 장비 9칸(무기, 헬멧·상의·하의·신발, 목걸이·귀걸이×2, 전용). 등급 0일반~4신화, 5고대, 6제작. 강화 상한 5/10/15/20/30/40/50, 구간별 보장(10/20/30회), 고대 +30 이상 실패 보정, 제작 +40 이상 보장 없음. 승급은 최대 강화 후 +0으로.
- 저장: localStorage `beast-hunter:profile:v1` (+ `:recovery`, `:before-restore`, `:sound`). 엔진은 v1~13 수용, 범위 밖이면 새 프로필(앱이 원본을 :recovery에 보관). 백업 형식 `beast-hunter-backup` v1, FNV-1a, 256KB. 저장은 호스트·포트별이라 포트를 바꾸면 진행이 안 보인다.
- strict(normal이 아닌) 스테이지는 체크포인트 → 실패/이탈 시 롤백, 클리어 시 `confirmSettlement`로 2단계 정산.

## 알려진 문제 (코드에서 확인)
- `makeItem`(game-engine.js:471)이 등급·출처·보스 인자를 무시하고 항상 일반 등급 생성 → DROP_TABLES, BOSS_DROP_TABLES, 고대 드롭, minimumRarity, legendaryPity가 사실상 죽은 코드. (README 0.97의 "스테이지는 일반만 드롭" 의도와는 일치)
- 제작 재료 `origin`(무명의 기원)이 보스 처치당 0.001%뿐 → README의 "현재 제작 가능"과 달리 제작이 사실상 불가능 (crafting.js:12).
- game-engine.js:774 `q.ancientSpec.ancient.signature`는 제작 장비에서 null 접근 위험(현재 미발생).
- `s.encounters/caches/nodes`를 채우는 코드 없음 → interact·상자·그룹 어그로 로직이 죽어 있음. `flow==='break'` 설정처 없음.
- 챕터 수 3이 여러 곳 하드코딩 (game-engine.js:117,123,579, battle-plans.js:30, terrain.js:18, profile-backup.js:12).
- world.js가 `?v=` 유무 차이로 두 번 로드됨 (app.js:8 vs 나머지). 테스트에선 game-engine.js도 이중 로드.
- app.js:1380 스킬 아이콘 `img.src`를 매 프레임 재대입. `updateHud`가 매 프레임 getElementById 수백 회.
- app.js:139 로드 실패 메시지가 실제 요청(.webp)이 아닌 원래 .png 이름을 표시.
- 궁극기 영상(mp4)·컷인은 테스트에서만 쓰이고 런타임에는 연결되지 않음. 신규 고대 15종 원화 없음.

## tools/
- 63개 스크립트: benchmark-*, measure-*.mjs/.py, render-*, review-*, pack-*.py, optimize-*.py, create-*-report.py, simulate-*.
- 렌더/리뷰 계열은 `CODEX_PRIMARY_RUNTIME_NODE_MODULES` 환경변수의 `@napi-rs/canvas`에 의존 → 이 환경에선 실행 불가. 다수가 저장소에 없는 기준 커밋 SHA를 `git show`로 참조. atlas 측정 .py는 scipy 필요(미설치).
- 저장소 루트에서 실행 가능: `simulate-stage-b`, `simulate-stage-c`, `measure-skills049/054`, `benchmark-replays`.
- `prepare-stage-c-qa.py:5`는 `app.js?v=0.99.0`을 치환하려 해 현재 무동작이며 dist/에 QA 파일을 직접 쓴다(배포 위험). `qa-skills.html`은 `qa-codex.html`의 복사본.

## 문서
- README.md (206KB): 버전별 변경 기록, 최신이 맨 위. 각 절에 검증 내용과 `tools/reports/` 증빙 경로.
- GAME_DESIGN.md / PERFORMANCE.md / ANIMATION_ASSETS.md: 최신 기준이 위, 아래는 과거 기록. 옛 규칙과 충돌하면 위쪽이 현재 기준.
