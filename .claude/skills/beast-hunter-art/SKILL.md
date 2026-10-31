---
name: beast-hunter-art
description: 괴수 사냥꾼 원화 생성(Codex CLI 설치·로그인, 몬스터·지형·장비·고대 시트 생성과 포장 스크립트 순서, manifest 되돌림 주의)과 tools/ 스크립트(시뮬레이션·벤치마크·포장기) 목록. 새 이미지를 만들거나 포장·시뮬레이션 도구를 돌릴 때 읽는다.
---

# beast-hunter-art

CLAUDE.md에서 옮겨 온 작업 메모. 내용이 바뀌면 이 파일을 고친다.

## 이미지 생성 (Codex CLI, 0.106~0.136)
- 새 원화는 Codex CLI로 만든다(사용자 요청). 클라우드 컨테이너에는 기본으로 없으니 `npm install -g @openai/codex@0.164.0` + `pip install scipy` 후 `codex login --device-auth`(사용자가 브라우저에서 코드 입력)로 로그인한다(0.136.1에서 확인, 컨테이너가 바뀌면 다시). `codex exec`(0.164, ChatGPT 로그인, `image_generation` 기능 켜짐)의 내장 `image_gen`이 `~/.codex/generated_images/`에 PNG를 만들고 지정 경로로 복사한다. 한 장에 약 2분, 6개까지 병렬로 돌려도 문제없었다.
- 성장 트리 아이콘(0.139): `art/growth0139/sheets.json`(4×2 칸에 7점, `items`=아이콘 아이디, 스타일 기준 `style-ref.png`=스킬 아이콘 8장) → `python3 tools/pack-growth0139.py`(칸 단위로 잘라 96px, 7열 아틀라스) → `node tools/make-growth-tree0139.mjs`(index.html 노드 버튼에 아이콘 좌표). 핵심 노드 가시 테두리가 이웃에 닿으면 자동 검사가 물체 수를 적게 세므로 눈으로 보고 채택해도 된다(node-4).
- 몬스터: `python3 tools/codex-monster-sheet.py art/monsters0107/<사양>.json <id>...` → 자동 검사(투명도·25포즈·5×5·가장자리) 불합격이면 재생성 → `python3 tools/pack-monsters0106.py <폴더> <태그>`(폴더의 PNG 전체를 종별 아틀라스로 다시 포장, scipy 필요: `pip install scipy`) → chapters.js의 `CHAPTER_BOSSES`, `MONSTERS`, `BIOMES.pool`에 등록. 긴 브레스·무기가 옆 칸까지 뻗으면 검사에 떨어지므로 "짧게, 칸 안에"를 프롬프트에 넣는다.
- 지형·장식물·효과: 같은 생성기에 `"kind":"terrain"`(불투명 정사각) 또는 `"kind":"sprite","minParts"`(투명, 물체 N개 이상) 사양 → `python3 tools/pack-environment0107.py`(지형 c1~c30, 장식물 아틀라스, 불 효과). 0.106의 `pack-terrain0106.py`는 옛 단계 키('1.2' 등)를 만들며 0.107 패커가 지운다. 0.107 패커는 재사용 지형의 `delivery`도 넣고, 장식물은 항상 `props_chapters-v09`에서 다시 만든다(재실행 안전).
- 장비: `"kind":"sprite","minParts":6` 사양(`art/equipment0109/sets.json`, 3×2 배치, 기존 장비 아틀라스를 스타일 참고로) → `python3 tools/pack-equipment0109.py`(조각마다 중심점이 속한 칸으로 물건을 묶어 최대 240px로 줄이고 지역별 페이지에 세트당 한 줄로 배치. 신발 한 켤레는 조각 2개라 '큰 조각 6개' 방식은 틀린다). 새 세트는 `equipment-sets.js` `ROWS`에 줄을 더하고 시트를 만든 뒤 다시 포장한다. 26장을 6개 병렬로 약 15분에 모두 첫 시도 통과.
- 4~6지역 고대 원화(0.119): `art/ancient0119/sheets.json`(15장, 장당 5점, 오른쪽 아래 칸 비움, `items`가 칸 순서의 고대 아이디) → `python3 tools/pack-ancient0119.py`(현재 아틀라스를 첫 75프레임 영역으로 잘라 그 아래에 붙임, 재실행 안전, 무기 손잡이·칼끝은 0.19 비율로 측정). ancient0112 패커를 다시 돌렸다면 0119도 이어서 돌린다.
- 고대 원화: `art/ancient0111/parts.json`(티어당 5점, 3×2에서 오른쪽 아래 칸 비움, 파일 번호는 0.112 지역 번호) → `python3 tools/pack-ancient0112.py`(0.19 고대 아틀라스 아래에 붙이고 0.19의 옛 번호를 지역 번호로 한 번 바꿈).
- 0.118 원화: `art/monsters0118`(바다·하늘·신역 일반 36·보스 30), `art/terrain0118`(지형 c31~c60), `art/env0118`(장식물·공격 효과 3생태), `art/equipment0118`(세트 30장). `pack-environment0107.py`가 c1~c60·장식물 7세트(`props_chapters-v0118`)·효과 4~7을, `pack-equipment0109.py`가 60세트·지역 페이지 6장을 만든다. 지형은 거울 반복 타일이라 대각선 띠가 있으면 X자 무늬가 생긴다: 사양에 'LAYOUT: … no diagonal bands' 문구를 넣고, 생성 뒤 2×2 거울 배치 미리보기로 확인한다.
- 패커를 돌린 뒤 `git checkout dist/assets/manifest.json`을 하면 다른 패커의 결과까지 되돌아간다. 되돌렸다면 0106 몬스터 → 0107 몬스터 → 0118 몬스터 → environment0107 → equipment0109 → ancient0112 → ancient0119 순으로 모두 다시 돌린다.
- 생성본은 반드시 눈으로 검수한다(모아보기 이미지를 만들어 Read). 자동 검사는 배치만 본다. 실패 시도는 `art/*/.codex-work/`(gitignore).
- 대기 루프에서 `pgrep -f "tools/codex-monster-sheet.py"`를 쓰면 루프 자신과 일치해 끝나지 않는다. `pkill -f`도 같은 이유로 셸을 죽일 수 있다.

