/**
 * ExpressServer - HTTP Server with API Endpoints
 *
 * Implements Express server with all observability API endpoints
 * for the dashboard and external integrations.
 *
 * @module observability/express-server
 * @see TASK-OBS-008-EXPRESS-SERVER.md
 * @see SPEC-OBS-001-CORE.md
 */
import { Express } from 'express';
import { IActivityStream } from './activity-stream.js';
import { IAgentExecutionTracker } from './agent-tracker.js';
import { IPipelineTracker } from './pipeline-tracker.js';
import { IRoutingHistory } from './routing-history.js';
import { IEventStore } from './event-store.js';
import { ISSEBroadcaster } from './sse-broadcaster.js';
/**
 * Express server dependencies
 */
export interface IServerDependencies {
    activityStream: IActivityStream;
    agentTracker: IAgentExecutionTracker;
    pipelineTracker: IPipelineTracker;
    routingHistory: IRoutingHistory;
    eventStore: IEventStore;
    sseBroadcaster: ISSEBroadcaster;
}
/**
 * Express server configuration
 */
export interface IServerConfig {
    /** Server host (default: '127.0.0.1' for localhost only) */
    host?: string;
    /** Server port (default: 3847) */
    port?: number;
    /** Enable verbose logging */
    verbose?: boolean;
}
/**
 * ExpressServer interface
 * Implements [REQ-OBS-07]: Express HTTP API server
 */
export interface IExpressServer {
    /**
     * Start the HTTP server
     * @param port Port to listen on
     * @returns Promise resolving when server is started
     */
    start(port: number): Promise<void>;
    /**
     * Stop the HTTP server
     * @returns Promise resolving when server is stopped
     */
    stop(): Promise<void>;
    /**
     * Get the Express application
     * @returns Express app instance
     */
    getApp(): Express;
    /**
     * Get the current port
     * @returns Port number or 0 if not started
     */
    getPort(): number;
}
/**
 * ExpressServer implementation
 *
 * Implements:
 * - [REQ-OBS-07]: Express HTTP API with 11 endpoints
 * - [RULE-OBS-006]: Security (localhost binding, headers)
 * - [RULE-OBS-003]: Graceful error handling
 */
