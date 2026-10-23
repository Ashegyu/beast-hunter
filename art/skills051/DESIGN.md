# Alpha 0.51 — 이미지 스킬 효과와 궁극기 전신 컷인

기존 리리안의 얼굴·은빛 머리·검은 전투복·붉은 망토를 참고해 built-in image_gen으로 이미지 4장을 생성했다. 원본 알파를 보존하고 런타임용은 lossless WebP로 인코딩했다. 프롬프트 전체와 저장 경로는 [prompts.json](prompts.json)에 있다.

## 적용

- 일반 스킬 16종: 4×4 이미지 아틀라스의 서로 다른 검기·회전·폭발·반격·잔상·사슬·룬을 실제 시전/명중 시점에 회전·확대·잔상 합성한다.
- 궁극기 3종: 전용 전신 일러스트와 화면 연출을 1.35초 동안 재생한다. 적월난무는 분할 진입과 붉은 회전, 일섬·월식은 교차 검기와 은빛 이동, 월영군무는 전신 분신과 보랏빛 소환이다.
- 궁극기의 **전신 일러스트에 이동·확대·분할·분신을 적용한 컷인 애니메이션**이다. 새 원화 프레임을 매 순간 그린 영상이나 관절 애니메이션은 아니다.
- 지속 버프와 표식에도 이미지를 표시한다. 표식은 실제 만료와 적 생존을 따르며 회피만으로 사라지지 않는다.
- 피해·기력·쿨다운·해금·명중 횟수는 유지했다. 컷인은 게임 시간을 따르고 피해 판정에 관여하지 않는다.

## 이미지 경로

| 용도 | 생성 원본 | 런타임 파일 |
|---|---|---|
| 일반 16종 효과 | /workspace/sites/beast-hunter-motion/art/skills051/effects-original.png | /workspace/sites/beast-hunter-motion/dist/assets/skill-effects-v051.webp |
| 적월난무 | /workspace/sites/beast-hunter-motion/art/skills051/bloodmoon-original.png | /workspace/sites/beast-hunter-motion/dist/assets/skill-bloodmoon-v051.webp |
| 일섬·월식 | /workspace/sites/beast-hunter-motion/art/skills051/eclipse-original.png | /workspace/sites/beast-hunter-motion/dist/assets/skill-eclipse-v051.webp |
| 월영군무 | /workspace/sites/beast-hunter-motion/art/skills051/phantoms-original.png | /workspace/sites/beast-hunter-motion/dist/assets/skill-phantoms-v051.webp |

## 상태와 자원

- 궁극기 연출은 성공한 발동에서만 생성한다. 회피·피격·거점 복귀·방 이동은 연출 참조를 제거하고, 렌더러도 토큰·생존·전투 상태를 재검증한다.
- 일시정지는 게임 시간을 멈춰 연출도 그대로 유지한다. 1.35초 뒤 참조를 제거한다. 새로고침/저장에는 연출이 들어가지 않는다.
- 네 이미지의 메타데이터·실제 치수·16개 atlas 사각형 검증 후 시작을 허용한다. 누락 시 성장 저장을 바꾸지 않고 재시도한다.
- 이미지 4장 추가, 시작 이미지 18→22장. 인코딩 6,204,498 bytes, 추가 RGBA 픽셀 메모리 약16.12MiB. 브라우저 디코더/드라이버 추가 메모리는 측정하지 않았다.
- 효과당 bitmap draw 최대4회, 궁극기 프레임 최대5회. 지속 적 표식은 최대64개 검사한다. 매 프레임 이미지나 임시 Canvas를 만들지 않는다.
- OS 모션 감소 설정에서는 컷인의 이동·분할·분신·회전을 생략한다.

## 검증

전체 검사469개 통과, 실패0개. 실제 app.js의 19개 스킬 버튼에서 이미지 효과 출력, 궁극기 3개의 전신 이미지 출력, 일시정지 및 회피 취소, 누락 이미지 재시도, 320px 배치, 상태/Canvas 복원, 이미지 호출 상한과 atlas 경계를 확인했다.

skill-image-contact.png, ultimate-cutins-contact.png와 MP4 두 개는 실제 엔진·원화·동일 렌더러로 만든 오프라인 검토 자료다. 브라우저나 실제 휴대폰 실행 검증은 아니며 GPU/P95/P99 성능 주장은 하지 않는다. 로그인과 사용자 컴퓨터 사용 없이 작업했다.

재생성: `node tools/render-skill-art051.mjs` (CODEX_PRIMARY_RUNTIME_NODE_MODULES 환경에서 Napi Canvas 사용). 24fps로 frames-grid와 frames-cutins를 MP4로 인코딩한다.

## 배포 크기 보정

첫 업로드가 expanded archive256MiB 제한으로 거절되어, 런타임에서 참조하지 않는 장비 생성 원본64개(약54.48MiB)를 dist/assets/source에서 art/equipment-source-originals로 옮겼다. 파일별SHA-256이 이동 전후 동일함을 확인했다. 실제 게임·검사실에서 쓰는 atlas와 원화는 그대로 배포한다. 원본 패킹 도구와 README의 경로도 갱신했다.
