import assert from "node:assert/strict";
import { decideRisk, paymentEvent } from "./risk_decision.js";

const event = paymentEvent.parse({ id: "pay_test", amount: 120, currency: "USD", country: "US", customerTier: "trusted" });
assert.equal(decideRisk(event, "Trusted customers may proceed."), "allow");
assert.equal(decideRisk({ ...event, amount: 10000 }, "Trusted customers may proceed."), "review");
assert.equal(decideRisk(event, "Manual review required for this country."), "review");
console.log("risk decision checks passed");
