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
- 테스트: `npm test` = `node --experimental-vm-modules --test tests/*.test.mjs` (약 70초). **935/935 통과** (0.140 기준). game-ui 테스트는 host마다 vm 문맥에 app.js를 컴파일하는데 V8 컴파일 캐시가 그 문맥을 붙잡아 메모리가 쌓였다(0.119에서 3.3GB, 기본 힙 약 2GB 초과). 테스트 파일 첫머리의 `v8.setFlagsFromString('--no-compilation-cache')`로 최대 RSS 약 0.73GB. 지우지 말 것. 어셋 개수 단언(클립 415+(45+26+66+3)×15, 프레임 907+(45+26+66+3)×25(+3은 0.123 레이드 보스), 시작 시 요청 이미지 26장 = 공유 18 + 1장 8장(세트 장비 페이지 포함))은 0.109 기준. region-assets 테스트가 모든 챕터 이미지 경로가 `delivery`를 거쳐 실제 파일로 이어지는지 검사한다(0.107에서 재사용 지형 6장 연결이 빠져 5·9·17·18·28·29장 입장이 막혔었다).

## 구조
- `dist/index.html` (389KB, 정적 DOM 3704 id, CSS 45개 순차 로드) → `menu-pages.js`, `app.js`.
- `dist/app.js` (207KB, 1469줄 압축형): UI 컨트롤러. DOM을 생성하지 않고 기존 노드 재사용. rAF `tick`(app.js:1078) → `game.advanceGame` → Canvas2D `draw()` + 매 프레임 DOM `updateHud()`. 화면 전환은 `modal()`(:887) 단일 오버레이 상태기계 + `campDrawer`, `navigateCamp()`(:1280).
- `dist/game-engine.js` (108KB, 허브): 순수 로직(DOM·저장소 없음). 다른 로직 모듈을 import하고, 시각 모듈(skill-vfx, skill-image-fx, monster-fx, combat-feedback, ultimate-video)과 combat-skills 등을 `export *`로 재노출.
- 로직 모듈: loot, equipment-progression/slots/synergies, crafting, chapters, battle-plans, battle-progress(정산 저널), dungeons, hunt-modes(난이도), combat-skills(35종), skill-motion, ancient-powers, unique-effects, build-effects(각인), profile-backup, world(카메라·좌표), terrain, motion.
- `engine.js` + `lab.html/lab.js`: 구형 모션 검사 도구(MOTION LAB). 실게임과 무관.
- `sound.js`: 오디오 파일 없이 WebAudio로 효과음 합성 (동시 10음).
- dist 어셋(0.130.1): 런타임 사용 집합(`regionAssetPlan`+`campAssetPaths`+manifest의 클립 외 이미지+html/css/js 경로+스킬 아이콘)에 없는 파일은 지웠다(webp로 대체된 PNG 원본, 옛 UI 시안, 프롬프트 txt, 안 쓰는 글꼴). 단 MOTION LAB(lab.html)이 쓰는 옛 클립 PNG 10장(hunter_walk 등)은 남김. 새 어셋을 넣으면 manifest/코드에서 참조되게 할 것.
- 어셋 로딩: `dist/assets/manifest.json`(클립 2470개, png→webp `delivery` 매핑). 거점 3장 → 공유 전투 18장 → 챕터별 7~9장(지형 `chapters['c<id>']`, 공격 효과, 보스 아틀라스, 그 챕터 6종의 아틀라스; 한 번에 한 챕터만 상주). 0.106 이후 몬스터는 종마다 아틀라스 1장. 어느 챕터도 안 쓰는 종(옛 지역 보스 3종)은 공유에서도 빠져 내려받지 않는다(region-assets.js, 밑줄 있는 액터 = 몬스터 종). 장식물은 `props_chapters-v0118`(0~11 기존, 12~15 불, 16~19 바다, 20~23 하늘, 24~27 신역). 장비 아틀라스: 기본은 0.9 원본 `equipment_chapters-v09`(12프레임, 검증 대상), 세트 360점은 지역별 페이지 `equipment-sets-r1~r6-v0109`에 있고 `manifest.equipment.setFrames[designId]`(프레임마다 `image`)와 `pages`(크기)로 찾는다(`gearFrame`이 처리, designId `set_<세트>_<sword|blade2|helmet|armor|pants|boots>`, chapters.js `SET_ART`/`ALL_EQUIPMENT_ART`). 아이콘은 `<img>`라 필요할 때 내려받고, 지역 어셋이 챕터 세트의 페이지를 함께 올려 전장 드롭을 그린다. 전투 중 캐릭터 손의 무기는 캐릭터 원화 그대로다(장비 원화는 미리보기·아이콘·드롭에만 쓰임).
- CSS: 버전별로 파일을 뒤에 덧붙여 덮어쓰는 레이어 구조 → **로드 순서 = 우선순위**. 끝에서 두 번째는 `layout-fit.css`(0.103.2, 한 화면 맞춤 규칙 모음, 0.105 지도 챕터 넘김 버튼, 0.108 장비 시너지 3줄 포함), 마지막은 `combat-auto.css`(0.104, 자동 전투 HUD: 상태 창 9분할 테두리, 하단 스킬 줄, 스킬 자동/수동 버튼). 새 화면 맞춤 수정은 여기에 화면별 주석과 함께 추가한다. `#game-shell` 접두 + `data-panel`/`data-camp-view`/`data-phase` 속성 선택자. `!important` 약 900개 + index.html 인라인 474개(옛 tools/apply-common-ui-v2.py가 주입, 0.130.1에서 도구 삭제). 0.140에서 세로·좁은 화면(폭 560 미만, 높이 320 미만) 전용 `@media` 블록은 지웠다(그때는 회전 안내만 보임). 세로 기준 기본 규칙은 가로 규칙의 바탕이라 남아 있다.
- `art/`: 원화 원본, 생성 프롬프트, 검수 자료. Codex 생성 원화: `art/monsters0106`(보스 27·일반 18), `art/terrain0106`(지형 6), `art/monsters0107`(불 12·어둠 6·불 보스 5·특수 보스 3), `art/terrain0107`(지형 21), `art/fire0107`(불 장식물·공격 효과), `art/equipment0108`(지역 세트 4장), `art/equipment0109`(챕터 세트 26장, 장당 6점), `art/ancient0111`(고대 신규 부위 3장, 장당 5점), `art/accessories0122`(장신구 15점, 장당 5점), `art/raid0123`(레이드 보스 3·레이드 고대 15), `art/seals0136`(보스 러시 인장 13·인장 조각 1·리리안 전용 3), `art/skills0137`(스킬 이펙트 16종 × 6프레임), `art/growth0139`(성장 트리 노드 아이콘 49점), `art/equipment0140`(1~3지역 던전 장신구 5점·제작 부위 5점), 0.118의 `art/monsters0118`·`art/terrain0118`·`art/env0118`·`art/equipment0118`. 각 폴더에 사양 JSON, `prompts/<id>.json`, PROVENANCE.md. 사용자 몬스터 백과 참고 이미지는 `art/monsters065/references/encyclopedia-1~5.png`. `tools/reports/`: 버전별 측정·검수 결과.

