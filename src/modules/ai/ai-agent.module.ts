import { Module } from '@nestjs/common';
import { AI_AGENT } from './domain/ports/ai-agent.port';
import { HttpAiAgent } from './infra/agent/http-ai-agent.adapter';

@Module({
  providers: [{ provide: AI_AGENT, useClass: HttpAiAgent }],
  exports: [AI_AGENT],
})
export class AiAgentModule {}
