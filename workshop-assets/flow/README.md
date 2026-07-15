# Flows

Workshop **Part 4**. Two Shopify Flow workflows for the pre-book order lifecycle, both on all plans:

- **Charge on fulfillment (Part 4a, required).** Charges the buyer's vaulted method when a B2B order's
  payment schedule comes due, which for due-on-fulfillment is at fulfillment (once at full fulfillment on
  non-Plus, per fulfillment on Plus), and skips any schedule already collected (safety check). It keys
  off the payment schedule, not the tag, so it's independent of the tag Flow.
- **Tag pre-book orders (Part 4b, optional).** Tags B2B orders that contain a pre-book item so the store
  owner can filter them in Admin. Merchant-visibility only; nothing depends on it. Build it if there's
  time, or leave it as a take-home.

Talk track: after the theme block (buyer sees pre-book context) and the payment Function (right
checkout), these Flows make the merchant's life easier managing orders and payments.

## Building them (recommended)

Build each Flow live with its Sidekick prompt. The prompts, triggers, conditions, actions,
and teach notes are documented in the build walkthrough, which is the **single source of truth**:

- Charge (Part 4a): [`../../prompts/04-flow-charge-on-fulfillment.md`](../../prompts/04-flow-charge-on-fulfillment.md)
- Tag (Part 4b, optional): [`../../prompts/05-flow-tag-prebook-orders.md`](../../prompts/05-flow-tag-prebook-orders.md)

## Importing them (optional)

For anyone who'd rather not build the Flows via Sidekick or by hand, exported `.flow` files
are provided here so you can import them directly:

- `flow-2-charge-on-fulfillment.flow` (the charge Flow, Part 4a, required): schedule-driven, a single
  `completedAt` guard, no tag dependency
- `flow-1-tag-prebook-orders.flow` (the tag Flow, Part 4b, optional)

To import: Shopify admin, Apps, Shopify Flow, Import, then select the `.flow` file. Review the
conditions after importing, then turn the workflow on.

> Building from the prompt is the recommended learning path; the `.flow` import is a shortcut.

### Regenerating the exports

If a Flow changes, re-export it to keep these files current: Shopify admin, Apps, Shopify
Flow, open the workflow, overflow menu, Export, then save the file here under the names above.
