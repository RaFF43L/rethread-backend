import { Readable, pipeline } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiAgentError } from '../../domain/errors/ai.error';
import type {
  AgentEvent,
  AgentItemInput,
  ChatInput,
  IAiAgent,
} from '../../domain/ports/ai-agent.port';
import { SseParser } from './sse-parser';

const ITEM_REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class HttpAiAgent implements IAiAgent {
  constructor(private readonly config: ConfigService) {}

  async streamChat(input: ChatInput, signal: AbortSignal): Promise<AsyncIterable<AgentEvent>> {
    const response = await this.send('POST', '/chat/stream', input, signal, 'text/event-stream');
    await this.ensureOk(response);

    if (!response.body) {
      throw new AiAgentError('Agent responded without a body.');
    }

    const parser = new SseParser();
    pipeline(Readable.fromWeb(response.body as ReadableStream), parser, () => {});
    return parser;
  }

  async createItem(input: AgentItemInput): Promise<void> {
    const response = await this.send('POST', '/items', input, this.itemTimeout());
    await this.ensureOk(response);
    await response.body?.cancel();
  }

  async updateItem(ref: string, changes: Partial<AgentItemInput>): Promise<boolean> {
    const path = `/items/${encodeURIComponent(ref)}`;
    const response = await this.send('PATCH', path, changes, this.itemTimeout());
    if (response.status === 404) {
      await response.body?.cancel();
      return false;
    }
    await this.ensureOk(response);
    await response.body?.cancel();
    return true;
  }

  private itemTimeout(): AbortSignal {
    return AbortSignal.timeout(ITEM_REQUEST_TIMEOUT_MS);
  }

  private async send(
    method: string,
    path: string,
    body: unknown,
    signal: AbortSignal,
    accept = 'application/json',
  ): Promise<Response> {
    const url = new URL(path, this.config.getOrThrow<string>('AI_AGENT_URL'));
    try {
      return await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: accept },
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      throw new AiAgentError(error instanceof Error ? error.message : String(error));
    }
  }

  private async ensureOk(response: Response): Promise<void> {
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new AiAgentError(`Agent responded with status ${response.status}. ${detail}`.trim());
    }
  }
}
