# 4. Flow: charge the vaulted card on fulfillment  [both]

Automatically charge the buyer's vaulted card / bank account **on fulfillment**: it fires when a B2B
order's payment schedule comes due, which for due-on-fulfillment terms is at fulfillment (and **per
fulfillment** on Plus), with a safety check that skips it if the payment was already collected. This is
**Part 4a** of the workshop and the **only required Flow**. It's **independent of the tagging Flow**
(Part 4b): it acts on the payment schedule, not the `Prebooking` tag, so it never waits on tagging. The
same Flow serves both plans.

## Prompt (copy into Sidekick)

```text
Shopify Flow: Charge vaulted B2B payment on due installment

Trigger: Payment schedule due
Condition: paymentSchedule.completedAt is nil (installment not yet collected)
Action: Capture vaulted payment method, using paymentSchedule.id

Do not use an order-level paid check. The condition must be installment-specific to avoid
double-charging. Designed for per fulfillment B2B payment capture.
```

### While Sidekick builds: talk this through

1. **Trigger = payment schedule due:** for a due-on-fulfillment order that fires when you fulfill; a Net 30 order would fire 30 days out.
2. **Safety check:** skip if the payment was already collected (`completedAt` exists), so it never double-charges.
3. **Independent of the tagging Flow:** it keys off the payment schedule, not the `Prebooking` tag, so there's nothing to wait for.
4. **One Flow, both plans:** non-Plus charges once at full fulfillment; Plus charges per fulfillment because the platform creates a schedule per shipment.

## What it builds

- **Trigger:** Payment schedule is due (fires when a payment schedule's due date is reached;
  for due-on-fulfillment that is when fulfillment happens)
- **Condition (the only one):**
  - `paymentSchedule.completedAt` does not exist (the installment hasn't been collected yet: the safety /
    double-charge guard). Keep it **installment-specific**, an order-level "paid" check would double-charge
    on multi-installment orders.
- **Action:** Charge vaulted payment for B2B order (against the due `paymentSchedule.id`)

## One Flow, both plans

- **Non-Plus:** one payment schedule at full fulfillment, so it charges once for the full balance.
- **Plus:** the platform generates a payment schedule per fulfillment, so it charges per shipment.

You do not author that difference; it comes from how each plan generates payment schedules.

## You should see

Fulfilling a pre-book order (fully on non-Plus, or a shipment at a time on Plus) automatically
charges the vaulted method for the due amount, once, with no waiting on any tag.

## Teach (deeper, optional)

- The `completedAt does not exist` condition is the safety check the presenter asked for: it skips any
  schedule that's already been collected, so a re-run or re-fulfillment can't double-charge.
- It's inherently **B2B-scoped** without an explicit "is B2B" condition: the trigger fires on a payment
  schedule (which only B2B / net-terms orders have) and the action charges a vaulted B2B method. It keys
  off the schedule, not the `Prebooking` tag, so the charge never depends on the optional tagging Flow. In
  this store's model every B2B order that should auto-charge is on terms, so "any B2B schedule that's due,
  if not already collected" is the right rule.
- The action charges the vaulted method through the order's payment schedule, independent of the
  store's payment-capture setting, so either "capture on fulfillment" or "manual capture" is fine
  (just not "automatically at checkout," which collects up front and defeats the model).
- This depends on the buyer having a vaulted method, which is what the force-vault piece
  (App Store app on non-Plus, or the Plus Function in Part 3) guarantees.
