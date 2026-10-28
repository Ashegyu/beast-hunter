# Alpha 0.140 장비 원화 (Codex CLI 생성)

옛 원화를 쓰던 두 곳을 새로 그렸습니다. 장마다 5점을 3×2로 그리고 오른쪽 아래 칸은 비웠습니다. 사양 `sheets.json`(`"kind":"sprite","minParts":5`, 칸 순서의 아이디 `items`), 기록 `prompts/<id>.json`. 두 장 모두 첫 시도에 통과했고 모아보기로 눈 검수했습니다.

- `acc-1`: 1~3지역 성장 던전 장신구. 스타일 기준은 0.122 장신구 페이지 `equipment-accessories-v0122`. 그전에는 1~3지역 목걸이가 0.9 부적 원화(숲·폐성·서리)를 썼고, 기본 카탈로그의 2·3티어가 폐성·서리라 불과 얼음의 땅에서 폐성 장신구가, 어둠의 심연에서 서리 장신구가 나왔습니다.
- `craft-1`: 제작 부위 5종(투구·각반·장화·귀걸이·리리안 성물). 스타일 기준은 0.41 제작 장비 페이지 `craft-equipment-v041`(이 폴더에 원본 사본을 둠, 다시 포장할 때 씀). 그전에는 공용 부위 아이콘(`equipment-parts-v0970`)을 썼습니다.
- 포장: `python3 tools/pack-equipment0140.py` → `equipment-accessories-v0140`(1264×256, 무손실, `manifest.equipment.setFrames`) · `craft-equipment-v0140`(1536×2048, 위쪽은 0.41 페이지 그대로, 아래 512px 칸 5개에 새 원화를 옛 원화 평균 크기(469px)로 배치, webp q90, `manifest.craftedPresentation`). 0.41 페이지는 dist에서 지웠습니다.

| 시트 | 아이디 | 내용 |
|---|---|---|
| `acc-1` | `acc_t1_charm` | 붉은 숲 목걸이(뿌리에 감싼 호박·단풍잎) |
| `acc-1` | `acc_t2_charm` | 불과 얼음 목걸이(반은 용암, 반은 얼음 결정) |
| `acc-1` | `acc_t3_charm` | 어둠의 심연 목걸이(소용돌이 공허의 눈·사슬) |
| `acc-1` | `acc_r2_earring` | 화빙 결정 귀걸이(불꽃 결정 + 얼음 조각) |
| `acc-1` | `acc_r3_earring` | 심연 혼불 귀걸이(자수정·보라 혼불) |
| `craft-1` | `crafted-helmet` | 수호 장인의 투구(청색 결정 볏) |
| `craft-1` | `crafted-pants` | 추적 장인의 각반(핏빛 결정) |
| `craft-1` | `crafted-boots` | 서리 장인의 장화(얼음 가시) |
| `craft-1` | `crafted-earring` | 별빛 장인의 귀걸이(분홍·보라 별 결정) |
| `craft-1` | `crafted-special` | 리리안의 적월 성물(붉은 초승달 결정·청록 룬) |
