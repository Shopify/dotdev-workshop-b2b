# Building B2B Pre-orders on Shopify

A hands-on workshop for partners and developers: build B2B pre-orders / pre-booking on today's Shopify
capabilities. This repo is a **foundation to build from**,
not a turnkey product: patterns, prompts, and a starter app you extend for your merchant.

> **Format: AI-assisted ("vibe coding"), not hands-on coding.** You build by prompting an AI assistant
> (Claude, Cursor, etc.), which writes the code; your job is to prompt it, then read and understand what
> it produced, not to write or debug code by hand. No prior coding experience needed. If a step's AI
> output misbehaves, you drop in the `finished` version and keep going.

This README is the **overview**. The two working docs are:

- **[`PREWORK.md`](PREWORK.md)**: the before-session setup (see [Prerequisites](#prerequisites) below), with exact steps and a validation checklist.
- **[`SESSION.md`](SESSION.md)**: the in-session follow-along: every command, prompt, and checkpoint in
  order. Open it and build.

## Who this is for

App developers, agencies, and technical partners who build or advise on B2B commerce for Shopify
merchants. The build is AI-assisted, so you'll be comfortable if you can:

- run commands in a terminal
- clone and edit a project from GitHub
- follow basic Shopify Admin and B2B concepts

## Prerequisites

Set all of this up **before the session**, it's much more difficult to do live. Full steps and a validation checklist
are in **[`PREWORK.md`](PREWORK.md)**; give yourself lead time for Shopify Payments especially.

- **US Shopify Plus sandbox** dev store (B2B features will be included by default)
- **Shopify Payments** in **test mode** (set payment capture to fulfillment or manual, not at checkout)
- **Shopify Flow** installed
- **Node.js 20+**, **pnpm** (or npm), and **Shopify CLI 4+**
- An **AI coding assistant** with the **Shopify Dev MCP** and **AI Toolkit**
- The **store seeded** with the workshop data (seed script in PREWORK)

## The problem

B2B on Shopify doesn't support selling plans yet, so there's no native pre-order path. Apparel merchants
in particular take pre-book orders two seasons ahead (order now, produce and ship later, pay on
fulfillment) and often run that on another platform. Pre-booking, in one line: a delayed-fulfillment
order that carries a season signal and is paid on fulfillment. This workshop builds it on Shopify now.

## What you'll build

Against your own dev store: a B2B buyer views a pre-book product and sees its ordering and delivery
windows, adds it to the cart, and at checkout the order is set to due-on-fulfillment; when it ships, the
vaulted card is charged automatically. You build the full **Plus** experience first, then adapt it for a
**non-Plus** merchant.

| | Non-Plus | Plus |
|---|---|---|
| Product modeling | Separate available-now and pre-book products | Available-now + pre-book in one mixed cart |
| Visibility | Separate catalog + location/market per type | Single location with both catalogs |
| Payment terms | Static "due on fulfillment" on the pre-book location | Function switches Net 30 to due-on-fulfillment when a pre-book item is in the cart |
| Force a vaulted card | App Store (public) app hides "pay later" | Custom payment-customization Function hides "pay later" |
| Charge on fulfillment | One Flow, charges at full fulfillment | Same Flow, charges per fulfillment |
| Season on cart/checkout | Line item properties (all plans) | Line item properties (same mechanism) |

## The building blocks

Pre-booking isn't one feature; it's a combination of primitives that are already on the platform. The
workshop wires these together:

1. **Catalogs (+ Markets)**: which products and prices each B2B buyer's location sees.
2. **Payment terms**: when the balance is due (Net 30, or **due on fulfillment**) on the company location.
3. **Custom data**: metaobjects + metafields; the "season" model attached to the product.
4. **Online store theme (Liquid)**: the PDP block that shows the windows and carries `Season` / `Delivery window` onto the cart line.
5. **Payment customizations** *(Plus)*: a Shopify Function that switches terms and hides "pay later" for pre-book carts.
6. **Vaulted cards & ACH**: save a payment method on the order to charge later.
7. **Shopify Flow**: charge the vaulted method automatically when the payment schedule comes due.

A couple of these are Plus-only (see [What actually requires Plus](#what-actually-requires-plus));
everything else works on any plan.

## What actually requires Plus

**B2B is now on every plan** (Basic and up): any merchant can run companies, locations, catalogs, net
terms, and vaulted cards. You build on a Plus dev store, but only two things gate on the merchant's plan:

- **Custom app Functions** (Plus-only): the payment-customization Function switches a mixed cart to
  due-on-fulfillment and hides "pay later" to force a vaulted card. Non-Plus uses two fixed-term
  locations plus an App Store app for the hide.
- **Per-fulfillment charging** (Plus-only): Plus bills each shipment separately; non-Plus charges once
  at full fulfillment.

Everything else is identical on either tier.

## How the workshop runs

The session **opens with a live demo of the finished flow**, so you see exactly what you're building
toward before you write anything. Then you build the core of it. You build the full **Plus** experience,
then adapt for **non-Plus** (no new code). Test every step by **logging in as your B2B buyer through the
storefront** (a one-time code is emailed); the admin preview and D2C visitors won't trigger the block or
the B2B payment behavior.

The runnable steps live in [`SESSION.md`](SESSION.md). At a glance:

- **Part 0: Set up the app.** Install and start the local dev session.
- **Part 1: Theme block.** The PDP panel that reads the season (custom data) and carries it to checkout; you author the season values in Admin while the AI builds.
- **Part 2: Payment Function** *(Plus)*. Switch a pre-book cart to due-on-fulfillment and force a vaulted card.
- **Part 3: Flows.** Charge the vaulted card automatically on fulfillment (required); optionally tag pre-book orders for a filtered view.
- **Part 4: Test the full order.** Place one order as the buyer and watch the vaulted card auto-charge on each fulfillment.
- **Recap: non-Plus.** The same outcome one tier down, using two fixed-term locations.

## Your seeded store (take 2 minutes to look)

The seed script (run in prework) builds the B2B structure the workshop sits on. You don't build it live,
but it **is** the non-Plus pattern:

- **Two product groups** tagged `available-now` and `prebook` (pre-book titles carry a `(Pre-book)` suffix); smart collections + menu links per group are a legibility aid.
- **Two wholesale locations** under one company (Available Now, Pre-book) plus a Plus **Combined** location. All share one address and the same buyer-as-admin: not separate places, just the lever for separate catalogs, terms, and orders per journey.
- **A market + catalog per location** at wholesale pricing; Combined carries both catalogs on one market for a mixed cart.
- **Terms per location:** Available Now = Net 30, Pre-book = **due on fulfillment**, Combined = Net 30 (the Plus Function switches it per checkout).

Separate products (not one product in two states) avoids inventory gymnastics; pre-book keeps selling
past zero stock (inventory policy `continue`) since each order sizes the production run. The data model
(season metaobject + product metafield) is seeded too; the one thing you author live is the **season
values**, which is Part 1.

## Repo structure

```
.
├── README.md                        This overview
├── PREWORK.md                       Do this BEFORE the session (accounts, Payments, store seed)
├── SESSION.md                       In-session follow-along (keep this open)
├── CODE.md                          Finished code as paste-in blocks (fallback to prompting)
├── b2b-preorder-reference-sheet.md  Take-home: pre-order patterns × Plus/non-Plus
├── starter/                         The Shopify app you extend (theme block + payment Function)
│   └── b2b-prebooking-workshop/     see its README for app layout + what ships vs. what you build
└── workshop-assets/
    ├── setup/                       store-setup script (setup-store.mjs)
    ├── products/                    seed products (CSV + images)
    └── flow/                        exported .flow definitions + screenshots
```

`main` is the starter you build from; the `finished` branch has the completed solution (also your
in-session recovery path).

## Take-home

Reset or redo a part via [`SESSION.md`](SESSION.md) ("Start a part over"). The
[reference sheet](b2b-preorder-reference-sheet.md) maps six pre-order patterns to these building blocks
on Plus and non-Plus, use it to build variations after the session.

## Where to go next (extension ideas)

- Attach line item properties on **every** add path (quick-add, bulk order), not just the PDP, via a site-wide app embed that intercepts `/cart/add`.
- On Plus, add a **checkout UI extension** for a more polished pre-book line display.
- Support **multiple seasons** and a buyer-selected delivery date.

## Reference docs

- [Payment Customization Function API](https://shopify.dev/docs/api/functions/latest/payment-customization)
- [Shopify Functions (plan availability)](https://shopify.dev/docs/api/functions/latest)
- [Theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [B2B](https://shopify.dev/docs/apps/build/b2b)
- [Shopify Flow](https://help.shopify.com/manual/shopify-flow)

---

<sup>Terminology: in prose we write **pre-book** / **pre-booking** (hyphenated); the literal identifiers
are one word (product tag `prebook`, order tag `Prebooking`, data model `b2b-prebooking`). The
unhyphenated form is always a tag or identifier.</sup>
