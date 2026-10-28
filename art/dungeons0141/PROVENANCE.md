# Alpha 0.141 성장 던전 장면 원화 (Codex CLI 생성)

성장 던전 6종·무한의 탑·레이드 보스 3종·보스 러시 장면 11장. 레이드 장면은 `reference`로 `art/raid0123/bosses/<종>.png`(보스 애니메이션 시트)를 함께 넘겨 같은 보스를 크게 그렸다. 사양 `scenes.json`(`"kind":"scene"` = 불투명 가로 그림, 스타일 기준 `dist/assets/growth-forge-v042.webp`), 기록 `prompts/<id>.json`. 11장 모두 첫 시도에 통과했고 모아보기로 눈 검수했다.

- 포장: `python3 tools/pack-dungeons0141.py` → `dist/assets/dungeon-<id>-v0141.webp`(768×512, 손실 WebP q82, 합계 약 1MB).
- 쓰임(`layout-fit.css` 0.141 블록): 성장 던전 카드 배경, 선택한 던전의 화면 배경(어둡게)과 오른쪽 입장 패널 머리 띠, 무한의 탑 층 칸 배경. 앱은 `#camp-dungeons-panel[data-dungeon]`에 고른 던전 아이디를 둔다(레이드·보스 러시는 빈 값).

| 아이디 | 장면 |
|---|---|
| gold | 황금 더미가 쌓인 지하 보물 동굴 |
| enhance | 쇳물이 쏟아지는 거대한 제련소 |
| promote | 해 질 녘 시련의 원형 경기장 |
| skill | 달빛 아래 푸른 검격 잔상이 남은 수련장 |
| xp | 룬 기둥이 늘어선 끝없는 수련 회랑 |
| craft | 괴수 뼈와 가죽이 걸린 해체 작업장 |
| tower | 폭풍 속 하늘로 솟은 탑 |
| raid-colossus | 용암 요새의 강철 거신 |
| raid-queen | 녹색 알집 동굴의 군단의 여왕 |
| raid-judge | 황혼 하늘 신전의 심판자 |
| rush | 색이 다른 다섯 관문의 결투장 |
