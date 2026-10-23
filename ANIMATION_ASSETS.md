# Alpha 0.9 동작·구역 어셋

## Alpha 0.38 보스 재도전 배너

사용자가 첨부한 전술·보스 보상 디자인을 참고해 내장 image_gen으로 보스 헤더3종을 생성했습니다. 모두1774×887(2:1), 오른쪽 보스/왼쪽 어두운 텍스트 여백이며 문자·UI·아이콘이 없습니다. 숲은 가지·뿌리의 세계수 수호령, 폐성은 왕관을 쓴 해골 왕, 빙원은 빙결한 용 형상의 지배자입니다. 게임 스프라이트/판정/모션에는 사용하지 않고 비전투 전술 화면의 CSS 배경에만 사용합니다.

- `dist/assets/replay-forest-v038.png` / `replay-forest-v038.webp`
- `dist/assets/replay-ruins-v038.png` / `replay-ruins-v038.webp`
- `dist/assets/replay-frost-v038.png` / `replay-frost-v038.webp`

WebP는 lossless/exact이며 디코딩 RGBA가 원본 PNG와 동일함을 확인했습니다. 전체7,702,402→5,157,944bytes. 세부 프롬프트와 원본 생성 경로는 `art/references/replay-boss-alpha038-prompts.txt`에 있습니다. UI의 보스 이름, 난이도와 보상 수치는 기존 게임 데이터로 별도 표시합니다.

## Alpha 0.36 지도와 무기 전용 합성

첨부된 흑철/금속 테두리 UI 참고 이미지에 맞춰 비전투 사냥 지도 3종을 사용합니다. 숲은 승인된 시안의 원본을 재사용하고, 폐성·빙원은 내장 image_gen 도구로 추가 생성했습니다. 모든 지도는 1024×1536이며 UI·문자·숫자 없이 중앙의 S자 길과 하단 야영지/상단 성채를 갖습니다. 단계 표시는 실제 진행 데이터로 HTML에 별도로 표시합니다.

- `dist/assets/hunt-map-forest-v036.png` / `.webp`
- `dist/assets/hunt-map-ruins-v036.png` / `.webp`
- `dist/assets/hunt-map-frost-v036.png` / `.webp`

정확한 생성 프롬프트와 내장 도구 모드는 `art/references/hunt-map-forest-alpha036-prompt.txt`, `art/references/hunt-map-alpha036-prompts.txt`에 기록합니다. `tools/optimize-hunt-maps.py`는 픽셀을 변경하지 않고 무손실 WebP로 인코딩하며, RGBA의 바이트 단위 동일성을 검증합니다. 합계 10,817,506 → 7,022,224 bytes, 검증 결과는 `tools/reports/hunt-map-delivery-alpha036.json`입니다. 이 지도는 전투 지형·충돌·웨이브 경로나 RNG의 입력이 아닙니다.

캐릭터 합성 경계는 무기로 제한합니다. 전체 착용 디자인 데이터는 유지하지만 `drawEquipment`, `drawEquipmentAura`, `drawEquipmentAttack`은 무기만 외형에 사용합니다. 갑옷·부적의 능력치와 실제 발동 효과, 시너지는 엔진에서 기존 방식대로 작동합니다. 원본 몸체·방향별 손/칼끝 좌표·검 가림 포즈와 검격 스냅샷 수명은 유지합니다. 무기 4,008개 정렬/숨김 72개와 보조 장비 외형 불변 사례를 자동 검증합니다.


## Alpha 0.9 최종 생성물

사용자의 MONSTER COLLECTION을 외형·팔레트·픽셀풍 참조로 내장 ImageGen 모드에서 생성했습니다. 원본 참조는 art/references/monster-collection-user-v09.png입니다. 같은 도구로 포즈 간 투명 여백과 북쪽 수호령의 뒷모습을 보정했습니다. 아래 파일은 선택한 최종 생성 출력 그대로이며 픽셀 후처리·재표본화·배경 제거를 하지 않았습니다. 프롬프트 파일은 최초 생성과 해당 어셋의 최종 수정 지시를 포함합니다.

