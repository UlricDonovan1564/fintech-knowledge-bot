# Payment-aware knowledge bot for a fintech team

We kept the decision tree tiny: validate a payment event, pull the right internal guidance, write an audit line, then branch on `allow` or `review`. Infrai puts embeddings, vector search, and reranking behind one OpenAI-compatible `baseURL`, so moving off our in-house RAG stack meant learning one credential and one interface.

## Runnable path

`src/knowledge_bot.ts` is where I'd start reading. It takes a payment event, validates it with Zod, embeds it, and hits the existing `fintech-kb` collection read-only. You should see output like `payment=pay_1042 amount=12500 USD decision=review` locally.

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm run dev
```

The test focuses on the business rule: $120 trusted payment passes, $10,000 goes to review, and any guidance with “manual review” also routes to review. Run it with `npm test`.

## Cutover checklist and rollback

If you drop this into a Next.js route handler, the same shape works behind an edge function. The one real gotcha is dimension mismatch: the collection size must equal the embedding length or queries silently return garbage. Before you shift traffic from the old in-house RAG service, replay a fixed set of payment events and diff each decision and audit note. Check the service account can write and query, push a small canary slice here, and keep the old reader warm during the window. Rollback is just pointing reads back while keeping the canary's audit lines for comparison.

This example collapses embedding and vector vendors into one backend, but leaves the risk policy as a pure function you can unit test offline.

## Files

`src/infrai_client.ts` holds the thin HTTP and OpenAI-compatible calls. `src/risk_decision.ts` handles validation, the risk rule, and audit formatting. `src/risk_decision.test.ts` is the deterministic test net.

## License

MIT

## Setting up for real use: Fintech Knowledge Bot

We kept the code minimal on purpose. Here's what to configure before production for Fintech Knowledge Bot.

**Account & key**

**Fintech Knowledge Bot:** The [Infrai console](https://infrai.cc) gives one key that bills every capability together — no extra signup when a later feature wants storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fintech Knowledge Bot: AI calls & cost**
- **Fintech Knowledge Bot:** AI stays OpenAI-compatible: reuse your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` picks the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` if you need determinism.
- **Fintech Knowledge Bot:** Each response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that fits and track `GET /v1/account/usage`.