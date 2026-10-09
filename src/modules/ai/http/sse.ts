import type { AgentEvent } from '../domain/ports/ai-agent.port';

export function formatSseEvent({ event, data, id }: AgentEvent): string {
  let frame = '';
  if (id !== undefined) frame += `id: ${id}\n`;
  frame += `event: ${event}\n`;
  for (const line of data.split(/\r\n|\r|\n/)) frame += `data: ${line}\n`;
  return `${frame}\n`;
}
