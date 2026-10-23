# Alpha 0.79 — 버튼 문구 정렬

확인된 원인: style.css의 .wide 및 .pause-actions #resume가 flex의 justify-content:space-between을 사용한다. text-align:center는 flex item 배치를 바꾸지 않으므로 직접 텍스트가 왼쪽, 화살표가 오른쪽에 놓인다. 다른 사냥터·도감·보스전 준비 버튼에도 개별 space-between 규칙이 있었다.

수정: 이미지 버튼 공통 레이아웃을 flex/center로 지정하고 높은 우선순위의 개별 규칙도 center로 정리한다. 10개 아이콘 포함 버튼은 장식/화살표를 absolute edge 요소로 분리하고 aria-hidden을 유지/추가했다. 부모 중앙의 텍스트는 좌우 대칭 여백으로 배치된다. 좁은 전투 준비 버튼은 28px 여백과 16px 화살표, 수집처 보기는 32px 여백을 쓴다. 긴 보스전 문구의 줄바꿈/자동 높이는 유지한다. 클릭 대상과 이벤트 ID를 바꾸지 않으며 장식은 pointer-events:none이다.

범위: 일시정지/결과/거점/지도/보스전 준비/장비 빌드/제작/재료 추적/도감의 이미지 버튼 33개와 대시보드 입장 버튼 1개. 수집 경로 카드는 왼쪽 정렬 정보 구조이고 상세 닫기는 display:block/text-align:right이므로 수정 대상에서 제외한다. 주요 버튼 목록과 해당 정렬 규칙은 button-audit.json이다. 이 파일은 소스 점검 기록이며 브라우저 계산 스타일 보고서가 아니다.

검증: 기존 tests/game-ui.test.mjs의 실제 app.js DOM/Canvas 통합 검사 167/167 통과. 원시 로그: ../../tools/reports/alignment079-ui-tests.txt. 일시정지/재개·장비·제작·도감·스킬·챕터 이동·로딩 실패/재시도와 기존 드롭/결과 이벤트를 포함한다. 이번 CSS 변경을 검증한다고 새로운 엔진 테스트를 추가하지 않았다.

HTML 닫힘, 1466개 ID의 유일성, 21개 로컬 stylesheet/script 경로, 변경 CSS 괄호와 정렬 충돌·아이콘 속성 및 git diff 공백을 검사했다. 실제 브라우저의 계산 레이아웃은 확인하지 못했다. 관리형 control-browser를 사용할 수 없어 브라우저 preview/직접 화면 검수는 생략했으며 대체 브라우저를 설치하지 않았다. GPU·터치·각 기기의 픽셀 정렬 보장은 포함하지 않는다. 사용자 컴퓨터나 로그인을 사용하지 않았다.