| 어셋 | 포즈·구성 | 최종 파일 | 프롬프트 |
| --- | --- | --- | --- |
| 숲 몬스터 | 95 / 19행 | [chapter_forest-v09.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/chapter_forest-v09.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/chapter_forest-v09.prompt.txt) |
| 폐성 몬스터 | 100 / 20행 | [chapter_ruins-v09.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/chapter_ruins-v09.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/chapter_ruins-v09.prompt.txt) |
| 빙하 몬스터 | 90 / 18행 | [chapter_frost-v09.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/chapter_frost-v09.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/chapter_frost-v09.prompt.txt) |
| 누락·방향 보충 | 20 / 4행 | [chapter_direction_patch-v09.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/chapter_direction_patch-v09.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/chapter_direction_patch-v09.prompt.txt) |
| 숲 바닥 | 타일 | [terrain_forest-v09.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/terrain_forest-v09.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/terrain_forest-v09.prompt.txt) |
| 폐성 바닥 | 타일 | [terrain_ruins-v09.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/terrain_ruins-v09.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/terrain_ruins-v09.prompt.txt) |
| 빙하 바닥 | 타일 | [terrain_frost-v09.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/terrain_frost-v09.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/terrain_frost-v09.prompt.txt) |
| 구역 장식 | 12 | [props_chapters-v09.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/props_chapters-v09.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/props_chapters-v09.prompt.txt) |
| 장비 그림 | 12 | [equipment_chapters-v09.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/equipment_chapters-v09.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/equipment_chapters-v09.prompt.txt) |

일반 몬스터 아홉 외형과 보스 세 외형을 사용합니다. 각 행은 걷기 두 포즈·공격 준비/접촉 두 포즈·시체 한 포즈입니다. 주 시트의 누락된 북쪽 수호령·빙하 마법사·빙왕과 잘못된 동쪽 늑대를 보충 시트로 대체했습니다. 네 몬스터 시트의 총 305포즈 중 잘못된 동쪽 늑대 원본 다섯 개를 제외하고 300개를 연결합니다. S·SE·E·NE·N 원본과 서쪽 반전으로 8방향을 표시하며 새 몬스터용 180클립을 추가했습니다. 전용 피격과 연속 쓰러짐 동작은 아직 없고 피격·경직은 준비 포즈와 시각 반응을 재사용합니다.

tools/measure-chapter-atlases.py는 RGBA 원본을 읽어 실제 실루엣 개수·60개 방향 행·머리/몸 기준점·공통 몸 높이·발 기준선을 측정합니다. 쓰는 것은 manifest 메타데이터와 보고서이며 이미지 파일은 수정하지 않습니다. 몬스터 영역에 이웃 주요 실루엣이 들어오면 실패합니다. 장식·장비는 이웃의 잎/검 끝을 제외하도록 메타데이터 영역 가장자리에서 최대 네 픽셀을 줄일 수 있습니다. 기존 리리안과 검사 화면의 클립은 유지합니다. PNG SHA-256과 측정값은 tools/reports/chapters-alpha09-measurements.json에 기록했습니다.

거점 장비 창의 초상은 사용자 리리안 원본을 그대로 복사한 dist/assets/lirian_design-portrait-v09.png를 CSS 영역 표시로 재사용합니다. 새로 생성한 초상이 아닙니다. 실제 app.js 호스트에서 12종×8방향의 원본 선택·반전·발 위치·고정 배율과 소멸을 검증했지만 실제 브라우저의 시각적 연결감은 직접 검수하지 못했습니다.

Alpha0.27 홈은 원본 디자인 시트 왼쪽 일러스트의 설명 문구를 내장 ImageGen 편집 모드로 제거한 `dist/assets/lirian_home-illustration-v027.png`를 사용합니다. 선택된 생성 출력은887×1774이며 그대로 복사했습니다. 원본 디자인 시트와 기존 전투용 아틀라스는 보존합니다. 전체 최종 프롬프트는 `dist/assets/prompts/lirian_home-illustration-v027.prompt.txt`입니다.

## 리리안 보행 정렬 보정

기존 대기·걷기 PNG의 실제 포즈 간격이 균등하지 않은데 기준점을 균등한 여섯 칸 간격으로 계산해 몸 전체가 옆으로 튀었습니다. tools/measure-lirian-atlases.py에서 각 원본의 머리 위쪽 25%에 있는 머리카락 색 픽셀 중앙을 읽고, 첫 대기 포즈의 머리-발 가로 차이를 유지해 대기·걷기의 pivotX를 보정했습니다. 옅은 투명 가장자리를 추가로 자르지 않도록 기존 원본 사각형의 기준점 여백은 보존합니다. PNG·포즈 순서·발 기준선·클립 배율은 변경하지 않았습니다. 다른 동작과 다른 몬스터의 메타데이터도 유지합니다. 다시 측정해도 기존 manifest release version을 덮어쓰지 않습니다.

