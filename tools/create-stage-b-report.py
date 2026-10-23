from pathlib import Path
import base64, html, json, zipfile

root = Path(__file__).resolve().parent.parent
out = root / 'tools/reports'
data = json.loads((out / 'stage-b-balance.json').read_text())
rows = []
labels = {(1, 9): '1-9 밀집 특수', (2, 4): '2-4 중장갑 특수', (3, 8): '3-8 혼합 정예', (1, 10): '1-10 회복 보스', (2, 10): '2-10 방어 보스', (3, 10): '3-10 소환 보스'}
for key, label in labels.items():
    entries = {r['build']: r for r in data['summary'] if (r['chapter'], r['stage']) == key}
    cells = ''.join(f"<td>{entries[b]['time']:.2f}초 / {entries[b]['hp']*100:.1f}%</td>" for b in ['horde', 'boss', 'survival'])
    rows.append(f'<tr><th>{label}</th>{cells}</tr>')
galleries = []
for screen, label in [('home', '홈 · 입장 프리셋'), ('build', '빌드 관리'), ('map', '사냥 지도'), ('craft', '지정 각인 제작'), ('combat', '보스 전투 HUD'), ('result', '승리 결과'), ('equipment', '기존 장비 화면')]:
    images = []
    for size in ['667x375', '740x360', '844x390', '932x430']:
        p = out / 'stage-b-evidence' / f'stage-b-{screen}-{size}.jpg'
        assert p.stat().st_size > 1000, p
        encoded = base64.b64encode(p.read_bytes()).decode()
        images.append(f'<figure><img loading="lazy" src="data:image/jpeg;base64,{encoded}" alt="{label} {size}"><figcaption>{size}</figcaption></figure>')
    galleries.append(f'<details><summary>{label} · 4개 크기</summary><div class="gallery">{"".join(images)}</div></details>')

