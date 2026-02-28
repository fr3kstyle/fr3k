/** Load Balancer - Distribute computational load */
export class LoadBalancer {
  balance(nodes: any[], load: number) {
    const sorted = [...nodes].sort((a, b) => a.load - b.load)
    return sorted.slice(0, Math.ceil(load / 10))
  }
}
