# Alpha 0.106 몬스터 원화 (Codex CLI 생성)

`codex exec`(codex-cli 0.164, ChatGPT 로그인)의 내장 `image_gen` 도구로 만든 5방향 × 5동작(걷기 2·공격 2·사망 1) 투명 시트입니다. 코드로 그리거나 화소를 고치지 않았습니다.

- 생성기: `tools/codex-monster-sheet.py SPEC.json ID...`. 사양 `bosses.json`, `regulars.json`에서 프롬프트를 만들고 `codex exec -i <스타일 기준> -i <백과 이미지>`로 한 장씩 생성합니다.
- 스타일 기준: 보스는 `art/monsters045/{forest_guardian,ruins_king,frost_king}.png`, 일반 몬스터는 지역의 `forest_wolf`·`ruins_skeleton`·`frost_wolf` 시트. 주제 참고: `art/monsters065/references/encyclopedia-3.png`(사용자 몬스터 백과).
- 자동 검수: 실제 투명도 25% 이상, 서로 떨어진 몸체 25개, 줄 단위 5×5 배치, 가장자리 미접촉, 걷기 몸 높이 120px 이상. 통과하지 못하면 다시 생성합니다. 실패한 시도는 `.codex-work/`(저장소 제외)에 남습니다.
- 시도·프롬프트·참고 이미지 해시·최종 SHA-256: `prompts/<id>.json`.
- 포장: `tools/pack-monsters0106.py`(0.65 포장기와 같은 추출 방식, 무손실 WebP). 보스는 종마다 아틀라스 1장, 일반 몬스터는 지역 × (기본 a / 특수 b) 아틀라스. 측정값: `tools/reports/alpha0106-monsters.json`.

## 챕터 보스 27종

| 챕터 | 보스 | id | 생성 시도 |
|---|---|---|---|
| 1 | 붉은엄니 멧돼지 | `boss_forest_boar` | 1 |
| 2 | 회색 늑대왕 | `boss_forest_direwolf` | 1 |
| 3 | 고블린 족장 | `boss_forest_goblinchief` | 2 |
| 4 | 가시덩굴 괴수 | `boss_forest_thornbeast` | 1 |
| 5 | 독버섯 왕 | `boss_forest_mushroomking` | 1 |
| 6 | 오크 대장군 | `boss_forest_orcwarlord` | 1 |
| 7 | 맨드레이크 여왕 | `boss_forest_mandrake` | 1 |
| 8 | 거미 여왕 | `boss_forest_spiderqueen` | 2 |
| 9 | 핏빛 곰 | `boss_forest_bloodbear` | 1 |
| 11 | 해골 거인 | `boss_ruins_bonegiant` | 1 |
| 12 | 구울 군주 | `boss_ruins_ghoullord` | 1 |
| 13 | 흡혈 박쥐 군주 | `boss_ruins_vampirebat` | 1 |
| 14 | 대사령술사 | `boss_ruins_lich` | 2 |
| 15 | 저주받은 기사단장 | `boss_ruins_cursedknight` | 1 |
| 16 | 그림자 밴시 | `boss_ruins_banshee` | 1 |
| 17 | 거대 미믹 | `boss_ruins_mimicking` | 1 |
| 18 | 미라 왕 | `boss_ruins_mummyking` | 1 |
| 19 | 근위대장 | `boss_ruins_deathguard` | 1 |
| 21 | 설원 매머드 | `boss_frost_mammoth` | 1 |
| 22 | 얼음 해룡 | `boss_frost_serpent` | 1 |
| 23 | 서리 그리폰 | `boss_frost_griffin` | 1 |
| 24 | 얼음 정령왕 | `boss_frost_elemental` | 1 |
| 25 | 수정 거신 | `boss_frost_colossus` | 1 |
| 26 | 설인 족장 | `boss_frost_yetichief` | 2 |
| 27 | 빙하 거북 | `boss_frost_tortoise` | 1 |
| 28 | 눈보라 마녀 | `boss_frost_witch` | 1 |
| 29 | 서리 와이번 | `boss_frost_wyvern` | 1 |

