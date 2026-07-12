# Flows

Two Shopify Flow workflows power the pre-book order lifecycle, and both work on all plans:

- **Flow 1: tag pre-book B2B orders.** Tags B2B orders that contain a pre-book item so they
  can be filtered in Admin and so Flow 2 knows which orders to act on.
- **Flow 2: charge the vaulted card on fulfillment.** Charges the buyer's vaulted method when
  a pre-book order's payment comes due (once at full fulfillment on non-Plus, per fulfillment
  on Plus). Depends on Flow 1's tag.

## Building them (recommended)

Build each Flow live with its Sidekick prompt. The prompts, triggers, conditions, actions,
and teach notes are documented in the build walkthrough, which is the **single source of truth**:

- Flow 1: [`../../prompts/03-flow-tag-prebook-orders.md`](../../prompts/03-flow-tag-prebook-orders.md)
- Flow 2: [`../../prompts/04-flow-charge-on-fulfillment.md`](../../prompts/04-flow-charge-on-fulfillment.md)

## Importing them (optional)

For anyone who'd rather not build the Flows via Sidekick or by hand, exported `.flow` files
are provided here so you can import them directly:

- `flow-1-tag-prebook-orders.flow`
- `flow-2-charge-on-fulfillment.flow`

To import: Shopify admin, Apps, Shopify Flow, Import, then select the `.flow` file. Review the
conditions after importing, then turn the workflow on.

> Building from the prompt is the recommended learning path; the `.flow` import is a shortcut.

### Regenerating the exports

If a Flow changes, re-export it to keep these files current: Shopify admin, Apps, Shopify
Flow, open the workflow, overflow menu, Export, then save the file here under the names above.
