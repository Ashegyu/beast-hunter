# 괴수 사냥꾼 (beast-hunter) 작업 메모

모바일 가로 전용 2D 액션 RPG 웹게임. 빌드 없는 순수 ES 모듈이고 `dist/`를 정적 호스팅한다. 원래 OpenAI Codex "Sites" 환경에서 개발되어 Codex 전용 경로·환경변수 흔적이 많다.
답변·문서·커밋 메시지는 한국어로 쓴다.

## 저장소 성격 (2026-10-23 분석, 커밋 43d1196 기준)
- Sites 저장 버전 166, 원본 커밋 90a0324의 **전체 내보내기**(Windows에서 추출). 원본 1,362개 파일, 약 643MB. 체크아웃 약 617MB.
- `.openai/`는 .gitignore로 일부러 제외되어 있다(호스팅 설정 2줄). 커밋하지 않는다.
- `SOURCE_MANIFEST.json`의 SHA-256과 대조하면 1,361개가 내용 일치. 빠진 것은 `.openai/hosting.json` 하나(정적 디렉터리를 dist로 지정하는 2줄 설정). 텍스트 602개는 줄바꿈(CRLF/LF)만 다르다.
- 코드·테스트·도구·문서는 자매 저장소 `Ashegyu/beast-hunter-motion`과 바이트 단위로 같다. 그쪽은 바이너리 어셋 업로드가 중단되어 실행 불가 상태이므로 **실제 작업은 이 저장소에서 한다.**
- 내보내기 때 추가된 파일: `serve-local.mjs`(127.0.0.1 전용 정적 서버, dist만 제공, Range 지원), `RUN_GAME.cmd`, `README_LOCAL.md`, `SOURCE_MANIFEST.json`, `LOCAL_VERIFICATION.json`, `LOCAL_TEST_RESULTS.txt`.

## 실행
- 게임: `PORT=8090 node serve-local.mjs` 후 `http://127.0.0.1:8090/` (기본 포트 8080). file:// 로는 안 된다.
- 헤드리스 확인: 전역 playwright(`/opt/node22/lib/node_modules/playwright`)를 createRequire로 불러 Chromium 실행. 844×390에서 거점 → 사냥터 → 전투 준비 → 전투까지 콘솔 오류·404 없이 동작 확인함.
- 테스트: `npm test` = `node --experimental-vm-modules --test tests/*.test.mjs` (약 70초). **782/782 통과** (0.105 기준).

## 테스트 작성 시 주의 (0.103.2에서 정리한 내용)
- 고대 장비는 0.97부터 레이드 전용 → 스테이지 보스는 고대를 떨어뜨리지 않음. 고대 카탈로그는 75종(신규 부위 15종은 고대 전용 원화 없음).
- 9스테이지는 밀집 공세(전원 skitter), strict 스테이지(4·8·9·10)는 이탈 시 처치 수·전리품까지 롤백. 서리 지역(21~30장) 보스는 70%·35%에서 호위대 소환.
- 카메라는 플레이어를 화면 높이 60%에 둠(world.js). 가로 화면 논리 폭은 1800(view-controls.js `viewportFor`)이고 캔버스에 축소해 그림.
- 서 있는 캐릭터는 화면 세로 위치에 따라 0.86~1.1배(app.js `sceneDepthScale`, 플레이어 위치에서 1.0).
- tests/game-ui.test.mjs 앞부분의 `appView/appScale/appCamera/appDepth/clientAt` 도우미가 app.js의 화면 변환을 그대로 재현한다. 화면 좌표 테스트는 이것을 쓴다.
- lab 테스트 링커는 `?v=` 쿼리를 잘라 처리한다.
- 0.105부터 챕터 30개: 1~10 붉은 숲, 11~20 망자의 폐성, 21~30 서리 왕좌. 챕터 2·3도 붉은 숲이므로 지역(몬스터·원화·보스 규칙)을 시험할 때는 1·11·21장을 쓴다. 진행 배열(stageProgress·bossMastery·difficultyProgress)은 길이 30이라 기대값은 `g.STAGES.map(...)`으로 만든다.
- game-ui.test.mjs의 `widen(p)`는 옛 3챕터 진행 기록을 1·11·21장 기준으로 옮기고, `pickChapter(ui,id)`는 지역 탭과 ‹ › 버튼으로 챕터를 고른다. `stage-1~3` 버튼은 이제 지역 탭이다.
- 0.104부터 실제 사냥은 항상 자동(`state.auto=true`). 이동·공격·마우스 조준으로 캐릭터를 조종해야 하는 그림/입력 테스트는 `host({manual:true})`로 검수용 수동 경로를 켠다. 실제 동작 검증은 manual 없이 쓴다.

