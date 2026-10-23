from pathlib import Path
import json,base64,html,re,zipfile,shutil
from PIL import Image,ImageOps,ImageDraw
root=Path(__file__).resolve().parents[1];folder=root/'tools/reports/stage-c';shots=folder/'screenshots'
balance=json.loads((folder/'balance.json').read_text());comparison=json.loads((folder/'test-comparison.json').read_text())
ui=(folder/'ui-full-tests-final.log').read_text();assert re.search(r'ℹ pass 239\nℹ fail 0',ui)
assert comparison['sameFailuresAfterChange'] and comparison['preexistingFailureCount']==19
for kind in ['home','more','hall','combat','success','failure','skills','materials']:
 for size in ['667x375','740x360','844x390','932x430']:
  p=shots/f'stage-c-{kind}-{size}.jpg';assert p.is_file();assert Image.open(p).size==tuple(map(int,size.split('x'))),(p,Image.open(p).size)
def esc(s):return html.escape(str(s))
def table(head,rows):return '<table><thead><tr>'+''.join('<th>'+esc(x)+'</th>' for x in head)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+esc(v)+'</td>' for v in row)+'</tr>' for row in rows)+'</tbody></table>'
def gallery(kind,label):
 out=f'<details><summary>{label} · 4개 가로 크기</summary><div class="gallery">'
 for size in ['667x375','740x360','844x390','932x430']:
  p=shots/f'stage-c-{kind}-{size}.jpg';data=base64.b64encode(p.read_bytes()).decode();out+=f'<figure><figcaption>{size}</figcaption><img alt="{label} {size}" src="data:image/jpeg;base64,{data}"></figure>'
 return out+'</div></details>'
rows=[]
for id,name in [('gold','골드'),('enhance','강화'),('promote','승급'),('skill','스킬')]:
 r=[next(x for x in balance['summary'] if x['id']==id and x['level']==10 and x['build']==b) for b in ['horde','boss','survival']]
 rows.append([name]+[f"{x['time']:.2f}초 / HP {x['hp']*100:.1f}%" for x in r])
body='''<p class="eyebrow">BEAST HUNTER · STAGE C · ALPHA 0.99.0</p><h1>성장 재료 던전 4종 구현 보고</h1><p class="lead">60초 전투 → 승패 → 한 번의 정산 → 저장 → 재입장 흐름을 기존 게임에 연결했습니다.</p><p class="muted">2026-10-23 · 기존 Sites 프로젝트 수정 · 실제 플레이어 PC·계정 로그인 없이 Work 검증 환경에서 작업</p>
<h2>1. 실제 프로젝트와 범위</h2><p>괴수 사냥꾼 / beast-hunter-motion. 기존 프로젝트 ID <code>appgprj_6acc7d4700248191a7337e7dcf529731</code>를 유지합니다. v1.1 명세의 단계 C(P1-1)만 구현했습니다. 기존 캐릭터·장비·몬스터·지역 그림, 등급 후광, 가로 전용 UI를 재사용했습니다.</p>
<h2>2. 실제로 동작하는 기능</h2><p>홈 하단 던전 또는 더보기 → 성장 던전에서 진입합니다. 4개 카드, 현재 보유 재료, 단계 선택, 확정 보상, 현재 프리셋 선택, 입장 버튼을 제공합니다. 각 던전은 1~10단계이며 성공 저장 뒤 해당 던전의 다음 단계가 열립니다. 실패·중단·시간초과 보상은 없습니다. 입장권·스태미나·일일 제한은 없습니다.</p>'''
body+=table(['던전','실제 적 구성','1단계 보상','10단계 보상 / 사용처'],[
 ['황금 무리 · 골드','약한 적 75마리, 3웨이브','600 골드','2,400 골드 · 기존 강화/승급/제작'],
 ['철갑의 제련소 · 강화','고체력 중갑 1마리씩, 3웨이브 · 장갑 25%','재련석 10','재련석 28 · 정제석 5 · 순수결정 2 / 기존 강화'],
 ['정예의 시련 · 승급','3웨이브 정예 · 마지막은 근접/중갑 정예 동시 등장','승급석 2 · 이형 결정 1','승급석 7 · 이형 결정 4 / 기존 승급'],
 ['잔상의 수련장 · 스킬','돌격·원거리·중갑의 서로 다른 혼합, 3웨이브','검술서 2','검술서 7 / 스킬 화면의 검술서 연구']])
