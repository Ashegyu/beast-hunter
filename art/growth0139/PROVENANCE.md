# Alpha 0.139 성장 트리 노드 아이콘 (Codex CLI 생성)

성장 트리 그물(노드 81개)의 아이콘 49점: 주요·핵심 노드 31점은 노드마다 하나, 작은 노드 17종은 첫 효과 종류(`t-<효과 키>`)마다 하나, 중심 1점.
영역 색: 검귀 진홍 테, 수호자 에메랄드 테, 검술사 사파이어 테, 다리·남쪽 보법·중심 금빛 테, 작은 노드 수수한 은빛 테. 핵심 노드는 더 크고 가시 달린 장식 테.
장마다 4×2(빈칸은 오른쪽 아래) 7점, 사양 `sheets.json`(`"kind":"sprite"`, `minParts` 7, 칸 순서의 아이콘 아이디 `items`), 기록 `prompts/<id>.json`.
스타일 기준 `style-ref.png`는 기존 스킬 아이콘 8장(`dist/assets/skills/`의 crescent·draw·parry·field·mark·bloodmoon·stance·gale)을 4×2로 모은 것.

- 생성: `python3 tools/codex-monster-sheet.py art/growth0139/sheets.json node-1 … node-7 --attempts 3` (codex-cli 0.164, 7장 병렬). node-1·3·5·6·7은 첫 시도, node-2는 세 번째 시도에 통과.
- node-4는 세 번 모두 자동 검사(떨어진 물체 7개)에 떨어졌다. 핵심 노드 테두리 가시가 이웃 아이콘에 닿아 물체 수가 6개로 잡힌 것뿐이고 눈으로 보면 7점이 모두 칸 안에 제대로 있어서, 두 번째 시도(`.codex-work/node-4-try2.png`)를 `node-4.png`로 채택했다(포장기는 물체가 아니라 칸으로 자른다).
- 포장: `python3 tools/pack-growth0139.py` → `dist/assets/growth-tree-v0139.webp`(672×672, 96px × 7열, `sheets.json` 순서). 노드 버튼의 위치·아이콘 좌표는 `node tools/make-growth-tree0139.mjs`가 `dist/index.html`에 쓴다.
- 모아보기로 눈 검수했다.

| 시트 | 아이콘 (칸 순서) |
|---|---|
| `node-1` | `blade-n` · `blade-a3` · `blade-a6` · `blade-a7` · `blade-b3` · `blade-b6` · `blade-b7` |
| `node-2` | `blade-m2` · `blade-m7` · `bw-2` · `ab-n` · `ab-l3` · `ab-r3` · `core` |
| `node-3` | `ward-n` · `ward-u2` · `ward-a2` · `ward-a4` · `ward-a6` · `ward-b2` · `ward-b4` |
| `node-4` | `ward-b6` · `wa-2` · `art-n` · `art-a3` · `art-a6` · `art-a7` · `art-b3` |
| `node-5` | `art-b6` · `art-b7` · `art-m2` · `art-m7` · `t-staminaRegen` · `t-skillCooldown` · `t-skillArea` |
| `node-6` | `t-damagePct` · `t-attackSpeed` · `t-crit` · `t-execute` · `t-finisher` · `t-range` · `t-speed` |
| `node-7` | `t-hpPct` · `t-reduction` · `t-lowHpGuard` · `t-regeneration` · `t-drain` · `t-skillDamage` · `t-skillFury` |

## 0.149.9 정화의 맹세 (node-8)
- 핵심 노드 `ward-21` '정화의 맹세' 아이콘 1점(`ward-purify`). Codex가 4×2 격자의 첫 칸보다 크게 그려 원본은 `node-8-source.png`로 두고, 같은 그림을 알파 경계로 잘라 첫 칸의 82%로 줄여 `node-8.png`에 다시 놓았다(픽셀은 크기만 바꿈). 첫 시도 통과·눈 검수.
- 아틀라스가 7행 → 8행이 되어 layout-fit.css의 `growth-tree-v0139.webp` 배경 크기를 700% 800%로 바꾸고 `node tools/make-growth-tree0139.mjs`로 트리 DOM을 다시 썼다.
