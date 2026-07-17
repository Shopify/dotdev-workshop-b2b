# Flows

Workshop **Part 3**. Two Shopify Flow workflows for the pre-book order lifecycle, both on all plans:

- **Charge on fulfillment (Part 3a, required).** Charges the buyer's vaulted method when a B2B order's
  payment schedule comes due, which for due-on-fulfillment is at fulfillment (once at full fulfillment on
  non-Plus, per fulfillment on Plus). Just a trigger and an action, no condition: the charge action
  already skips schedules that have been paid. It keys off the payment schedule, not the tag, so it's
  independent of the tag Flow.
- **Tag pre-book orders (Part 3b, optional).** Tags B2B orders that contain a pre-book item so the store
  owner can filter them in Admin. Merchant-visibility only; nothing depends on it. Build it if there's
  time, or leave it as a take-home.

Talk track: after the theme block (buyer sees pre-book context) and the payment Function (right
checkout), these Flows make the merchant's life easier managing orders and payments.

## Building them (recommended)

Build each Flow live (Sidekick prompt, by hand, or import). The prompts, triggers, actions, and teach
notes live in [`../../SESSION.md`](../../SESSION.md) Part 3, which is the **single source of truth**.

## Importing them (optional)

For anyone who'd rather not build the Flows via Sidekick or by hand, exported `.flow` files
are provided here so you can import them directly:

- `charge-on-fulfillment.flow` (the charge Flow, Part 3a, required): schedule-driven trigger,
  then the charge action, no condition
- `tag-prebook-orders.flow` (the tag Flow, Part 3b, optional)

To import: Shopify admin, Apps, Shopify Flow, Import, then select the `.flow` file. Review the
conditions after importing, then turn the workflow on.

> Building from the prompt is the recommended learning path; the `.flow` import is a shortcut.

### Regenerating the exports

If a Flow changes, re-export it to keep these files current: Shopify admin, Apps, Shopify
Flow, open the workflow, overflow menu, Export, then save the file here under the names above.
