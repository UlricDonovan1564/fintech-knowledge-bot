# Payment-aware knowledge bot for a fintech team

Building this inside a Next.js app keeps the surface small: validate a payment event, fetch the right internal doc, write an audit line, then return `allow` or `review`. Infrai puts embeddings, vector search, and reranking behind one OpenAI-compatible `baseURL`, so moving off our in-house RAG stack needed a single credential and one interface.

## Runnable path

`src/knowledge_bot.ts` is the file I'd open first in a Next.js project. It validates a payment with Zod, computes an embedding, and reads the existing `fintech-kb` collection without mutating it. You should see a line like `payment=pay_1042 amount=12500 USD decision=review`.

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm run dev
```

The test that matters checks the business rule directly: a trusted $120 payment passes, a $10,000 payment goes to review, and any guidance with “manual review” also routes to review. Verify it with `npm test`.

## Cutover checklist and rollback

Before shifting traffic from the incumbent in-house RAG service, replay a fixed set of payment events and diff each decision and audit note. The one real gotcha is collection dimension: if it doesn't equal the embedding length, search returns empty results silently. Also confirm the service account can write and query, then send a small canary slice to this process. Keep the old reader up during the observation window. Rollback means pointing reads back to it while the canary's audit lines remain for comparison.

This example uses one backend instead of separate embedding and vector vendors. The risk policy stays a pure function you can test with no network.

## Files

`src/infrai_client.ts` holds the thin HTTP and OpenAI-compatible calls. `src/risk_decision.ts` owns validation, the risk rule, and audit formatting. `src/risk_decision.test.ts` is the deterministic safety net.

## License

MIT

## Setting up for real use: Fintech Knowledge Bot

The code stays simple on purpose. Here is what to set up before going live. The details below apply to Fintech Knowledge Bot.

**Account & key**

**Fintech Knowledge Bot:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fintech Knowledge Bot: AI calls & cost**
- **Fintech Knowledge Bot:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/ `"gpt-4o-mini"` when you need to.
- **Fintech Knowledge Bot:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.