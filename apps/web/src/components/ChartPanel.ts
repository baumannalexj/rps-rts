import type { ChartData } from '../charts/ChartData.ts';
import type { ChartSpec } from '../presenters/ChartSeriesPresenter.ts';
import type { ChartTheme } from '../theme/readTheme.ts';
import { LineChart } from '../charts/LineChart.ts';
import { dashClass } from '../presenters/palette.ts';
import { h } from './dom.ts';

export class ChartPanel {
  readonly root: HTMLElement;
  readonly chart: LineChart;
  private readonly legend: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly title: string;
  private legendKey = '';
  private readonly resize: ResizeObserver | null;

  constructor(parent: HTMLElement, spec: ChartSpec, theme: ChartTheme) {
    const headingId = `chart-${spec.key}-h`;
    this.title = spec.title;
    this.canvas = h('canvas', { role: 'img', 'aria-label': spec.title });
    const tip = h('div', { class: 'tip', 'aria-hidden': 'true' });
    this.legend = h('div', { class: 'legend' });
    this.root = h('figure', { class: 'chart', style: 'margin:0' }, [
      h('div', { class: 'chart-head' }, [h('h2', { id: headingId, text: spec.title }), h('small', { text: spec.unit })]),
      this.canvas,
      this.legend,
      tip,
    ]);
    parent.append(this.root);
    this.chart = new LineChart(this.canvas, tip, theme);
    this.resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.chart.draw()) : null;
    this.resize?.observe(this.canvas);
  }

  update(data: ChartData): void {
    const key = data.series.map((s) => `${s.id}=${s.label}=${s.colorToken}=${s.dash.join(',')}`).join('|');
    if (key !== this.legendKey) {
      this.legendKey = key;
      this.legend.replaceChildren(
        ...data.series.map((s) => {
          const swatch = h('i', { class: dashClass(s.dash) || undefined, 'aria-hidden': 'true' });
          swatch.style.setProperty('--lc', `var(${s.colorToken})`);
          return h('span', {}, [swatch, s.label]);
        }),
      );
    }
    const last = data.times.length - 1;
    if (last >= 0) {
      const summary = data.series.map((s) => `${s.label} ${(s.values[last] ?? 0).toFixed(1)}`).join(', ');
      const label = `${this.title}: ${summary}`;
      if (this.canvas.getAttribute('aria-label') !== label) this.canvas.setAttribute('aria-label', label);
    }
    this.chart.setData(data);
  }

  destroy(): void {
    this.resize?.disconnect();
    this.chart.destroy();
    this.root.remove();
  }
}
