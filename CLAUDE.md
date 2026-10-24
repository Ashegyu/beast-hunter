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
- 테스트: `npm test` = `node --experimental-vm-modules --test tests/*.test.mjs` (약 70초). **788/788 통과** (0.117 기준). 어셋 개수 단언(클립 415+(45+26)×15, 프레임 907+(45+26)×25, 시작 시 요청 이미지 26장 = 공유 18 + 1장 8장(세트 장비 페이지 포함))은 0.109 기준. region-assets 테스트가 모든 챕터 이미지 경로가 `delivery`를 거쳐 실제 파일로 이어지는지 검사한다(0.107에서 재사용 지형 6장 연결이 빠져 5·9·17·18·28·29장 입장이 막혔었다).

## 테스트 작성 시 주의 (0.103.2에서 정리한 내용)
- 고대 장비(0.110): 보스 고대 = 챕터 10스테이지 보스가 그 지역 번호의 고대(0.112부터 번호 = 지역: 1 숲지기, 2 서리, 3 폐성·망자. 기본 카탈로그 티어 2가 폐성, 3이 서리라 `ancientIdOfBase`/`ANCIENT_TIER_OF_BASE`가 2↔3을 바꿔 고대 아이디·티어를 만든다. 고대는 계열의 기본 원화 아이디를 그대로 써서 원화 티어 ≠ 고대 티어일 수 있으므로 `equipmentArt`·`cleanItem`·`equipmentSnapshot`이 고대는 티어 비교를 건너뛴다. 저장 v15가 v14 이하의 고대 2·3번을 한 번 바꿔 옮긴다) 고대를 `ANCIENT_BOSS_CHANCE`(0.113: 일반 1%·정예 2%·악몽 3%, 사용자 요청 '진짜 잘 안 나와야')로 떨어뜨린다(`dropBossAncient`). 0.114부터 확정 드롭(천장) 없음(사용자 결정): 저장 필드 `legendaryPity`는 남아 있지만 쓰지 않는다. 레이드 고대는 레이드와 함께 추가 예정(미구현). 테스트에서 고대 드롭을 확인할 때는 `s.lootRng` 시드를 바꿔 가며 고대가 나오는 처치를 찾는다(tests/ancient-items.test.mjs).
- 장비 확정 지급 없음(0.115, 사용자 결정. 강화 구간 보장, 대장간 제작 확정 성공(재료가 매우 드물어서), 던전 완주 재료 보상은 그대로 두기로 사용자 결정): `DROP_CHANCE`(일반 몬스터 .16, 정예 .7, 스테이지 클리어 보상 .7, 보스 장비 3개 각 .75)로 매번 `lootRandom` 판정, 일반 몬스터 10마리 천장(`lootPity`) 제거(필드는 남음). 판 단위 덮어쓰기 `s.lootRates`(저장 안 함): **장비가 꼭 나와야 하는 테스트는 `s.lootRates={normal:1,elite:1,stage:1,boss:1}`을 둔다**(launch 뒤, UI 테스트는 start 뒤 `ui.state`). 보스 결과를 단언할 때는 고대가 섞일 수 있어 `s.run.bossAncients.length`만큼 더해 센다.
- 난이도 장비(0.113): 장비의 `hunt`(1 정예, 2 악몽)가 기본 능력치 배율 `HUNT_POWER`(1/1.25/1.6)를 정한다(`affixRange`의 4번째 인자, `itemRollRanges`·승급·재련 모두 반영, `cleanItem`이 보존). 스테이지 드롭은 `rollStageItem({hunt})`가 `HUNT_GRADE_TABLES`로 등급을 정한다(일반 100 / 정예 55·35·10 / 악몽 20·40·30·10, **신화는 드롭 금지**(사용자 결정), 일반 난이도는 추가 난수를 쓰지 않음). 던전은 hunt 0. 보스 고대도 hunt 배율을 받는다. 고대 카탈로그는 75종(모두 개별 원화, 아틀라스 `ancient-individual-v0112` 75프레임, `numbering:'region'`), 능력치는 부위별 3종(`ANCIENT_STATS`)×(.76+.24×티어)×2.9.
- 고대 특수효과(`ancient-powers.js`): 75종 모두 고유. 발동 조건 normal/finisher/skill/crit/kill/dash/perfect/hurt/lowHp/periodic/pickup(heavy·counter·idle은 자동 전투에서 발동하지 않아 0.110에서 없앰). 새 효과 fury/haste(시간제 버프, `s.uniqueState.ancientBuffs`, `ancientBuff(s,key)`가 damageEnemy·기본 공격 속도에 반영), invuln, cdr(스킬 재사용 감소), execute(비보스 처형). 'skill'은 `SKILL_HOOKS.cast`(combat-skills `castSkill`의 `h.cast`), 'kill'은 `kill()`, 'crit'은 연격 접촉 루프 뒤 `ancientAll`. tests/ancient-powers.test.mjs의 `fire()`가 조건별로 실제 전투 상황을 만들어 발동을 확인한다.
- 9스테이지는 밀집 공세(전원 skitter), strict 스테이지(4·8·9·10)는 이탈 시 처치 수·전리품까지 롤백. 보스 규칙은 생태별(숲 재생, 불 화염 폭주, 얼음 호위 소환, 어둠 방어 태세), 특수 보스(10·20·30장)는 거기에 70%·35% 호위 4마리.
- 카메라는 플레이어를 화면 높이 60%에 둠(world.js). 가로 화면 논리 폭은 1800(view-controls.js `viewportFor`)이고 캔버스에 축소해 그림.
- 서 있는 캐릭터는 화면 세로 위치에 따라 0.86~1.1배(app.js `sceneDepthScale`, 플레이어 위치에서 1.0).
- tests/game-ui.test.mjs 앞부분의 `appView/appScale/appCamera/appDepth/clientAt` 도우미가 app.js의 화면 변환을 그대로 재현한다. 화면 좌표 테스트는 이것을 쓴다.
- lab 테스트 링커는 `?v=` 쿼리를 잘라 처리한다.
- 0.107 구성: 1~10 숲(지역 1 붉은 숲), 11~15 불·16~20 얼음(지역 2 불과 얼음의 땅), 21~30 어둠(지역 3 어둠의 심연). 지역(`theme` 1~3)은 지도 탭·장비/재료 티어·던전, 생태(`biome`: forest/fire/frost/ruins)는 지형 장식·공격 효과(`effects` 1~4)·보스 규칙(`bossRule`)·몬스터 풀. 생태를 시험할 때는 1·11·16·21장을 쓴다. 진행 배열은 길이 30이라 기대값은 `g.STAGES.map(...)`으로 만든다.
- 스테이지별 몬스터: `chapter.stages[n]`이 그 스테이지의 {skitter,spitter,bulwark} 한 종씩(`chapterLineups`, 1~8스테이지는 역할 조합 8가지, 매 단계 2역할 이상 교체). `chapter.roster`는 그 6종. 몬스터의 `unlockStage`는 더 이상 출현에 쓰지 않는다.
- game-ui.test.mjs의 `widen(p)`는 옛 3챕터 진행 기록을 1·11·21장 기준으로 옮기고, `pickChapter(ui,id)`는 지역 탭과 ‹ › 버튼으로 챕터를 고른다. `stage-1~3` 버튼은 지역 탭이다. 챕터마다 내려받는 이미지 수가 다르다(8~11장: 지역 세트 장비 페이지 1장 포함, 16~20장은 중간 보스 아틀라스 1장 추가).
- 0.109 장비 세트: 챕터마다 고유 세트 30종(`equipment-sets.js` `ROWS` = [id, 챕터, 이름, 색, 기본 성향, 2세트, 4세트, 이름], `chapter.set`). 스테이지 드롭(`makeItem`)은 `set:stageOf(s).set`으로 그 챕터 세트만 고른다(`loot.js` `SET_CATALOG` 360종, 항목에 `set` 필드, 아이디 `set-<세트>-<부위>-n`, 기본 능력치 = `SET_STYLES[성향]`×`power`(지역 안 챕터당 +2%)). 0.108의 forest/fire/frost/ruins는 1·11·16·21장 세트로 아이디·이름·고유 효과 순서를 유지한다(`effectOffset` 0). 기존 `BASE_CATALOG` 123종은 세트가 없고 고대 75종은 여기서만 파생된다(고대·카탈로그 개수 테스트는 `!r.set`로 거른다). 세트 효과는 `equipment-sets.js`(`EQUIPMENT_SETS`, `SET_STATS`, `setBonusStats`)에 있고 `equipmentBonuses`가 speed/crit/reduction을 더하고, `playerStats`가 `damagePct`/`hpPct`를 곱하고 attackSpeed(%)·range(%)·regeneration(초당)·collection(거리)을 반영한다.
- 0.108 중간 보스: `CHAPTER_ROWS` 4번째 칸 `midBoss`(16~20장 얼음 보스 5종). 8스테이지 마지막 웨이브 첫 정예가 그 종으로 바뀌고(`beginWave`), 체력 ×2.5·공격 ×1.3·반경 +40. 지역 어셋에 그 아틀라스가 들어간다(클립 105→120).
- 0.104부터 실제 사냥은 항상 자동(`state.auto=true`). 이동·공격·마우스 조준으로 캐릭터를 조종해야 하는 그림/입력 테스트는 `host({manual:true})`로 검수용 수동 경로를 켠다. 실제 동작 검증은 manual 없이 쓴다.

