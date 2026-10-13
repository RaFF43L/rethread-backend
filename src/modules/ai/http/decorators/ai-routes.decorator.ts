import { applyDecorators, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VoiceTokenResponseDto } from '../dto/voice-token.dto';

const badRequest = ApiResponse({ status: 400, description: 'Invalid payload.' });
const unauthorized = ApiResponse({ status: 401, description: 'Unauthorized.' });
const adminOnly = ApiResponse({ status: 403, description: 'Requires the @admin group.' });
const sessionNotFound = ApiResponse({ status: 404, description: 'Chat session not found.' });

export const AiTag = () => applyDecorators(ApiTags('AI'), ApiBearerAuth());

export const ChatRoute = () =>
  applyDecorators(
    Post('chat'),
    ApiOperation({
      summary: 'Chat with the AI agent about an item (Server-Sent Events). Admin only for now.',
    }),
    ApiProduces('text/event-stream'),
    ApiResponse({ status: 200, description: 'Stream of agent events, relayed as SSE.' }),
    badRequest,
    unauthorized,
    adminOnly,
    sessionNotFound,
    ApiResponse({ status: 502, description: 'AI agent is unavailable.' }),
  );

export const VoiceTokenRoute = () =>
  applyDecorators(
    Post('voice/token'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary:
        'Authorize a voice chat: LiveKit URL + token for the session room. Admin only for now.',
      description:
        'The client connects to `url` with `token`; the audio goes to the voice agent without passing through the backend. Same session (memory) as the text chat.',
    }),
    ApiResponse({ status: 201, type: VoiceTokenResponseDto }),
    badRequest,
    unauthorized,
    adminOnly,
    sessionNotFound,
  );

export const ChatItemsRoute = () =>
  applyDecorators(
    Post('items'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Product cards for the SKUs a voice reply recommends. Admin only for now.',
      description:
        'Same cards as the `items` of the text chat `done` event, in the order of the SKUs; unknown SKUs are dropped.',
    }),
    ApiResponse({ status: 200, description: '{ items: Product[] }' }),
    badRequest,
    unauthorized,
    adminOnly,
  );
