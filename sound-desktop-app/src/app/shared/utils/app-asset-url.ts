const appAssetBase = (() => {
  if (typeof document === 'undefined') return null;

  const baseHref = document.querySelector('base')?.getAttribute('href') || './';
  return new URL(baseHref, document.URL);
})();

/** Resolves a public asset from the Angular base URL in both web and file builds. */
export function appAssetUrl(path: string): string {
  if (!path) return '';
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path;
  if (!appAssetBase) return path;

  return new URL(path.replace(/^\/+/, ''), appAssetBase).href;
}