## 구조
- `dist/index.html` (389KB, 정적 DOM 3704 id, CSS 45개 순차 로드) → `menu-pages.js`, `app.js`.
- `dist/app.js` (207KB, 1469줄 압축형): UI 컨트롤러. DOM을 생성하지 않고 기존 노드 재사용. rAF `tick`(app.js:1078) → `game.advanceGame` → Canvas2D `draw()` + 매 프레임 DOM `updateHud()`. 화면 전환은 `modal()`(:887) 단일 오버레이 상태기계 + `campDrawer`, `navigateCamp()`(:1280).
- `dist/game-engine.js` (108KB, 허브): 순수 로직(DOM·저장소 없음). 다른 로직 모듈을 import하고, 시각 모듈(skill-vfx, skill-image-fx, monster-fx, combat-feedback, ultimate-video)과 combat-skills 등을 `export *`로 재노출.
- 로직 모듈: loot, equipment-progression/slots/synergies, crafting, chapters, battle-plans, battle-progress(정산 저널), dungeons, hunt-modes(난이도), combat-skills(35종), skill-motion, ancient-powers, unique-effects, build-effects(각인), profile-backup, world(카메라·좌표), terrain, motion.
- `engine.js` + `lab.html/lab.js`: 구형 모션 검사 도구(MOTION LAB). 실게임과 무관.
- `sound.js`: 오디오 파일 없이 WebAudio로 효과음 합성 (동시 10음).
- 어셋 로딩: `dist/assets/manifest.json`(클립 1480개, png→webp `delivery` 매핑). 거점 3장 → 공유 전투 18장 → 챕터별 7~9장(지형 `chapters['c<id>']`, 공격 효과, 보스 아틀라스, 그 챕터 6종의 아틀라스; 한 번에 한 챕터만 상주). 0.106 이후 몬스터는 종마다 아틀라스 1장. 어느 챕터도 안 쓰는 종(옛 지역 보스 3종)은 공유에서도 빠져 내려받지 않는다(region-assets.js, 밑줄 있는 액터 = 몬스터 종). 장식물은 `props_chapters-v0107`(0~11 기존, 12~15 불). 장비 아틀라스: 기본은 0.9 원본 `equipment_chapters-v09`(12프레임, 검증 대상), 세트 180점은 지역별 페이지 `equipment-sets-r1/r2/r3-v0109`에 있고 `manifest.equipment.setFrames[designId]`(프레임마다 `image`)와 `pages`(크기)로 찾는다(`gearFrame`이 처리, designId `set_<세트>_<sword|blade2|helmet|armor|pants|boots>`, chapters.js `SET_ART`/`ALL_EQUIPMENT_ART`). 아이콘은 `<img>`라 필요할 때 내려받고, 지역 어셋이 챕터 세트의 페이지를 함께 올려 전장 드롭을 그린다. 전투 중 캐릭터 손의 무기는 캐릭터 원화 그대로다(장비 원화는 미리보기·아이콘·드롭에만 쓰임).
- CSS: 버전별로 파일을 뒤에 덧붙여 덮어쓰는 레이어 구조 → **로드 순서 = 우선순위**. 끝에서 두 번째는 `layout-fit.css`(0.103.2, 한 화면 맞춤 규칙 모음, 0.105 지도 챕터 넘김 버튼, 0.108 장비 시너지 3줄 포함), 마지막은 `combat-auto.css`(0.104, 자동 전투 HUD: 상태 창 9분할 테두리, 하단 스킬 줄, 스킬 자동/수동 버튼). 새 화면 맞춤 수정은 여기에 화면별 주석과 함께 추가한다. `#game-shell` 접두 + `data-panel`/`data-camp-view`/`data-phase` 속성 선택자. `!important` 약 900개 + index.html 인라인 474개(tools/apply-common-ui-v2.py가 주입). 세로용 규칙 다수는 가로 전용 전환 뒤 사실상 죽은 코드.
- `art/`: 원화 원본, 생성 프롬프트, 검수 자료. Codex 생성 원화: `art/monsters0106`(보스 27·일반 18), `art/terrain0106`(지형 6), `art/monsters0107`(불 12·어둠 6·불 보스 5·특수 보스 3), `art/terrain0107`(지형 21), `art/fire0107`(불 장식물·공격 효과), `art/equipment0108`(지역 세트 4장), `art/equipment0109`(챕터 세트 26장, 장당 6점), `art/ancient0111`(고대 신규 부위 3장, 장당 5점). 각 폴더에 사양 JSON, `prompts/<id>.json`, PROVENANCE.md. 사용자 몬스터 백과 참고 이미지는 `art/monsters065/references/encyclopedia-1~5.png`. `tools/reports/`: 버전별 측정·검수 결과.

