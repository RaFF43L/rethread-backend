import { Body, Controller, Logger, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUserId } from '../../users/http/decorators/current-user-id.decorator';
import { StreamChatUseCase } from '../application/use-cases/stream-chat.usecase';
import { AiTag, ChatRoute } from './decorators/ai-routes.decorator';
import { ChatDto } from './dto/chat.dto';
import { formatSseEvent } from './sse';

@AiTag()
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly streamChat: StreamChatUseCase) {}

  @ChatRoute()
  async chat(
    @Body() dto: ChatDto,
    @CurrentUserId() userId: number,
    @Res() res: Response,
  ): Promise<void> {
    const abort = new AbortController();
    res.on('close', () => abort.abort());

    const events = await this.streamChat.execute({ ...dto, userId }, abort.signal);

    res.status(200).set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    try {
      for await (const event of events) {
        res.write(formatSseEvent(event));
      }
    } catch (error) {
      if (!abort.signal.aborted) {
        this.logger.error('AI agent stream failed', error instanceof Error ? error.stack : error);
        res.write(
          formatSseEvent({
            event: 'error',
            data: JSON.stringify({ message: 'AI agent stream interrupted.' }),
          }),
        );
      }
    } finally {
      res.end();
    }
  }
}
