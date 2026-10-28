---
name: beast-hunter-ui
description: 괴수 사냥꾼 UI 레이아웃 원칙과 CSS 함정(공통 스킨 선택자 우선순위, 홈 메뉴 배치, 결과 창, 틀 맞춤·자동 레이아웃 점검 방법). index.html·*.css·app.js 화면을 고치거나 레이아웃을 검수할 때 읽는다.
---

# beast-hunter-ui

CLAUDE.md에서 옮겨 온 작업 메모. 내용이 바뀌면 이 파일을 고친다.

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
- 결과 창(0.129, 사용자 요청 '정보가 너무 많아, 스크롤 없이'): 수치 4칸·장비 아이콘 한 줄·레벨 한 줄 + 오른쪽 버튼만 보이고 나머지는 layout-fit.css 0.129 블록에서 숨김(DOM·갱신 코드는 남음). 0.135.3: 보스 고대·괴수 기술 줄(`#result-boss-ancients`)은 오른쪽 버튼 칸 아래에 absolute로 띄움(왼쪽 칸에 두면 잘림). 0.135.4: 획득 칸은 '장비 | 재료' 탭(`result-loot-tab-gear/materials`, 재료 칸 `result-mat-<id>`, 엔진 `s.run.materialLedger`)과 '더보기'(`result-loot-more`, `#result-content[data-loot-expanded]`로 왼쪽 칸 전체를 펼쳐 페이지 넘김). 결과 창 검수는 Playwright `page.clock.install()` 후 `clock.runFor`로 빨리 감아 판을 끝낸다(실시간으론 수 분). 0.136: 던전·레이드·보스 러시 결과는 `#dungeon-result-rewards`를 한 줄로 두고 `.result-stats`를 숨긴다(`:has`). 숨긴 요소에 정보를 다시 늘리지 말 것.
- 틀 맞춤 점검(0.130): 자식이 부모의 테두리 안쪽을 넘는지(위치 absolute 제외)와 `[data-common-skin]`의 ::before/::after 장식 틀 크기가 요소와 다른지를 재는 스크립트로 확인한다. 공통 스킨 틀이 작게 그려지면 옛 CSS의 `:before{margin-right}` 같은 잔재를 의심(제작 목표 버튼). `#game-shell`은 `word-break:keep-all`.
- 자동 레이아웃 점검: 저장 프로필을 만들어 localStorage에 넣고 Playwright로 각 화면을 돌며 화면 밖 버튼·가림·글자 잘림·스크롤 영역을 측정했다. 접힌 `<details>` 내용과 2px로 접어 둔 예전 버튼(#codex-back, #inventory-note)은 오탐이다.
- 제작 화면(0.141): layout-fit.css 끝 '제작 화면 새 디자인' 블록. 옛 craft.css·style.css·theme.css·layout-fit 초반 규칙이 `#game-shell[data-panel=craft] #craft-content ...`로 grid-auto-flow·width:max-content·row-gap·display:flex 등을 걸어 둬서 새 규칙은 `#game-shell#game-shell#game-shell`(아이디 3~4개)로 이긴다. 어떤 규칙이 이기는지는 CDP `CSS.getMatchedStylesForNode`로 뽑으면 빠르다. 효과 설명(`details.unique-summary`)은 원화 판(.craft-caption) 안으로 옮겼고 `open` 고정, `#craft-equip`은 `.craft-purchase` 안 제작하기 자리. 재료 카드는 `@container mats`(재료 칸 크기)로 그림+숫자 ↔ 그림·이름·숫자를 고른다 — 아래 문구가 늘면 칸이 줄어서 뷰포트 @media로는 못 맞춘다. 각인 격자 글자 크기도 `@container insc`.
- 숫자 표기(0.142, 사용자 요청): 퍼센트가 아닌 수치는 소수점 없이(피해·체력·초는 정수, 대기 시간은 올림), 배율은 `pctOf`/`timesText`로 '136%'. 새 화면에 toFixed를 쓸 땐 % 수치에만.
- 스킬 갈래 보기(0.142): 단계 탭 `skill-tier-0..3`(높이 20px) + 카드 `skill-branch-0..2`(이름·효과 nowrap 한 줄, 설명은 max-height 360 이상에서만) + 안내 `skill-branch-note` 한 줄(비용·보유만, 긴 설명은 title). 568×320 패시브 이름이 가장 길어 글자 10px·자간 −.2px로 맞춤. 잠긴 단계 표시는 '스킬 Lv.N 필요' 대신 'Lv.N 필요'. 규칙은 layout-fit.css 끝 0.142 스킬 갈래 3단 주석 블록.
