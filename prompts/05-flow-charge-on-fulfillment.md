# 5. Flow: charge the vaulted card when payment is due  [both]

Automatically charge the buyer's vaulted card / bank account when a B2B order's payment schedule
reaches its due date, with a safety check that skips it if the payment was already collected. This is
**Part 4b** of the workshop. It's **independent of Flow 1**: it acts on the payment schedule, not the
`Prebooking` tag, so it never waits on Flow 1's tagging. The same Flow serves both plans.

## Prompt (copy into Sidekick)

```text
Create a new Flow that charges the vaulted B2B payment method when a B2B order's payment
schedule reaches its due date, but only if that payment hasn't already been collected.
```

### While Sidekick builds: talk this through

1. **Trigger = payment schedule due:** for a due-on-fulfillment order that fires when you fulfill; a Net 30 order would fire 30 days out.
2. **Safety check:** skip if the payment was already collected (`completedAt` exists), so it never double-charges.
3. **Independent of Flow 1:** it keys off the payment schedule, not the `Prebooking` tag, so there's nothing to wait for.
4. **One Flow, both plans:** non-Plus charges once at full fulfillment; Plus charges per fulfillment because the platform creates a schedule per shipment.

## What it builds

- **Trigger:** Payment schedule is due (fires when a payment schedule's due date is reached;
  for due-on-fulfillment that is when fulfillment happens)
- **Conditions (all true):**
  - the order is a **B2B order** (placed by a purchasing company)
  - `paymentSchedule.completedAt` does not exist (payment not already collected: the safety / double-charge guard)
- **Action:** Charge vaulted payment for B2B order

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
- We scope it to **B2B orders** (any B2B order's schedule, when due) rather than to the `Prebooking`
  tag, so the charge doesn't depend on Flow 1 having run yet. In this store's model every B2B order that
  should auto-charge is on terms, so "charge any B2B order when its schedule is due" is the right rule.
- The action charges the vaulted method through the order's payment schedule, independent of the
  store's payment-capture setting, so either "capture on fulfillment" or "manual capture" is fine
  (just not "automatically at checkout," which collects up front and defeats the model).
- This depends on the buyer having a vaulted method, which is what the force-vault piece
  (App Store app on non-Plus, or the Plus Function in Part 3) guarantees.