## 버전 표기
- README는 0.103.2부터 다시 최신(그 사이 0.98~0.103.1 기록은 없음), `index.html`은 `app.js?v=0.117.0`, 모듈 import 쿼리는 0.70~0.117 혼재(0.105~0.117에서 바꾼 모듈과 그 import 사슬은 `?v=0.117.0`), `PROFILE_VERSION=15`(0.105 v14 진행 배열 30칸, 0.112 v15 고대 번호 재배정; 테스트의 복원 버전 단언은 15). 코드가 문서보다 앞서 있다. README_LOCAL은 폴더 이름 때문에 "Alpha 0.45"라고 부른다.
- 파일명 버전: 점 제거(063=0.63, 0844=0.84.4, v0970=0.97.0, v01002=0.100.2). 단 alpha09/alpha091은 0.9/0.9.1.

## 게임 규칙 요약
- 전투(0.104): 이동·공격·회피는 항상 자동(engine `autoInput`). 파쇄(Q, `thunder`)는 UI·자동 전투에서 제거(엔진 함수는 남음). 스킬만 자동/수동 선택: 앱이 `input.skillMode`('auto'|'manual')를 넘기고, 수동이면 탭한 스킬을 `input.skillRequest`로 3초간 예약해 다음 공격 틈에 시전. 선택은 localStorage `beast-hunter:skill-mode`. 연격 3타는 원래 수치(피해 1.85배, 방어 38). 중갑은 유지하고 4스테이지 장갑 55%로 **대응 스킬 필수 구간**(사용자 결정): 마지막 검끝 패시브 장착 시 연격(`swing.damage` 있는 타격)이 장갑 무시 + 3타 방어 +62(`FINISHER_GUARD_BONUS`), 파갑참은 방어를 `breachGuardShatter(rank)`만큼 먼저 깎아 강타 65와 합쳐 한 번에 부수고 주변 260 장갑 8초 해제(`BREACH_ARMOR`, `e.plateBrokenUntil`), autoSkill이 방어·장갑 남은 적에게 우선 사용. 스테이지 규칙 `required:true`면 힌트 뒤에 '필요'(아니면 '유리').
- 성장(0.105): 레벨 상한 `MAX_LEVEL=100`. `xpNeeded`=Lv.10 전 300+250×레벨, 이후 3000+6×(레벨-10). 일반 챕터 하나가 약 1만 경험치 → 정비 진행 시 챕터 끝 Lv.8(1장) / 34~36(10장) / 66~67(20장) / 96~97(30장). 적월난무 각성은 Lv.50, 마지막 검끝 해금 Lv.3. 레벨·수치 조정은 정비(강화·승급 포함)+체크포인트 재도전+막히면 앞 스테이지 1회 파밍을 흉내 낸 30챕터 시뮬레이션(시드 3개, 시드당 약 2분)으로 확인한다(strict 스테이지 실패는 경험치도 롤백되므로 같은 곳만 반복하면 레벨이 안 오른다). 현재 결과(0.107, 배수 0.16): 30장까지 클리어, 전체 도전 33~37회, 대부분 첫 도전 통과(난이도 상향 여지).
- 캐릭터: 리리안 1명(검사, 엔진 역할 ID는 hunter). 30챕터(chapters.js `CHAPTER_ROWS` = [이름, 생태, 보스 종]) × 10스테이지 × 난이도 3(일반/정예/악몽: HP ×1/1.5/2.2). 모든 챕터에 고유 보스(`CHAPTER_BOSSES`, special=10/20/30장). 적 배수 `chapterMultiplier`=1+0.16×(챕터-1)(30장 ×5.64), 보스 HP=780×배수×지역 보정(1/1.13/1.22)×지역 마지막 챕터 1.15, 보스 골드 90×배수, 보스 핵 `bossCores`=ceil(챕터/5)+난이도 보너스. 정예·악몽 보스 패턴 `REPLAY_CYCLES`는 생태 기준(fire는 frost 행). 던전은 1·11·21장에 속한다.
- 스테이지 60초 제한. 1~9는 웨이브 3개, 10은 보스 단독. 4·9 special, 8 elite, 10 boss. 동시 적 최대 32.
- `advanceGame`: dt ≤0.1s, 0.025s 고정 서브스텝. RNG는 LCG 5개 스트림(전투·전리품·재료·재련·승급), `Math.random` 미사용 → 결정적.
- 장비 9칸(무기, 헬멧·상의·하의·신발, 목걸이·귀걸이×2, 전용). 등급 0일반~4신화, 5고대, 6제작. 강화 상한 5/10/15/20/30/40/50, 구간별 보장(10/20/30회), 고대 +30 이상 실패 보정, 제작 +40 이상 보장 없음. 승급은 최대 강화 후 +0으로.
- 저장: localStorage `beast-hunter:profile:v1` (+ `:recovery`, `:before-restore`, `:sound`). 엔진은 v1~15 수용(v13 이하의 1~3장 진행은 새 1~3장으로, v14 이하의 고대 2·3번은 서로 바꿔 옮김), 백업 검증(profile-backup.js)은 v8~15, 범위 밖이면 새 프로필(앱이 원본을 :recovery에 보관). 백업 형식 `beast-hunter-backup` v1, FNV-1a, 256KB. 저장은 호스트·포트별이라 포트를 바꾸면 진행이 안 보인다.
- strict(normal이 아닌) 스테이지는 체크포인트 → 실패/이탈 시 롤백, 클리어 시 `confirmSettlement`로 2단계 정산.

