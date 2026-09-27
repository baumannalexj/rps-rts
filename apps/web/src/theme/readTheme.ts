/** Reads palette tokens from CSS so canvas drawing follows the active light/dark theme. */

export interface ChartTheme {
  /** Resolves a CSS custom property like "--water" to a color string. */
  color(token: string): string;
  readonly font: string;
}

export const CHART_FONT = '10.5px "IBM Plex Mono", ui-monospace, monospace';

/**
 * Caches computed token values and invalidates them when the color scheme or the
 * [data-theme] attribute changes. Call `onChange` to redraw charts on theme flips.
 */
export class ThemeReader implements ChartTheme {
  readonly font: string = CHART_FONT;
  private readonly root: HTMLElement;
  private readonly cache = new Map<string, string>();
  private readonly listeners = new Set<() => void>();
  private readonly media: MediaQueryList | null;
  private readonly observer: MutationObserver | null;
  private readonly onMedia = (): void => this.invalidate();

  constructor(root: HTMLElement = document.documentElement) {
    this.root = root;
    this.media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
    this.media?.addEventListener('change', this.onMedia);
    this.observer = typeof MutationObserver === 'function' ? new MutationObserver(() => this.invalidate()) : null;
    this.observer?.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  color(token: string): string {
    let v = this.cache.get(token);
    if (v === undefined) {
      v = getComputedStyle(this.root).getPropertyValue(token).trim() || '#888';
      this.cache.set(token, v);
    }
    return v;
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  invalidate(): void {
    this.cache.clear();
    for (const l of this.listeners) l();
  }

  destroy(): void {
    this.media?.removeEventListener('change', this.onMedia);
    this.observer?.disconnect();
    this.listeners.clear();
  }
}
