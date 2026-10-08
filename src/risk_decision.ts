import { z } from "zod";

export const paymentEvent = z.object({ id: z.string().min(1), amount: z.number().nonnegative(), currency: z.string().length(3), country: z.string().length(2), customerTier: z.enum(["standard", "trusted"]) });
export type PaymentEvent = z.infer<typeof paymentEvent>;
export type Decision = "allow" | "review";

export function decideRisk(event: PaymentEvent, retrievedGuidance: string): Decision {
  const highAmount = event.amount >= 10_000;
  const restrictedCountry = /manual review|required review/i.test(retrievedGuidance);
  return highAmount || restrictedCountry ? "review" : "allow";
}

export function auditNotice(event: PaymentEvent, decision: Decision): string {
  return `payment=${event.id} amount=${event.amount} ${event.currency} decision=${decision}`;
}