body+='''<p>재련석/승급석 등은 기존 재료 ID와 동일한 수량을 사용합니다. 성공한 뒤 가방과 강화·승급 화면에 곧바로 반영됩니다. 검술서는 기존 도감 아이콘을 재사용하고 가방에 획득처와 사용처를 표시합니다. 검술서 3개 + 500골드로 연구 포인트 1개를 얻습니다. 연구는 최대 49포인트이며 기존 레벨별 무료 포인트·스킬 레벨 조건·무료 재분배는 유지됩니다. 같은 던전 재입장, 던전 선택으로, 프리셋 변경 후 재도전이 동작합니다.</p>
<h2>3. 구현하지 않은 항목</h2><p>단계 D의 캠페인 완료 기반 엔드 콘텐츠 해금·레이드·도전의 탑, 단계 E의 무한 학살·생존의 시련·보스 러시는 이번 범위가 아닙니다. 장신구·캐릭터 전용장비 드롭을 주는 별도 장비 던전도 추가하지 않았습니다. 고대 장비의 레이드 획득 예정 정책과 제작 장비는 유지됩니다. 새 아트와 전면 UI 교체는 없습니다.</p>
<h2>4. 결정값·기존 규칙 처리</h2><p>명세의 60초, 반복 입장, 실패 보상 없음, 프리셋 자유 전환을 적용했습니다. 강화·승급은 기존 재료를 사용합니다. 기존 스킬 강화에는 재료가 없고 레벨 포인트만 있었으므로, 기존 기능을 바꾸지 않고 검술서 연구 경로를 추가했습니다. 던전 최대 10단계, 단계별 적 수/능력치/보상, 연구 비용/상한은 명세에서 미정이었던 초기 구현값이며 위 표와 정의 파일에서 확인할 수 있습니다. 재고 한도(재료 100만/골드 1억)에 닿으면 실제 추가 가능한 수량만 정산·표시합니다. 던전은 장비·경험치를 따로 지급하지 않으며 캠페인 진행을 변경하지 않습니다.</p>
<h2>5. 세이브 호환성과 가로 화면 검증</h2><p>저장 키 <code>beast-hunter:profile:v1</code>는 동일하며 스키마는 12 → 13입니다. <code>dungeonProgress</code>, 검술서 재고, <code>skillBook.trainingPoints</code> 기본값을 추가했습니다. 기존 장비 인스턴스 ID·강화·재화·프리셋·진행도를 보존했습니다. 이전에 보존한 v10/v11 샘플과 변경 전 v12 샘플로 복원·재저장·백업 왕복을 검증했습니다. 사용자의 실제 스마트폰 세이브를 읽거나 변경하지 않았습니다.</p><p>667×375, 740×360, 844×390, 932×430에서 아래 8화면을 캡처했습니다. 던전 선택의 가로 넘침이 없고, 작은 화면의 단계 줄바꿈을 수정했으며 주요 입장/재입장 버튼은 화면 안에 유지됩니다. 결과/스킬의 상세 기록은 기존 내부 스크롤을 유지합니다. 브라우저 결과는 검증용 세이브를 사용합니다. 승급 던전은 자연 자동 전투로, 다른 일부 캡처는 동일 엔진을 빠르게 계산하는 QA 버튼으로 결과까지 진행했습니다. QA 파일은 배포물에서 제외합니다.</p>'''
for kind,label in [('home','홈 던전 진입점'),('more','더보기'),('hall','던전 선택'),('combat','전투 HUD'),('success','성공 정산'),('failure','실패 정산'),('skills','검술서 연구'),('materials','재료 가방')]:body+=gallery(kind,label)
body+='''<h2>6. 수용 테스트와 확인한 한계</h2><p><strong>전체 UI 통합 239개 통과 / 0실패.</strong> 엔진·장비·스킬·저장 등 광범위한 검사는 536개 중 517개 통과, 기존 실패 19개입니다. 합계 756개 통과 / 19개 기존 실패입니다. 신규 던전 엔진 19개와 신규 UI 8개는 모두 통과했습니다. 실패 19개는 이전 배포 커밋을 별도 체크아웃해 같은 이름·개수로 재현했으며 신규 실패는 없습니다. “전체 테스트 통과”로 표시하지 않습니다.</p><p>기존 실패는 폐기된 보스 고대 드롭·도감 60개·등급 프레임 기대, 특수 구간 보상 롤백 기대, 과거 몬스터 구성, 어셋 검사기의 오래된 모듈 경로 등입니다. 현재 기능으로 바꾸는 작업은 이번 범위에 포함하지 않았습니다. 전체 UI의 첫 재실행은 테스트 호스트의 1GB 힙 한도에 걸렸고, 마지막에는 테스트를 생략하지 않고 2GB 한도로 239개를 통과했습니다. 이는 사용자 브라우저 메모리 측정이 아닙니다.</p>'''
body+=table(['확인 항목','결과'],[
 ['4종 진입·3웨이브·성공/실패·재입장','엔진/UI/브라우저로 확인'],['보상/비용 중복, 빠른 재입장 클릭','한 전투 ID에 한 번만 저장·정산. 로딩 중 중복 입장 방지'],['저장 실패','결과와 다음 단계 해금을 동결. 다시 저장 성공 뒤 1회 확정'],['새로고침·중단·사망·60초 초과','실패, 신규 보상 없음. 기존 재료·캠페인 진행 보존'],['재련/승급 재료 부족','변경 전에 차단. 음수 재고와 중복 승급 없음'],['검술서 획득·연구·복원','동일 재고 소비, 포인트 저장, 레벨 조건 유지'],['기존 사냥·3난이도·장비·스킬·백업','관련 회귀/전체 UI 확인. 기존 19개 실패 별도 기록']])
