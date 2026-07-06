export function getCategoryList() {
  return [
    {
      groupId: 'black-ginseng',
      name: '黑参',
      thumbnail: '/images/products/image-1.jpeg',
      children: [
        {
          groupId: 'black-ginseng-products',
          name: '黑参',
          thumbnail: '/images/products/image-1.jpeg',
          children: [
            {
              groupId: 'black-liquid',
              name: '黑参液',
              thumbnail: '/images/products/image-1.jpeg',
            },
          ],
        },
      ],
    },
    {
      groupId: 'paste-products',
      name: '黑参/红参膏',
      thumbnail: '/images/products/image-2.jpeg',
      children: [
        {
          groupId: 'paste-products-list',
          name: '黑参/红参膏',
          thumbnail: '/images/products/image-2.jpeg',
          children: [
            {
              groupId: 'red-paste',
              name: '红参膏',
              thumbnail: '/images/products/image-2.jpeg',
            },
          ],
        },
      ],
    },
  ];
}
