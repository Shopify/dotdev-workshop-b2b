# Building B2B Pre-booking on Shopify

A hands-on workshop for partners and developers: build B2B pre-order / pre-booking
solutions with today's Shopify capabilities, before selling plans are available for B2B.

This repo is a **foundation to build from**, not a turnkey product. It gives you the
patterns, prompts, and a starter app; you extend them for your merchant.

## The problem

B2B on Shopify doesn't support selling plans yet, so there's no native pre-order path.
Apparel merchants in particular take pre-book orders two seasons ahead (order now, produce
and ship later, pay on fulfillment) and today often run that on another platform. This
workshop shows how to build it on Shopify now.

Pre-booking, in one line: a delayed-fulfillment order that carries a season signal and is
paid on fulfillment.

> Terminology: in prose we write **pre-book** / **pre-booking** (hyphenated). The literal
> identifiers are one word: the product tag is `prebook`, the order tag is `Prebooking`, and the
> data model is `b2b-prebooking`. When you see the unhyphenated form, it's a tag or identifier.

## Two use cases

| | Non-Plus (Advanced) | Plus |
|---|---|---|
| Product modeling | Separate available-now and pre-book products | Available-now + pre-book in one mixed cart |
| Visibility | Separate catalog + location/market per type | Single location with both catalogs |
| Payment terms | Static "due on fulfillment" on the pre-book location | Function switches Net 30 to due-on-fulfillment when a pre-book item is in the cart |
| Force a vaulted card | App Store (public) app hides "pay later" | Custom payment-customization Function hides "pay later" |
| Charge on fulfillment | One Flow, charges at full fulfillment | Same Flow, charges per fulfillment |
| Season on cart/checkout | Line item properties (all plans) | Line item properties (same mechanism) |

You build **both** on your dev store, which includes Plus features, so you can complete every
part. The **non-Plus vs. Plus labels tell you which merchant plan a capability requires**, so
you can build for a merchant on Advanced or on Plus and clearly explain the differences. For
example, a non-Plus merchant needs an App Store app to hide a payment method and cannot
dynamically switch payment terms; on Plus, a custom app does both.

## Plans: what B2B gives you, and what Plus adds

B2B itself is on **all plans** (Basic, Grow, Advanced, Plus): companies, locations, up to 3 B2B
catalogs, net terms including due-on-fulfillment, vaulted cards, and Shopify Flow with B2B
objects. See [B2B features by plan](https://help.shopify.com/en/manual/b2b/getting-started/plan-features).

This workshop's "non-Plus" build targets **Advanced**, because it uses **contextual
storefront/checkout customization by market** (the per-market navigation), which is Advanced and
up (not Basic/Grow), and it stays within the **3-catalog** cap.

**Plus adds** the pieces the Plus build uses: the `paymentTermsSet` Function operation, unlimited
and direct-to-company catalogs, deposits/partial payments, **payment requests per fulfillment**
(per-shipment charging), theme customization by customer type, and checkout UI extensions on the
payment step. Also, **custom apps that contain Functions require Plus**: on non-Plus the
force-vault Function must come from an **App Store (public) app**; on Plus a custom app does it.

## Repo structure

```
.
├── prompts/            AI prompts + CLI commands, in build order (Plus first)
├── starter/            The Shopify app you extend (theme block + payment Function)
│   └── b2b-prebooking-workshop/
└── workshop-assets/    Activation steps, Flow definitions, and supporting docs
    ├── payment-customization-activation.md
    └── flow/
```

## Prerequisites

See `workshop-assets/prerequisites.md`. In short: a Shopify Plus sandbox dev store with B2B
enabled and the apparel products imported, the Shopify CLI, the
[Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) in your AI assistant,
Sidekick, and the Shopify GraphiQL App installed (used to activate the Plus payment Function). The
company (Urban Style), buyer (Maria Cruz), and locations are created for you by step 0.

## Build sequence

Work through `prompts/` in order. Each step maps to a piece you build or run, labelled
**[non-Plus]**, **[Plus]**, or **[both]**.

**Before the workshop (pre-seeded, so in-session time goes to code):**

0. Store setup: run `workshop-assets/setup/setup-store.py` (products, collections + menu, company +
   buyer, catalogs, markets, locations, terms, DTC catalog) [non-Plus + Plus].
   Optional AI-prompt alternative: `prompts/00-store-setup.md`. (The pre-booking **data model** is
   *not* seeded here; it's app-owned and created on `shopify app dev` in step 1.)

**In the workshop (the code):**

1. Scaffold the app (`prompts/01-scaffold-app.md`)
2. Theme app block: PDP windows + line item properties (`prompts/02-theme-app-block.md`) [both]
3. Flow: tag pre-book B2B orders (`prompts/03-flow-tag-prebook-orders.md`) [both]
4. Flow: charge the vaulted card on fulfillment (`prompts/04-flow-charge-on-fulfillment.md`) [both]
5. Plus payment-terms Function (`prompts/05-plus-payment-terms-function.md`) [Plus]

You arrive with step 0 already done: a pre-seeded B2B store (run `workshop-assets/setup/setup-store.py`
yourself beforehand; see `workshop-assets/setup/README.md`). The workshop opens with a short look at that structure and *why* it's built
that way, then goes hands-on. It builds the full **Plus** experience first (steps 1 to 5, with the
payment Function as the Plus payoff), then adapts it for a **non-Plus** merchant (two locations
with fixed terms, no new code). See `workshop-assets/prerequisites.md`.

Need to redo a part or wipe the in-session build back to the pre-seeded baseline? See
`workshop-assets/reset.md`.

## Reference docs

- Payment Customization Function API: https://shopify.dev/docs/api/functions/latest/payment-customization
- Shopify Functions (plan availability): https://shopify.dev/docs/api/functions/latest
- Theme app extensions: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions
- B2B: https://shopify.dev/docs/apps/build/b2b
- Shopify Flow: https://help.shopify.com/manual/shopify-flow
