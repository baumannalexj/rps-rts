/** De-collides end-of-line labels vertically. Pure. */

export interface LabelIn {
  readonly id: string;
  /** Desired y (the line end). */
  readonly y: number;
}

export interface LabelOut {
  readonly id: string;
  readonly y: number;
  /** Where the label text is placed. */
  readonly labelY: number;
}

/**
 * Keeps labels at least `gap` apart and inside [top, bottom], moving each as little as it can.
 * Forward pass pushes down, backward pass pulls back up from the bottom edge.
 * If they can't all fit, the top edge wins and labels spill below `bottom`.
 */
export function layoutLabels(items: readonly LabelIn[], gap: number, top: number, bottom: number): LabelOut[] {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  const ys = sorted.map((i) => Math.max(top, i.y));
  for (let k = 1; k < ys.length; k++) ys[k] = Math.max(ys[k]!, ys[k - 1]! + gap);
  if (ys.length > 0) ys[ys.length - 1] = Math.min(ys[ys.length - 1]!, bottom);
  for (let k = ys.length - 2; k >= 0; k--) ys[k] = Math.min(ys[k]!, ys[k + 1]! - gap);
  for (let k = 0; k < ys.length; k++) {
    const floor = k === 0 ? top : ys[k - 1]! + gap;
    ys[k] = Math.max(ys[k]!, floor);
  }
  return sorted.map((i, k) => ({ id: i.id, y: i.y, labelY: ys[k]! }));
}
