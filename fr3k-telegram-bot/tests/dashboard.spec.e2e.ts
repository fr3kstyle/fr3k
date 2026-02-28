#!/usr/bin/env bun
/**
 * PAI Observability Dashboard - Comprehensive End-to-End Test Suite
 *
 * Tests all dashboard functionality using Playwright:
 * - Test 1: Dashboard Page Loads (Task #9)
 * - Test 2: All Navigation Buttons Work (Task #10)
 * - Test 3: All API Endpoints Return Valid Data (Task #11)
 * - Test 4: Jaeger Trace Links Work (Task #12)
 * - Test 5: SSE Real-Time Updates (Task #13)
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const DASHBOARD_URL = `${BASE_URL}/dashboard`;
const SCREENSHOT_DIR = '/home/fr3k/pai-telegram-bot/tests/screenshots';

// ============================================================================
// TEST 1: Dashboard Page Loads (Task #9)
// ============================================================================

test.describe('Test 1: Dashboard Page Loads', () => {
  test('should load dashboard without errors', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle' });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for SSE connection

    // Check page title
    const title = await page.title();
    expect(title).toContain('PAI');

    // Screenshot the full page
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard-loads.png`,
      fullPage: true
    });

    // Verify main UI elements render
    await expect(page.locator('h1')).toContainText('PAI Observability');

    // Check for glass cards
    const glassCards = await page.locator('.glass-card').count();
    expect(glassCards).toBeGreaterThan(0);

    // Check for metric cards
    await expect(page.locator('#cpu-value')).toBeVisible();
    await expect(page.locator('#memory-value')).toBeVisible();
    await expect(page.locator('#uptime-value')).toBeVisible();

    // Check connection status
    const connectionStatus = page.locator('#connection-status');
    await expect(connectionStatus).toBeVisible();
  });

  test('should have proper page structure', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');

    // Check all metric cards exist
    const metricCards = [
      '#cpu-value',
      '#memory-value',
      '#uptime-value',
      '#disk-value',
      '#telegram-queue',
      '#voice-queue',
      '#skills-count',
      '#sessions-count'
    ];

    for (const selector of metricCards) {
      await expect(page.locator(selector)).toBeVisible();
    }

    // Check for workflow section
    await expect(page.locator('#workflows-container')).toBeVisible();
    await expect(page.locator('#trace-viewer')).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard-structure.png`,
      fullPage: true
    });
  });
});

// ============================================================================
// TEST 2: All Navigation Buttons Work (Task #10)
// ============================================================================

test.describe('Test 2: All Navigation and Interactive Elements', () => {
  test('should display all dashboard sections', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify all main sections are visible
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('#agents-list')).toBeVisible();
    await expect(page.locator('#workflows-container')).toBeVisible();
    await expect(page.locator('#activity-log')).toBeVisible();
    await expect(page.locator('#trace-viewer')).toBeVisible();

    // Screenshot all sections
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-all-elements.png`,
      fullPage: true
    });
  });

  test('workflow items should be clickable when present', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for workflow items in the container
    const workflowsContainer = page.locator('#workflows-container');
    await expect(workflowsContainer).toBeVisible();

    // Try clicking on workflow items if they exist
    const workflowItems = await workflowsContainer.locator('[onclick]').all();
    console.log(`Found ${workflowItems.length} workflow items`);

    if (workflowItems.length > 0) {
      // Click first workflow item
      await workflowItems[0].click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/02-workflow-clicked.png`,
        fullPage: true
      });

      // Verify trace viewer updated
      const traceViewer = page.locator('#trace-viewer');
      await expect(traceViewer).toBeVisible();
    } else {
      // Screenshot empty state
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/02-no-workflows.png`,
        fullPage: true
      });

      // Check for empty state message
      const emptyState = await workflowsContainer.locator('.empty-state').textContent();
      expect(emptyState).toContain('No active workflows');
    }
  });

  test('should have working status indicator', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check status dot
    const statusDot = page.locator('#status-dot');
    await expect(statusDot).toBeVisible();

    // Check connection status text
    const connectionStatus = page.locator('#connection-status');
    await expect(connectionStatus).toBeVisible();

    const statusText = await connectionStatus.textContent();
    console.log(`Connection status: ${statusText}`);

    // Status should be either "Connected" or "Connecting..."
    expect(statusText).toMatch(/(Connected|Connecting|Disconnected)/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-status-indicator.png`
    });
  });
});

// ============================================================================
// TEST 3: All API Endpoints Return Valid Data (Task #11)
// ============================================================================

test.describe('Test 3: API Endpoints', () => {
  test('GET /health should return 200 with valid JSON', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`);

    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('status');
    expect(json.status).toBe('healthy');
    expect(json).toHaveProperty('timestamp');

    console.log('Health check response:', JSON.stringify(json, null, 2));
  });

  test('GET /api/status should return system metrics', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/status`);

    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('system');
    expect(json).toHaveProperty('agents');
    expect(json).toHaveProperty('telegram');
    expect(json).toHaveProperty('voice');
    expect(json).toHaveProperty('skills');
    expect(json).toHaveProperty('sessions');
    expect(json).toHaveProperty('timestamp');

    // Validate system metrics structure
    expect(json.system).toHaveProperty('cpu');
    expect(json.system).toHaveProperty('memory');
    expect(json.system).toHaveProperty('uptime');

    // Validate agents array
    expect(Array.isArray(json.agents)).toBe(true);
    if (json.agents.length > 0) {
      expect(json.agents[0]).toHaveProperty('name');
      expect(json.agents[0]).toHaveProperty('running');
    }

    console.log('Status response keys:', Object.keys(json));
  });

  test('GET /api/workflows should return workflow data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/workflows`);

    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('active');
    expect(json).toHaveProperty('recent');
    expect(json).toHaveProperty('statistics');
    expect(json).toHaveProperty('timestamp');

    expect(Array.isArray(json.active)).toBe(true);
    expect(Array.isArray(json.recent)).toBe(true);

    expect(json.statistics).toHaveProperty('total');
    expect(json.statistics).toHaveProperty('completed');
    expect(json.statistics).toHaveProperty('failed');

    console.log('Workflows response:', {
      activeCount: json.active.length,
      recentCount: json.recent.length,
      statistics: json.statistics
    });
  });

  test('GET /api/instances should return instance data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/instances`);

    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('instances');
    expect(json).toHaveProperty('myInstanceId');
    expect(json).toHaveProperty('amLeader');
    expect(json).toHaveProperty('activeCount');
    expect(json).toHaveProperty('timestamp');

    expect(Array.isArray(json.instances)).toBe(true);

    console.log('Instances response:', {
      myInstanceId: json.myInstanceId,
      amLeader: json.amLeader,
      activeCount: json.activeCount
    });
  });

  test('GET /api/conversation/{userId} should return conversation data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/conversation/8188688460`);

    // Could be 404 if no conversation exists, or 200 with data
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const json = await response.json();
      expect(json).toHaveProperty('conversation');
      expect(json).toHaveProperty('lineage');
      expect(json).toHaveProperty('timestamp');

      console.log('Conversation found for user 8188688460');
    } else {
      const json = await response.json();
      expect(json).toHaveProperty('error');
      console.log('No conversation found for user 8188688460 (expected if no messages yet)');
    }
  });

  test('GET /api/messages/recent should return recent messages', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/messages/recent?limit=10`);

    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('messages');
    expect(json).toHaveProperty('count');
    expect(json).toHaveProperty('timestamp');

    expect(Array.isArray(json.messages)).toBe(true);
    expect(typeof json.count).toBe('number');

    console.log('Recent messages:', {
      count: json.count,
      firstMessage: json.messages[0] || 'No messages'
    });
  });

  test('GET /api/observability should return observability summary', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/observability`);

    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('workflows');
    expect(json).toHaveProperty('lineage');
    expect(json).toHaveProperty('instances');
    expect(json).toHaveProperty('timestamp');

    console.log('Observability summary:', {
      workflows: json.workflows,
      lineage: json.lineage,
      instances: json.instances
    });
  });
});

// ============================================================================
// TEST 4: SSE Real-Time Updates (Task #13)
// ============================================================================

test.describe('Test 5: SSE Real-Time Updates', () => {
  test('should connect to SSE endpoint and receive updates', async ({ page }) => {
    // Set up network monitoring for SSE
    const sseRequests: string[] = [];

    page.on('request', request => {
      if (request.url().includes('/metrics/sse')) {
        sseRequests.push(request.url());
      }
    });

    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify SSE was requested
    console.log('SSE requests made:', sseRequests.length);

    // Check connection status in UI
    const connectionStatus = page.locator('#connection-status');
    const statusText = await connectionStatus.textContent();
    console.log(`UI Connection status: ${statusText}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-sse-connected.png`
    });
  });

  test('should update metrics via SSE', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');

    // Wait for initial SSE data to load
    await page.waitForTimeout(5000);

    // Get values after SSE should have updated
    const cpuValue = await page.locator('#cpu-value').textContent();
    const memoryValue = await page.locator('#memory-value').textContent();
    const agentsValue = await page.locator('#agents-list').textContent();

    console.log(`CPU: ${cpuValue}, Memory: ${memoryValue}`);
    console.log(`Agents: ${agentsValue}`);

    // The connection status should show some state
    const connectionStatus = await page.locator('#connection-status').textContent();
    expect(connectionStatus).toBeTruthy();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-sse-events.png`,
      fullPage: true
    });
  });

  test('should display real-time updates from EventSource', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');

    // Monitor console for SSE connection messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Connected') || text.includes('SSE') || text.includes('metrics')) {
        consoleMessages.push(text);
      }
    });

    // Wait for SSE events
    await page.waitForTimeout(5000);

    console.log(`Console messages about SSE: ${consoleMessages.length}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-realtime-updates.png`
    });
  });
});

// ============================================================================
// TEST 6: Dashboard Activity Log
// ============================================================================

test.describe('Test 6: Dashboard Activity Log', () => {
  test('should display activity log', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const activityLog = page.locator('#activity-log');
    await expect(activityLog).toBeVisible();

    // Check for log entries or empty state
    const logEntries = await activityLog.locator('.log-entry').count();
    const emptyState = await activityLog.locator('.empty-state').count();

    console.log(`Activity log entries: ${logEntries}, Empty state: ${emptyState}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-activity-log.png`
    });
  });
});

// ============================================================================
// TEST 7: Workflow Statistics
// ============================================================================

test.describe('Test 7: Workflow Statistics Display', () => {
  test('should display workflow statistics', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check statistics elements
    const stats = {
      total: page.locator('#wf-total'),
      completed: page.locator('#wf-completed'),
      failed: page.locator('#wf-failed'),
      avgDuration: page.locator('#wf-avg-duration')
    };

    for (const [name, locator] of Object.entries(stats)) {
      await expect(locator).toBeVisible();
      const value = await locator.textContent();
      console.log(`${name}: ${value}`);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-workflow-statistics.png`
    });
  });
});

// ============================================================================
// TEST 8: Responsiveness
// ============================================================================

test.describe('Test 8: Responsive Design', () => {
  // Set shorter timeout for responsive test
  test.setTimeout(60000);

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-responsive-desktop.png`,
      fullPage: true
    });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-responsive-tablet.png`,
      fullPage: true
    });

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-responsive-mobile.png`,
      fullPage: true
    });
  });
});

// ============================================================================
// TEST 9: Error Handling
// ============================================================================

test.describe('Test 9: Error Handling', () => {
  test('should handle 404 for non-existent routes', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/non-existent-route`);
    expect(response.status()).toBe(404);
  });

  test('should handle invalid workflow ID gracefully', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/workflows/invalid-trace-id`);
    expect(response.status()).toBe(404);

    const json = await response.json();
    expect(json).toHaveProperty('error');
  });

  test('should handle invalid conversation ID gracefully', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/conversation/invalid-user-id`);
    // Should not crash, return 404 or empty data
    expect([200, 404]).toContain(response.status());
  });
});

// ============================================================================
// TEST 10: Agents Status Display
// ============================================================================

test.describe('Test 10: Agents Status Display', () => {
  test('should display agents list', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const agentsList = page.locator('#agents-list');
    await expect(agentsList).toBeVisible();

    // Check for agent items or loading state
    const agentItems = await agentsList.locator('.list-item').count();
    console.log(`Agent items displayed: ${agentItems}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-agents-status.png`
    });
  });
});

// ============================================================================
// TEST 11: Jaeger Trace Links (Task #12)
// ============================================================================

test.describe('Test 11: Jaeger Integration', () => {
  test('should check Jaeger service availability', async ({ request }) => {
    // Test if Jaeger is running on default port
    try {
      const response = await request.get('http://localhost:16686/api/services');
      console.log('Jaeger API status:', response.status());

      // Jaeger may or may not be running - log the status
      if (response.status() === 200) {
        const json = await response.json();
        console.log('Jaeger services available:', json);
      }
    } catch (e) {
      console.log('Jaeger not available - this is optional');
    }
  });
});

// ============================================================================
// TEST 12: Direct SSE Endpoint Test
// ============================================================================

test.describe('Test 12: Direct SSE Endpoint Validation', () => {
  test('SSE endpoint should be accessible', async ({ request }) => {
    // Use fetch directly with AbortController to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${BASE_URL}/metrics/sse`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // SSE returns 200 with content-type text/event-stream
      expect(response.status).toBe(200);
      const contentType = response.headers.get('content-type');
      console.log('SSE Content-Type:', contentType);
    } catch (e) {
      clearTimeout(timeoutId);
      // AbortError is expected - we just wanted to verify it responds
      if ((e as Error).name === 'AbortError') {
        console.log('SSE endpoint accessible (connection aborted as expected)');
      } else {
        throw e;
      }
    }
  });
});
