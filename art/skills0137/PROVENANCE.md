# Alpha 0.137 스킬 이펙트 원화 (Codex CLI 생성, 연속 동작)

리리안 일반 스킬 16종의 이펙트를 더 화려하게 다시 그리고, 스킬마다 **6프레임 연속 동작**(생성 → 형성 → 최고조 → 분출 → 소멸 → 잔광; 검진·자세·표식·혈검은 반복 재생용 고리)으로 만들었다. 궁극기 3종과 괴수 기술·장비 기술은 이 16종을 빌려 쓰므로 함께 바뀐다.

1. 키 아트: `sheets.json`의 `fx-1~4`(2×2, 장당 4종, 스타일 기준 옛 아틀라스 `skill-effects-v051`). fx-2(낙하·쳐내기·잔상·삼연)는 연속 동작으로 계획을 바꾸며 중단해서 옛 아틀라스 칸을 확대해 키로 썼다. 효과별로 자른 것이 `keys/<id>.png`.
2. 연속 동작: `anim.json`의 `anim-<id>`(3×2 = 6프레임, 1536×1024, 키 아트를 첨부). 생성 `python3 tools/codex-monster-sheet.py art/skills0137/anim.json anim-<id>`.
   - 12종은 첫 시도(낙하·검진 일부 두 번째) 통과. 검진·표식·자세·혈검은 원형이라 빛 번짐이 칸을 채워 자동 검사(완전 투명 30% 이상)에 세 번 다 걸렸지만, 초록 배경 합성으로 배경 없이 투명한 것을 확인하고 각 1장을 눈 검수로 채택했다(field try1, mark try3, stance try2, bloodblade try3).
3. 포장: `python3 tools/pack-skills0137.py` → `dist/assets/skill-effects-v0137.webp`(2040×2040, 칸 204px, 10×10 중 96칸, 손실 색상 품질 85 + 무손실 알파, 약 2.2MB). 칸 가장자리 6%는 알파를 서서히 줄여 잘린 선이 보이지 않게 했다. manifest `skillPresentation.effects.sequences`(효과당 6칸)와 `frames`(최고조 프레임 = 3번째, 컷인·버프용).