body = '''<p class="eyebrow">BEAST HUNTER · ALPHA 0.98.0 · 2026-10-22</p>
<h1>단계 B · P0 구현 및 검증 보고</h1>
<p class="lead">장비 각인, 통합 프리셋, 특수·정예·보스 규칙과 저장 정산을 연결했습니다. 기능 회귀 테스트는 통과했습니다. 밸런스 목표는 일부만 충족하며, 모바일 성능 합격은 아직 확정하지 않았습니다.</p>
<div class="metrics"><b>370<small>자동 테스트 통과</small></b><b>234<small>실제 엔진 시뮬레이션</small></b><b>28<small>최종 화면 증거</small></b><b>12<small>세이브 스키마</small></b></div>
<h2>1. 실제 프로젝트와 적용 범위</h2>
<p>기존 <strong>괴수 사냥꾼</strong> Sites 프로젝트를 수정했습니다. 프로젝트 ID는 <code>appgprj_6acc7d4700248191a7337e7dcf529731</code>입니다. 기존 공개 범위와 주소를 유지합니다. 단계 A 이후 단계 B만 구현했으며 C·D·E는 진행하지 않았습니다. 캐릭터·몬스터·아이템·맵·프레임 이미지는 재사용했고, 가로 모드 전용과 200칸 가방을 유지했습니다.</p>
<h2>2. 실제로 동작하는 기능</h2>
<ul><li><strong>추가 각인 8종:</strong> 번개 전이, 처치 폭발, 출혈, 처형, 흡혈, 광폭화, 방어 약화, 반격. 전투와 설명이 같은 정의 데이터를 참조합니다. 기존 선천 고유 능력과 장비 수치를 보존합니다.</li>
<li><strong>계산 제한:</strong> 같은 각인 수치를 합산하고 전이 대상 5명·흡혈 10%·장갑 약화 40%p 상한을 적용합니다. 지속 효과는 시간 갱신·최대 강도 유지, 재전이·재폭발·재반격을 차단합니다. 엔진 업데이트 1회당 고유 발동 50회, 시각 효과 400개 상한입니다.</li>
<li><strong>획득과 제작:</strong> 특수 20%·정예 30%·보스 50% 확률로 드롭 장비에 각인을 부여합니다. 일반 구간은 추가 각인 드롭이 없습니다. 제작 시 원하는 각인을 지정하거나 기존 보유 장비의 각인을 교체할 수 있습니다. 추가 비용은 1,500골드·괴수 뼈철 12·이형 결정 2입니다. 장비 ID·기본/강화 수치를 유지하며 재료 확인 후 한 번에 소모합니다.</li>
<li><strong>통합 프리셋 5개:</strong> 이름, 9개 장비 인스턴스 ID, 액티브 우선순서, 패시브·궁극기, 자동 스킬 정책과 각성을 저장합니다. 같은 장비를 복제하지 않고 공유합니다. 홈·입장 패널에서 두 번의 탭으로 변경하며 장비와 표시 수치를 함께 갱신합니다. 없는 장비는 빈 슬롯과 안내로 처리합니다. 잘못된 중복 참조는 적용을 거부합니다.</li>
<li><strong>챕터 타입:</strong> 1~3·5~7 일반, 4·9 특수, 8 정예, 10 보스입니다. 기존 3개 난이도와 별개입니다. 모두 60초입니다. 4구간 중장갑, 8구간 혼합 정예, 9구간 돌격 군집을 실제 적 구성에 적용했습니다.</li>
<li><strong>보스 의사결정:</strong> 숲 보스는 8초마다 최대 HP 2% 회복, 폐성 보스는 8초 피해 70% 감소 후 4초 약점, 빙하 보스는 HP 70%·35%에서 호위 적을 소환합니다. 체력·현재 상태·공략 힌트를 HUD에 표시합니다.</li>
<li><strong>보상과 저장:</strong> 특수·정예·보스의 보상은 전투 체크포인트로 격리합니다. 사망·시간초과·귀환·새로고침 시 해당 구간 보상을 취소합니다. 성공 시 전투/스테이지 ID를 기록한 저장 후보를 만들고 localStorage 저장이 성공한 뒤 진행도와 다음 해금을 확정합니다. 실패하면 입력을 잠그고 저장 재시도를 제공합니다. 결과 화면에서 같은 지점 재도전·프리셋 변경 후 재도전이 연결됩니다.</li></ul>
<h2>3. 구현하지 않은 항목과 이유</h2>
<p>성장 던전 4종, 캠페인 기반 엔드 해금, 레이드·도전의 탑·무한 학살·생존의 시련·보스 러시는 단계 C~E 범위이므로 추가하지 않았습니다. 기존 준비 중 메뉴를 완료 기능으로 세지 않습니다. 아래 밸런스 차이를 목표 안으로 조정하는 작업과 실기기 성능 검증도 남아 있습니다.</p>
<h2>4. 기존 규칙과 결정값 충돌 처리</h2>
<table><thead><tr><th>항목</th><th>처리</th></tr></thead><tbody>
<tr><td>기존 고유 능력</td><td>기존 18종 선천 능력과 무기 특성의 수치를 유지하고 정의 데이터를 단일화했습니다. 새 8종은 인스턴스당 선택 가능한 추가 각인 1칸으로 구분했습니다.</td></tr>
<tr><td>폐성 보스 약점</td><td>명세 예시는 +30%이나 기존 약점 배율 +50%를 우선 유지했습니다. 방어 구간 8초/70% 감소, 약점 구간 4초입니다.</td></tr>
<tr><td>일반 사냥의 중도 보상</td><td>일반 구간은 기존 점진 지급·복구 정책을 유지합니다. 새 특수·정예·보스는 실패/새로고침 시 미확정 보상이 없습니다. 업데이트 전 예약된 골드·재료·장비는 기존 복구 규칙을 유지합니다.</td></tr>
<tr><td>전투 중 장비 교체</td><td>기존 일시정지 중 개별 장비 교체는 유지합니다. 통합 프리셋·각인·제작·강화는 거점에서 적용합니다. 엄격 정산 구간에서 아직 확정되지 않은 드롭은 장착할 수 없습니다. 이미 발사된 스킬의 각인은 시전 시점 스냅샷을 사용합니다.</td></tr>
<tr><td>프리셋에서 참조한 장비 분해</td><td>기존 참조 장비 보호 정책을 유지합니다. 외부/옛 세이브에서 누락된 참조는 빈 슬롯 전환과 경고로 검증했습니다.</td></tr>
<tr><td>방어 약화의 해석</td><td>기존 엔진에 독립 방어력 스탯이 없으므로 장갑 피해 감소를 20%p씩 약화하고 받는 피해 +10%씩, 상한 40%p/+20%로 명시했습니다. 장갑이 없는 보스에서도 효과가 작동합니다.</td></tr>
<tr><td>지정되지 않은 획득 비용</td><td>각인 드롭 확률·각인 비용은 위의 별도 정의 데이터에 둔 초기값입니다. 기존 제작 비용에 추가되며 기존 재화만 사용합니다.</td></tr></tbody></table>
<h2>5. 세이브 호환성과 네 가지 화면 크기</h2>
<p>저장 키 <code>beast-hunter:profile:v1</code>을 유지하고 스키마를 12로 올렸습니다. v10/v11 원본·예약 보상·백업 등 단계 A의 보존 샘플 5개를 유지해 마이그레이션과 재저장/백업 왕복을 검증했습니다. 기존 장비 ID, 기본·강화 수치, 재화, 진행도와 완료 기록을 보존하며 과거 클리어에 새 보상을 소급 지급하지 않습니다. 기존 장비 프리셋 3개는 당시 현재 스킬 설정과 함께 통합하고, 별도 스킬 프리셋 원본 3개도 보존합니다.</p>
<p>이 샘플은 개발 QA용 백업입니다. 사용자 스마트폰의 실제 세이브를 백업했다는 뜻이 아닙니다. 사용자 기기와 외부 계정에 접속하지 않았습니다.</p>
<p>667×375, 740×360, 844×390, 932×430에서 홈·빌드·지도·제작·전투·결과·장비를 확인했습니다. 작은 화면의 제작 버튼은 40px, 프리셋 버튼은 40px로 유지합니다. 재료·빌드 상세·전리품은 제한된 영역 안에서 스크롤합니다. 고정 주요 버튼은 화면 안에 배치했습니다. 프리셋 이름의 포커스 이동 덮어쓰기, 기존 footer 스타일의 버튼 가림, 보스 안내 겹침, 결과 통계 밀림을 실제 브라우저 QA에서 수정했습니다.</p>
GALLERIES
<h2>6. 수용 테스트와 수치 결과</h2>
<p><strong>370/370 자동 테스트 통과:</strong> 단계 B/장비/스킬/저장 179개, 기존 전투·드롭·3개 챕터·60초 흐름 회귀 175개, UI 통합 16개입니다. 파서 검사와 git diff 공백 검사도 통과했습니다. 새 UI 통합 테스트는 이름 입력 후 포커스 이동 저장, 다섯 슬롯 복구, 각인 비용, 저장 실패→재시도→정산 1회, 재도전 지점 유지, 정산 이후 인스턴스 ID에 따른 전리품 보관 표시를 포함합니다.</p>
<p>실제 브라우저에서도 이름 변경/저장, 홈 프리셋 선택, 각인 부여, 각인 지정 제작(추가 비용 포함 총 5,000골드 차감), 보스 자동 전투→승리→보상 저장, 프리셋 관리→같은 보스 재도전, 중도 귀환을 확인했습니다. 저장 완료 ID가 중복 없이 늘고 미완료 귀환에는 보상이 추가되지 않았습니다.</p>
<h3>3빌드 측정: 평균 시간 / 남은 HP</h3>
<p>같은 레벨·기본 장비·능력치에 각인만 달리한 실제 엔진 자동 전투입니다. 각인 차이를 분리하려고 스킬 시전을 끈 상태로 25ms 고정 스텝, 콘텐츠당 빌드별 고정 시드 10개를 사용했습니다. 생존 빌드는 흡혈·반격과 방어 약화를 사용하고 기존 피해 감소 능력치는 동일하게 맞췄습니다.</p>
<table><thead><tr><th>콘텐츠</th><th>대군</th><th>보스</th><th>생존</th></tr></thead><tbody>BALANCE_ROWS</tbody></table>
<p><strong>판정: 일부 충족.</strong> 1-9 대군 빌드는 약 31~32% 빨라 목표 20~40% 안입니다. 3-10 생존 빌드는 남은 HP 99.9%로 다른 빌드의 88.8~89.2%보다 여유가 있습니다. 보스 빌드는 3종 보스에서 가장 빠르지만 차이는 약 2~13%로 20% 목표에 못 미칩니다. 중장갑/혼합 정예에서도 대군 빌드 우세가 약 40~46%여서 역할 분리가 더 필요합니다. 각 빌드의 장점은 확인했으나 전체 밸런스 합격으로 판정하지 않습니다.</p>
<p>기본 표본 180/180 승리, 공격력과 최대 HP를 각각 25% 높인 보조 표본 54/54 승리입니다. 이는 비추천 빌드도 성장으로 클리어 가능함을 보이는 제한된 표본입니다. 콘텐츠별 권장 전투력 숫자가 아직 정의되어 있지 않아, 명세의 “권장 전투력 +25%” 전체 구간을 검증한 것은 아닙니다. 플레이 재미와 반복 의지는 사용자 플레이 테스트가 필요합니다.</p>
<h3>성능과 확인하지 못한 위험</h3>
<ul><li>대표 시뮬레이션의 동시 적 최대 32, 시각 효과 최대 204, 고유 발동 최대 50이었습니다. 별도 밀집 테스트는 발동 50/시각 효과 400 상한과 재전이·재폭발 차단을 검증합니다. 엔진 CPU 표본은 Node에서의 논리 처리이며 화면 FPS가 아닙니다.</li>
<li>클라우드 Chromium에서는 프레임 CPU p95 약 31.6~74.5ms, 최대 약 549.5ms가 관측됐습니다. 이전 QA 탭 동시 실행과 원격 환경이 섞여 있어 실기기 성능으로 해석할 수 없습니다. 프레임 안정성 합격을 주장하지 않습니다. 단계 E 전이라도 저사양 실기기 측정과 렌더/DOM 비용 점검이 필요합니다.</li>
<li>localStorage 기반이므로 서버 권위성·치팅 방지·서로 다른 기기 동기화는 없습니다. 같은 브라우저의 여러 실행 탭 사이에 저장 동시성 잠금도 없습니다. QA 중 이전 탭이 같은 키를 덮는 현상을 확인했으며 한 실행 탭 사용이 필요합니다.</li>
<li>OS 강제 종료, 실제 iOS/Android 주소창·노치·GPU, 장시간 메모리 사용은 직접 검증하지 못했습니다. 개발 브라우저의 DOM 검사만으로 이 항목을 통과시키지 않았습니다.</li></ul>
<h2>7. 적용 주소와 증거</h2>
<p><a href="https://beast-hunter-motion.jeagyouns.chatgpt.site">https://beast-hunter-motion.jeagyouns.chatgpt.site</a> · 기존 공개 사이트에 Alpha 0.98.0으로 배포할 소스입니다. 최종 배포 성공 여부와 버전은 작업 완료 메시지를 기준으로 확인합니다. 내부 미리보기 주소는 사용자용 링크로 제공하지 않습니다.</p>
<p>검토 ZIP에는 이 보고서, 화면 28장, 뷰포트 좌표 검사, 3개 테스트 로그, 234회 원시 측정, 보존 세이브 샘플과 재현 스크립트가 들어 있습니다. 소스는 기존 Sites Git 저장소에 함께 보존합니다.</p>
<h2>8. 다음 단계에서 먼저 정할 사항</h2>
<p>단계 C는 아직 시작하지 않았습니다. 진행 전에 보스/중장갑 구간의 빌드 차이를 더 조정할지, 현재 초기값으로 던전 공급 루프부터 연결할지 정하면 됩니다. 던전은 기존 재료와 비용을 연결하며 입장권·일일 제한을 새로 만들지 않는 명세를 따릅니다.</p>
'''
body = body.replace('GALLERIES', ''.join(galleries)).replace('BALANCE_ROWS', ''.join(rows))
css = '''body{margin:0;background:#0b1118;color:#ddd7ca;font:15px/1.8 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:42px 24px}h1,h2,h3{color:#f2d7a0;line-height:1.35}h1{font-size:38px}h2{font-size:24px;margin-top:48px;border-top:1px solid #715b3e;padding-top:26px}h3{margin-top:30px}.eyebrow{letter-spacing:2px;color:#b99b69;font-size:12px}.lead{font-size:19px;max-width:850px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:30px 0}.metrics b{display:block;background:#15212a;padding:16px;color:#f0cf8a;font-size:28px;border-radius:9px}.metrics small{display:block;font-size:12px;color:#c3c1b7;font-weight:400}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid #4b4c45;padding:10px;text-align:left}th{color:#e4c38b;background:#15212a}li{margin-bottom:12px}a{color:#d9ba82}code{overflow-wrap:anywhere;font-size:12px}details{margin:12px 0;border:1px solid #5f513b;border-radius:8px;padding:12px}summary{cursor:pointer;color:#efd3a1}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}figure{margin:0}img{width:100%;display:block;border-radius:5px}figcaption{font-size:12px;color:#b7ac98;margin:5px}p{overflow-wrap:anywhere}@media(max-width:700px){.metrics{grid-template-columns:1fr 1fr}.gallery{grid-template-columns:1fr}h1{font-size:29px}main{padding:24px 16px}table{font-size:11px}th,td{padding:6px}}'''
target = out / 'beast-hunter-stage-b-report.html'
target.write_text(f'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>괴수 사냥꾼 단계 B 보고</title><style>{css}</style><main>{body}</main></html>')
archive = out / 'beast-hunter-stage-b-review.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in [target, out / 'stage-b-balance.json', *out.glob('stage-b-*-tests.log'), *sorted((out / 'stage-b-evidence').glob('*')), *sorted((out / 'stage-b-baseline').glob('*')), root / 'tools/simulate-stage-b.mjs', Path(__file__), root / 'tests/stage-b.test.mjs']:
        z.write(p, p.relative_to(root))
print(target, target.stat().st_size)
print(archive, archive.stat().st_size)
