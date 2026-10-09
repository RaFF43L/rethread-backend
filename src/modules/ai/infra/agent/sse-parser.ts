import { Transform, type TransformCallback } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
import type { AgentEvent } from '../../domain/ports/ai-agent.port';

export class SseParser extends Transform {
  private readonly decoder = new StringDecoder('utf8');
  private buffer = '';
  private event = '';
  private data: string[] = [];
  private id?: string;

  constructor() {
    super({ readableObjectMode: true });
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.consume(this.decoder.write(chunk));
    callback();
  }

  _flush(callback: TransformCallback): void {
    this.consume(this.decoder.end());
    if (this.buffer) this.processLine(this.buffer);
    this.buffer = '';
    this.dispatch();
    callback();
  }

  private consume(text: string): void {
    this.buffer += text;
    // A trailing \r may be the first half of a \r\n split across chunks.
    const end = this.buffer.endsWith('\r') ? this.buffer.length - 1 : this.buffer.length;
    const lines = this.buffer.slice(0, end).split(/\r\n|\r|\n/);
    this.buffer = (lines.pop() ?? '') + this.buffer.slice(end);
    for (const line of lines) this.processLine(line);
  }

  private processLine(line: string): void {
    if (line === '') {
      this.dispatch();
      return;
    }
    if (line.startsWith(':')) return;

    const separator = line.indexOf(':');
    const field = separator === -1 ? line : line.slice(0, separator);
    let value = separator === -1 ? '' : line.slice(separator + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') this.event = value;
    else if (field === 'data') this.data.push(value);
    else if (field === 'id') this.id = value;
  }

  private dispatch(): void {
    if (this.data.length > 0) {
      const event: AgentEvent = {
        event: this.event || 'message',
        data: this.data.join('\n'),
        ...(this.id !== undefined && { id: this.id }),
      };
      this.push(event);
    }
    this.event = '';
    this.data = [];
    this.id = undefined;
  }
}
