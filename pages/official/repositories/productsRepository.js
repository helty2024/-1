import officialProducts from '../../../data/officialProducts';
import localProducts from '../data/products';

const { PRODUCT_DATA_SOURCE } = require('../../../config/officialApi');
const { request } = require('../../../utils/officialApiClient');

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

function normalizeProductDetail(product) {
  return {
    ...product,
    shortName: product.shortName || product.name,
    images: {
      main: '',
      detail: '',
      scene: '',
      material: '',
      other: '',
      ...(product.images || {}),
    },
    sellingPoints: product.sellingPoints || [],
    specs: product.specs || [],
    scenarios: product.scenarios || [],
    agencyValue: product.agencyValue || [],
    evidence: product.evidence || null,
  };
}

async function listProductRecords() {
  if (PRODUCT_DATA_SOURCE === 'mock') return officialProducts;

  try {
    const products = await request({ path: `/public/products?_t=${Date.now()}` });
    return (products || []).map(normalizeListProduct);
  } catch (error) {
    if (officialProducts.length) return officialProducts;
    throw error;
  }
}

async function getProductRecord(slug) {
  if (PRODUCT_DATA_SOURCE === 'mock') {
    return localProducts[slug] ? normalizeProductDetail(localProducts[slug]) : null;
  }

  try {
    const product = await request({
      path: `/public/products/${encodeURIComponent(slug)}?_t=${Date.now()}`,
    });
    return normalizeProductDetail(product);
  } catch (error) {
    const fallback = localProducts[slug];
    if (fallback) return normalizeProductDetail(fallback);
    throw error;
  }
}

export { getProductRecord, listProductRecords };