## 버전 표기
- README는 0.103.2부터 다시 최신(그 사이 0.98~0.103.1 기록은 없음). **모듈 쿼리는 0.140부터 하나로 통일**: dist의 모든 로컬 import·`<script>`·`<link>`가 `?v=0.140.0`(예전엔 0.48~0.139가 섞이고 쿼리 없는 import도 있었음). 새 버전을 낼 때 `python3 tools/set-module-version.py X.Y.Z` 한 번으로 전부 올린다(파일마다 따로 올리지 말 것: 같은 파일이 다른 쿼리로 섞이면 모듈 인스턴스가 둘이 된다). 테스트 2곳(gear-skills, raids)은 `loot.js?v=0.136.2`를 따로 불러 별도 인스턴스를 쓰며 그대로 둔다. `PROFILE_VERSION=16`(0.105 v14 진행 배열 30칸, 0.112 v15 고대 번호 재배정, 0.118 v16 진행 배열 60칸·레벨 상한 200; 테스트의 복원 버전 단언은 16). 코드가 문서보다 앞서 있다. README_LOCAL은 폴더 이름 때문에 "Alpha 0.45"라고 부른다.
- 파일명 버전: 점 제거(063=0.63, 0844=0.84.4, v0970=0.97.0, v01002=0.100.2). 단 alpha09/alpha091은 0.9/0.9.1.

## 문서
- README.md: 버전별 변경 기록, 최신이 맨 위. 각 절에 검증 내용과 `tools/reports/` 증빙 경로(0.130.1에서 대부분의 옛 리포트를 지워 옛 절의 경로는 git 기록에서 찾는다).
- GAME_DESIGN.md / PERFORMANCE.md / ANIMATION_ASSETS.md: 최신 기준이 위, 아래는 과거 기록. 옛 규칙과 충돌하면 위쪽이 현재 기준.

## 필요할 때 읽는 메모 (프로젝트 스킬, `.claude/skills/`)
토큰 절약을 위해 긴 메모는 스킬로 옮겼다. 해당 작업 전에 Skill 도구로 불러 읽는다. 메모를 갱신할 때도 그 파일을 고친다.
- `beast-hunter-tests`: 테스트 작성 시 주의(드롭 고정 `s.lootRates`, 고대 시드, durable, manual host, 좌표 도우미 등).
- `beast-hunter-rules`: 게임 규칙·시스템 상세(난이도·관문·성장·스킬·보스 러시·인장·저장 형식)와 알려진 문제. **게임 로직·밸런스 변경 전 필독.**
- `beast-hunter-ui`: UI 레이아웃 원칙과 CSS 함정. **화면 수정 전 필독.** 요점: 메뉴는 스크롤 없이 한 화면, 검수 해상도 844×390·915×412·667×375·568×320·900×405, 새 맞춤 규칙은 layout-fit.css 끝에.
- `beast-hunter-art`: Codex CLI 원화 생성·포장 순서, tools/ 스크립트 목록.
