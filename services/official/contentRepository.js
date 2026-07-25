const { CONTENT_DATA_SOURCE } = require('../../config/officialApi');
const { request } = require('../../utils/officialApiClient');
const { localizeContentImages } = require('../../utils/officialMedia');
const { getContent } = require('../../data/officialContent');

async function getContentPage(type) {
  if (CONTENT_DATA_SOURCE === 'mock') return getContent(type);

  try {
    const content = await request({ path: `/public/content-pages/${type}` });
    return await localizeContentImages(content);
  } catch (error) {
    const fallback = getContent(type);
    if (fallback) return fallback;
    throw error;
  }
}

module.exports = { getContentPage };
