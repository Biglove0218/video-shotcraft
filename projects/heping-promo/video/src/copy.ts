// 全片文案（用户确认版）。镜头组件的默认 props 从这里取，FontGate 也按这里预载字形。
export const COPY = {
  city: '瑞安市',
  name: '和平机械配件厂',
  nameLines: ['和平机械', '配件厂'],
  seal: '和平',
  s1Sub: ['锻件源头工厂', '20', '年老厂'],
  s2Kicker: '对焊法兰',
  s2Steps: ['来图', '锻造毛坯', '精车成品'],
  s3Kicker: '平焊法兰',
  s3Title: '毛坯 → 成品',
  s3Before: '毛坯',
  s3After: '成品',
  s4Kicker: '阀门配件 · 毛坯锻件',
  s4Title: ['自由锻', '非标定制'],
  s5Title: ['毛坯成品', '一站供应'],
  s5Sub: '来图加工',
  s6Kicker: '材质齐全 · 执行国标',
  specs: [
    { k: '执行标准', v: '国标 GB' },
    { k: '碳钢', v: '20# · 16Mn' },
    { k: '不锈钢', v: '304 · 316' },
  ],
  s7Tags: ['可开票', '全国发货'],
  contactLabel: '联系人',
  contact: '陈和平',
  phone: '133 5336 3168',
  addr: ['浙江省温州市瑞安市潘岱街道', '寺前村老坑底 1 号'],
  years: '20 年老厂',
};

export const ALL_TEXT = Array.from(new Set(JSON.stringify(COPY).split(''))).join('') + '→·#0123456789';