## 구조
- `dist/index.html` (389KB, 정적 DOM 3704 id, CSS 45개 순차 로드) → `menu-pages.js`, `app.js`.
- `dist/app.js` (207KB, 1469줄 압축형): UI 컨트롤러. DOM을 생성하지 않고 기존 노드 재사용. rAF `tick`(app.js:1078) → `game.advanceGame` → Canvas2D `draw()` + 매 프레임 DOM `updateHud()`. 화면 전환은 `modal()`(:887) 단일 오버레이 상태기계 + `campDrawer`, `navigateCamp()`(:1280).
- `dist/game-engine.js` (108KB, 허브): 순수 로직(DOM·저장소 없음). 다른 로직 모듈을 import하고, 시각 모듈(skill-vfx, skill-image-fx, monster-fx, combat-feedback, ultimate-video)과 combat-skills 등을 `export *`로 재노출.
- 로직 모듈: loot, equipment-progression/slots/synergies, crafting, chapters, battle-plans, battle-progress(정산 저널), dungeons, hunt-modes(난이도), combat-skills(35종), skill-motion, ancient-powers, unique-effects, build-effects(각인), profile-backup, world(카메라·좌표), terrain, motion.
- `engine.js` + `lab.html/lab.js`: 구형 모션 검사 도구(MOTION LAB). 실게임과 무관.
- `sound.js`: 오디오 파일 없이 WebAudio로 효과음 합성 (동시 10음).
- 어셋 로딩: `dist/assets/manifest.json`(클립 415개, png→webp `delivery` 매핑). 거점 3장 → 공유 전투 18장 → 지역별 4장(한 번에 한 지역만 상주). 폰트는 `dist/assets/fonts/`.
- CSS: 버전별로 파일을 뒤에 덧붙여 덮어쓰는 레이어 구조 → **로드 순서 = 우선순위**. 끝에서 두 번째는 `layout-fit.css`(0.103.2, 한 화면 맞춤 규칙 모음, 0.105 지도 챕터 넘김 버튼 포함), 마지막은 `combat-auto.css`(0.104, 자동 전투 HUD: 상태 창 9분할 테두리, 하단 스킬 줄, 스킬 자동/수동 버튼). 새 화면 맞춤 수정은 여기에 화면별 주석과 함께 추가한다. `#game-shell` 접두 + `data-panel`/`data-camp-view`/`data-phase` 속성 선택자. `!important` 약 900개 + index.html 인라인 474개(tools/apply-common-ui-v2.py가 주입). 세로용 규칙 다수는 가로 전용 전환 뒤 사실상 죽은 코드.
- `art/`: 원화 원본, 생성 프롬프트, 검수 자료. `tools/reports/`: 버전별 측정·검수 결과(394개).

## 버전 표기
- README는 0.103.2부터 다시 최신(그 사이 0.98~0.103.1 기록은 없음), `index.html`은 `app.js?v=0.105.0`, 모듈 import 쿼리는 0.70~0.105 혼재(0.105에서 바꾼 모듈과 그 import 사슬은 `?v=0.105.0`), `PROFILE_VERSION=14`(0.105, 진행 배열 30칸). 코드가 문서보다 앞서 있다. README_LOCAL은 폴더 이름 때문에 "Alpha 0.45"라고 부른다.
- 파일명 버전: 점 제거(063=0.63, 0844=0.84.4, v0970=0.97.0, v01002=0.100.2). 단 alpha09/alpha091은 0.9/0.9.1.

