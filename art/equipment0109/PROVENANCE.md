# Alpha 0.109 챕터 세트 장비 원화 (Codex CLI 생성)

30챕터가 모두 고유 세트를 갖도록 세트 원화 26장을 새로 만들었습니다(1·11·16·21장은 0.108의 `art/equipment0108` 원화 재사용). 장마다 같은 세트의 검, 두 번째 무기, 투구, 상의, 하의, 신발 6점을 3×2로 그렸고, 디자인은 그 챕터 보스를 주제로 했습니다. 사양 `sets.json`(`"kind":"sprite","minParts":6`, 기존 장비 아틀라스 `equipment_chapters-v09`를 스타일 기준으로 첨부), 기록 `prompts/<id>.json`.

| 챕터 | 시트 | 세트 | 두 번째 무기 |
|---|---|---|---|
| 2 | `set-wolf` | 늑대왕의 송곳니 | 사냥 곡도 |
| 3 | `set-goblin` | 고블린 약탈자 | 톱날 대검 |
| 4 | `set-thorn` | 가시덤불 수호자 | 가시 대검 |
| 5 | `set-spore` | 독버섯 포자 | 독침 세검 |
| 6 | `set-orc` | 오크 대장군 | 도끼날 대검 |
| 7 | `set-mandrake` | 맨드레이크 여왕 | 덩굴 곡검 |
| 8 | `set-spider` | 거미 여왕 | 갈래 단검 |
| 9 | `set-bloodbear` | 핏빛 곰 | 발톱 대검 |
| 10 | `set-worldtree` | 세계수의 가호 | 뿌리 대검 |
| 12 | `set-ifrit` | 이프리트의 열기 | 초승 곡검 |
| 13 | `set-lavagiant` | 용암 거인 | 바위 대검 |
| 14 | `set-phoenix` | 불사조의 깃 | 깃털 세검 |
| 15 | `set-minotaur` | 화염 미노타우로스 | 양날 도끼검 |
| 17 | `set-seadragon` | 얼음 해룡 | 물결 곡검 |
| 18 | `set-blizzard` | 눈보라 마녀 | 결정 마검 |
| 19 | `set-glacierturtle` | 빙하 거북 | 방패날 대검 |
| 20 | `set-twindragon` | 염빙 쌍두룡 | 용머리 대검 |
| 22 | `set-ghoul` | 구울 군주 | 갈고리 대검 |
| 23 | `set-vampire` | 흡혈 군주 | 박쥐날 곡검 |
| 24 | `set-necro` | 대사령술사 | 낫날 대검 |
| 25 | `set-cursedknight` | 저주받은 기사단 | 양손 대검 |
| 26 | `set-banshee` | 그림자 밴시 | 유령 곡검 |
| 27 | `set-mimic` | 미믹의 탐욕 | 이빨 대검 |
| 28 | `set-mummy` | 미라 왕 | 코페시 |
| 29 | `set-royalguard` | 왕의 근위대 | 의장 대검 |
| 30 | `set-abyss` | 심연의 군주 | 공허 대검 |

26장 모두 첫 생성에서 자동 검사를 통과했고, 모아보기 이미지로 눈으로 검수해 채택했습니다.

포장: `python3 tools/pack-equipment0109.py` — 시트의 단단한 조각(불투명도 128 이상)마다 중심점이 속한 3×2 칸으로 물건을 묶고(신발 한 켤레·가는 세검처럼 여러 조각인 물건, 칸 선을 넘는 대각선 칼날 대응), 옅은 번짐은 가장 가까운 조각에, 아주 작은 부스러기는 버립니다. 최대 240px로 줄여 지역별 페이지 `equipment-sets-r1/r2/r3-v0109`(세트당 한 줄)에 배치하고 `manifest.equipment.setFrames`/`pages`에 등록합니다. 측정값 `tools/reports/alpha0109-equipment.json`.
