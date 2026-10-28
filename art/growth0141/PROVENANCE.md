# Alpha 0.141 능력치 문장 아이콘 (Codex CLI 생성)

능력치 단련 6종(공격·체력·방어·치명·연격·보법)과 초월 4종(공격·생명·사냥·검술)의 둥근 문장 10점. 사양 `sheets.json`(`"kind":"sprite","minParts":5`, 3×2에서 오른쪽 아래 칸 비움, 스타일 기준 성장 트리 아이콘 `growth-tree-v0139`), 기록 `prompts/<id>.json`. 두 장 모두 첫 시도에 통과했고 모아보기로 눈 검수했다.

- 포장: `python3 tools/pack-growth0141.py` → `dist/assets/growth-stats-v0141.webp`(5×2, 128px 칸, 순서 power vitality guard precision tempo / stride might life slayer arts). layout-fit.css가 `.stat-row[data-stat]`로 위치를 고른다.