body+='<h3>세 빌드 실제 엔진 측정</h3><p>동일 장비/능력치의 Lv.35 검증 프로필, 스킬 발동을 꺼 각인 차이를 분리하고 25ms 간격으로 자동 전투를 계산했습니다. 4던전 × 1·5·10단계 × 3빌드 × 5개 시드 = 180/180 성공. 10단계에서 공격력·최대 체력 +25% 비교 36/36 성공. 별도로 기본 Lv.1 프로필 4회 중 골드/스킬은 성공, 강화/승급은 시간초과했습니다. 모든 초보 캐릭터에게 모든 던전의 즉시 완료를 보장하지 않습니다.</p>'
body+=table(['10단계 평균','대군 처리','보스 화력','생존'],rows)
body+='''<p>골드 10단계에서 대군은 보스 빌드보다 약 39.6% 빠릅니다. 강화 10단계에서 보스 빌드는 대군보다 약 35.5% 빠릅니다. 생존 빌드의 뚜렷한 독자 우위는 이번 재료 던전 측정에서 충분히 확인되지 않았습니다. 명세의 전체 3빌드 균형 목표를 모두 충족했다고 선언하지 않습니다. +25% 비교는 공격력/체력 기준이며 별도 권장 전투력 체계의 검증은 아닙니다. 최대 몬스터·이펙트·프레임당 발동량은 원시 측정 JSON에 있습니다. 실제 스마트폰 FPS·장시간 발열·메모리는 이번 단계에서 측정하지 않았습니다. 로컬 저장 구조의 치팅 방지·서버 권위성도 보장하지 않습니다.</p>
<h2>7. 사이트와 검증 자료</h2><p><a href="https://beast-hunter-motion.jeagyouns.chatgpt.site">https://beast-hunter-motion.jeagyouns.chatgpt.site</a>. 최종 배포 성공 여부와 저장 버전은 완료 메시지의 실제 응답을 기준으로 합니다. 이 보고서와 검토 ZIP, 전투 원시 JSON, 기존 실패 비교, 전체 UI/엔진 로그, 가로 캡처 32장, v12 샘플을 저장했습니다.</p>
<h2>8. 다음 단계</h2><p>다음은 단계 D: 캠페인 완료 해금 로직, 레이드, 도전의 탑입니다. 나머지 엔드 콘텐츠 3종은 준비 중으로 구분합니다. 재료 던전 초기 보상과 검술서 연구 비용은 플레이 결과에 맞춰 이후 조정할 수 있습니다. 생존 빌드의 콘텐츠별 우위와 기존 실패 테스트의 현행 정책 정합성은 별도 정리가 남아 있습니다.</p>'''
report='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>괴수 사냥꾼 · 단계 C 보고</title><style>body{margin:0;background:#0c1319;color:#e4ded1;font:15px/1.8 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:40px 24px}h1,h2,h3{color:#e5c48b;line-height:1.5}h1{font-size:32px}h2{font-size:22px;margin-top:38px;border-bottom:1px solid #65583e;padding-bottom:8px}.eyebrow,.muted{color:#acb4b5;font-size:12px}.lead{font-size:19px}code{font-size:12px;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:13px;margin:20px 0}td,th{border:1px solid #4a4540;text-align:left;padding:9px}th{background:#27232a;color:#dfc394}a{color:#cfb98f}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%;border-radius:7px}figcaption{font-size:12px;color:#bda47e}details{border:1px solid #4e473c;border-radius:8px;padding:12px;margin:12px 0}summary{cursor:pointer;color:#e5c48b}strong{color:#f0d4a2}@media(max-width:700px){.gallery{grid-template-columns:1fr}table{font-size:11px}td,th{padding:5px}main{padding:20px 14px}}</style><main>'+body+'</main></html>'
reportpath=folder/'beast-hunter-stage-c-report.html';reportpath.write_text(report)
with zipfile.ZipFile(folder/'beast-hunter-stage-c-review.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['beast-hunter-stage-c-report.html','baseline-v12.json','balance.json','geometry.json','test-comparison.json','regression-tests-final.log','preexisting-test-failures.log','ui-full-tests-final.log']:
  z.write(folder/name,name)
 for p in shots.glob('*.jpg'):z.write(p,'screenshots/'+p.name)
 for name in ['dist/dungeons.js','tests/dungeons.test.mjs','tools/simulate-stage-c.mjs','tools/prepare-stage-c-qa.py','tools/create-stage-c-report.py']:z.write(root/name,name)
print(reportpath,reportpath.stat().st_size)
print('ZIP', (folder/'beast-hunter-stage-c-review.zip').stat().st_size)
