import { loadAccountImage, loadDarkImage } from './imageLoader';

const imageCache: Record<string, Promise<string>> = {};

export const importAccountImage = (account: string, imageName: string): Promise<string> => {
  const cacheKey = `${account}:${imageName}`;
  // @ts-expect-error TS2801: This condition will always return true since this Promise<string> is always defined.
  if (imageCache[cacheKey]) {
    return imageCache[cacheKey];
  }

  const promise: Promise<string> = (async () => {
    try {
      if (!account) {
        const fallback = await loadDarkImage(imageName);
        return fallback.default;
      }
      try {
        const imagePath = await loadAccountImage(account, imageName);
        return imagePath.default;
      } catch (error) {
        console.error(`Failed to load image ${imageName} for account ${account}:`, error);
        try {
          const fallback = await loadDarkImage(imageName);
          return fallback.default;
        } catch (fallbackError) {
          console.error(`Fallback failed for ${imageName}:`, fallbackError);
          return "";
        }
      }
    } catch {
      return "";
    } finally {
      setTimeout(() => {
        promise.then((res) => {
          if (!res) {
            delete imageCache[cacheKey];
          }
        });
      }, 0);
    }
  })();

  imageCache[cacheKey] = promise;
  return promise;
};
