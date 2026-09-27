/** FrameScheduler on requestAnimationFrame; falls back to ~60 Hz timers outside the browser. */
import type { FrameScheduler } from '@rps/contracts';

export class BrowserFrameScheduler implements FrameScheduler {
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextTimerId = 1;

  request(callback: (nowMs: number) => void): number {
    if (typeof globalThis.requestAnimationFrame === 'function') {
      return globalThis.requestAnimationFrame(callback);
    }
    const id = this.nextTimerId++;
    this.timers.set(
      id,
      setTimeout(() => {
        this.timers.delete(id);
        callback(this.now());
      }, 16),
    );
    return id;
  }

  cancel(handle: number): void {
    const timer = this.timers.get(handle);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(handle);
    } else if (typeof globalThis.cancelAnimationFrame === 'function') {
      globalThis.cancelAnimationFrame(handle);
    }
  }

  now(): number {
    return typeof globalThis.performance?.now === 'function' ? globalThis.performance.now() : Date.now();
  }
}
