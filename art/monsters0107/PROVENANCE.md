# Alpha 0.107 몬스터 원화 (Codex CLI 생성)

`tools/codex-monster-sheet.py`로 `codex exec` 내장 `image_gen`에 생성시켰습니다. 생성·검수·포장 방식은 `art/monsters0106/PROVENANCE.md`와 같고, 사양은 `bosses.json`·`regulars.json`, 시도 기록은 `prompts/<id>.json`에 있습니다.

- 스타일 기준: 불 몬스터는 `art/monsters045/forest_orc.png`, 어둠 몬스터는 `ruins_skeleton.png`, 보스는 기존 지역 보스 시트. 주제 참고: 사용자 몬스터 백과 `art/monsters065/references/encyclopedia-1.png`·`-3.png`.
- 포장: `python3 tools/pack-monsters0106.py art/monsters0107 v0107` (종마다 아틀라스 1장).

## 보스 8종

| 챕터 | 보스 | id | 종류 | 생성 시도 |
|---|---|---|---|---|
| 10 | 고대 세계수 엔트 | `boss_special_worldtree` | 특수 보스 | 1 |
| 11 | 화염 드레이크 | `boss_fire_drake` | 챕터 보스 | 2 |
| 12 | 이프리트 | `boss_fire_ifrit` | 챕터 보스 | 1 |
| 13 | 용암 거인 | `boss_fire_giant` | 챕터 보스 | 1 |
| 14 | 불사조 | `boss_fire_phoenix` | 챕터 보스 | 1 |
| 15 | 화염 미노타우로스 왕 | `boss_fire_minotaur` | 챕터 보스 | 2 |
| 20 | 화염과 서리의 쌍두룡 | `boss_special_twindragon` | 특수 보스 | 1 |
| 30 | 심연의 군주 | `boss_special_abysslord` | 특수 보스 | 1 |

쌍두룡은 첫 3회 모두 브레스가 옆 칸까지 뻗어 자동 검사에 떨어져, "입 앞의 짧은 불꽃·냉기만, 긴 브레스 없음" 조건을 더해 4번째에 통과했습니다.

## 일반 몬스터 18종

| id | 이름 | 역할 | 생성 시도 |
|---|---|---|---|
| `fire_salamander` | 불도마뱀 | 근접 추격 | 1 |
| `fire_hellhound` | 지옥 사냥개 | 근접 추격 | 1 |
| `fire_imp` | 불꽃 임프 | 근접 추격 | 1 |
| `fire_phoenixling` | 어린 불새 | 근접 추격 | 1 |
| `fire_spirit` | 불의 정령 | 원거리 | 1 |
| `fire_cultist` | 화염 사교도 | 원거리 | 1 |
| `fire_slime` | 용암 슬라임 | 원거리 | 1 |
| `fire_beetle` | 화염 딱정벌레 | 원거리 | 1 |
| `fire_golem` | 용암 골렘 | 중갑 | 1 |
| `fire_crab` | 흑요석 게 | 중갑 | 1 |
| `fire_salamanderknight` | 샐러맨더 전사 | 중갑 | 1 |
| `fire_rhino` | 용암 코뿔소 | 중갑 | 1 |
| `dark_imp` | 그림자 임프 | 근접 추격 | 1 |
| `dark_spider` | 그림자 거미 | 근접 추격 | 1 |
| `dark_succubus` | 서큐버스 | 원거리 | 1 |
| `dark_priest` | 어둠 사제 | 원거리 | 1 |
| `dark_demon` | 지옥 악마 전사 | 중갑 | 1 |
| `dark_voidgolem` | 공허 골렘 | 중갑 | 1 |
