# art/tree0147 — 성장 트리 연결선 (Alpha 0.147.1)

- `branch-1.png`: Codex CLI 0.164 `codex exec` 내장 image_gen, `tools/codex-monster-sheet.py art/tree0147/branches.json branch-1` (sprite, 조각 4개), 첫 시도 통과(1774×887, 투명 70.7%). 프롬프트·해시는 `prompts/branch-1.json`.
- 스타일 참고: `art/growth0139/node-1.png`(성장 트리 노드 문장).
- 포장: `python3 tools/pack-tree0147.py` → `dist/assets/tree-branches-v0147.webp`(512×192, 4줄: 가시 가지·잎 덩굴·붉은 결 가지·은 장식 가지). CSS가 연결선마다 한 줄을 가로로 이어 붙여 노드 사이에 눕힌다.
