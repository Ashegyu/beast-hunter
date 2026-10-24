# Alpha 0.108 지역 세트 장비 원화 (Codex CLI 생성)

지역 생태마다 세트 장비 6점(검, 두 번째 무기, 투구, 상의, 하의, 신발)을 한 장에 그렸습니다. 사양 `sets.json`(`"kind":"sprite","minParts":6`), 기록 `prompts/<id>.json`. 기존 장비 아틀라스(`equipment_chapters-v09`)를 스타일 기준 이미지로 붙여 화풍·크기·검의 대각선 방향(손잡이 왼쪽 아래, 칼끝 오른쪽 위)을 맞췄습니다.

| 시트 | 세트 | 디자인 |
|---|---|---|
| `set-forest.png` | 숲의 사냥꾼 | 검은 나무·껍질·땋은 가죽·붉은 단풍잎·호박 보석·가시덩굴 |
| `set-fire.png` | 화염 군주 | 흑요석·용암 균열·불꽃 장식 |
| `set-frost.png` | 서리 수호자 | 얼음 결정·서리 털·은빛 판금 |
| `set-ruins.png` | 심연의 계약 | 해골·공허 보라 빛·망자 판금 |

네 장 모두 첫 생성에서 자동 검사(투명도, 분리된 물체 6개 이상)를 통과했고 눈으로 검수해 채택했습니다.

포장: `python3 tools/pack-equipment0108.py` — 시트마다 큰 물체 6개를 잘라(투명도 8 이하의 옅은 번짐은 제외) 0.9 장비 원화와 같은 최대 340px로 줄이고, 0.9 장비 아틀라스를 그대로 복사한 아래에 붙여 `equipment_chapters-v0108`을 만듭니다. `manifest.equipment.designIds`에 `set_<세트>_<sword|blade2|helmet|armor|pants|boots>` 24개가 더해집니다. 다시 실행해도 항상 0.9 아틀라스에서 시작합니다. 측정값 `tools/reports/alpha0108-equipment.json`.

0.109부터 이 네 세트는 1·11·16·21장 세트로 쓰이며, 포장은 `tools/pack-equipment0109.py`가 30세트를 지역별 페이지로 묶습니다(`pack-equipment0108.py`와 `equipment_chapters-v0108` 아틀라스는 0.109에서 지움).
