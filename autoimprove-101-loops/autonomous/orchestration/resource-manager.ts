/**
 * Resource Manager
 * Dynamic resource allocation and management for autonomous agents
 */

interface Resource {
  id: string;
  type: 'compute' | 'memory' | 'storage' | 'network' | 'custom';
  capacity: number;
  available: number;
  allocatedTo: Map<string, number>; // agentId -> amount
  priority: number;
}

interface AllocationRequest {
  requestId: string;
  agentId: string;
  resourceType: string;
  amount: number;
  priority: number;
  duration: number;
  timestamp: number;
}

interface Allocation {
  requestId: string;
  agentId: string;
  resourceId: string;
  amount: number;
  startTime: number;
  endTime: number;
  status: 'active' | 'expired' | 'released';
}

export class ResourceManager {
  private resources = new Map<string, Resource>();
  private allocations = new Map<string, Allocation>();
  private pendingRequests: AllocationRequest[] = [];
  private allocationHistory: Allocation[] = [];

  registerResource(config: Omit<Resource, 'allocatedTo'>): void {
    const resource: Resource = {
      ...config,
      allocatedTo: new Map()
    };
    this.resources.set(resource.id, resource);
  }

  requestAllocation(
    agentId: string,
    resourceType: string,
    amount: number,
    priority: number = 1,
    duration: number = 3600000
  ): string {
    const request: AllocationRequest = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      resourceType,
      amount,
      priority,
      duration,
      timestamp: Date.now()
    };

    this.pendingRequests.push(request);
    this.processPendingRequests();

