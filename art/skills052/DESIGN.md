# Alpha 0.52 — 배경이 포함된 애니메이션풍 궁극기

기존051 전신 일러스트3종을 정체성·복장 참고로 사용하고, built-in image_gen으로 선화와 명암이 또렷한2D 애니메이션풍 전체 장면으로 다시 생성했다. 배경과 고유 스킬 효과가 원화에 함께 그려져 있다. 전체 프롬프트는 [prompts.json](prompts.json).

| 궁극기 | 배경·원화 효과 | 앞에서 움직이는 효과 |
|---|---|---|
| 적월난무 | 거대한 붉은 달·무너진 성당·붉은7연 검광 | 3방향 초승달 검기 |
| 일섬·월식 | 검은 일식·떠오르는 폐허·은빛 일섬 | 교차하는 검광 |
| 월영군무 | 보랏빛 달·달빛 궁정·분신2체·소환 검 | 궤도 소환 검과 마법진 |

## 파일

생성 원본: /workspace/sites/beast-hunter-motion/art/skills052/bloodmoon-scene-original.png, /workspace/sites/beast-hunter-motion/art/skills052/eclipse-scene-original.png, /workspace/sites/beast-hunter-motion/art/skills052/phantoms-scene-original.png.

게임용: /workspace/sites/beast-hunter-motion/dist/assets/skill-bloodmoon-v052.webp, /workspace/sites/beast-hunter-motion/dist/assets/skill-eclipse-v052.webp, /workspace/sites/beast-hunter-motion/dist/assets/skill-phantoms-v052.webp.

원본을 보존하고768×1152 lossless WebP로 인코딩했다. 이전051 런타임 컷인은 art/skills051/runtime에 보존하고 배포 파일에서는 교체했다. 시작 이미지 수는22장을 유지한다. 효과 아틀라스와 장면3장의 합은6,929,404bytes이며, 해상도가 같아 추가 디코딩 픽셀 메모리는051과 같다.

## 렌더링·상태 계약

descriptor.kind='scene'은 배경 포함 완성 그림 전체를 한 번에 그린다. 화면을 분할하거나 불투명 배경을 복제하지 않는다. 320px에서도 종횡비와 전체 전신을 유지하고, 상단70/하단100 HUD 여백 안에서 작은 확대·이동을 적용한다. 앞쪽 효과는 안전 영역 안에 clip하며 얼굴을 가리지 않도록 아래쪽에 배치한다. 전체 장면은 미리 그린 일러스트에 카메라 이동과 실시간 검광을 합성하는 컷인이다. 프레임별 새 작화 영상은 아니다.

기존1.35초 게임 시간·일시정지·피격/회피 취소·전투 종료·만료 계약과 피해/기력/쿨다운을 유지한다. 모션 감소에서는 위치·회전을 고정한다. 장면당 bitmap 호출은4/3/5회다.

## 검증

전체471개 검사 통과. 새 장면 descriptor, 실제 파일·치수, 이미지 예산,320px 전체 장면 배치,5시점×3장면×2해상도의 표시·clip·상태 복원, 모션 감소·시전 버튼·일시정지·회피 취소·누락 이미지 재시도와 기존 전투 회귀 검사를 포함한다.

ultimate-cutins-contact.png와 ultimate-scenes-mobile.mp4는 실제 엔진·동일 렌더러·새 원화로 제작한 오프라인 검토 자료다. 브라우저/휴대폰 실기기 검증은 아직 하지 않았다. 사용자 컴퓨터와 로그인은 사용하지 않았다.

재생성: `node tools/render-skill-scene052.mjs` 후24fps로 frames-cutins를 인코딩한다.