## UI 레이아웃 원칙과 함정
- 메뉴는 스크롤 없이 한 화면에 들어가야 한다(사용자 요청). 목록이 넘치면 페이지 넘김(가방·스킬·도감 방식)이나 격자 재배치로 해결한다.
- 검수 해상도: 844×390, 915×412, 667×375, 568×320, 900×405. 높이 360px 이하는 `@media(max-height:360px)` 블록에서 보조 문구를 숨기고 행 높이를 줄인다.
- `common-ui-v2.css`가 `[data-common-skin][data-common-skin]`에 `position:relative`를 강제한다. 스킨 붙은 요소를 덮개(absolute)로 띄우려면 같은 이중 속성 선택자로 덮어써야 한다.
- 스킨 붙은 버튼의 `:before` 장식은 절대 위치라서, 버튼을 `position:static`으로 바꾸면 장식이 부모 전체를 덮는다. 위치를 풀 때는 `relative`+`left/bottom:auto`를 쓴다.
- 공통 스킨 테두리 원화(`assets/common-ui-v2/empty_skins/button_base_ornate_dark.png`)는 바깥에 투명 여백이 있다. 바탕색을 칠할 때는 테두리 안쪽(좌우 3px, 위아래 2px)으로 줄여야 테두리 밖으로 색이 새지 않는다(layout-fit.css의 빨간 스킨 규칙 참고).
- 홈 왼쪽 메뉴 아이콘은 `lobby-reference-v0920.webp` 시안 전체에서 잘라 쓰며 원본에 글자가 박혀 있어 clip-path로 아래를 잘라야 한다.
- 장비 화면 귀걸이 2 칸 옆 검은 모루는 배경 원화의 일부다(버그 아님).
- 공통 스킨 '선택됨' 장식은 `common-ui-v2.css`의 `#game-shell :is(#camp-map-panel,…) [data-common-skin][data-common-skin][data-common-skin=tab][aria-pressed=true]::before`(아이디 2개)가 그린다. 화면별로 모양을 바꾸려면 `#game-shell#game-shell #<패널>`처럼 아이디를 3개 이상 써야 이긴다(0.117 사냥 지도 난이도 알약 모양).
- 홈(0.116, 사용자 요청): 메뉴는 오른쪽 `.home-shortcuts` 한 묶음 4×2(nav-hunt·lobby-equipment·lobby-bag·lobby-skills·hub-growth·lobby-craft·lobby-summon·camp-codex)만 보인다. `.lobby-side`·`.lobby-bottom`·`#home-intel`(가을 사냥 안내)·`#home-build-control`(빌드 선택)은 `layout-fit.css`에서 숨김(버튼과 리스너는 DOM에 남음, lobby-character는 lobby-bottom으로 옮김). 홈에 메뉴를 흩어 놓지 말 것.
- 자동 레이아웃 점검: 저장 프로필을 만들어 localStorage에 넣고 Playwright로 각 화면을 돌며 화면 밖 버튼·가림·글자 잘림·스크롤 영역을 측정했다. 접힌 `<details>` 내용과 2px로 접어 둔 예전 버튼(#codex-back, #inventory-note)은 오탐이다.

## 알려진 문제 (코드에서 확인)
- `makeItem`은 출처·보스·minimum 인자를 무시하고 등급은 난이도(`hunt`)로만 정한다 → DROP_TABLES, BOSS_DROP_TABLES, minimumRarity는 사실상 죽은 코드. 고대는 0.110부터 `dropBossAncient`가 따로 떨어뜨린다.
- 제작 재료 `origin`(무명의 기원)이 보스 처치당 0.001%뿐 → README의 "현재 제작 가능"과 달리 제작이 사실상 불가능 (crafting.js:12).
- `s.encounters/caches/nodes`를 채우는 코드 없음 → interact·상자·그룹 어그로 로직이 죽어 있음. `flow==='break'` 설정처 없음.
- 궁극기 영상(mp4)·컷인은 테스트에서만 쓰이고 런타임에는 연결되지 않음.
- 0.106 보스 중 독버섯 왕·얼음 정령왕·빙하 거북·대사령술사는 뒷모습 줄이 앞모습과 비슷하게 생성됨(사용 가능 수준이라 유지). 0.109부터 스테이지 드롭은 챕터 세트 장비지만, 장신구·전용 칸과 던전·제작 장비는 여전히 옛 티어 이름·원화(2티어 폐성, 3티어 서리)를 쓴다(고대는 0.111에서 떨어지는 지역을 이름·원화에 맞춰 바꿈).
- 파쇄 제거(0.104)로 '파쇄 적중 시' 발동하는 고유 효과(파쇄 축전기 등)가 더 이상 발동하지 않음(고대 특수효과는 0.110에서 스킬 시전 등으로 옮김). 연격 3타로 옮길지 밸런스 결정 필요.
- 4스테이지(철갑 진군)는 원본부터 60초 제한에 붙어 있는 구간이고 단일 시드 시뮬레이션은 결과가 크게 흔들린다. 전투 수치를 바꿀 땐 지역 3개(1·11·21장 등) × 시드 여러 개로 4스테이지만 반복 측정해 클리어율로 비교하고, tests/game-engine.test.mjs의 자동 빌드 완주 테스트도 확인한다.
- `updateHud`가 매 프레임 getElementById를 수백 회 호출(성능 여지). 테스트에선 profile-backup.js 경유로 game-engine.js가 이중 로드됨.
- 0.103.2에서 고친 것: 스킬 아이콘 매 프레임 src 재대입, 로드 실패 문구 파일명, 제작 장비 투사체 null 접근, world.js 이중 로드, 가방 버튼 클릭 인자.

## 이미지 생성 (Codex CLI, 0.106~0.111)
- 새 원화는 Codex CLI로 만든다(사용자 요청). `codex exec`(0.164, ChatGPT 로그인, `image_generation` 기능 켜짐)의 내장 `image_gen`이 `~/.codex/generated_images/`에 PNG를 만들고 지정 경로로 복사한다. 한 장에 약 2분, 6개까지 병렬로 돌려도 문제없었다.
- 몬스터: `python3 tools/codex-monster-sheet.py art/monsters0107/<사양>.json <id>...` → 자동 검사(투명도·25포즈·5×5·가장자리) 불합격이면 재생성 → `python3 tools/pack-monsters0106.py <폴더> <태그>`(폴더의 PNG 전체를 종별 아틀라스로 다시 포장, scipy 필요: `pip install scipy`) → chapters.js의 `CHAPTER_BOSSES`, `MONSTERS`, `BIOMES.pool`에 등록. 긴 브레스·무기가 옆 칸까지 뻗으면 검사에 떨어지므로 "짧게, 칸 안에"를 프롬프트에 넣는다.
- 지형·장식물·효과: 같은 생성기에 `"kind":"terrain"`(불투명 정사각) 또는 `"kind":"sprite","minParts"`(투명, 물체 N개 이상) 사양 → `python3 tools/pack-environment0107.py`(지형 c1~c30, 장식물 아틀라스, 불 효과). 0.106의 `pack-terrain0106.py`는 옛 단계 키('1.2' 등)를 만들며 0.107 패커가 지운다. 0.107 패커는 재사용 지형의 `delivery`도 넣고, 장식물은 항상 `props_chapters-v09`에서 다시 만든다(재실행 안전).
- 장비: `"kind":"sprite","minParts":6` 사양(`art/equipment0109/sets.json`, 3×2 배치, 기존 장비 아틀라스를 스타일 참고로) → `python3 tools/pack-equipment0109.py`(조각마다 중심점이 속한 칸으로 물건을 묶어 최대 240px로 줄이고 지역별 페이지에 세트당 한 줄로 배치. 신발 한 켤레는 조각 2개라 '큰 조각 6개' 방식은 틀린다). 새 세트는 `equipment-sets.js` `ROWS`에 줄을 더하고 시트를 만든 뒤 다시 포장한다. 26장을 6개 병렬로 약 15분에 모두 첫 시도 통과.
- 고대 원화: `art/ancient0111/parts.json`(티어당 5점, 3×2에서 오른쪽 아래 칸 비움, 파일 번호는 0.112 지역 번호) → `python3 tools/pack-ancient0112.py`(0.19 고대 아틀라스 아래에 붙이고 0.19의 옛 번호를 지역 번호로 한 번 바꿈).
- 패커를 돌린 뒤 `git checkout dist/assets/manifest.json`을 하면 다른 패커의 결과까지 되돌아간다. 되돌렸다면 0106 몬스터 → 0107 몬스터 → environment0107 → equipment0109 → ancient0112 순으로 모두 다시 돌린다.
- 생성본은 반드시 눈으로 검수한다(모아보기 이미지를 만들어 Read). 자동 검사는 배치만 본다. 실패 시도는 `art/*/.codex-work/`(gitignore).
- 대기 루프에서 `pgrep -f "tools/codex-monster-sheet.py"`를 쓰면 루프 자신과 일치해 끝나지 않는다. `pkill -f`도 같은 이유로 셸을 죽일 수 있다.

## tools/
- 63개 스크립트: benchmark-*, measure-*.mjs/.py, render-*, review-*, pack-*.py, optimize-*.py, create-*-report.py, simulate-*.
- 렌더/리뷰 계열은 `CODEX_PRIMARY_RUNTIME_NODE_MODULES` 환경변수의 `@napi-rs/canvas`에 의존 → 이 환경에선 실행 불가. 다수가 저장소에 없는 기준 커밋 SHA를 `git show`로 참조. atlas 측정 .py는 scipy 필요(미설치).
- 저장소 루트에서 실행 가능: `simulate-stage-b`, `simulate-stage-c`, `measure-skills049/054`, `benchmark-replays`.
- `prepare-stage-c-qa.py:5`는 `app.js?v=0.99.0`을 치환하려 해 현재 무동작이며 dist/에 QA 파일을 직접 쓴다(배포 위험). `qa-skills.html`은 `qa-codex.html`의 복사본.

## 문서
- README.md (206KB): 버전별 변경 기록, 최신이 맨 위. 각 절에 검증 내용과 `tools/reports/` 증빙 경로.
- GAME_DESIGN.md / PERFORMANCE.md / ANIMATION_ASSETS.md: 최신 기준이 위, 아래는 과거 기록. 옛 규칙과 충돌하면 위쪽이 현재 기준.