- 장면(0.141): `"kind":"scene"`(불투명 가로 그림, 폭 1024 이상·가로가 세로의 1.3배 이상) 사양 `art/dungeons0141/scenes.json` → `python3 tools/pack-dungeons0141.py`(768×512 webp). UI 배경으로 쓰는 그림은 '가운데 위쪽에 주제, 아래 30%는 어둡게, 글자·인물 없음'을 프롬프트에 넣는다.

- 스킬 이펙트(0.142): `art/skills0142/anim.json`(0.137 키 아트를 '모양·방향 참고만'으로 첨부, 프롬프트에 스킬별 `palette`와 '선명한 셀 셰이딩·각진 파편, 깃털·꽃잎 금지') → `python3 tools/pack-skills0142.py`. 반복형 원(잔월진·표식·자세)은 광채가 칸을 채워 자동 검사(완전 투명 30%)에 늘 걸리니 실패본의 알파를 확인하고 눈으로 골라 `anim-<id>.png`로 복사한다. 생성기 프로세스를 멈출 땐 `kill <PID>`만 쓴다(`ps|grep|kill` 묶음이 셸을 죽였다).

## tools/ (0.140: `set-module-version.py X.Y.Z` = dist 전체 모듈 쿼리 통일·버전 올리기)

## tools/ 원래 목록 (0.130.1 정리 후 16개, 0.131에서 simulate-campaign0131, 0.136에서 benchmark-bossrush0136 추가)
- 벤치마크·시뮬레이션: `simulate-campaign0133.mjs`(정책별 60챕터, 0.133), `simulate-campaign0131.mjs`(60챕터 캠페인, 시드당 약 11분, `node tools/simulate-campaign0131.mjs dist <시드> [마지막 챕터]`), `benchmark-raids0123.mjs`, `benchmark-skills0128.mjs`, `benchmark-replays.mjs`, `simulate-stage-b.mjs`, `simulate-stage-c.mjs`, `measure-skills049/054.mjs`(저장소 루트에서 실행, 결과는 `tools/reports/`에 씀).
- 원화: `codex-monster-sheet.py`(Codex 생성+검사), 포장 `pack-monsters0106.py`·`pack-environment0107.py`·`pack-equipment0109.py`·`pack-ancient0112.py`·`pack-ancient0119.py`·`pack-accessories0122.py`·`pack-raid0123.py`·`pack-seals0136.py`·`pack-skills0137.py`·`pack-equipment0140.py`(1~3지역 던전 장신구 페이지 + 제작 원화 페이지, 0.41 원본 사본은 `art/equipment0140`), 아이콘 `make-beast-icons0125.py`. 포장 스크립트는 `art/` 원본을 읽고 `tools/reports/`에 측정 결과를 쓴다.
- `tools/reports/`에는 테스트가 읽는 기준 파일(stage-b-baseline 4개, stage-c/baseline-v12, alpha045/065-monsters, equipment-sockets-alpha091, lirian-alpha081-alignment)과 최근 밸런스 측정(0123 레이드, 0128 스킬)만 남겼다. README의 옛 절이 가리키는 다른 리포트·Codex 전용 렌더/검수 스크립트(@napi-rs/canvas, 없는 기준 커밋 git show), 옛 포장기, QA html은 0.130.1에서 지웠다(git 기록에 있음). index.html의 인라인 스킨 스타일을 넣은 `apply-common-ui-v2.py`도 지웠으니 인라인 스타일은 손으로 고친다.

