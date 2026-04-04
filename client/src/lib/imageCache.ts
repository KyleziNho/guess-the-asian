// Sequential image preloader with priority override.
//
// One image is fetched at a time so the very first image finishes as fast as
// the network allows (no bandwidth contention). As soon as one completes, the
// next one in the queue starts. If the user is about to view an image that
// hasn't loaded yet, `prioritizeImage` moves it to the front of the queue.

const cache = new Map<string, HTMLImageElement>();
const queue: string[] = [];
let currentlyLoading: string | null = null;

function loadNext() {
  if (currentlyLoading) return;

  // Skip any URLs that got cached while they were sitting in the queue.
  let url: string | undefined;
  while (queue.length > 0) {
    const candidate = queue.shift();
    if (candidate && !cache.has(candidate)) {
      url = candidate;
      break;
    }
  }
  if (!url) return;

  currentlyLoading = url;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    cache.set(url!, img);
    currentlyLoading = null;
    loadNext();
  };
  img.onerror = () => {
    currentlyLoading = null;
    loadNext();
  };
  img.src = url;
}

export function queueImage(url: string) {
  if (!url) return;
  if (cache.has(url)) return;
  if (currentlyLoading === url) return;
  if (queue.includes(url)) return;
  queue.push(url);
  loadNext();
}

export function queueImages(urls: string[]) {
  for (const url of urls) queueImage(url);
}

// Move `url` to the front of the queue so it starts as soon as the current
// download finishes. No-op if it's already cached or currently loading.
export function prioritizeImage(url: string) {
  if (!url) return;
  if (cache.has(url)) return;
  if (currentlyLoading === url) return;
  const idx = queue.indexOf(url);
  if (idx !== -1) queue.splice(idx, 1);
  queue.unshift(url);
  loadNext();
}

export function isImageCached(url: string): boolean {
  return cache.has(url);
}
