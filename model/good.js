const products = [
  {
    saasId: 'zhishentang',
    storeId: '1000',
    spuId: '1001',
    title: '黑参液',
    primaryImage: '/images/products/image-1.jpeg',
    images: ['/images/products/image-1.jpeg'],
    video: null,
    available: 1,
    minSalePrice: 6990,
    minLinePrice: 9990,
    maxSalePrice: 6990,
    maxLinePrice: 9990,
    spuStockQuantity: 99,
    soldNum: 128,
    isPutOnSale: 1,
    categoryIds: ['black-ginseng'],
    specList: [
      {
        specId: 'spec-package',
        title: '规格',
        specValueList: [
          {
            specValueId: 'black-liquid-20',
            specId: 'spec-package',
            specValue: '20袋',
            image: null,
          },
        ],
      },
    ],
    skuList: [
      {
        skuId: 'sku-1001',
        skuImage: '/images/products/image-1.jpeg',
        specInfo: [
          {
            specId: 'spec-package',
            specTitle: '规格',
            specValueId: 'black-liquid-20',
            specValue: '20袋',
          },
        ],
        priceInfo: [
          { priceType: 1, price: '6990', priceTypeName: '销售价格' },
          { priceType: 2, price: '9990', priceTypeName: '划线价格' },
        ],
        stockInfo: {
          stockQuantity: 99,
          safeStockQuantity: 0,
          soldQuantity: 0,
        },
        weight: { value: null, unit: 'KG' },
        volume: null,
        profitPrice: null,
      },
    ],
    spuTagList: [{ id: 'tag-hot', title: '礼盒促销', image: null }],
    limitInfo: [{ text: '每人限购5件' }],
    desc: ['/images/products/image-1.jpeg'],
    etitle: '黑参液礼盒促销',
  },
  {
    saasId: 'zhishentang',
    storeId: '1000',
    spuId: '1002',
    title: '红参膏',
    primaryImage: '/images/products/image-2.jpeg',
    images: ['/images/products/image-2.jpeg'],
    video: null,
    available: 1,
    minSalePrice: 6990,
    minLinePrice: 9990,
    maxSalePrice: 6990,
    maxLinePrice: 9990,
    spuStockQuantity: 99,
    soldNum: 96,
    isPutOnSale: 1,
    categoryIds: ['red-ginseng-paste'],
    specList: [
      {
        specId: 'spec-package',
        title: '规格',
        specValueList: [
          {
            specValueId: 'red-paste-200',
            specId: 'spec-package',
            specValue: '200g',
            image: null,
          },
        ],
      },
    ],
    skuList: [
      {
        skuId: 'sku-1002',
        skuImage: '/images/products/image-2.jpeg',
        specInfo: [
          {
            specId: 'spec-package',
            specTitle: '规格',
            specValueId: 'red-paste-200',
            specValue: '200g',
          },
        ],
        priceInfo: [
          { priceType: 1, price: '6990', priceTypeName: '销售价格' },
          { priceType: 2, price: '9990', priceTypeName: '划线价格' },
        ],
        stockInfo: {
          stockQuantity: 99,
          safeStockQuantity: 0,
          soldQuantity: 0,
        },
        weight: { value: null, unit: 'KG' },
        volume: null,
        profitPrice: null,
      },
    ],
    spuTagList: [{ id: 'tag-choice', title: '精选好物', image: null }],
    limitInfo: [{ text: '每人限购5件' }],
    desc: ['/images/products/image-2.jpeg'],
    etitle: '红参膏 200g',
  },
];

export function genGood(id = '1001', available = 1) {
  const item = products.find((good) => good.spuId === String(id)) || products[Number(id) % products.length] || products[0];
  return {
    ...item,
    available,
    images: item.images || [item.primaryImage],
    desc: item.desc || [item.primaryImage],
  };
}

export function getAllGoods() {
  return products.map((item) => genGood(item.spuId));
}
