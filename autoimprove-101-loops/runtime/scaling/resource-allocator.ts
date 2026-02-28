/** Resource Allocator - Allocate CPU/memory */
export class ResourceAllocator {
  allocate(request: { cpu: number; memory: number }) {
    return { allocated: true, cpu: request.cpu, memory: request.memory }
  }
}
