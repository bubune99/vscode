/**
 * Core Type Definitions for AI Orchestrator
 */

// ============================================================================
// Provider Types
// ============================================================================

export interface AIProvider {
  name: string;
  supportsToolCalling: boolean;
  supportsStreaming: boolean;
  maxContextTokens: number;
  costPer1MTokens: { input: number; output: number };

  execute(request: AIRequest): Promise<AIResponse>;
  estimateCost(request: AIRequest): number;
  checkAvailability(): Promise<boolean>;
}

export interface AIRequest {
  prompt: string;
  context: string[];
  tools?: Tool[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  complexity?: number;
  requiresReasoning?: boolean;
  requiresToolCalling?: boolean;
  critical?: boolean;
  securityRelated?: boolean;
}

export interface AIResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  latency: number;
  model: string;
  provider: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
}

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface ToolCall {
  tool: string;
  arguments: Record<string, any>;
}

// ============================================================================
// Agent Types
// ============================================================================

export interface Agent {
  name: string;
  role: AgentRole;
  model: string;
  provider: AIProvider;
  systemPrompt: string;
  requiresToolCalling: boolean;

  execute(task: Task, context: Context): Promise<AgentResult>;
}

export type AgentRole =
  | 'planning'
  | 'code'
  | 'review'
  | 'test'
  | 'document'
  | 'architecture';

export interface Task {
  id: string;
  type: TaskType;
  description: string;
  complexity: number;
  context: Context;
  maxCostUSD?: number;
}

export type TaskType =
  | 'planning'
  | 'code-generation'
  | 'code-review'
  | 'testing'
  | 'documentation'
  | 'architecture-design'
  | 'refactoring'
  | 'debugging'
  | 'analysis';

export interface AgentResult {
  success: boolean;
  output: string;
  artifacts?: Artifact[];
  toolCalls?: ToolCall[];
  cost: number;
  latency: number;
  confidence: number;
}

export interface Artifact {
  type: 'code' | 'test' | 'documentation' | 'diagram' | 'decision';
  path: string;
  content: string;
  language?: string;
}

// ============================================================================
// Context Types
// ============================================================================

export interface Context {
  project: ProjectMetadata;
  architecture: ArchitectureContext;
  decisions: ArchitecturalDecision[];
  tasks: Task[];
  codebase: CodebaseContext;
  memory: MemoryContext;
}

export interface ProjectMetadata {
  name: string;
  description: string;
  language: string;
  framework: string;
  version: string;
}

export interface ArchitectureContext {
  type: string;
  patterns: string[];
  database: string;
  authentication: string;
  deployment: string;
  principles: string[];
}

export interface ArchitecturalDecision {
  id: string;
  timestamp: Date;
  decision: string;
  reasoning: string;
  alternatives: string[];
  consequences: string[];
  madeBy: 'human' | 'agent' | 'consultation';
  confidence: number;
}

export interface CodebaseContext {
  entryPoints: string[];
  keyFiles: string[];
  dependencies: Record<string, string>;
  structure: FileTreeNode[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

export interface MemoryContext {
  recentConversations: Conversation[];
  keyInsights: Insight[];
}

export interface Conversation {
  id: string;
  timestamp: Date;
  messages: Message[];
  outcome: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Insight {
  id: string;
  type: 'pattern' | 'preference' | 'constraint' | 'requirement';
  content: string;
  confidence: number;
  timestamp: Date;
}

// ============================================================================
// Consultation Types
// ============================================================================

export interface ConsultationSession {
  id: string;
  problem: Problem;
  participants: Agent[];
  phases: ConsultationPhase[];
  consensus?: Consensus;
  duration: number;
  cost: number;
}

export interface Problem {
  description: string;
  type: ProblemType;
  complexity: number;
  context: Context;
  constraints: string[];
}

export type ProblemType =
  | 'architecture'
  | 'implementation'
  | 'bug'
  | 'optimization'
  | 'design';

export interface ConsultationPhase {
  phase: 'analysis' | 'discussion' | 'consensus' | 'validation';
  duration: number;
  outputs: ConsultationOutput[];
}

export interface ConsultationOutput {
  agent: string;
  content: string;
  confidence: number;
  timestamp: Date;
}

export interface Consensus {
  solution: Solution;
  confidence: number;
  agreeingAgents: string[];
  disagreements: Disagreement[];
  reasoning: string;
}

export interface Solution {
  summary: string;
  details: string;
  implementation: string[];
  risks: string[];
  alternatives: string[];
}

export interface Disagreement {
  agent: string;
  point: string;
  reasoning: string;
}

// ============================================================================
// Bug Tracking Types
// ============================================================================

export interface Bug {
  id: string;
  test: string;
  error: Error;
  screenshot?: Buffer;
  context: Context;
  attemptCount: number;
  maxAttempts: number;
  status: BugStatus;
  consultationHistory: ConsultationSession[];
  solutions: Solution[];
}

export type BugStatus = 'new' | 'consulting' | 'fixing' | 'escalated' | 'resolved';

export interface AttemptRecord {
  attempt: number;
  type: 'quick-fix' | 'consultation';
  result: FixResult;
  timestamp: Date;
}

export interface FixResult {
  fixed: boolean;
  agent?: string;
  solution?: Solution;
  error?: string;
  duration: number;
}

// ============================================================================
// Routing Types
// ============================================================================

export interface RoutingDecision {
  mode: 'single-agent' | 'multi-agent' | 'escalate';
  agents: Agent[];
  reasoning: string;
  estimatedCost: number;
  estimatedDuration: number;
}

export interface ProviderSelection {
  provider: AIProvider;
  model: string;
  estimatedCost: number;
  estimatedLatency: number;
  reasoning: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface OrchestratorConfig {
  providers: ProviderConfig[];
  agents: AgentConfig[];
  routing: RoutingConfig;
  budget: BudgetConfig;
  local: LocalConfig;
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  priority: number;
}

export interface AgentConfig {
  role: AgentRole;
  defaultModel: string;
  defaultProvider: string;
  systemPrompt: string;
  requiresToolCalling: boolean;
}

export interface RoutingConfig {
  strategy: 'cost-optimize' | 'quality-first' | 'speed-first' | 'privacy-first';
  maxCostPerRequest: number;
  preferLocal: boolean;
  consultationThreshold: number;
}

export interface BudgetConfig {
  monthlyLimitUSD: number;
  perRequestLimitUSD: number;
  warnThresholdPercent: number;
}

export interface LocalConfig {
  enabled: boolean;
  npuAvailable: boolean;
  gpuAvailable: boolean;
  vramGB: number;
  ramGB: number;
}
