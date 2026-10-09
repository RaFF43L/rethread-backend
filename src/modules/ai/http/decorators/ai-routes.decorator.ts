import { applyDecorators, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';

export const AiTag = () => applyDecorators(ApiTags('AI'), ApiBearerAuth());

export const ChatRoute = () =>
  applyDecorators(
    Post('chat'),
    ApiOperation({
      summary: 'Chat with the AI agent about an item (Server-Sent Events). Admin only for now.',
    }),
    ApiProduces('text/event-stream'),
    ApiResponse({ status: 200, description: 'Stream of agent events, relayed as SSE.' }),
    ApiResponse({ status: 400, description: 'Invalid payload.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    ApiResponse({ status: 403, description: 'Requires the @admin group.' }),
    ApiResponse({ status: 404, description: 'Chat session not found.' }),
    ApiResponse({ status: 502, description: 'AI agent is unavailable.' }),
  );