10·20·30장은 기존 지역 보스(세계수의 수호령·무덤의 왕·빙원의 지배자)를 그대로 씁니다.

## 일반 몬스터 18종

| 지역 | 이름 | id | 역할 | 구분 | 생성 시도 |
|---|---|---|---|---|---|
| 붉은 숲 | 독침 말벌 | `forest_hornet` | 근접 추격 | 기본(1스테이지부터) | 1 |
| 붉은 숲 | 덩굴 드라이어드 | `forest_dryad` | 원거리 | 기본(1스테이지부터) | 1 |
| 붉은 숲 | 이끼 나무 골렘 | `forest_treant` | 중갑 | 기본(1스테이지부터) | 1 |
| 붉은 숲 | 사마귀 전사 | `forest_mantis` | 근접 추격 | 특수(2·3·4스테이지 해금) | 1 |
| 붉은 숲 | 고블린 주술사 | `forest_shaman` | 원거리 | 특수(2·3·4스테이지 해금) | 1 |
| 붉은 숲 | 갑각 장수풍뎅이 | `forest_beetle` | 중갑 | 특수(2·3·4스테이지 해금) | 1 |
| 망자의 폐성 | 해골 사냥개 | `ruins_hound` | 근접 추격 | 기본(1스테이지부터) | 1 |
| 망자의 폐성 | 해골 궁수 | `ruins_archer` | 원거리 | 기본(1스테이지부터) | 1 |
| 망자의 폐성 | 석상 가고일 | `ruins_gargoyle` | 중갑 | 기본(1스테이지부터) | 1 |
| 망자의 폐성 | 역병 쥐 | `ruins_rat` | 근접 추격 | 특수(2·3·4스테이지 해금) | 1 |
| 망자의 폐성 | 부유 눈알 | `ruins_eye` | 원거리 | 특수(2·3·4스테이지 해금) | 1 |
| 망자의 폐성 | 시체 거인 | `ruins_flesh` | 중갑 | 특수(2·3·4스테이지 해금) | 2 |
| 서리 왕좌 | 서리 여우 | `frost_fox` | 근접 추격 | 기본(1스테이지부터) | 1 |
| 서리 왕좌 | 설원 궁수 | `frost_archer` | 원거리 | 기본(1스테이지부터) | 1 |
| 서리 왕좌 | 빙판 곰 | `frost_bear` | 중갑 | 기본(1스테이지부터) | 1 |
| 서리 왕좌 | 서리 올빼미 | `frost_owl` | 근접 추격 | 특수(2·3·4스테이지 해금) | 1 |
| 서리 왕좌 | 얼음 슬라임 | `frost_slime` | 원거리 | 특수(2·3·4스테이지 해금) | 1 |
| 서리 왕좌 | 서리 기사 | `frost_knight` | 중갑 | 특수(2·3·4스테이지 해금) | 1 |

배치: 지역의 1~3장은 기존 6종, 4~6장은 기존 기본 3종 + 새 특수 3종, 7~10장은 새 6종입니다.

검수 메모: 모든 시트를 눈으로 확인했습니다. 일부 보스(독버섯 왕, 얼음 정령왕, 빙하 거북, 대사령술사)는 뒷모습 줄이 앞모습과 비슷하게 그려졌습니다. 게임에서는 쓸 수 있는 수준이라 그대로 두었습니다.

> Alpha 0.107부터 일반 몬스터는 생태별 풀에 들어가 스테이지마다 다른 조합으로 나오고, 일반 몬스터·보스 모두 종마다 아틀라스 1장으로 다시 포장했습니다. 얼음 보스 중 서리 그리폰·얼음 정령왕·수정 거신·설인 족장·서리 와이번과 망자 보스 9종의 배치는 `dist/chapters.js`의 `CHAPTER_ROWS`를 따릅니다(앞의 5종은 현재 미사용).
