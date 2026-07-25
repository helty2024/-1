import officialProducts from '../../data/officialProducts';

const { PRODUCT_DATA_SOURCE } = require('../../config/officialApi');
const { request } = require('../../utils/officialApiClient');

function normalizeListProduct(product) {
  return {
    slug: product.slug,
    name: product.name,
    shortName: product.shortName || product.name,
    role: product.role || '',
    note: product.listNote || product.note || '',
    scene: product.listScene || product.scene || '',
    image: product.coverImage || product.image || (product.images && product.images.main) || '',
  };
}

async function listProductRecords() {
  if (PRODUCT_DATA_SOURCE === 'mock') return officialProducts;

  try {
    const products = await request({ path: `/public/products?_t=${Date.now()}` });
    const normalizedProducts = (products || []).map(normalizeListProduct);
    return normalizedProducts.length ? normalizedProducts : officialProducts;
  } catch (error) {
    return officialProducts;
  }
}

export { listProductRecords };
