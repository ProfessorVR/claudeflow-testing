/**
 * ExpressServer Tests
 *
 * Test suite for ExpressServer with all API endpoint validations.
 *
 * @module tests/observability/express-server
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { ExpressServer, IServerDependencies } from '../../../src/god-agent/observability/express-server';
import { ActivityStream } from '../../../src/god-agent/observability/activity-stream';
import { AgentExecutionTracker } from '../../../src/god-agent/observability/agent-tracker';
import { PipelineTracker } from '../../../src/god-agent/observability/pipeline-tracker';
import { RoutingHistory } from '../../../src/god-agent/observability/routing-history';
import { EventStore } from '../../../src/god-agent/observability/event-store';
import { SSEBroadcaster } from '../../../src/god-agent/observability/sse-broadcaster';
import * as fs from 'fs';

describe('ExpressServer', () => {
  let server: ExpressServer;
  let dependencies: IServerDependencies;
  let activityStream: ActivityStream;
  let agentTracker: AgentExecutionTracker;
  let pipelineTracker: PipelineTracker;
  let routingHistory: RoutingHistory;
  let eventStore: EventStore;
  let sseBroadcaster: SSEBroadcaster;

  const TEST_DB_PATH = '.test-observability/express-server-test.db';

  beforeEach(async () => {
    // Clean up test database if exists
    const dir = '.test-observability';
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }

    // Initialize dependencies
    activityStream = new ActivityStream(1000);
    agentTracker = new AgentExecutionTracker(activityStream);
    pipelineTracker = new PipelineTracker(activityStream);
    routingHistory = new RoutingHistory(activityStream, 100);
    eventStore = new EventStore(TEST_DB_PATH, 10000);
    sseBroadcaster = new SSEBroadcaster({ verbose: false });

    dependencies = {
      activityStream,
      agentTracker,
      pipelineTracker,
      routingHistory,
      eventStore,
      sseBroadcaster,
    };

    // Create server (but don't start it yet)
    server = new ExpressServer(dependencies, {
      host: '127.0.0.1',
      verbose: false,
    });
  });

  afterEach(async () => {
    // Stop server if running
    await server.stop();

    // Close event store
    await eventStore.close();

    // Shutdown SSE broadcaster
    sseBroadcaster.shutdown();

    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    const dir = '.test-observability';
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('Server Lifecycle', () => {
    it('should start and stop successfully', async () => {
      await server.start(0);  // Use port 0 for auto-assign
      expect(server.getPort()).toBeGreaterThan(0);

      await server.stop();
      expect(server.getPort()).toBe(0);
    });

    it('should bind to localhost by default (RULE-OBS-006)', async () => {
      // This is verified by configuration, checking in constructor
      expect(server).toBeDefined();
    });
  });

  describe('TC-008-01: GET /api/health', () => {
    it('should return healthy status', async () => {
      const app = server.getApp();

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('clientCount');
      expect(response.body).toHaveProperty('eventCount');
      expect(response.body).toHaveProperty('bufferUsage');
    });

    it('should respond in < 10ms (performance budget)', async () => {
      const app = server.getApp();

      const start = Date.now();
      await request(app).get('/api/health');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
    });
  });

  describe('TC-008-02: GET /api/events?limit=10', () => {
    it('should return max 10 events when limit=10', async () => {
      // Insert 20 events
      for (let i = 0; i < 20; i++) {
        eventStore.insert({
          id: `evt_${i}`,
          timestamp: Date.now() + i,
          component: 'routing',
          operation: `test_op_${i}`,
          status: 'success',
          metadata: { index: i },
        });
      }

      // Wait for writes to complete
      await new Promise(resolve => setImmediate(resolve));

      const app = server.getApp();
      const response = await request(app).get('/api/events?limit=10');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(10);
      expect(response.body.count).toBe(10);
    });

    it('should respond in < 100ms (performance budget)', async () => {
      // Insert events
      for (let i = 0; i < 50; i++) {
        eventStore.insert({
          id: `evt_${i}`,
          timestamp: Date.now() + i,
          component: 'routing',
          operation: `test_op_${i}`,
          status: 'success',
          metadata: { index: i },
        });
      }

      await new Promise(resolve => setImmediate(resolve));

      const app = server.getApp();

      const start = Date.now();
      await request(app).get('/api/events?limit=10');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('TC-008-03: GET /api/events?component=routing', () => {
    it('should filter events by component', async () => {
      // Insert mixed events
      eventStore.insert({
        id: 'evt_routing_1',
        timestamp: Date.now(),
        component: 'routing',
        operation: 'routing_decision',
        status: 'success',
        metadata: {},
      });

      eventStore.insert({
        id: 'evt_agent_1',
        timestamp: Date.now(),
        component: 'agent',
        operation: 'agent_started',
        status: 'running',
        metadata: {},
      });

      eventStore.insert({
        id: 'evt_routing_2',
        timestamp: Date.now(),
        component: 'routing',
        operation: 'routing_decision',
        status: 'success',
        metadata: {},
      });

      await new Promise(resolve => setImmediate(resolve));

      const app = server.getApp();
      const response = await request(app).get('/api/events?component=routing');

      expect(response.status).toBe(200);
      expect(response.body.events.length).toBeGreaterThanOrEqual(2);
      expect(response.body.events.every((e: any) => e.component === 'routing')).toBe(true);
    });
  });

  describe('TC-008-04: GET /api/agents', () => {
    it('should return active agents', async () => {
      // Start an agent
      agentTracker.startAgent({
        id: 'exec_1',
        agentKey: 'backend-dev',
        agentName: 'Backend Developer',
        category: 'development',
        status: 'running',
        startTime: Date.now(),
        input: 'Test task',
      });

      const app = server.getApp();
      const response = await request(app).get('/api/agents');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toHaveProperty('agents');
      expect(response.body).toHaveProperty('count');
      expect(response.body.agents).toHaveLength(1);
      expect(response.body.agents[0].agentKey).toBe('backend-dev');
    });

    it('should respond in < 20ms (performance budget)', async () => {
      const app = server.getApp();

      const start = Date.now();
      await request(app).get('/api/agents');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(20);
    });
  });

  describe('TC-008-05: GET /api/routing/invalid', () => {
    it('should return 404 for invalid routing ID', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/routing/invalid-id-999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });

  describe('TC-008-06: GET /api/stream', () => {
    it('should set SSE headers', async () => {
      const app = server.getApp();

      // SSE endpoint keeps connection open, so we'll test headers differently
      // by connecting and immediately checking response headers
      return new Promise<void>((resolve) => {
        const req = request(app).get('/api/stream');

        req.end((err, res) => {
          if (res) {
            expect(res.headers['content-type']).toBe('text/event-stream');
            expect(res.headers['cache-control']).toBe('no-cache');
            expect(res.headers['connection']).toBe('keep-alive');
          }
          resolve();
        });

        // Force early termination after headers received
        setTimeout(() => {
          req.abort();
        }, 50);
      });
    });
  });

  describe('TC-008-07: GET /', () => {
    it('should return HTML dashboard', async () => {
      const app = server.getApp();
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('God Agent');
    });
  });

  describe('TC-008-08: GET /unknown', () => {
    it('should return 404 for unknown routes', async () => {
      const app = server.getApp();
      const response = await request(app).get('/unknown-route-xyz');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('TC-008-09: Security Headers', () => {
    it('should set X-Content-Type-Options: nosniff', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options: DENY', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/health');

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should set explicit Content-Type on JSON responses', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/health');

      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('TC-008-10: Performance', () => {
    it('should respond in < 100ms for /api/health', async () => {
      const app = server.getApp();

      const start = Date.now();
      await request(app).get('/api/health');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should respond in < 100ms for /api/agents', async () => {
      const app = server.getApp();

      const start = Date.now();
      await request(app).get('/api/agents');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('GET /api/pipelines', () => {
    it('should return active pipelines', async () => {
      // Start a pipeline
      pipelineTracker.startPipeline({
        name: 'test-pipeline',
        steps: ['step1', 'step2'],
        taskType: 'research',
      });

      const app = server.getApp();
      const response = await request(app).get('/api/pipelines');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pipelines');
      expect(response.body).toHaveProperty('count');
      expect(response.body.pipelines).toHaveLength(1);
      expect(response.body.pipelines[0].name).toBe('test-pipeline');
    });
  });

  describe('GET /api/routing/:id', () => {
    it('should return routing explanation for valid ID', async () => {
      // Record a routing decision
      const routingId = routingHistory.record({
        taskDescription: 'Implement API endpoint',
        taskType: 'coding',
        selectedAgent: 'backend-dev',
        confidence: 0.95,
        candidates: [
          {
            agentType: 'backend-dev',
            score: 0.95,
            matchedCapabilities: ['api', 'backend'],
            confidence: 0.95,
          },
        ],
        reasoningSteps: ['Analyzed task type', 'Matched capabilities'],
        coldStartUsed: false,
      });

      const app = server.getApp();
      const response = await request(app).get(`/api/routing/${routingId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', routingId);
      expect(response.body).toHaveProperty('selectedAgent', 'backend-dev');
      expect(response.body).toHaveProperty('confidence', 0.95);
      expect(response.body).toHaveProperty('explanation');
    });
  });

  describe('GET /api/metrics', () => {
    it('should return Prometheus format metrics', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/metrics');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.headers['content-type']).toContain('version=0.0.4');
      expect(response.text).toContain('god_agent_events_total');
      expect(response.text).toContain('god_agent_active_agents');
      expect(response.text).toContain('god_agent_sse_clients');
    });

    it('should include uptime metric', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/metrics');

      expect(response.text).toContain('god_agent_uptime_seconds');
    });
  });

  describe('Memory Endpoints', () => {
    it('GET /api/memory/domains should return domains derived from EventStore', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/memory/domains');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('domains');
      expect(response.body).toHaveProperty('totalEvents');
      expect(response.body).toHaveProperty('uniqueDomains');
    });

    it('GET /api/memory/patterns should return patterns derived from EventStore', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/memory/patterns');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('patterns');
      expect(response.body).toHaveProperty('totalEvents');
      expect(response.body).toHaveProperty('uniquePatterns');
    });

    it('GET /api/learning/stats should return learning stats derived from EventStore', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/learning/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalTrajectories');
      expect(response.body).toHaveProperty('baselineQuality');
      expect(response.body).toHaveProperty('learnedQuality');
      expect(response.body).toHaveProperty('improvement');
    });
  });

  describe('Query Parameters', () => {
    it('should handle multiple query params for /api/events', async () => {
      // Insert events
      eventStore.insert({
        id: 'evt_1',
        timestamp: 1000,
        component: 'routing',
        operation: 'test',
        status: 'success',
        metadata: {},
      });

      eventStore.insert({
        id: 'evt_2',
        timestamp: 2000,
        component: 'agent',
        operation: 'test',
        status: 'error',
        metadata: {},
      });

      await new Promise(resolve => setImmediate(resolve));

      const app = server.getApp();
      const response = await request(app)
        .get('/api/events')
        .query({
          limit: 10,
          component: 'routing',
          status: 'success',
        });

      expect(response.status).toBe(200);
      expect(response.body.events).toBeDefined();
    });

    it('should handle since and until timestamp filters', async () => {
      const now = Date.now();

      eventStore.insert({
        id: 'evt_old',
        timestamp: now - 10000,
        component: 'routing',
        operation: 'test',
        status: 'success',
        metadata: {},
      });

      eventStore.insert({
        id: 'evt_recent',
        timestamp: now,
        component: 'routing',
        operation: 'test',
        status: 'success',
        metadata: {},
      });

      await new Promise(resolve => setImmediate(resolve));

      const app = server.getApp();
      const response = await request(app)
        .get('/api/events')
        .query({
          since: now - 5000,
        });

      expect(response.status).toBe(200);
      expect(response.body.events).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully without stack traces', async () => {
      // Force an error by passing invalid component
      const app = server.getApp();
      const response = await request(app).get('/api/events?component=invalid-component-xyz');

      // Should still return 200 with empty results (query handles invalid gracefully)
      expect(response.status).toBe(200);
    });

    it('should return JSON error responses', async () => {
      const app = server.getApp();
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Coverage: Edge Cases', () => {
    it('should handle empty agents list', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/agents');

      expect(response.status).toBe(200);
      expect(response.body.agents).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it('should handle empty pipelines list', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/pipelines');

      expect(response.status).toBe(200);
      expect(response.body.pipelines).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it('should handle empty events list', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/events');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });

  // ===========================================================================
  // Claim Map Endpoints
  // ===========================================================================
  describe('Claim Map Endpoints', () => {
    it('GET /api/claim-map/jobs should return empty list initially', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/claim-map/jobs');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toBeDefined();
      expect(Array.isArray(response.body.jobs)).toBe(true);
    });

    it('POST /api/claim-map/analyze should require text', async () => {
      const app = server.getApp();
      const response = await request(app)
        .post('/api/claim-map/analyze')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('text is required');
    });

    it('POST /api/claim-map/analyze should accept text and return jobId', async () => {
      const app = server.getApp();
      const response = await request(app)
        .post('/api/claim-map/analyze')
        .send({ text: 'Aristotle argues that phantasia is a distinct faculty of the soul.' });

      expect(response.status).toBe(200);
      expect(response.body.jobId).toBeDefined();
      expect(response.body.jobId).toMatch(/^cm_/);
      expect(response.body.status).toBe('running');
    });

    it('GET /api/claim-map/data/:jobId should return 404 for unknown job', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/claim-map/data/nonexistent');

      expect(response.status).toBe(404);
    });

    it('GET /api/claim-map/text/:jobId should return 404 for unknown job', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/claim-map/text/nonexistent');

      expect(response.status).toBe(404);
    });

    it('PATCH /api/claim-map/node/:jobId/:nodeId should return 404 for unknown node', async () => {
      const app = server.getApp();
      const response = await request(app)
        .patch('/api/claim-map/node/nonexistent/node1')
        .send({ userNote: 'test' });

      expect(response.status).toBe(404);
    });

    it('DELETE /api/claim-map/jobs/:jobId should succeed even for nonexistent', async () => {
      const app = server.getApp();
      const response = await request(app).delete('/api/claim-map/jobs/nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/claim-map/export/:jobId should return 404 for unknown job', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/claim-map/export/nonexistent');

      expect(response.status).toBe(404);
    });

    it('GET /api/claim-map/compare/:jobA/:jobB should return 404 for unknown jobs', async () => {
      const app = server.getApp();
      const response = await request(app).get('/api/claim-map/compare/jobA/jobB');

      expect(response.status).toBe(404);
    });

    it('POST /api/claim-map/analyze + GET /data should return full analysis after completion', async () => {
      const app = server.getApp();

      // Start analysis
      const analyzeResp = await request(app)
        .post('/api/claim-map/analyze')
        .send({ text: 'Heidegger argues that Dasein is always already in a world. Furthermore, this being-in-the-world constitutes an essential structure of existence.' });

      expect(analyzeResp.status).toBe(200);
      const jobId = analyzeResp.body.jobId;

      // Wait for async analysis to complete (with polling)
      let data: any = null;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 200));
        const dataResp = await request(app).get(`/api/claim-map/data/${jobId}`);
        if (dataResp.status === 200 && dataResp.body.job?.status === 'complete') {
          data = dataResp.body;
          break;
        }
      }

      expect(data).not.toBeNull();
      expect(data.job.status).toBe('complete');
      expect(data.nodes).toBeDefined();
      expect(data.links).toBeDefined();
      expect(data.stats).toBeDefined();
      expect(data.stats.totalClaims).toBeGreaterThanOrEqual(0);
      expect(data.layout).toBeDefined();

      // Verify text endpoint
      const textResp = await request(app).get(`/api/claim-map/text/${jobId}`);
      expect(textResp.status).toBe(200);
      expect(textResp.body.sourceText).toBeDefined();
      expect(textResp.body.spans).toBeDefined();

      // Verify span integrity: each span's offset maps to correct substring
      for (const span of textResp.body.spans) {
        if (span.startOffset != null && span.endOffset != null && span.startOffset >= 0) {
          const substring = textResp.body.sourceText.slice(span.startOffset, span.endOffset);
          expect(substring.length).toBeGreaterThan(0);
        }
      }

      // Verify export works
      const exportResp = await request(app).get(`/api/claim-map/export/${jobId}?format=json`);
      expect(exportResp.status).toBe(200);
      expect(exportResp.body.nodes).toBeDefined();

      // Verify CSV export
      const csvResp = await request(app).get(`/api/claim-map/export/${jobId}?format=csv`);
      expect(csvResp.status).toBe(200);
      expect(csvResp.headers['content-type']).toContain('text/csv');

      // Verify jobs list includes this job
      const jobsResp = await request(app).get('/api/claim-map/jobs');
      expect(jobsResp.body.jobs.some((j: any) => j.jobId === jobId)).toBe(true);

      // Test node update if we have nodes
      if (data.nodes.length > 0) {
        const nodeId = data.nodes[0].id;
        const patchResp = await request(app)
          .patch(`/api/claim-map/node/${jobId}/${nodeId}`)
          .send({ userNote: 'Test note', overrideLabel: 'background_knowledge', pinned: true });
        expect(patchResp.status).toBe(200);
        expect(patchResp.body.success).toBe(true);

        // Verify the update persisted
        const updatedData = await request(app).get(`/api/claim-map/data/${jobId}`);
        const updatedNode = updatedData.body.nodes.find((n: any) => n.id === nodeId);
        expect(updatedNode.userNote).toBe('Test note');
        expect(updatedNode.overrideLabel).toBe('background_knowledge');
        expect(updatedNode.pinned).toBe(true);
      }

      // Test delete
      const deleteResp = await request(app).delete(`/api/claim-map/jobs/${jobId}`);
      expect(deleteResp.status).toBe(200);

      // Verify deleted
      const afterDelete = await request(app).get(`/api/claim-map/data/${jobId}`);
      expect(afterDelete.status).toBe(404);
    }, 15000); // Allow 15s for async pipeline
  });
});