- 승화 제작(0.142): `art/forge0142/sheets.json`(forge-1 무기·투구·갑옷·각반·장화, forge-2 목걸이·귀걸이·재료 3종) → `python3 tools/pack-forge0142.py`(입력 사본 craft-equipment-v0140.webp·materials-v0141.webp가 같은 폴더에 있음). 사양의 `style` 경로가 없으면 생성기가 그림을 만든 뒤 기록 단계에서 멈춘다(0.142에서 겪음) — 경로를 먼저 확인.
- 악몽 콘텐츠(0.142): `art/nightmare0142`(bosses/bosses.json 보스 시트, ancients.json 고대 5점, scenes.json 장면 2장, icons.json nm-1). 포장 순서 `pack-forge0142.py` → `pack-monsters0106.py art/nightmare0142/bosses v0142` → `pack-nightmare0142.py`(뒤 둘이 manifest를 고치므로 순서 지킬 것). `pack-monsters0106.py`는 이제 delivery에서 같은 태그의 `monsters-` 항목만 지운다(전엔 `craft-equipment-v0142` 등도 지워 404). 장면 스타일 그림의 인물이 새어 들어오면 프롬프트에 'NO figures'. 같은 id 작업 둘은 `.codex-work`에서 겹치니 id를 다르게.
- 사냥 지도 지역 배경(0.143): `art/maps0143/scenes.json`(r1~r6, `kind:scene`, 스타일 `hunt-map-forest-v036.webp`, 가운데 띠에 길·가장자리 어둡게) → `python3 tools/pack-maps0143.py`(1280×853 webp). 생성기 두 개를 동시에 돌려 약 10분.

- 성장 트리 연결선(0.147.2): `art/tree0147/branches.json`(sprite, 4줄 가로 줄기, 스타일 `art/growth0139/node-1.png`) → `python3 tools/pack-tree0147.py`(줄기 4개를 잘라 512×44, 4줄 webp). 첫 시도 통과, 약 2분.

- 상태 효과 아이콘(0.149.3): `art/status0149/icons.json`(sprite, minParts 6, 3×2 여섯 칸 모두, 스타일 `growth-tree-v0139.webp`) → `python3 tools/pack-status0149.py`(64px, 6×2 webp). 두 장 병렬, 첫 시도 통과, 약 3분.
