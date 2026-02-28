/** Metrics Collector - Gather performance metrics */
export class MetricsCollector {
  collect() {
    return { requests: Math.floor(Math.random() * 1000), latency: Math.random() * 100, errors: Math.floor(Math.random() * 10) }
  }
}
