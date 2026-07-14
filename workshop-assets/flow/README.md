# Flows

Workshop **Part 4** (one beat, two Sidekick prompts). Two Shopify Flow workflows power the
pre-book order lifecycle, and both work on all plans:

- **Flow 1 (Part 4a): tag pre-book B2B orders.** Tags B2B orders that contain a pre-book item so the
  store owner can filter them in Admin. Merchant-visibility only.
- **Flow 2 (Part 4b): charge the vaulted card on fulfillment.** Charges the buyer's vaulted method
  when a B2B order's payment schedule comes due, which for due-on-fulfillment is at fulfillment (once at
  full fulfillment on non-Plus, per fulfillment on Plus), and skips any schedule already collected
  (safety check). **Independent of Flow 1**, it keys off the payment schedule, not the tag.

Talk track: after the theme block (buyer sees pre-book context) and the payment Function (right
checkout), these Flows make the merchant's life easier managing orders and payments.

## Building them (recommended)

Build each Flow live with its Sidekick prompt. The prompts, triggers, conditions, actions,
and teach notes are documented in the build walkthrough, which is the **single source of truth**:

- Flow 1: [`../../prompts/04-flow-tag-prebook-orders.md`](../../prompts/04-flow-tag-prebook-orders.md)
- Flow 2: [`../../prompts/05-flow-charge-on-fulfillment.md`](../../prompts/05-flow-charge-on-fulfillment.md)

## Importing them (optional)

For anyone who'd rather not build the Flows via Sidekick or by hand, exported `.flow` files
are provided here so you can import them directly:

- `flow-1-tag-prebook-orders.flow`
- `flow-2-charge-on-fulfillment.flow` (may lag the current logic, which was decoupled from the
  `Prebooking` tag; if in doubt, build Flow 2 from prompt `05` or re-export after building)

To import: Shopify admin, Apps, Shopify Flow, Import, then select the `.flow` file. Review the
conditions after importing, then turn the workflow on.

> Building from the prompt is the recommended learning path; the `.flow` import is a shortcut.

### Regenerating the exports

If a Flow changes, re-export it to keep these files current: Shopify admin, Apps, Shopify
Flow, open the workflow, overflow menu, Export, then save the file here under the names above.