| 원본 방향 | 보정 전 머리 가로 이동 폭 | 보정 후 | 기존 세로 이동 폭 |
| --- | ---: | ---: | ---: |
| S | 41.192 | <0.01 | 0.000 |
| SE | 41.400 | <0.01 | 0.600 |
| E | 42.201 | <0.01 | 0.603 |
| NE | 38.123 | <0.01 | 0.646 |
| N | 44.234 | <0.01 | 1.340 |

단위는 높이 126으로 그린 논리 좌표이며 600×380 내부 Canvas에서는 절반입니다. 표는 움직이는 월드 발 위치에 상대적인 걷기 네 포즈의 측정 머리 기준점 이동 폭입니다. 실제 app.js 호스트에서 8방향·기본/강화 속도·걷기에서 대기 전환을 같은 픽셀 기준점과 Canvas 아핀 행렬로 검증했습니다. 원시 측정과 원본 PNG SHA-256은 tools/reports/lirian-alpha081-alignment.json입니다. 이 수치는 기준점 정렬에 관한 것이며 전체 팔다리의 움직임이 0이라는 뜻은 아닙니다. 실제 브라우저의 보행 연결감은 별도 검수가 필요합니다.

## 갑각충 전투 동작

기존 갑각충 걷기 아틀라스를 외형·팔레트·픽셀풍 스타일 참조로 내장 ImageGen 모드에서 두 아틀라스를 생성했습니다. 같은 도구로 남쪽 공격 준비의 방향과 반응 어셋의 투명한 가장자리를 보정했습니다. PNG는 최종 생성 출력 그대로 복사했고 픽셀을 후처리하지 않았습니다.

| 어셋 | 원본 포즈 | 최종 파일 | 최초·최종 프롬프트 세트 |
| --- | ---: | --- | --- |
| 갑각충 공격 | 20 | [skitter_attack-v08.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/skitter_attack-v08.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/skitter_attack-v08.prompt.txt) |
| 갑각충 피격·사망 | 30 | [skitter_reactions-v08.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/skitter_reactions-v08.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/skitter_reactions-v08.prompt.txt) |

원본은 S·SE·E·NE·N 다섯 방향이고 서쪽 세 방향은 반전해 8방향으로 재생합니다. 공격은 5행×4열, 반응은 5행×6열입니다. 반응의 앞 두 열은 피격/회복, 뒤 네 열은 쓰러짐/시체입니다. 원본의 왼쪽을 보는 SE와 일부 E 시점은 clip.flipX로 정규화합니다. 원본 8방향을 별도로 생성한 것은 아닙니다.

tools/measure-skitter-atlases.py는 원본 RGBA를 읽어 영역·발 접촉·갑각 중심을 측정하고 기존 걷기의 중앙 갑각 위치를 기준으로 가로 기준점을 맞춥니다. 동작 안의 몸 높이는 고정합니다. 사망은 서 있는 회복 포즈의 높이를 공유해 마지막 낮은 시체까지 같은 배율을 유지합니다. 투명 여백과 큰 이웃 포즈의 침범을 검사하고 기존 플레이어·다른 적의 메타데이터를 유지합니다. 측정 결과는 tools/reports/skitter-alpha08-measurements.json입니다. 이미지 파일은 쓰지 않습니다.

이 생성 어셋의 실제 브라우저 연결감과 손맛은 아직 직접 검수하지 못했습니다.

## Alpha 0.6 리리안 동작 어셋

사용자 첨부 LIRIAN 디자인 시트를 정체성·의상·픽셀 스타일 참조로 사용했습니다. 내장 ImageGen 모드로 PNG 여섯 개를 생성하고, 같은 도구로 공격과 회피/피격 아틀라스의 여백을 보정했습니다. 원본 디자인은 art/references/lirian-design.png에 보관했습니다. 대기·걷기·세 공격·회피·피격·사망은 메인 게임에서 새 캐릭터로 재생됩니다.

