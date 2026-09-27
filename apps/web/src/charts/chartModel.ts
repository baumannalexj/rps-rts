/** Turns ChartData + a pixel box into everything the renderer draws. Pure, testable without a canvas. */
import type { ChartData } from './ChartData.ts';
import { LinearScale, nearestIndex, niceMax, timeTicks, valueTicks } from './LinearScale.ts';
import { layoutLabels } from './labelLayout.ts';
import { fmtAxis, fmtNum, fmtTime } from '../presenters/format.ts';

export const CHART_PADDING = { left: 40, right: 46, top: 8, bottom: 20 } as const;
export const LABEL_GAP = 12;

export interface Plot {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface GridLine {
  readonly y: number;
  readonly label: string;
}

export interface TimeTick {
  readonly x: number;
  readonly label: string;
}

export interface EndLabel {
  readonly seriesIndex: number;
  readonly x: number;
  readonly y: number;
  readonly labelY: number;
  readonly text: string;
}

export interface ChartModel {
  readonly plot: Plot;
  readonly yMax: number;
  readonly x: LinearScale;
  readonly y: LinearScale;
  readonly grid: readonly GridLine[];
  readonly timeTicks: readonly TimeTick[];
  /** Pixel points per series, same order as data.series. */
  readonly paths: readonly (readonly (readonly [number, number])[])[];
  readonly ends: readonly EndLabel[];
}

export function buildChartModel(data: ChartData, width: number, height: number): ChartModel | null {
  const { times, series } = data;
  if (times.length < 2 || width <= 0 || height <= 0) return null;
  const P = CHART_PADDING;
  const plot: Plot = {
    left: P.left,
    top: P.top,
    width: Math.max(1, width - P.left - P.right),
    height: Math.max(1, height - P.top - P.bottom),
  };
  let max = 0;
  for (const s of series) for (const v of s.values) if (v > max) max = v;
  const yMax = niceMax(max * 1.05);
  const t0 = times[0]!;
  const t1 = times[times.length - 1]!;
  const x = new LinearScale(t0, Math.max(t0 + 1, t1), plot.left, plot.left + plot.width);
  const y = new LinearScale(0, yMax, plot.top + plot.height, plot.top);

  const grid = valueTicks(yMax, 4).map((v) => ({ y: Math.round(y.map(v)) + 0.5, label: fmtAxis(v) }));
  const ticks = timeTicks(t0, t1).map((t) => ({ x: x.map(t), label: fmtTime(t) }));
  const paths = series.map((s) => times.map((t, k) => [x.map(t), y.map(s.values[k] ?? 0)] as const));

  const xEnd = plot.left + plot.width;
  const rawEnds = series.map((s, i) => {
    const v = s.values[times.length - 1] ?? 0;
    return { id: String(i), y: y.map(v), v };
  });
  const laid = layoutLabels(rawEnds, LABEL_GAP, plot.top + 4, plot.top + plot.height);
  const ends: EndLabel[] = laid.map((l) => {
    const i = Number(l.id);
    return { seriesIndex: i, x: xEnd, y: l.y, labelY: l.labelY, text: fmtNum(rawEnds[i]!.v) };
  });

  return { plot, yMax, x, y, grid, timeTicks: ticks, paths, ends };
}

export interface HoverInfo {
  readonly index: number;
  readonly x: number;
  readonly points: readonly { readonly seriesIndex: number; readonly y: number }[];
  readonly lines: readonly string[];
}

/** Hover state for a pointer at canvas-x `px`, or null when outside the plot. */
export function hoverAt(model: ChartModel, data: ChartData, px: number): HoverInfo | null {
  const { plot } = model;
  if (px < plot.left || px > plot.left + plot.width) return null;
  const k = nearestIndex(data.times, model.x.invert(px));
  if (k < 0) return null;
  const t = data.times[k]!;
  const x = model.x.map(t);
  return {
    index: k,
    x,
    points: data.series.map((s, i) => ({ seriesIndex: i, y: model.y.map(s.values[k] ?? 0) })),
    lines: tooltipLines(data, k),
  };
}

export function tooltipLines(data: ChartData, k: number): string[] {
  const t = data.times[k] ?? 0;
  return [fmtTime(t), ...data.series.map((s) => `${s.label.padEnd(9, ' ')} ${fmtNum(s.values[k] ?? 0)}`)];
}

/** Tooltip left offset: to the right of the crosshair unless it would overflow, then to the left. */
export function tooltipLeft(x: number, tipWidth: number, canvasWidth: number, offset = 12): number {
  return x + offset + tipWidth > canvasWidth ? x - tipWidth - offset : x + offset;
}
