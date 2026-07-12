# 4. Flow: charge the vaulted card on fulfillment  [both]

Automatically charge the buyer's vaulted card / bank account when a pre-book order's payment
comes due. The same Flow serves both plans.

## Prompt (Sidekick)

```
create a new flow to charge the vaulted b2b payment method on a b2b order when: 1) the order has payment terms due on fulfillment, 2) the order is tagged "Prebooking", 3) the order due date has arrived
```

## What it builds

- **Trigger:** Payment schedule is due (fires when a payment schedule's due date is reached;
  for due-on-fulfillment that is when fulfillment happens)
- **Conditions (all true):**
  - `paymentSchedule.completedAt` does not exist (payment not already collected: double-charge guard)
  - `paymentSchedule.paymentTerms.paymentTermsType` equals `FULFILLMENT` (due-on-fulfillment only)
  - `paymentSchedule.paymentTerms.order.tags` contains `Prebooking` (pre-book orders only, via step 3)
- **Action:** Charge vaulted payment for B2B order

## One Flow, both plans

- **Non-Plus:** one payment schedule at full fulfillment, so it charges once for the full balance.
- **Plus:** the platform generates a payment schedule per fulfillment, so it charges per shipment.

You do not author that difference; it comes from how each plan generates payment schedules.

## You should see

Fulfilling a pre-book order (fully on non-Plus, or a shipment at a time on Plus) automatically
charges the vaulted method for the due amount, with no double charge.

## Teach

- The `completedAt does not exist` condition is the double-charge guard; it is cleaner than a
  manual "no open authorization" check.
- The action charges the vaulted method through the order's payment schedule, independent of the
  store's payment-capture setting, so either "capture on fulfillment" or "manual capture" is fine
  (just not "automatically at checkout," which collects up front and defeats the model).
- This depends on the buyer having a vaulted method, which is what the force-vault piece
  (App Store app on non-Plus, or the Plus Function in step 5) guarantees.