| 어셋 | 원본 포즈 | 최종 파일 | 최종 프롬프트 세트 |
| --- | ---: | --- | --- |
| 리리안 대기·걷기 | 30 | [lirian_locomotion-v05.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/lirian_locomotion-v05.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/lirian_locomotion-v05.prompt.txt) |
| 리리안 가로 베기 | 30 | [lirian_forehand-v05.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/lirian_forehand-v05.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/lirian_forehand-v05.prompt.txt) |
| 리리안 되베기 | 30 | [lirian_backhand-v05.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/lirian_backhand-v05.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/lirian_backhand-v05.prompt.txt) |
| 리리안 내려찍기 | 30 | [lirian_finisher-v05.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/lirian_finisher-v05.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/lirian_finisher-v05.prompt.txt) |
| 리리안 회피·피격 | 30 | [lirian_actions-v06.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/lirian_actions-v06.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/lirian_actions-v06.prompt.txt) |
| 리리안 사망 | 20 | [lirian_death-v06.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/lirian_death-v06.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/lirian_death-v06.prompt.txt) |

각 파일은 S·SE·E·NE·N 다섯 원본 방향입니다. 서쪽 세 방향은 반전해 8방향으로 재생합니다. 대기 두 포즈·걷기 네 포즈, 공격별 여섯 재생 단계입니다. 오른쪽 가로 베기의 두 원본은 반대로 돌아보므로 런타임에서는 올바른 출발/준비 포즈를 유지·재사용합니다. Alpha 0.6은 회피 네 포즈·피격 두 포즈·사망 네 포즈로 원본 50개를 추가했습니다. 따라서 리리안의 170개 프레임 참조 중 고유 원본은 168개입니다.

회피·피격 아틀라스는 5행×6열이며 앞 네 열은 회피, 뒤 두 열은 피격입니다. 사망은 5행×4열입니다. 새로운 두 원본의 큰 캐릭터 영역과 기준점 여백에 이웃 포즈가 들어오지 않는지 측정했습니다. 사망은 서 있는 첫 프레임의 몸 높이를 공유해 마지막 누운 포즈까지 같은 배율로 재생합니다. 저장한 PNG는 ImageGen 출력 그대로입니다.

tools/measure-lirian-atlases.py는 PNG를 읽기만 하고 명시적 프레임 사각형·기준점·몸 높이·원본 열 선택을 기록합니다. 이미지 픽셀은 수정하지 않습니다. 프레임 영역에 다른 큰 캐릭터가 들어오면 측정을 실패시킵니다. 검 끝을 발로 오인하지 않도록 방향/동작별 준비·회복의 발 기준선을 공유합니다. 작은 투명 여백을 포함해 모든 기준점을 프레임 안에 둡니다. 플레이어 이름/클립은 바뀌지만 엔진의 hunter 역할 ID와 프로필 저장 형식은 유지합니다.

이 어셋은 생성 모델로 제작한 픽셀풍 개발 시안입니다. 실제 브라우저에서 연결 동작과 실기기 재생감 검수는 아직 수행하지 못했습니다.

## 이전 Alpha 0.4 어셋

내장 ImageGen으로 기존 사냥꾼과 몬스터를 스타일·정체성 참조로 사용해 생성했습니다. 사냥꾼의 두 아틀라스는 검과 망토가 옆 프레임에 걸쳐 들어가지 않도록 같은 도구로 여백을 수정했습니다. 아래 프롬프트 파일에는 최초 생성과 최종 여백 수정 지시를 함께 기록했습니다.

| 어셋 | 원본 프레임 | 파일 | 최종 프롬프트 |
| --- | ---: | --- | --- |
| 사냥꾼 방향별 걷기 | 20 | [hunter_directions_walk-v04.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/hunter_directions_walk-v04.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/hunter_directions_walk-v04.prompt.txt) |
| 사냥꾼 방향별 베기 | 20 | [hunter_directions_attack-v04.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/hunter_directions_attack-v04.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/hunter_directions_attack-v04.prompt.txt) |
| 갑각충 방향별 걷기 | 20 | [skitter_directions-v04.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/skitter_directions-v04.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/skitter_directions-v04.prompt.txt) |
| 중갑 방향별 걷기·공격 | 30 | [bulwark_directions-v04.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/bulwark_directions-v04.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/bulwark_directions-v04.prompt.txt) |
| 포격충 방향별 걷기·공격 | 30 | [spitter_directions-v04.png](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/spitter_directions-v04.png) | [프롬프트](sandbox:/workspace/sites/beast-hunter-motion/dist/assets/prompts/spitter_directions-v04.prompt.txt) |

