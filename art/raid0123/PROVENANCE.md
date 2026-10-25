# Alpha 0.123 레이드 원화 (Codex CLI 생성)

- 레이드 보스 3종(25포즈 시트): `bosses/bosses.json`(스타일 `art/monsters045/frost_king.png`, 참고 `art/monsters065/references/encyclopedia-3.png`), 기록 `bosses/prompts/<id>.json`. 3장 모두 첫 시도 통과, 눈 검수함.
  - `raid_colossus` 강철 거신 · `raid_queen` 군단의 여왕 · `raid_judge` 황혼의 심판자
  - 포장: `python3 tools/pack-monsters0106.py art/raid0123/bosses v0123` → `monsters-raid_*-v0123` 아틀라스 3장.
- 레이드 고대 15점(레이드마다 무기·투구·상의·목걸이·인장): `ancients.json`(`"kind":"sprite","minParts":5`, 스타일 `ancient-individual-v019`, 칸 순서 `items`), 기록 `prompts/<id>.json`. 3장 모두 첫 시도 통과, 눈 검수함.
  - 포장: `python3 tools/pack-raid0123.py` → `ancient-individual-v0123`(2240×3712, 165프레임). 0.119 패커를 다시 돌렸다면 이어서 돌린다.
- 데이터: `dist/raids.js`(레이드·주간 입장·보상·레이드 고대 목록), `dist/ancient-powers.js` `RAID_POWERS`, `dist/chapters.js` `RAID_BOSSES`.
