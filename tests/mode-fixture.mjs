// Alpha 0.139 난이도 개편: 정예 opens after every chapter is cleared on 일반, 악몽 after every chapter on 정예, and inside a mode the
// chapters open one by one. openMode makes `chapter` of `mode` playable: every chapter cleared, earlier chapters beaten on `mode`.
export function openMode(g,p,mode,chapter=1){const all=g.STAGES.length;p.clearedStage=all;p.unlockedStage=all;p.stageProgress=g.STAGES.map(()=>10);
 p.bossMastery=g.STAGES.map((_,i)=>Math.max(p.bossMastery?.[i]??-1,mode?(i<chapter-1?mode:mode-1):0));return p;}
