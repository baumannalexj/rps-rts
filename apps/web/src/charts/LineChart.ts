/** Canvas line chart renderer. All layout math lives in chartModel.ts; this only draws. */
import type { ChartData } from './ChartData.ts';
import type { ChartTheme } from '../theme/readTheme.ts';
import { buildChartModel, hoverAt, tooltipLeft, type ChartModel } from './chartModel.ts';

const EMPTY: ChartData = { times: [], series: [] };

export class LineChart {
  readonly canvas: HTMLCanvasElement;
  readonly tip: HTMLElement;
  private readonly theme: ChartTheme;
  /** Horizontal offset of the canvas inside the tooltip's positioned parent. */
  private readonly tipOffsetX: number;
  private data: ChartData = EMPTY;
  private hoverX: number | null = null;
  private readonly onMove = (e: PointerEvent): void => {
    const r = this.canvas.getBoundingClientRect();
    this.hoverX = e.clientX - r.left;
    this.draw();
  };
  private readonly onLeave = (): void => {
    this.hoverX = null;
    this.tip.hidden = true;
    this.draw();
  };

  constructor(canvas: HTMLCanvasElement, tip: HTMLElement, theme: ChartTheme, tipOffsetX = 12) {
    this.canvas = canvas;
    this.tip = tip;
    this.theme = theme;
    this.tipOffsetX = tipOffsetX;
    this.tip.hidden = true;
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerleave', this.onLeave);
  }

  setData(data: ChartData): void {
    this.data = data;
    this.draw();
  }

  draw(): void {
    const cv = this.canvas;
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    if (W === 0 || H === 0) return;
    const dpr = globalThis.devicePixelRatio || 1;
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (cv.width !== pw || cv.height !== ph) {
      cv.width = pw;
      cv.height = ph;
    }
    const g = cv.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);

    const model = buildChartModel(this.data, W, H);
    if (!model) {
      this.tip.hidden = true;
      return;
    }
    const th = this.theme;
    const { plot } = model;

    // Grid and axis labels.
    g.font = th.font;
    g.fillStyle = th.color('--t2');
    g.strokeStyle = th.color('--grid');
    g.lineWidth = 1;
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    for (const line of model.grid) {
      g.beginPath();
      g.moveTo(plot.left, line.y);
      g.lineTo(plot.left + plot.width, line.y);
      g.stroke();
      g.fillText(line.label, plot.left - 6, line.y);
    }
    g.textAlign = 'center';
    g.textBaseline = 'top';
    for (const t of model.timeTicks) g.fillText(t.label, t.x, plot.top + plot.height + 5);

    // Lines.
    const colors = this.data.series.map((s) => th.color(s.colorToken));
    g.lineWidth = 2;
    g.lineJoin = 'round';
    model.paths.forEach((pts, si) => {
      g.beginPath();
      g.strokeStyle = colors[si] ?? '#888';
      g.setLineDash(this.data.series[si]?.dash ?? []);
      pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    });
    g.setLineDash([]);

    // End dots and de-collided direct labels.
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    const panel = th.color('--panel');
    const ink = th.color('--t1');
    for (const e of model.ends) {
      g.beginPath();
      g.fillStyle = colors[e.seriesIndex] ?? '#888';
      g.arc(e.x, e.y, 3.5, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = panel;
      g.lineWidth = 1.5;
      g.stroke();
      g.fillStyle = ink;
      g.fillText(e.text, e.x + 7, e.labelY);
    }

    this.drawHover(g, model, W, colors);
  }

  private drawHover(g: CanvasRenderingContext2D, model: ChartModel, W: number, colors: readonly string[]): void {
    const hover = this.hoverX === null ? null : hoverAt(model, this.data, this.hoverX);
    if (!hover) {
      this.tip.hidden = true;
      return;
    }
    const { plot } = model;
    const x = Math.round(hover.x) + 0.5;
    g.strokeStyle = this.theme.color('--t3');
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, plot.top);
    g.lineTo(x, plot.top + plot.height);
    g.stroke();
    for (const p of hover.points) {
      g.beginPath();
      g.fillStyle = colors[p.seriesIndex] ?? '#888';
      g.arc(hover.x, p.y, 3.5, 0, Math.PI * 2);
      g.fill();
    }
    const text = hover.lines.join('\n');
    if (this.tip.textContent !== text) this.tip.textContent = text;
    this.tip.hidden = false;
    const left = tooltipLeft(hover.x, this.tip.offsetWidth, W) + this.tipOffsetX;
    this.tip.style.left = `${left}px`;
    this.tip.style.top = '40px';
  }

  destroy(): void {
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerleave', this.onLeave);
  }
}