export declare class ExpressServer implements IExpressServer {
    private app;
    private server;
    private port;
    private host;
    private verbose;
    private activityStream;
    private agentTracker;
    private pipelineTracker;
    private routingHistory;
    private eventStore;
    private sseBroadcaster;
    private startTime;
    /**
     * Create a new ExpressServer
     * @param dependencies Server dependencies
     * @param config Server configuration
     */
    constructor(dependencies: IServerDependencies, config?: IServerConfig);
    /**
     * Get real metrics from SQLite databases
     * Queries learning.db and desc.db for actual trajectory/pattern/episode counts
     */
    private getRealDatabaseMetrics;
    /**
     * Create and configure Express application
     * @returns Configured Express app
     */
    private createApp;
    /**
     * Register API endpoints
     * @param app Express application
     */
    private registerEndpoints;
    /**
     * Serve dashboard HTML
     */
    private serveDashboard;
    /**
     * Handle SSE connection
     * Implements [REQ-OBS-09]: SSE real-time streaming
     */
    private handleSSE;
    /**
     * Get historical events with query parameters
     * Query params: limit, component, status, since, until
     */
    private getEvents;
    /**
     * Get active agents - derives from EventStore agent events
     */
    private getAgents;
    /**
     * Get active pipelines - derives from EventStore pipeline events
     */
    private getPipelines;
    /**
     * Get routing explanation by ID
     */
    private getRoutingExplanation;
    /**
     * Get routing decisions list - derives from EventStore routing events
     */
    private getRoutingDecisions;
    /**
     * Get memory domains from InteractionStore events
     */
    private getMemoryDomains;
    /**
     * Get memory patterns from ReasoningBank/SONA events
     */
    private getMemoryPatterns;
    /**
     * Get learning statistics - derives from EventStore learning events
     */
    private getLearningStats;
    /**
     * Get memory interactions for InteractionStore tab
     */
    private getMemoryInteractions;
    /**
     * Get memory reasoning for ReasoningBank tab
     */
    private getMemoryReasoning;
    /**
     * Get episode store data
     */
    private getEpisodeStore;
    /**
     * Get UCM context data
     */
    private getUcmContext;
    /**
     * Get hyperedge store data
     */
    private getHyperedgeStore;
    /**
     * Get comprehensive system metrics for all panels
     * Derives real metrics from EventStore data
     */
    private getSystemMetrics;
    /**
     * Helper to calculate date range from days parameter
     */
    private getDateRange;
    /**
     * Get analytics dashboard summary
     * Returns aggregated metrics for the summary panel
     */
    private getAnalyticsSummary;
    /**
     * Get model comparison data
     * Returns per-model metrics for comparison charts
     */
    private getAnalyticsModels;
    /**
     * Get quality trends data
     * Returns quality score trends over time
     */
    private getAnalyticsQuality;
    /**
     * Get cost analytics data
     * Returns cost breakdown by model/provider
     */
    private getAnalyticsCosts;
    /**
     * Get monitoring health check
     * Returns system health status from monitoring
     */
    private getMonitoringHealth;
    /**
     * Get active monitoring alerts
     * Returns current alerts with severity levels
     */
    private getMonitoringAlerts;
    /**
     * Get circuit breaker status
     * Returns status for all provider circuits
     */
    private getRouterCircuits;
    /**
     * Get rate limiter status
     * Returns rate limit status for all providers
     */
    private getRouterRateLimits;
    /**
     * Get provider health for graceful degradation
     * Returns health status for all providers
     */
    private getRouterDegradation;
    /**
     * Get A/B testing experiments
     * Returns list of active and recent experiments
     */
    private getRouterExperiments;
    /**
     * Execute CLI command
     * Provides command-line interface through API
     */
    private executeCommand;
    /**
     * Get list of Knowledge Units with optional filtering
     * Query params: query, minConfidence, limit, offset
     */
    private getExploreKUs;
    /**
     * Get list of Reasoning Units with optional filtering
     * Query params: relation, minScore, sourceKuId, targetKuId, limit
     */
    private getExploreRUs;
    /**
     * Get single Knowledge Unit by ID
     */
    private getExploreKU;
    /**
     * Get single Reasoning Unit by ID
     */
    private getExploreRU;
    /**
     * Build and return knowledge graph
     * Query params: format (d3|dot|cytoscape|mermaid), type (ku|full|provenance), kuId, maxNodes
     */
    private getExploreGraph;
    /**
     * Get provenance trace for a Knowledge Unit
     */
    private getExploreTrace;
    /**
     * Get coverage analysis
     * Query params: showGaps, includeHeatmap
     */
    private getExploreCoverage;
    /**
     * Get explore system statistics
     */
    private getExploreStats;
    /**
     * Search Knowledge Units semantically
     * Query params: q (search query), limit
     */
    private searchExploreKUs;
    /**
     * Get Prometheus metrics
     * Implements Prometheus text format
     */
    private getPrometheusMetrics;
    /**
     * Health check endpoint
     * Implements [REQ-OBS-07]: Health monitoring
     */
    private healthCheck;
    /**
     * Start the HTTP server
     * Implements [RULE-OBS-006]: Localhost binding
     *
     * @param port Port to listen on
     * @returns Promise resolving when server is started
     */
    start(port: number): Promise<void>;
    /**
     * Stop the HTTP server
     * @returns Promise resolving when server is stopped
     */
    stop(): Promise<void>;
    /**
     * Get the Express application
     */
    getApp(): Express;
    /**
     * Get the current port
     */
    getPort(): number;
}
export default ExpressServer;
//# sourceMappingURL=express-server.d.ts.map