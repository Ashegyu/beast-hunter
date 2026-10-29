# Alpha 0.142 악몽 콘텐츠 원화

- 생성: Codex CLI `codex exec` 내장 image_gen, `python3 tools/codex-monster-sheet.py <사양> <id>` (2026-10-29). 프롬프트 기록은 `prompts/`, `bosses/prompts/`.
- `bosses/bosses.json` → `bosses/raid_nightmare.png`: 레이드 보스 '악몽의 군주'(흑요석 갑주·가시 왕관·붉은 눈) 5방향 × 걷기·공격·죽음 시트.
- `ancients.json` → `raid-nightmare.png`: 레이드 고대 5점(가시검·가시 왕관 투구·흑요 흉갑·악몽의 눈 목걸이·가시 귀걸이). 3×2 칸, 오른쪽 아래 비움. 스타일 첨부 `ancient-individual-v0123.webp`.
- `scenes.json` → `rift.png`(심연의 균열), `raid-nightmare-scene.png`(악몽의 군주 레이드 장면). 스타일 `dungeon-tower-v0141`.
  첫 시도의 레이드 장면은 스타일 그림의 심판자 천사가 그대로 새어 들어와 버렸고, 프롬프트에 'NO figures'를 넣어 다시 만들었다.
  처음 장면 id를 `raid-nightmare`로 두었다가 고대 시트와 작업 폴더(`.codex-work`)가 겹쳐 `raid-nightmare-scene`으로 바꿨다.
- `icons.json` → `nm-1.png`: 초월 수호·초월 질풍 문장, 악몽 결정 재료, 악몽 표식, 균열 아이콘(3×2, 오른쪽 아래 비움).
- 포장 순서: `python3 tools/pack-forge0142.py` → `python3 tools/pack-monsters0106.py art/nightmare0142/bosses v0142` → `python3 tools/pack-nightmare0142.py`.
  결과: `monsters-raid_nightmare-v0142`(보스 아틀라스), `ancient-individual-v0142`(고대 170칸, v0123 대체), `growth-stats-v0142`(초월 문장 2칸 추가),
  `materials-v0142` 17번 칸(악몽 결정), `dungeon-rift-v0142.webp`, `dungeon-raid-sovereign-v0142.webp`.
  `growth-stats-v0141.webp`는 패커 입력용 사본이다.
