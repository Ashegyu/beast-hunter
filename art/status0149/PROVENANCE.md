# Alpha 0.149.3 상태 효과 아이콘 (Codex CLI 생성)

전투 상태 칩 앞에 붙는 둥근 아이콘 12점. 사양 `icons.json`(`"kind":"sprite","minParts":6`, 3×2 여섯 칸 모두 사용, 스타일 기준 성장 트리 아이콘 `growth-tree-v0139`), 기록 `prompts/<id>.json`. 두 장 모두 첫 시도에 통과했고 모아보기로 눈 검수했다.

- status-1: 화상 burn · 동상 frost · 저주 curse · 부식 corrode · 봉인 sealed · 정화의 기세 purified
- status-2: 해체됨 dispelled · 신성 보호막 holyShield · 격노 fury · 방어 태세 stance · 재생 regen · 가호 ward
- 포장: `python3 tools/pack-status0149.py` → `dist/assets/status-icons-v0149.webp`(6×2, 64px 칸). layout-fit.css가 `.status-chip[data-status]::before`로 위치를 고른다.
