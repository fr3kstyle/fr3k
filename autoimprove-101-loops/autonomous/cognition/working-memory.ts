/** Working Memory - Short-term context tracking */
export class WorkingMemory {
  private items: any[] = []
  add(item: any) { this.items.push(item); if (this.items.length > 7) this.items.shift(); }
  get() { return this.items }
}
