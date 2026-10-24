// Region equipment sets (Alpha 0.108). Every stage drops pieces of its biome's set:
// weapon, helmet, chest, pants and boots. Wearing 2 or 4 pieces of one set adds bonuses.
// Pure data and arithmetic: no DOM, storage or randomness.
export const SET_SLOTS=Object.freeze(['weapon','helmet','armor','pants','boots']);
export const EQUIPMENT_SETS=Object.freeze(Object.fromEntries([
 {id:'forest',name:'숲의 사냥꾼',tier:1,color:'#e08a4f',bonuses:[{pieces:2,text:'이동 속도 +6%',stats:{speed:6}},{pieces:4,text:'공격력 +10% · 치명 +4%',stats:{damagePct:.10,crit:4}}],
  names:{weapon:[['단풍 사냥검','붉은잎 장검'],['가시덩굴 곡검','나무뿔 대검']],helmet:['사슴뿔 투구','덩굴 관'],armor:['단풍잎 흉갑','나무껍질 갑옷'],pants:['덩굴 각반','사냥꾼 바지'],boots:['나무뿌리 장화','이끼 발싸개']}},
 {id:'fire',name:'화염 군주',tier:2,color:'#ff7a3a',bonuses:[{pieces:2,text:'공격력 +8%',stats:{damagePct:.08}},{pieces:4,text:'치명 +8% · 공격력 +8%',stats:{crit:8,damagePct:.08}}],
  names:{weapon:[['용암 장검','불씨 검'],['화염 곡도','흑요석 대검']],helmet:['화염 왕관 투구','용암 투구'],armor:['흑요석 흉갑','불꽃 판금'],pants:['용암 각반','불꽃 판금 하의'],boots:['화산 장화','불꽃 철화']}},
 {id:'frost',name:'서리 수호자',tier:2,color:'#8fd8f5',bonuses:[{pieces:2,text:'피해 감소 +4%',stats:{reduction:4}},{pieces:4,text:'체력 +15% · 피해 감소 +4%',stats:{hpPct:.15,reduction:4}}],
  names:{weapon:[['빙결 장검','서리 검'],['빙하 곡검','얼음 결정 대검']],helmet:['서리 왕관 투구','빙결 투구'],armor:['서리 털 흉갑','빙하 판금'],pants:['서리 각반','빙결 판금 하의'],boots:['설원 장화','얼음 철화']}},
 {id:'ruins',name:'심연의 계약',tier:3,color:'#b67cf0',bonuses:[{pieces:2,text:'치명 +6%',stats:{crit:6}},{pieces:4,text:'공격력 +12% · 체력 +6%',stats:{damagePct:.12,hpPct:.06}}],
  names:{weapon:[['심연 장검','해골 검'],['공허 곡도','망령 대검']],helmet:['심연 관 투구','해골 투구'],armor:['공허 흉갑','망자 판금'],pants:['심연 각반','뼈 판금 하의'],boots:['공허 장화','망자 철화']}},
].map(set=>[set.id,Object.freeze({...set,bonuses:Object.freeze(set.bonuses.map(b=>Object.freeze({...b,stats:Object.freeze(b.stats)})))})])));
// Art ids in the equipment atlas: two weapon designs, then one per armor part.
export const setArtId=(set,slot,variant=0)=>`set_${set}_${slot==='weapon'?(variant?'blade2':'sword'):slot}`;
// counts: {setId: pieces worn}. Returns the summed stats of every reached bonus.
export function setBonusStats(counts){
 const total={damagePct:0,hpPct:0,speed:0,crit:0,reduction:0};
 for(const [id,count] of Object.entries(counts??{}))for(const bonus of EQUIPMENT_SETS[id]?.bonuses??[])if(count>=bonus.pieces)for(const [k,v] of Object.entries(bonus.stats))total[k]+=v;
 return total;
}
export function setBonusText(id,count=0){
 const set=EQUIPMENT_SETS[id];if(!set)return '';
 return set.bonuses.map(b=>(count>=b.pieces?'● ':'○ ')+b.pieces+'세트 · '+b.text).join('\n');
}
