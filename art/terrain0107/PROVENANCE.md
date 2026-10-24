# Alpha 0.107 지형·불 지역 환경 원화 (Codex CLI 생성)

30챕터가 모두 다른 바닥을 쓰도록 지형 타일 21장을 새로 만들었습니다(나머지 9장은 0.44·0.106 타일 재사용). 사양 `terrain.json`, 기록 `prompts/<id>.json`. 각 생태의 기존 타일을 스타일 기준으로 붙이고 0.44 지형 프롬프트의 공통 조건을 그대로 썼습니다.

| 챕터 | 타일 |
|---|---|
| 2 | `terrain-c02` (forest) |
| 3 | `terrain-c03` (forest) |
| 4 | `terrain-c04` (forest) |
| 6 | `terrain-c06` (forest) |
| 7 | `terrain-c07` (forest) |
| 8 | `terrain-c08` (forest) |
| 10 | `terrain-c10` (forest) |
| 11 | `terrain-c11` (fire) |
| 12 | `terrain-c12` (fire) |
| 13 | `terrain-c13` (fire) |
| 14 | `terrain-c14` (fire) |
| 15 | `terrain-c15` (fire) |
| 19 | `terrain-c19` (ice) |
| 20 | `terrain-c20` (ice) |
| 22 | `terrain-c22` (dark) |
| 23 | `terrain-c23` (dark) |
| 24 | `terrain-c24` (dark) |
| 25 | `terrain-c25` (dark) |
| 26 | `terrain-c26` (dark) |
| 27 | `terrain-c27` (dark) |
| 30 | `terrain-c30` (dark) |

재사용: 1장 terrain-forest-v044, 5장 forest-2(늪), 9장 forest-3(핏빛 수림), 16장 frost-v044, 17장 frost-2(호수), 18장 frost-3(빙하 고개), 21장 ruins-v044, 28장 ruins-2(묘실), 29장 ruins-3(왕실 묘당).

불 지역 전용(`art/fire0107`): `props-fire.png` 장식물 4종(불탄 나무, 용암 바위 첨탑, 연기 나는 용암 분출구, 불꽃 수정), `fx-fire.png` 몬스터 공격 효과(0.69 숲 효과 시트를 배치 기준으로 같은 4×4 구성).

포장: `python3 tools/pack-environment0107.py` — 지형은 `manifest.chapters['c1'..'c30']`, 장식물은 기존 0.9 아틀라스를 그대로 복사한 뒤 아래에 불 장식물 4개를 붙인 `props_chapters-v0107`(프레임 12~15), 효과는 `manifest.monsterEffects['4']`. 측정값 `tools/reports/alpha0107-environment.json`.
