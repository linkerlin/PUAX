/**
 * 梦议会：一条编好的航线，而不是八梦菜单。
 * 坐忘破框 → 混沌筑巢 → 庖丁释错 → 薪火验真。
 */

export const DREAM_COUNCIL_LEGS = [
  { role: 'dream-zuowang', name: '坐忘', purpose: '空杯破先入' },
  { role: 'dream-hundun', name: '混沌', purpose: '自洽宇宙中筑巢，暂缓证伪' },
  { role: 'dream-paoding', name: '庖丁', purpose: '报错即纹理，重释约束' },
  { role: 'dream-xinhuo', name: '薪火', purpose: '醒梦验真，假设永不自动升格' },
] as const;

export type DreamCouncilLeg = (typeof DREAM_COUNCIL_LEGS)[number];

export function compileCouncilItinerary(objective: string): string {
  const legs = DREAM_COUNCIL_LEGS.map(
    (leg, i) => `${i + 1}. ${leg.name}（${leg.role}）— ${leg.purpose}`
  ).join('\n');
  return [
    '[PUAX-DREAM-COUNCIL] 梦议会航线，非自助菜单。',
    `锚点：${objective}`,
    legs,
    '规则：按序走完；中途可醒；薪火收束前不得把假设写成结论。',
    '入梦：puax_enter_dreamscape({ council: true, boundary })。醒：puax_awaken。',
  ].join('\n');
}

export function firstCouncilRole(): DreamCouncilLeg {
  return DREAM_COUNCIL_LEGS[0];
}
