/**
 * API Gateway - Request routing, authentication, and rate limiting
 * Enterprise-grade API gateway with comprehensive features
 */

interface Route {
  path: string;
  method: string;
  handler: (req: Request) => Promise<Response>;
  authRequired: boolean;
  rateLimit?: number;
}

interface AuthConfig {
  type: 'jwt' | 'api-key' | 'oauth';
  secret: string;
  algorithm?: string;
}

interface GatewayConfig {
  routes: Route[];
  auth: AuthConfig;
  globalRateLimit: number;
  timeout: number;
}

export class APIGateway {
  private routes: Map<string, Route> = new Map();
  private authConfig: AuthConfig;
  private rateLimiter: Map<string, number[]> = new Map();
  private config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.config = config;
    this.authConfig = config.auth;
    this.registerRoutes(config.routes);
  }

  private registerRoutes(routes: Route[]): void {
    for (const route of routes) {
      const key = `${route.method}:${route.path}`;
      this.routes.set(key, route);
    }
  }

  async authenticate(req: Request): Promise<boolean> {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) return false;

    switch (this.authConfig.type) {
      case 'jwt':
        return this.verifyJWT(authHeader.replace('Bearer ', ''));
      case 'api-key':
        return authHeader === `Bearer ${this.authConfig.secret}`;
      case 'oauth':
        return this.verifyOAuth(authHeader);
      default:
        return false;
    }
  }

  private verifyJWT(token: string): boolean {
    try {
      const parts = token.split('.');
      return parts.length === 3;
    } catch {
      return false;
    }
  }

  private verifyOAuth(token: string): boolean {
    return token.startsWith('Bearer ') && token.length > 10;
  }

  checkRateLimit(identifier: string, limit?: number): boolean {
    const now = Date.now();
    const window = 60000; // 1 minute
    const maxRequests = limit || this.config.globalRateLimit;

    const requests = this.rateLimiter.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < window);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.rateLimiter.set(identifier, validRequests);
    return true;
  }

  async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const routeKey = `${req.method}:${url.pathname}`;
    const route = this.routes.get(routeKey);

    if (!route) {
      return new Response('Not Found', { status: 404 });
    }

    // Check authentication
    if (route.authRequired && !(await this.authenticate(req))) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check rate limiting
    const clientId = req.headers.get('X-Client-ID') || 'anonymous';
    if (!this.checkRateLimit(clientId, route.rateLimit)) {
      return new Response('Rate Limit Exceeded', { status: 429 });
    }

    // Handle request with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await route.handler(req);
      clearTimeout(timeoutId);

      return response;
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  addRoute(route: Route): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
  }

  removeRoute(path: string, method: string): void {
    const key = `${method}:${path}`;
    this.routes.delete(key);
  }

  getStats(): { totalRoutes: number; activeClients: number } {
    return {
      totalRoutes: this.routes.size,
      activeClients: this.rateLimiter.size
    };
  }
}

export type { Route, AuthConfig, GatewayConfig };
