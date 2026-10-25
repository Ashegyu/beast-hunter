# Alpha 0.122 장신구 원화 (Codex CLI 생성)

1~6지역 귀걸이·리리안 인장(전용)과 4~6지역 목걸이, 모두 15점입니다. 그전에는 귀걸이·인장이 같은 티어의 부적 원화를 함께 썼고, 4~6지역 장신구는 없었습니다. 장마다 5점을 3×2로 그리고 오른쪽 아래 칸은 비웠습니다. 사양 `sheets.json`(`"kind":"sprite","minParts":5`, 기존 장비 아틀라스 `equipment_chapters-v09`를 스타일 기준으로 첨부, 칸 순서의 원화 아이디 `items`), 기록 `prompts/<id>.json`. 3장 모두 첫 시도에 통과했고 모아보기로 눈 검수했습니다.

- 포장: `python3 tools/pack-accessories0122.py` → `equipment-accessories-v0122`(1200×752, 15프레임, 최대 240px). 프레임은 `manifest.equipment.setFrames`에 들어가 세트 장비와 같은 경로(`gearFrame`)로 그려집니다.
- 데이터: 원화 목록은 `dist/chapters.js` `ACCESSORY_ART`, 4~6지역 장신구는 `dist/loot.js` `ACCESSORY_CATALOG`.

| 시트 | 원화 아이디 | 내용 |
|---|---|---|
| `acc-1` | `acc_t1_earring` | 붉은 숲 귀걸이(단풍잎·호박) |
| `acc-1` | `acc_t1_seal` | 리리안의 적월 인장(붉은 초승달) |
| `acc-1` | `acc_t2_earring` | 폐성 수호자의 귀걸이(성탑·보라 불꽃) |
| `acc-1` | `acc_t2_seal` | 리리안의 망령 인장(해골·사슬) |
| `acc-1` | `acc_t3_earring` | 서리결 귀걸이(눈꽃 수정) |
| `acc-2` | `acc_t3_seal` | 리리안의 서리 인장(얼음 초승달) |
| `acc-2` | `acc_t4_charm` | 4지역 목걸이(조개 진주) |
| `acc-2` | `acc_t4_earring` | 심해 산호 귀걸이 |
| `acc-2` | `acc_t4_seal` | 리리안의 해류 인장(삼지창) |
| `acc-2` | `acc_t5_charm` | 5지역 목걸이(깃털·번개 수정) |
| `acc-3` | `acc_t5_earring` | 뇌운 귀걸이(번개·날개) |
| `acc-3` | `acc_t5_seal` | 리리안의 뇌운 인장(날개·뇌운) |
| `acc-3` | `acc_t6_charm` | 6지역 목걸이(태양 원반) |
| `acc-3` | `acc_t6_earring` | 황혼 성륜 귀걸이(후광) |
| `acc-3` | `acc_t6_seal` | 리리안의 성휘 인장(일식) |
