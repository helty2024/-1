const resolvedImages = Object.create(null);
const pendingImages = Object.create(null);

function isLocalHttpUrl(url) {
  return typeof url === 'string' && /^http:\/\//i.test(url);
}

function downloadLocalImage(url) {
  return new Promise((resolve) => {
    wx.downloadFile({
      url,
      timeout: 15000,
      success(response) {
        if (
          response.statusCode < 200 ||
          response.statusCode >= 300 ||
          !response.tempFilePath
        ) {
          console.error('[officialMedia] image download returned no file', {
            url,
            statusCode: response.statusCode,
          });
          resolve('');
          return;
        }

        resolve(response.tempFilePath);
      },
      fail(error) {
        console.error('[officialMedia] image download failed', { url, error });
        resolve('');
      },
    });
  });
}

function resolveDisplayImage(url) {
  if (!isLocalHttpUrl(url)) return Promise.resolve(url || '');
  if (resolvedImages[url]) return Promise.resolve(resolvedImages[url]);
  if (pendingImages[url]) return pendingImages[url];

  pendingImages[url] = downloadLocalImage(url).then((localPath) => {
    if (localPath) resolvedImages[url] = localPath;
    return localPath;
  }).finally(() => {
    delete pendingImages[url];
  });

  return pendingImages[url];
}

async function localizeContentImages(content) {
  if (!content) return content;

  const sections = await Promise.all(
    (content.sections || []).map(async (section) => ({
      ...section,
      image: await resolveDisplayImage(section.image),
      cards: await Promise.all(
        (section.cards || []).map(async (card) => ({
          ...card,
          image: await resolveDisplayImage(card.image),
        })),
      ),
    })),
  );

  return {
    ...content,
    coverImage: await resolveDisplayImage(content.coverImage),
    sections,
  };
}

module.exports = {
  localizeContentImages,
  resolveDisplayImage,
};
