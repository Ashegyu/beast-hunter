# Alpha 0.142 승화 제작 원화

- 생성: Codex CLI 0.164 `codex exec` 내장 image_gen, `python3 tools/codex-monster-sheet.py art/forge0142/sheets.json forge-1 forge-2` (2026-10-29).
- forge-1: 승화검·투구·갑주·각반·장화 / forge-2: 목걸이·귀걸이 + 4~6지역 재료(심해 진주·폭풍 깃·황혼 성휘). 3×2 칸, 오른쪽 아래 비움.
- 첫 시도에서 둘 다 채택(눈 검수). 당시 사양의 스타일 경로(`dist/assets/craft-equipment-v041.webp`)가 없어 생성기가 프롬프트 기록 단계에서 멈췄고,
  그림은 스타일 첨부 없이 프롬프트만으로 만들어졌다. 사양은 이후 `craft-equipment-v0140.webp`(이 폴더 사본)를 가리키도록 고쳤다.
- 포장: `python3 tools/pack-forge0142.py` → `dist/assets/craft-equipment-v0142.webp`(0.140 제작 페이지 + 승화 7부위), `materials-v0142.webp`(7×3).
  `materials-v0141.webp`·`craft-equipment-v0140.webp`는 패커 입력용으로 이 폴더에 사본을 둔다.