## 게임 규칙 요약
- 전투(0.104): 이동·공격·회피는 항상 자동(engine `autoInput`). 파쇄(Q, `thunder`)는 UI·자동 전투에서 제거(엔진 함수는 남음). 스킬만 자동/수동 선택: 앱이 `input.skillMode`('auto'|'manual')를 넘기고, 수동이면 탭한 스킬을 `input.skillRequest`로 3초간 예약해 다음 공격 틈에 시전. 선택은 localStorage `beast-hunter:skill-mode`. 연격 3타는 원래 수치(피해 1.85배, 방어 38). 중갑은 유지하고 4스테이지 장갑 55%로 **대응 스킬 필수 구간**(사용자 결정): 마지막 검끝 패시브 장착 시 연격(`swing.damage` 있는 타격)이 장갑 무시 + 3타 방어 +62(`FINISHER_GUARD_BONUS`), 파갑참은 방어를 `breachGuardShatter(rank)`만큼 먼저 깎아 강타 65와 합쳐 한 번에 부수고 주변 260 장갑 8초 해제(`BREACH_ARMOR`, `e.plateBrokenUntil`), autoSkill이 방어·장갑 남은 적에게 우선 사용. 스테이지 규칙 `required:true`면 힌트 뒤에 '필요'(아니면 '유리').
- 성장(0.105): 레벨 상한 `MAX_LEVEL=100`. `xpNeeded`=Lv.10 전 300+250×레벨, 이후 3000+6×(레벨-10). 일반 챕터 하나가 약 1만 경험치 → 정비 진행 시 챕터 끝 Lv.8~9(1장) / 37~38(10장) / 68~70(20장) / 99~100(30장). 적월난무 각성은 Lv.50, 마지막 검끝 해금 Lv.3. 레벨·수치 조정은 정비(강화·승급 포함)+체크포인트 재도전+막히면 앞 스테이지 1회 파밍을 흉내 낸 30챕터 시뮬레이션(시드 3개, 시드당 약 2분)으로 확인한다(strict 스테이지 실패는 경험치도 롤백되므로 같은 곳만 반복하면 레벨이 안 오른다). 현재 결과: 30장까지 클리어, 실패는 1~10장·24~30장의 4스테이지에 몰리고 11~23장은 거의 첫 도전 통과.
- 캐릭터: 리리안 1명(검사, 엔진 역할 ID는 hunter). 30챕터(chapters.js `THEMES` 3개 × 10, 챕터마다 이름·보스 칭호) × 10스테이지 × 난이도 3(일반/정예/악몽: HP ×1/1.5/2.2). 적 배수 `chapterMultiplier`=1+0.13×(챕터-1)(30장 ×4.77), 보스 HP=780×배수×지역 보정(1/1.13/1.22)×지역 마지막 챕터 1.15, 보스 골드 90×배수, 보스 핵 `bossCores`=ceil(챕터/5)+난이도 보너스. 지형·몬스터·보스 규칙·장비/재료 티어·manifest의 chapters/monsterEffects 키는 챕터의 `theme`(1~3)을 쓴다. 지역 어셋 상주 단위는 챕터 id(같은 지역끼리는 이미 받은 그림을 재사용). 던전은 1·11·21장에 속한다.
- 스테이지 60초 제한. 1~9는 웨이브 3개, 10은 보스 단독. 4·9 special, 8 elite, 10 boss. 동시 적 최대 32.
- `advanceGame`: dt ≤0.1s, 0.025s 고정 서브스텝. RNG는 LCG 5개 스트림(전투·전리품·재료·재련·승급), `Math.random` 미사용 → 결정적.
- 장비 9칸(무기, 헬멧·상의·하의·신발, 목걸이·귀걸이×2, 전용). 등급 0일반~4신화, 5고대, 6제작. 강화 상한 5/10/15/20/30/40/50, 구간별 보장(10/20/30회), 고대 +30 이상 실패 보정, 제작 +40 이상 보장 없음. 승급은 최대 강화 후 +0으로.
- 저장: localStorage `beast-hunter:profile:v1` (+ `:recovery`, `:before-restore`, `:sound`). 엔진은 v1~14 수용(v13 이하의 1~3장 진행은 새 1~3장으로), 범위 밖이면 새 프로필(앱이 원본을 :recovery에 보관). 백업 형식 `beast-hunter-backup` v1, FNV-1a, 256KB. 저장은 호스트·포트별이라 포트를 바꾸면 진행이 안 보인다.
- strict(normal이 아닌) 스테이지는 체크포인트 → 실패/이탈 시 롤백, 클리어 시 `confirmSettlement`로 2단계 정산.

