import { embed, infrai } from "./infrai_client.js";
import { auditNotice, decideRisk, paymentEvent } from "./risk_decision.js";

const event = paymentEvent.parse({ id: "pay_1042", amount: 12500, currency: "USD", country: "US", customerTier: "standard" });
const vector = await embed(`payment risk guidance for ${event.country} ${event.currency}`);
const matches = await infrai.query(vector) as { matches?: Array<{ metadata?: { text?: string } }> };
const guidance = matches.matches?.map((m) => m.metadata?.text ?? "").join(" ") ?? "";
const decision = decideRisk(event, guidance);
console.log(auditNotice(event, decision));
