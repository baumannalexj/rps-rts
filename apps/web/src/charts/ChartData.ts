/** Input to the chart renderer. Produced by ChartSeriesPresenter. */
export interface ChartSeries {
  readonly id: string;
  readonly label: string;
  /** CSS custom property name, resolved against the live theme at draw time. */
  readonly colorToken: string;
  readonly dash: readonly number[];
  /** One value per entry in ChartData.times. */
  readonly values: readonly number[];
}

export interface ChartData {
  /** Game ticks, ascending. */
  readonly times: readonly number[];
  readonly series: readonly ChartSeries[];
}
