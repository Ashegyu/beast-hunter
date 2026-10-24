# Alpha 0.106 지형 원화 (Codex CLI 생성)

`codex exec` 내장 `image_gen`으로 만든 반복 바닥 타일 6장입니다. 사양은 `terrain.json`, 시도 기록은 `prompts/<id>.json`에 있습니다. 각 지역의 기존 타일(`terrain-*-v044`)을 스타일 기준 이미지로 붙이고, Alpha 0.44 지형 프롬프트의 공통 조건(위에서 본 평면, 조명·그림자 없음, 차분한 질감)을 그대로 썼습니다.

| 지역 | 2단계(4~6장) | 3단계(7~10장) |
|---|---|---|
| 붉은 숲 | `terrain-forest-2` 늪지 | `terrain-forest-3` 핏빛 수림 |
| 망자의 폐성 | `terrain-ruins-2` 지하 묘실 석판 | `terrain-ruins-3` 왕실 묘당 |
| 서리 왕좌 | `terrain-frost-2` 얼어붙은 호수 | `terrain-frost-3` 빙하 고개 |

2단계 타일의 첫 생성본 3장은 기존 타일과 거의 구분되지 않아 버리고, "한눈에 다르게" 조건을 더해 다시 만들었습니다. 1단계(1~3장)는 기존 타일을 그대로 씁니다.

`tools/pack-terrain0106.py`가 무손실 WebP로 내보내고(디코딩 RGB 동일 확인) `manifest.chapters['<지역>.<단계>']`에 등록합니다. 측정값: `tools/reports/alpha0106-terrain.json`.
