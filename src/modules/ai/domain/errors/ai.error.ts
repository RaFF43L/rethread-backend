import { AppError } from '../../../../shared/kernel/app-error';

export class AiAgentError extends AppError {
  readonly statusCode = 502;
  readonly code = 'AI_AGENT_ERROR';
  constructor(reason: string) {
    super('AI agent is unavailable.', { reason });
  }
}

export class ChatSessionNotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'CHAT_SESSION_NOT_FOUND';
  constructor() {
    super('Chat session not found.');
  }
}
