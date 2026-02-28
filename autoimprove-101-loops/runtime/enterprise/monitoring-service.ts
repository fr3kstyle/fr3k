/**
 * Monitoring Service - Health checks, alerts, and dashboards
 * Enterprise-grade monitoring with intelligent alerting
 */

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastCheck: number;
  responseTime: number;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface AlertRule {
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'info' | 'warning' | 'critical';
  cooldown: number;
  lastTriggered?: number;
}

interface Dashboard {
  id: string;
  name: string;
  metrics: string[];
  refreshInterval: number;
}

export class MonitoringService {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private dashboards: Map<string, Dashboard> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.setupDefaultAlerts();
  }

  registerHealthCheck(
    name: string,
    checkFn: () => Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; message: string }>,
    interval: number = 30000
  ): void {
    const runCheck = async () => {
      const start = Date.now();
      try {
        const result = await checkFn();
        const responseTime = Date.now() - start;

        this.healthChecks.set(name, {
          name,
          status: result.status,
          message: result.message,
          lastCheck: Date.now(),
          responseTime
        });

        this.evaluateAlerts();
      } catch (error) {
        this.healthChecks.set(name, {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: Date.now(),
          responseTime: Date.now() - start
        });
      }
    };

    // Run immediately and then on interval
    runCheck();
    const intervalId = setInterval(runCheck, interval);
    this.checkIntervals.set(name, intervalId);
  }

  unregisterHealthCheck(name: string): void {
    const interval = this.checkIntervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(name);
    }
    this.healthChecks.delete(name);
  }

  getHealthStatus(name: string): HealthCheck | null {
    return this.healthChecks.get(name) || null;
  }

  getAllHealthStatus(): Record<string, HealthCheck> {
    return Object.fromEntries(this.healthChecks);
  }

  getOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const checks = Array.from(this.healthChecks.values());

    if (checks.length === 0) return 'healthy';

    const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
    if (hasUnhealthy) return 'unhealthy';

    const hasDegraded = checks.some(c => c.status === 'degraded');
    if (hasDegraded) return 'degraded';

    return 'healthy';
  }

  addAlertRule(rule: Omit<AlertRule, 'lastTriggered'>): void {
    this.alertRules.push({ ...rule, lastTriggered: undefined });
  }

  private evaluateAlerts(): void {
    const healthData = this.getAllHealthStatus();
    const now = Date.now();

    for (const rule of this.alertRules) {
      if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldown) {
        continue;
      }

      if (rule.condition(healthData)) {
        this.createAlert({
          severity: rule.severity,
          message: `Alert: ${rule.name}`,
          timestamp: now,
          resolved: false
        });

        rule.lastTriggered = now;
      }
    }
  }

  private createAlert(alert: Omit<Alert, 'id'>): void {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.alerts.push(newAlert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  resolveAlert(id: string): void {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
    }
  }

  createDashboard(config: Omit<Dashboard, 'id'>): string {
    const id = `dashboard-${Date.now()}`;
    const dashboard: Dashboard = {
      ...config,
      id
    };

    this.dashboards.set(id, dashboard);
    return id;
  }

  getDashboard(id: string): Dashboard | null {
    return this.dashboards.get(id) || null;
  }

  getAllDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  getDashboardData(id: string): any {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) return null;

    const data: Record<string, any> = {
      overallHealth: this.getOverallHealth(),
      healthChecks: this.getAllHealthStatus(),
      activeAlerts: this.getActiveAlerts(),
      timestamp: Date.now()
    };

    for (const metric of dashboard.metrics) {
      if (metric === 'health') {
        data.health = this.getAllHealthStatus();
      } else if (metric === 'alerts') {
        data.alerts = this.getActiveAlerts();
      }
    }

    return data;
  }

  private setupDefaultAlerts(): void {
    this.addAlertRule({
      name: 'Service Unhealthy',
      condition: (data) => {
        return Object.values(data).some(
          (check: any) => check.status === 'unhealthy'
        );
      },
      severity: 'critical',
      cooldown: 60000
    });

    this.addAlertRule({
      name: 'Service Degraded',
      condition: (data) => {
        return Object.values(data).some(
          (check: any) => check.status === 'degraded'
        );
      },
      severity: 'warning',
      cooldown: 120000
    });

    this.addAlertRule({
      name: 'Slow Response',
      condition: (data) => {
        return Object.values(data).some(
          (check: any) => check.responseTime > 1000
        );
      },
      severity: 'warning',
      cooldown: 300000
    });
  }

  shutdown(): void {
    for (const interval of this.checkIntervals.values()) {
      clearInterval(interval);
    }
    this.checkIntervals.clear();
  }

  getStats(): {
    healthChecks: number;
    activeAlerts: number;
    dashboards: number;
  } {
    return {
      healthChecks: this.healthChecks.size,
      activeAlerts: this.getActiveAlerts().length,
      dashboards: this.dashboards.size
    };
  }
}

export type { HealthCheck, Alert, AlertRule, Dashboard };
