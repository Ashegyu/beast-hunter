# 획득 이펙트 원화 — Alpha 0.77

내장 image_gen으로 신규 생성한 4행×4열 투명 PNG 아틀라스다. CLI/API fallback을 사용하지 않았다. [최종 프롬프트](FINAL_PROMPT.txt), [원본 PNG](source.png), [변환·해시 정보](asset.json)를 함께 보존한다.

프로젝트 적용 파일: /workspace/sites/beast-hunter-motion/dist/assets/loot-pickup-v077.webp
원본: /workspace/sites/beast-hunter-motion/art/loot-pickup077/source.png
최종 프롬프트: /workspace/sites/beast-hunter-motion/art/loot-pickup077/FINAL_PROMPT.txt

원본 1254×1254의 RGB와 알파를 수정하지 않았다. Pillow lossless WebP(exact=True)로 전송 형식만 변환했고, 두 파일을 디코딩해 numpy.array_equal로 RGBA 네 채널 전체가 일치함을 확인했다. 좌표 분할과 발광 합성은 게임 렌더러가 수행한다. 픽셀 단위 재채색·배경 제거·프레임별 새 이미지 버퍼를 생성하지 않는다.

행 순서는 은청색/황금색/홍자색/백금색이고 열은 점화/확산/상승/소멸이다. 생성 결과의 밝은 발광 원점에 맞춰 공통 기준점을 셀 너비 50%·높이 90%에 둔다. 원본 한 변이 4의 배수가 아니므로 Canvas의 유효한 소수점 source rectangle로 셀을 정확히 4등분한다. 게임의 지면 투영으로 세로가 눌리지 않도록 upright 변환 후 표시한다.
