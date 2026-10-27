# Alpha 0.136 인장 원화 사양 (Codex CLI 생성 예정)

보스 러시 인장 13종(효과마다 하나)과 인장 조각 아이콘 1점. 지금 게임은 기존 장신구 원화(하옵 acc_t3_seal · 중옵 acc_t1_seal · 상옵 acc_t6_seal)와 그 잘라 쓴 조각 아이콘을 쓴다.
등급 색: 하옵 은빛·서리 파랑, 중옵 청동·진홍, 상옵 금빛·빛나는 보석. 장마다 3×2(빈칸은 오른쪽 아래), `items`가 칸 순서의 원화 아이디(`seal_<효과 id>`, `seal_shard`).

- 생성: `python3 tools/codex-monster-sheet.py art/seals0136/sheets.json seal-1 seal-2 seal-3` (Codex CLI 로그인 필요)
- 아직 생성하지 않음: 이 컨테이너에 Codex CLI와 OpenAI 인증이 없었다(0.136).
