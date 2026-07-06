import { getAllGoods } from './good';

export function getGoodsList(baseID = 0, length = 10) {
  const goods = getAllGoods();
  const start = Math.max(Number(baseID) || 0, 0);
  const end = start + length;

  return goods.slice(start, end);
}

export const goodsList = getAllGoods();
