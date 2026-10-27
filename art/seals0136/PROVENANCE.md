# Alpha 0.136.1 인장 원화 (Codex CLI 생성)

보스 러시 인장 13종(효과마다 하나)과 인장 조각 아이콘 1점, 0.136.2에 리리안 전용 인장 3종. 그전(0.136.0)에는 기존 장신구 원화(하옵 acc_t3_seal · 중옵 acc_t1_seal · 상옵 acc_t6_seal)를 등급별로 같이 썼다.
등급 색: 하옵 은빛·서리 파랑, 중옵 청동·진홍, 상옵 금빛·빛나는 보석. 장마다 3×2(빈칸은 오른쪽 아래), 사양 `sheets.json`(`"kind":"sprite"`, 기존 장비 아틀라스 `equipment_chapters-v09`를 스타일 기준으로 첨부, 칸 순서의 원화 아이디 `items`), 기록 `prompts/<id>.json`. 3장 모두 첫 시도에 통과했고 모아보기로 눈 검수했다.

- 생성: `python3 tools/codex-monster-sheet.py art/seals0136/sheets.json seal-1 seal-2 seal-3 seal-4` (codex-cli 0.164, ChatGPT 기기 인증 로그인 `codex login --device-auth`)
- 포장: `python3 tools/pack-seals0136.py` → `equipment-seals-v0136`(1240×1000, 17프레임, 최대 240px). 프레임은 `manifest.equipment.setFrames`(`seal_<효과 id>`, `seal_shard`)에 들어가 세트 장비와 같은 경로(`gearFrame`)로 그려진다.
- 데이터: `dist/seals.js` `sealArtId`, `dist/chapters.js` `SEAL_ART`(인장은 티어와 상관없이 이 원화). 인장 조각 아이콘은 layout-fit.css `.seal-shard-icon`이 같은 페이지에서 잘라 쓴다.

| 시트 | 원화 아이디 | 내용 |
|---|---|---|
| `seal-1` | `seal_life` · `seal_guard` · `seal_stride` | 하옵: 잎 하트 · 성탑 방패 · 바람 날개 장화 |
| `seal-1` | `seal_might` · `seal_keen` | 중옵: 교차한 대검 · 눈과 단검 |
| `seal-2` | `seal_tempo` · `seal_reach` | 중옵: 사슬 세 갈래 베기 · 창날 |
| `seal-2` | `seal_moonfall` · `seal_bloodthirst` · `seal_aegis` | 상옵: 떨어지는 핏빛 초승달 · 피 흘리는 붉은 달 · 빛의 결계 |
| `seal-3` | `seal_afterimage` · `seal_verdict` · `seal_awakening` | 상옵: 잔상 검 셋 · 천칭과 칼 · 황금 심장 |
| `seal-3` | `seal_shard` | 인장 조각(재료 아이콘) |
| `seal-4` | `seal_lirian_crescent` · `seal_lirian_parry` · `seal_lirian_awaken` | 0.136.2 리리안 전용: 적월 검기 · 흑장미와 쳐내는 세검 · 검에 꿰뚫린 붉은 달 (흑요석·진홍·은빛 테, 스타일 기준 `seal-2.png`, 색·모티프 참고 리리안 초상 `equipment-armory-portrait-v040`) |
