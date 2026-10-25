# Alpha 0.118 지형 원화 (Codex CLI 생성)

31~60장 지형 30장. 사양 `terrain.json`(`"kind":"terrain"`, 바다는 `terrain-frost-v044`, 하늘은 `terrain-forest-v044`, 신역은 `terrain-ruins-v044`를 질감 기준으로 첨부), 기록 `prompts/<id>.json`(마지막 생성만 남음). 포장: `python3 tools/pack-environment0107.py`.

게임은 지형을 좌우·상하로 번갈아 뒤집어 반복하므로, 대각선 띠가 있는 타일은 화면에서 큰 X자·마름모 무늬가 됩니다. 첫 생성 14장을 2×2 거울 배치로 확인한 뒤 모든 사양에 `LAYOUT:` 문구(대각선 띠·한 방향 줄무늬 금지, 둥근 덩어리를 고르게)를 더했고, 그래도 무늬가 강했던 타일은 `STRICT:` 문구를 더해 다시 만들었습니다.

| 챕터 | 내용 | 비고 |
|---|---|---|
| 31 | Coral reef shore | 2회째 채택 |
| 32 | Shipwreck graveyard seabed | 첫 생성 채택 |
| 33 | Kelp forest seabed | 3회째 채택(STRICT) |
| 34 | Pearl cave floor | 첫 생성 채택 |
| 35 | Siren reef | 3회째 채택(얼음 결정처럼 나와 설명을 바꾸고 STRICT) |
| 36 | Deep sea trench edge | 2회째 채택(STRICT) |
| 37 | Jellyfish colony seabed | 2회째 채택 |
| 38 | Sunken temple floor | 첫 생성 채택 |
| 39 | Kraken lair seabed | 첫 생성 채택 |
| 40 | Abyssal sea throne | 첫 생성 채택 |
| 41 | Floating isle meadow | 2회째 채택 |
| 42 | Wind canyon floor | 2회째 채택(STRICT) |
| 43 | Cloud bridge | 3회째 채택(STRICT) |
| 44 | Feather temple floor | 첫 생성 채택 |
| 45 | Broken windmill isle ground | 첫 생성 채택 |
| 46 | Lightning spire ground | 첫 생성 채택 |
| 47 | Eye of the storm | 첫 생성 채택 |
| 48 | Thunder forge floor | 첫 생성 채택 |
| 49 | Thunderbolt altar ground | 첫 생성 채택 |
| 50 | Sky throne floor | 2회째 채택(STRICT, 약한 마름모 무늬는 대리석 바닥으로 유지) |
| 51 | Golden temple steps | 첫 생성 채택 |
| 52 | Garden of light | 첫 생성 채택 |
| 53 | Starlit corridor | 첫 생성 채택 |
| 54 | Choir ruins floor | 첫 생성 채택 |
| 55 | Court of judgement | 첫 생성 채택 |
| 56 | Collapsing heaven | 첫 생성 채택 |
| 57 | Sea of broken stars | 첫 생성 채택 |
| 58 | Gate of eternity | 첫 생성 채택 |
| 59 | Graveyard of gods | 첫 생성 채택 |
| 60 | Sun throne floor | 첫 생성 채택 |