## UI 레이아웃 원칙과 함정
- 메뉴는 스크롤 없이 한 화면에 들어가야 한다(사용자 요청). 목록이 넘치면 페이지 넘김(가방·스킬·도감 방식)이나 격자 재배치로 해결한다.
- 검수 해상도: 844×390, 915×412, 667×375, 568×320, 900×405. 높이 360px 이하는 `@media(max-height:360px)` 블록에서 보조 문구를 숨기고 행 높이를 줄인다.
- `common-ui-v2.css`가 `[data-common-skin][data-common-skin]`에 `position:relative`를 강제한다. 스킨 붙은 요소를 덮개(absolute)로 띄우려면 같은 이중 속성 선택자로 덮어써야 한다.
- 스킨 붙은 버튼의 `:before` 장식은 절대 위치라서, 버튼을 `position:static`으로 바꾸면 장식이 부모 전체를 덮는다. 위치를 풀 때는 `relative`+`left/bottom:auto`를 쓴다.
- 공통 스킨 테두리 원화(`assets/common-ui-v2/empty_skins/button_base_ornate_dark.png`)는 바깥에 투명 여백이 있다. 바탕색을 칠할 때는 테두리 안쪽(좌우 3px, 위아래 2px)으로 줄여야 테두리 밖으로 색이 새지 않는다(layout-fit.css의 빨간 스킨 규칙 참고).
- 홈 왼쪽 메뉴 아이콘은 `lobby-reference-v0920.webp` 시안 전체에서 잘라 쓰며 원본에 글자가 박혀 있어 clip-path로 아래를 잘라야 한다.
- 장비 화면 귀걸이 2 칸 옆 검은 모루는 배경 원화의 일부다(버그 아님).
- 자동 레이아웃 점검: 저장 프로필을 만들어 localStorage에 넣고 Playwright로 각 화면을 돌며 화면 밖 버튼·가림·글자 잘림·스크롤 영역을 측정했다. 접힌 `<details>` 내용과 2px로 접어 둔 예전 버튼(#codex-back, #inventory-note)은 오탐이다.

## 알려진 문제 (코드에서 확인)
- `makeItem`(game-engine.js:471)이 등급·출처·보스 인자를 무시하고 항상 일반 등급 생성 → DROP_TABLES, BOSS_DROP_TABLES, 고대 드롭, minimumRarity, legendaryPity가 사실상 죽은 코드. (README 0.97의 "스테이지는 일반만 드롭" 의도와는 일치)
- 제작 재료 `origin`(무명의 기원)이 보스 처치당 0.001%뿐 → README의 "현재 제작 가능"과 달리 제작이 사실상 불가능 (crafting.js:12).
- `s.encounters/caches/nodes`를 채우는 코드 없음 → interact·상자·그룹 어그로 로직이 죽어 있음. `flow==='break'` 설정처 없음.
- 궁극기 영상(mp4)·컷인은 테스트에서만 쓰이고 런타임에는 연결되지 않음. 신규 고대 15종 원화 없음.
- 파쇄 제거(0.104)로 '파쇄 적중 시' 발동하는 고유 효과(파쇄 축전기 등)와 고대 각인이 더 이상 발동하지 않음. 연격 3타로 옮길지 밸런스 결정 필요.
- 4스테이지(철갑 진군)는 원본부터 60초 제한에 붙어 있는 구간이고 단일 시드 시뮬레이션은 결과가 크게 흔들린다. 전투 수치를 바꿀 땐 지역 3개(1·11·21장 등) × 시드 여러 개로 4스테이지만 반복 측정해 클리어율로 비교하고, tests/game-engine.test.mjs의 자동 빌드 완주 테스트도 확인한다.
- `updateHud`가 매 프레임 getElementById를 수백 회 호출(성능 여지). 테스트에선 profile-backup.js 경유로 game-engine.js가 이중 로드됨.
- 0.103.2에서 고친 것: 스킬 아이콘 매 프레임 src 재대입, 로드 실패 문구 파일명, 제작 장비 투사체 null 접근, world.js 이중 로드, 가방 버튼 클릭 인자.

## tools/
- 63개 스크립트: benchmark-*, measure-*.mjs/.py, render-*, review-*, pack-*.py, optimize-*.py, create-*-report.py, simulate-*.
- 렌더/리뷰 계열은 `CODEX_PRIMARY_RUNTIME_NODE_MODULES` 환경변수의 `@napi-rs/canvas`에 의존 → 이 환경에선 실행 불가. 다수가 저장소에 없는 기준 커밋 SHA를 `git show`로 참조. atlas 측정 .py는 scipy 필요(미설치).
- 저장소 루트에서 실행 가능: `simulate-stage-b`, `simulate-stage-c`, `measure-skills049/054`, `benchmark-replays`.
- `prepare-stage-c-qa.py:5`는 `app.js?v=0.99.0`을 치환하려 해 현재 무동작이며 dist/에 QA 파일을 직접 쓴다(배포 위험). `qa-skills.html`은 `qa-codex.html`의 복사본.

## 문서
- README.md (206KB): 버전별 변경 기록, 최신이 맨 위. 각 절에 검증 내용과 `tools/reports/` 증빙 경로.
- GAME_DESIGN.md / PERFORMANCE.md / ANIMATION_ASSETS.md: 최신 기준이 위, 아래는 과거 기록. 옛 규칙과 충돌하면 위쪽이 현재 기준.
