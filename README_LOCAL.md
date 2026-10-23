# 괴수 사냥꾼 전체 소스 · 로컬 실행 안내

두 압축 파일은 Sites 최신 저장 버전 166의 전체 소스와 자산입니다.

- beast-hunter-local-game.zip: 실행 가능한 게임, 필수 자산, 테스트, 원본 문서
- beast-hunter-art-and-tools.zip: 전체 원화·참고 자료·개발 도구·기존 보고서

두 ZIP을 같은 상위 폴더에 압축 해제하면 beast-hunter-alpha045 폴더 하나로 합쳐집니다.
게임 실행에는 첫 번째 ZIP만 있으면 됩니다. 전체 원본 보관에는 두 ZIP을 모두 받으세요.
프로젝트 표시 이름은 Alpha 0.45이지만 원본 README의 최신 변경 기록은 Alpha 0.97.0입니다.
추출한 커밋: 90a0324021c812f547e702f61974dee7806bef63
원본 1,362개 파일을 포함하며 게임 코드는 수정하지 않았습니다.

## Windows에서 실행

1. ZIP을 폴더에 완전히 압축 해제합니다. ZIP 안에서 바로 실행하지 마세요.
2. Node.js를 설치합니다. 이 묶음은 Node.js v24.13.1로 검증했습니다.
3. RUN_GAME.cmd를 더블 클릭합니다.
4. 브라우저에서 http://127.0.0.1:8080/ 을 엽니다.
5. 게임을 사용하는 동안 명령창을 열어 둡니다. 종료는 Ctrl+C입니다.

별도 npm install이나 빌드는 필요하지 않습니다.
index.html을 직접 더블 클릭하는 file:// 방식 대신 위 HTTP 서버를 사용하세요.
서버는 이 PC의 127.0.0.1에만 연결하며 dist 폴더만 제공합니다.

## 터미널에서 실행

프로젝트 폴더에서:
```text
node serve-local.mjs
```

8080 포트를 이미 사용 중이면 PowerShell에서:
```powershell
$env:PORT = '8081'
node serve-local.mjs
```
이때 접속 주소는 http://127.0.0.1:8081/ 입니다.

## 저장 데이터

게임 진행은 접속한 브라우저의 localStorage에 저장됩니다.
기존 Sites 주소에서 플레이하던 저장 데이터는 localhost로 자동 이동하지 않습니다.
게임 안의 백업/복원 기능으로 내보낸 파일을 로컬 게임에서 복원하세요.
브라우저, 프로필, 호스트명 또는 포트를 바꾸면 저장 공간이 달라집니다.
같은 주소와 포트를 계속 사용하세요.

## 포함 내용

- dist/: 실제 게임 JavaScript, CSS, HTML, 이미지, 폰트, 사운드 및 동영상 자산
- art/: 원화, 디자인 참고 및 검수 자료
- tests/: 기존 자동 테스트
- tools/: 기존 제작/분석 도구와 보고서
- README.md, GAME_DESIGN.md, PERFORMANCE.md, ANIMATION_ASSETS.md: 기존 문서
- .openai/hosting.json: 원본 프로젝트 설정
- serve-local.mjs, RUN_GAME.cmd, README_LOCAL.md: 이번에 추가한 로컬 실행 지원 파일
- SOURCE_MANIFEST.json: 원본 파일별 크기와 SHA-256 및 추출 기준
- LOCAL_VERIFICATION.json: 이번 추출본의 검증 결과

Git 저장소 이력, 인증 정보, 브라우저 저장 데이터, node_modules는 포함하지 않습니다.
원본 소스·자산·기존 보고서는 전부 포함합니다.

## 기존 자동 테스트 실행

```text
node --experimental-vm-modules --test tests/*.test.mjs
```

기존 README에는 과거 버전 기록도 함께 있습니다.
현재 추출본에서 직접 수행한 검증과 제한은 LOCAL_VERIFICATION.json을 확인하세요.

## 이번 추출본 검증 결과

원본 1,362개 파일 복원 및 SHA-256 목록 생성, 게임 파일 463개 HTTP 응답 전수 검사를 완료했습니다.
기존 자동 테스트는 776개 중 744개 통과, 32개 실패했습니다.
실패는 변경하지 않은 기존 게임 소스로 실행한 결과이며, 원인 수정은 이번 파일 내보내기 범위에 포함하지 않았습니다.
상세 로그는 LOCAL_TEST_RESULTS.txt에 있습니다. 브라우저에서 실제 플레이는 별도로 검수하지 않았습니다.
