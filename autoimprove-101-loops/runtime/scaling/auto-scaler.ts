/** Auto Scaler - Scale based on load */
export class AutoScaler {
  scale(current: number, target: number) {
    return { action: current < target ? 'scale_up' : 'scale_down', newCapacity: target }
  }
}
