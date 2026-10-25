# Alpha 0.118 몬스터 원화 (Codex CLI 생성)

`tools/codex-monster-sheet.py`로 `codex exec` 내장 `image_gen`에 생성시켰습니다. 생성·검수·포장 방식은 `art/monsters0106/PROVENANCE.md`와 같고, 사양은 `bosses.json`·`regulars.json`, 시도 기록은 `prompts/<id>.json`에 있습니다.

- 스타일 기준: 일반 몬스터는 `art/monsters045/forest_orc.png`, 보스는 `art/monsters045/frost_king.png`. 주제 참고: 사용자 몬스터 백과 `art/monsters065/references/encyclopedia-3.png`.
- 포장: `python3 tools/pack-monsters0106.py art/monsters0118 v0118` (종마다 아틀라스 1장).
- 66장 모두 자동 검사(투명도·25포즈·5×5·가장자리)를 첫 시도에 통과했고, 모아보기 이미지로 눈 검수했습니다.

## 보스 30종

| 챕터 | 지형 | 보스 | id | 생성 시도 |
|---|---|---|---|---|
| 31 | 산호초 해안 | 거대 집게 게왕 | `boss_sea_crabking` | 1 |
| 32 | 침몰선의 묘지 | 유령 선장 | `boss_sea_ghostcaptain` | 1 |
| 33 | 해초의 숲 | 해초 마녀 | `boss_sea_kelpwitch` | 1 |
| 34 | 진주 동굴 | 진주 대왕조개 | `boss_sea_giantclam` | 1 |
| 35 | 세이렌의 암초 | 세이렌 여왕 | `boss_sea_sirenqueen` | 1 |
| 36 | 심해 해구 입구 | 심해 아귀 | `boss_sea_anglerfish` | 1 |
| 37 | 해파리 군락 | 거대 독해파리 | `boss_sea_jellyfish` | 1 |
| 38 | 가라앉은 신전 | 인어 대사제 | `boss_sea_merpriest` | 1 |
| 39 | 크라켄의 소굴 | 크라켄 | `boss_sea_kraken` | 1 |
| 40 | 심연의 해저 왕좌 | 심해의 리바이어던 | `boss_special_leviathan` | 1 |
| 41 | 떠다니는 섬 | 그리폰 왕 | `boss_sky_griffinking` | 1 |
| 42 | 바람의 협곡 | 하피 여왕 | `boss_sky_harpyqueen` | 1 |
| 43 | 구름 다리 | 구름 거인 | `boss_sky_cloudgiant` | 1 |
| 44 | 깃털 신전 | 까마귀 장군 | `boss_sky_crowgeneral` | 1 |
| 45 | 부서진 풍차섬 | 바람의 정령왕 | `boss_sky_windlord` | 1 |
| 46 | 번개 첨탑 | 번개 와이번 | `boss_sky_thunderwyvern` | 1 |
| 47 | 폭풍의 눈 | 폭풍의 정령 | `boss_sky_stormelemental` | 1 |
| 48 | 천둥 대장간 | 천둥 거인 대장장이 | `boss_sky_thundersmith` | 1 |
| 49 | 낙뢰의 제단 | 썬더버드 | `boss_sky_thunderbird` | 1 |
| 50 | 하늘 왕좌 | 천둥의 용왕 | `boss_special_stormdragon` | 1 |
| 51 | 황금 신전의 계단 | 신전 수호 석상 | `boss_divine_guardian` | 1 |
| 52 | 빛의 정원 | 황금 스핑크스 | `boss_divine_sphinx` | 1 |
| 53 | 별빛 회랑 | 성좌 기사 | `boss_divine_starknight` | 1 |
| 54 | 성가대의 폐허 | 타락 천사 | `boss_divine_fallenangel` | 1 |
| 55 | 심판의 법정 | 심판관 | `boss_divine_judge` | 1 |
| 56 | 무너지는 하늘 | 시간의 수호자 | `boss_divine_chrono` | 1 |
| 57 | 깨진 별의 바다 | 성좌 뱀 | `boss_divine_starserpent` | 1 |
| 58 | 영원의 문 | 문지기 거신 | `boss_divine_gatekeeper` | 1 |
| 59 | 신들의 묘역 | 타락한 전쟁신 | `boss_divine_wargod` | 1 |
| 60 | 태양의 옥좌 | 몰락한 태양신 | `boss_special_sungod` | 1 |

## 일반 몬스터 36종

| id | 이름 | 역할 | 생성 시도 |
|---|---|---|---|
| `sea_piranha` | 이빨 피라냐 | 근접 추격 | 1 |
| `sea_eel` | 전기 뱀장어 | 근접 추격 | 1 |
| `sea_shrimp` | 갑옷 새우 | 근접 추격 | 1 |
| `sea_crab` | 해적 게 | 근접 추격 | 1 |
| `sea_mermaid` | 인어 궁수 | 원거리 | 1 |
| `sea_puffer` | 가시 복어 | 원거리 | 1 |
| `sea_jelly` | 독 해파리 | 원거리 | 1 |
| `sea_coralwisp` | 산호 정령 | 원거리 | 1 |
| `sea_crabknight` | 게 기사 | 중갑 | 1 |
| `sea_turtle` | 바다거북 전사 | 중갑 | 1 |
| `sea_sharkman` | 상어인 투사 | 중갑 | 1 |
| `sea_coralgolem` | 산호 골렘 | 중갑 | 1 |
| `sky_harpy` | 하피 | 근접 추격 | 1 |
| `sky_hawk` | 폭풍 매 | 근접 추격 | 1 |
| `sky_cloudwolf` | 구름 늑대 | 근접 추격 | 1 |
| `sky_sprite` | 바람 요정 | 근접 추격 | 1 |
| `sky_stormmage` | 폭풍 마법사 | 원거리 | 1 |
| `sky_archer` | 깃털 궁수 | 원거리 | 1 |
| `sky_orb` | 번개 구슬 정령 | 원거리 | 1 |
| `sky_thunderjelly` | 천둥 구름 해파리 | 원거리 | 1 |
| `sky_rockgolem` | 부유석 골렘 | 중갑 | 1 |
| `sky_griffinrider` | 그리폰 기수 | 중갑 | 1 |
| `sky_stormknight` | 폭풍 기사 | 중갑 | 1 |
| `sky_cloudturtle` | 구름 거북 | 중갑 | 1 |
| `divine_cherub` | 천사 병사 | 근접 추격 | 1 |
| `divine_hound` | 황금 수호견 | 근접 추격 | 1 |
| `divine_lion` | 빛의 사자 | 근접 추격 | 1 |
| `divine_wraith` | 시간의 망령 | 근접 추격 | 1 |
| `divine_priest` | 빛의 사제 | 원거리 | 1 |
| `divine_starmage` | 성좌 마법사 | 원거리 | 1 |
| `divine_archer` | 천상 궁수 | 원거리 | 1 |
| `divine_eye` | 심판의 눈 | 원거리 | 1 |
| `divine_golem` | 빛의 골렘 | 중갑 | 1 |
| `divine_paladin` | 타락 성기사 | 중갑 | 1 |
| `divine_statue` | 날개 석상 | 중갑 | 1 |
| `divine_clockwork` | 시계 장치 거신 | 중갑 | 1 |
