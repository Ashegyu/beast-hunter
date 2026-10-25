# Alpha 0.118 장식물·몬스터 공격 효과 (Codex CLI 생성)

사양 `env.json`. 장식물은 0.9 장식물 아틀라스를, 공격 효과는 `art/monster-effects069/forest-original.png`(숲 효과 시트, 4×4 배치 그대로)를 기준으로 첨부했습니다. 포장: `python3 tools/pack-environment0107.py`(장식물은 최대 360px로 줄여 `props_chapters-v0118` 16~27번 프레임, 효과는 `monsterEffects` 5·6·7).

| 시트 | 내용 | 생성 시도 |
|---|---|---|
| `props-sea` | 산호, 따개비 돛대 그루터기, 다시마 덤불, 진주 조개 | 1 |
| `props-sky` | 바람에 휜 나무, 깃발 걸린 돌기둥, 번개 피뢰침 첨탑, 하늘 수정 | 1 |
| `props-divine` | 날개 천사 석상, 부서진 대리석 기둥, 황금 화로, 별빛 수정 | 1 |
| `fx-sea` | 물결 베기 · 물방울 탄 · 물기둥 충격 · 물살 돌진 | 1 |
| `fx-sky` | 바람 칼날 · 구슬 번개 · 낙뢰 충격 · 급강하 잔상 | 1 |
| `fx-divine` | 성광 베기 · 별빛 구슬 · 성인 폭발 · 빛줄기 돌격 | 2 (첫 시도 투명도 부족) |