5개 아틀라스에 120프레임을 추가했습니다. 기존 42프레임을 포함한 전체 162프레임은 검사 화면에서 확인할 수 있습니다. S와 N은 실제 앞모습·뒷모습이고, 대각선도 별도 시점입니다. 대응되는 좌우는 반전을 사용하며 8개 독립 원본 방향을 모두 생성한 것은 아닙니다. 원본의 일부 왼쪽 시점은 clip.flipX로 정규화했습니다. 몸을 화면 평면에서 회전해 상하 방향으로 사용하지 않습니다.

원본 PNG 픽셀은 수정하지 않았습니다. 연결된 불투명 영역과 발·머리 기준을 읽어 프레임 사각형·기준점·몸 높이를 기록했습니다. 큰 이웃 캐릭터가 프레임에 섞이지 않는지와 이미지 경계를 확인했습니다. 무기 길이나 예비 동작으로 프레임 크기가 커져도 같은 클립 안에서 몸의 크기는 유지됩니다.

이전 파일은 검사 화면에 유지하며, 메인 플레이어 동작은 위 리리안 어셋으로 교체했습니다. 중갑·포격충의 방향별 피격·사망 전용 포즈와 모든 방향의 개별 좌우 비대칭 장비 표현은 후속 작업입니다.


## Alpha 0.39 archive scenery

- Built-in image_gen scene-only plates: dist/assets/codex-archive-hero-v039.png and codex-gallery-floor-v039.png, with exact lossless WebP counterparts used by codex.css.
- Both1774×887. No embedded weapon, character, typography or control. Real catalog sprites remain dynamic and maintain item identity.
- Total PNG3928373 bytes → WebP2667196 bytes (32.10% reduction); decoded RGBA equality verified.
- Approved composition: art/references/codex-approved-alpha039.png. Actual390px/320px captures: art/references/codex-actual-alpha039-390.png and codex-actual-alpha039-320.png.
- Exact prompts, reference role and generation paths: art/references/codex-archive-alpha039-prompts.txt.
- New plates are CSS-only camp assets; combat startup manifest and23-image boot set are unchanged.


## Alpha 0.40 equipment-window presentation

- Approved UI concept: art/references/equipment-approved-alpha040.png; generation/refinement: equipment-approved-alpha040-prompts.txt.
- Weapon-free Lirian portrait: dist/assets/equipment-armory-portrait-v040.png/.webp,1448×1086. PNG2335180 -> WebP1632900B,RGBA identical. Exact built-in image_gen prompt/provenance: art/references/equipment-armory-alpha040-prompts.txt.
- Refined12-design presentation atlas: dist/assets/armory-equipment-v040.png/.webp/.json,1448×1086,4×3 cells. PNG1180119 -> WebP802730B,RGBA identical. Exact built-in image_gen prompts: art/references/armory-equipment-alpha040-prompts.txt.
- Atlas preserves all12 original base-design identities. Existing ancient individual art is retained. Original combat textures/poses/sockets and23-image boot are unchanged; manifest.equipmentPresentation supplies UI-only frames/dimensions/grips.
- The generated atlas contains documented nearly invisible alpha1 speckle; visible alpha>=8 forms have separated bounds. Grip points are visual estimates for the armory and must not replace combat pose metadata.
- Actual390/320px captures: art/references/equipment-actual-alpha040-390.png and equipment-actual-alpha040-320.png. Full validation and evidence limits: tools/reports/equipment-alpha040-qa.txt.

## Alpha 0.42 menu atmosphere

- Built-in image_gen scene-only training forge: dist/assets/growth-forge-v042.png,1709x920; WebP quality87 counterpart242618bytes used by menus.css. Neutral sword/anvil is a training prop, not an owned item.
- Two design-first concept sheets: art/references/menus042-concept.png and menus042-overlays-concept.png. Exact prompts/critique: art/references/menus-alpha042-prompts.txt.
- Other menu art reuses current crafting/material/equipment/archive/map assets. No animation manifest or initial23-image combat boot changes.
- Actual screenshots and evidence limits: tools/reports/menus-alpha042-qa.txt.
