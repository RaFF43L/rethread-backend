import type { AgentItemInput } from '../../ai/domain/ports/ai-agent.port';
import { type Product, ProductCategory } from '../domain/entities/product.entity';
import type { AgentAttributesInput, UpdateProductInput } from './dto/product.dto';

const AGENT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.CALCA]: 'calça',
  [ProductCategory.BLUSA]: 'blusa',
  [ProductCategory.CAMISETA]: 'camiseta',
  [ProductCategory.SHORT]: 'short',
  [ProductCategory.VESTIDO]: 'vestido',
};

function agentAttributes(input: AgentAttributesInput): Partial<AgentItemInput> {
  return {
    title: input.title,
    department: input.department,
    era: input.era,
    size_region: input.sizeRegion,
    fabric: input.fabric,
    stretch: input.stretch,
    style_tags: input.styleTags,
    occasions: input.occasions,
    condition: input.condition,
    notes: input.notes,
    measurements: input.measurements,
  };
}

export function toAgentItem(product: Product, input: AgentAttributesInput): AgentItemInput {
  const category = AGENT_CATEGORY_LABELS[product.category];
  return {
    ...agentAttributes(input),
    sku: product.codigoIdentificacao,
    title:
      input.title ?? `${category.charAt(0).toUpperCase()}${category.slice(1)} ${product.marca}`,
    description: product.descricao,
    category,
    brand: product.marca,
    label_size: product.size,
    color: product.cor,
    price: product.preco,
    status: 'active',
  };
}

// Only the fields present in the update, so the agent keeps everything else.
export function toAgentItemChanges(input: UpdateProductInput): Partial<AgentItemInput> {
  const changes: Partial<AgentItemInput> = {
    ...agentAttributes(input),
    description: input.descricao,
    category: input.category && AGENT_CATEGORY_LABELS[input.category],
    brand: input.marca,
    label_size: input.size,
    color: input.cor,
    price: input.preco,
  };
  return Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  ) as Partial<AgentItemInput>;
}
