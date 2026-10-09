export const AI_AGENT = Symbol('AI_AGENT');

export interface Measurements {
  readonly chest?: number;
  readonly waist?: number;
  readonly hip?: number;
  readonly thigh?: number;
  readonly shoulder?: number;
  readonly sleeve?: number;
  readonly length?: number;
  readonly rise?: number;
  readonly inseam?: number;
  readonly hem?: number;
}

export interface ChatInput {
  readonly message: string;
  readonly session_id?: string;
  readonly item_id?: string;
  readonly buyer_measurements?: Measurements;
}

export type AgentItemStatus = 'draft' | 'active' | 'reserved' | 'sold';

export const AGENT_DEPARTMENTS = ['feminino', 'masculino', 'unissex'] as const;
export type AgentDepartment = (typeof AGENT_DEPARTMENTS)[number];

export const AGENT_STRETCH_LEVELS = ['none', 'low', 'medium', 'high'] as const;
export type AgentStretch = (typeof AGENT_STRETCH_LEVELS)[number];

export interface AgentItemInput {
  readonly sku?: string;
  readonly title: string;
  readonly description?: string;
  readonly category: string;
  readonly department?: AgentDepartment;
  readonly brand?: string;
  readonly era?: string;
  readonly label_size?: string;
  readonly size_region?: string;
  readonly color?: string;
  readonly fabric?: string;
  readonly stretch?: AgentStretch;
  readonly style_tags?: string[];
  readonly occasions?: string[];
  readonly condition?: string;
  readonly price?: number;
  readonly status?: AgentItemStatus;
  readonly notes?: string;
  readonly measurements?: Measurements;
}

export interface AgentEvent {
  readonly event: string;
  readonly data: string;
  readonly id?: string;
}

export interface IAiAgent {
  streamChat(input: ChatInput, signal: AbortSignal): Promise<AsyncIterable<AgentEvent>>;
  createItem(input: AgentItemInput): Promise<void>;
  // Resolves false when the agent has no item with that id/SKU.
  updateItem(ref: string, changes: Partial<AgentItemInput>): Promise<boolean>;
}
