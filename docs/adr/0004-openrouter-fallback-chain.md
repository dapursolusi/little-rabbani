# OpenRouter Fallback Chain

AI narrative generation routes through OpenRouter with a primary model (DeepSeek V3.x or newer, prioritizing the cheapest capable model) and a fallback chain to alternative models. We rejected direct integration with a single provider (OpenAI, Anthropic, Google) because it creates vendor lock-in and prevents cheap model swaps as pricing or quality shifts. We rejected local/open models because of hardware cost, latency, and weaker Bahasa Indonesia quality at this scale.

OpenRouter gives a single API key, multi-model access, and built-in fallback. A thin wrapper (`lib/ai.ts`) abstracts the provider so the primary and fallback models are config-driven — swapping DeepSeek for another model is a one-file change. This matters because the AI is core to the product (daily narrative drafts, quarterly report sections), so provider agility is worth the small indirection.
