const CHUNK_LOAD_MESSAGES = [
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "importing a module script failed",
  "chunkloaderror",
  "loading chunk",
  "unable to preload css"
];

export function isChunkLoadError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return CHUNK_LOAD_MESSAGES.some(fragment => message.includes(fragment));
}

export function chunkRecoveryUrl(currentHref, targetFullPath = "/") {
  const url = new URL(currentHref);
  const routePath = targetFullPath.startsWith("/") ? targetFullPath : `/${targetFullPath}`;
  url.hash = `#${routePath}`;
  return url.href;
}
