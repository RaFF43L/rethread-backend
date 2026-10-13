import { Injectable } from '@nestjs/common';
import type { ProductOutput } from '../../../products/application/dto/product.dto';
import { ChatItemsResolver } from '../chat-items.resolver';

export interface ResolveChatItemsInput {
  readonly skus: string[];
}

/**
 * Product cards for the SKUs a voice reply recommends. In the text chat they
 * come in the `done` event; in voice the agent sends the SKUs to the client
 * over the call, and the client resolves them here.
 */
@Injectable()
export class ResolveChatItemsUseCase {
  constructor(private readonly items: ChatItemsResolver) {}

  async execute({ skus }: ResolveChatItemsInput): Promise<{ items: ProductOutput[] }> {
    return { items: await this.items.resolve(skus) };
  }
}