    return request.requestId;
  }

  private processPendingRequests(): void {
    // Sort by priority (higher first) and timestamp
    this.pendingRequests.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    const processed: string[] = [];

    for (const request of this.pendingRequests) {
      const allocated = this.tryAllocate(request);
      if (allocated) {
        processed.push(request.requestId);
      }
    }

    this.pendingRequests = this.pendingRequests.filter(r => !processed.includes(r.requestId));
  }

  private tryAllocate(request: AllocationRequest): boolean {
    // Find resources of the requested type
    const matchingResources = Array.from(this.resources.values())
      .filter(r => r.type === request.resourceType || r.id === request.resourceType)
      .sort((a, b) => b.priority - a.priority);

    for (const resource of matchingResources) {
      if (resource.available >= request.amount) {
        this.allocate(resource.id, request);
        return true;
      }
    }

    // Try to find resources that can be reclaimed
    for (const resource of matchingResources) {
      const reclaimed = this.reclaimResource(resource, request.amount);
      if (reclaimed >= request.amount) {
        this.allocate(resource.id, request);
        return true;
      }
    }

    return false;
  }

  private allocate(resourceId: string, request: AllocationRequest): void {
    const resource = this.resources.get(resourceId);
    if (!resource) return;

    const allocation: Allocation = {
      requestId: request.requestId,
      agentId: request.agentId,
      resourceId,
      amount: request.amount,
      startTime: Date.now(),
      endTime: Date.now() + request.duration,
      status: 'active'
    };

    resource.available -= request.amount;
    resource.allocatedTo.set(request.agentId,
      (resource.allocatedTo.get(request.agentId) || 0) + request.amount
    );

    this.allocations.set(request.requestId, allocation);
    this.allocationHistory.push(allocation);

    // Auto-release after duration
    setTimeout(() => {
      this.releaseAllocation(request.requestId);
    }, request.duration);
  }

  private reclaimResource(resource: Resource, requiredAmount: number): number {
    let reclaimed = 0;

    // Get active allocations for this resource, sorted by priority (lower first)
    const resourceAllocs = Array.from(this.allocations.values())
      .filter(a => a.resourceId === resource.id && a.status === 'active')
      .sort((a, b) => {
        const reqA = this.pendingRequests.find(r => r.requestId === a.requestId);
        const reqB = this.pendingRequests.find(r => r.requestId === b.requestId);
        return (reqA?.priority || 1) - (reqB?.priority || 1);
      });

    for (const alloc of resourceAllocs) {
      if (reclaimed >= requiredAmount) break;

      reclaimed += alloc.amount;
      this.releaseAllocation(alloc.requestId);
    }

    return reclaimed;
  }

  releaseAllocation(requestId: string): void {
    const allocation = this.allocations.get(requestId);
    if (!allocation || allocation.status !== 'active') return;

    const resource = this.resources.get(allocation.resourceId);
    if (!resource) return;

    resource.available += allocation.amount;
    const currentAlloc = resource.allocatedTo.get(allocation.agentId) || 0;
    resource.allocatedTo.set(allocation.agentId, Math.max(0, currentAlloc - allocation.amount));

    allocation.status = 'released';

    // Process pending requests now that resources are available
    this.processPendingRequests();
  }

  getResourceStatus(resourceId: string): Resource | undefined {
    return this.resources.get(resourceId);
  }

  getAgentAllocations(agentId: string): Allocation[] {
    return Array.from(this.allocations.values())
      .filter(a => a.agentId === agentId && a.status === 'active');
  }

  getResourceUtilization(resourceId: string): number {
    const resource = this.resources.get(resourceId);
    if (!resource) return 0;
    return (resource.capacity - resource.available) / resource.capacity;
  }

  getSystemUtilization(): Map<string, number> {
    const utilization = new Map<string, number>();
    this.resources.forEach((resource, id) => {
      utilization.set(id, this.getResourceUtilization(id));
    });
    return utilization;
  }

  reallocateForPriority(agentId: string, requiredResources: Map<string, number>, priority: number): boolean {
    // Release current allocations for this agent
    const currentAllocs = this.getAgentAllocations(agentId);
    currentAllocs.forEach(alloc => this.releaseAllocation(alloc.requestId));

    // Request new allocations with higher priority
    let success = true;
    for (const [resourceType, amount] of requiredResources) {
      const requestId = this.requestAllocation(agentId, resourceType, amount, priority);
      const allocation = this.allocations.get(requestId);
      if (!allocation) {
        success = false;
        break;
      }
    }

    return success;
  }

  scaleResource(resourceId: string, newCapacity: number): void {
    const resource = this.resources.get(resourceId);
    if (!resource) return;

    const diff = newCapacity - resource.capacity;
    resource.capacity = newCapacity;

    if (diff > 0) {
      resource.available += diff;
      this.processPendingRequests();
    } else if (diff < 0 && resource.available < 0) {
      // Need to reclaim
      this.reclaimResource(resource, -diff);
    }
  }

  findBottlenecks(): { resourceId: string; utilization: number }[] {
    return Array.from(this.resources.entries())
      .map(([id, resource]) => ({
        resourceId: id,
        utilization: this.getResourceUtilization(id)
      }))
      .filter(item => item.utilization > 0.9)
      .sort((a, b) => b.utilization - a.utilization);
  }

  optimizeAllocation(): void {
    const bottlenecks = this.findBottlenecks();

    // For heavily utilized resources, try to rebalance
    bottlenecks.forEach(({ resourceId }) => {
      const resource = this.resources.get(resourceId);
      if (!resource) return;

      // Find agents with large allocations
      const largeAllocs = Array.from(resource.allocatedTo.entries())
        .filter(([_, amount]) => amount > resource.capacity * 0.3)
        .sort((a, b) => b[1] - a[1]);

      // Try to move some allocations to other resources
      largeAllocs.forEach(([agentId, amount]) => {
        const allocs = this.getAgentAllocations(agentId);
        allocs.forEach(alloc => {
          if (alloc.resourceId === resourceId) {
            this.releaseAllocation(alloc.requestId);
            // Re-request with same priority, may get different resource
            this.requestAllocation(agentId, resource.type, amount, 1);
          }
        });
      });
    });
  }

  cleanup(): void {
    const now = Date.now();
    for (const [id, alloc] of this.allocations) {
      if (alloc.status === 'active' && alloc.endTime < now) {
        this.releaseAllocation(id);
      }
    }

    // Clean old history
    this.allocationHistory = this.allocationHistory.filter(a =>
      a.status === 'active' || a.endTime > now - 86400000
    );
  }
}
