# Alpha 0.141 재료 아이콘 (Codex CLI 생성)

재련석·정제석·순수결정·검술서·승급석 5점. 그전에는 다른 재료 그림을 빌려 썼다. 사양 `sheets.json`(`"kind":"sprite","minParts":5`, 스타일 기준 `craft-materials-v041`), 첫 시도에 통과·눈 검수.

- 포장: `python3 tools/pack-materials0141.py` → `dist/assets/materials-v0141.webp`(7×2, 128px, crafting.js `MATERIALS` 순서). 0.41 제작 재료 8점 + 이 5점 + 인장 조각(0.136 인장 페이지)을 한 장에 모은다. 재료 도감이 쓴다.
