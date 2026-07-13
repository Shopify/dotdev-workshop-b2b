# Building B2B Pre-booking on Shopify

A hands-on workshop for partners and developers: build B2B pre-order / pre-booking on today's
Shopify capabilities, before selling plans are available for B2B. This repo is a **foundation to
build from**, not a turnkey product: patterns, prompts, and a starter app you extend for your merchant.

**This README is the workshop.** Read it top to bottom, then build part by part. Each step has a
matching prompt in [`prompts/`](prompts); the `finished` branch is the reference solution.

> ## ⚠️ Required prework, do it BEFORE the session
>
> Setup is heavier than most workshops and **cannot be done live** (a US Plus sandbox with B2B,
> Shopify Payments in test mode, Shopify Flow, and the store seed script all take time or have
> verification delays). **Do every step in
> [`workshop-assets/prerequisites.md`](workshop-assets/prerequisites.md) before you arrive.** In the
> room we only clone, `pnpm install`, and build. See [Get ready](#get-ready).

## The problem

B2B on Shopify doesn't support selling plans yet, so there's no native pre-order path. Apparel
merchants in particular take pre-book orders two seasons ahead (order now, produce and ship later, pay
on fulfillment) and often run that on another platform. Pre-booking, in one line: a delayed-fulfillment
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

## What actually requires Plus

**B2B is now on every plan** (Basic and up), not just Plus: any merchant can run companies, locations,
catalogs, net terms, and vaulted cards. So most of this applies broadly. You build everything on your
Plus dev store; only three things gate on the merchant's plan:

- **Dynamic payment terms at checkout** (`paymentTermsSet` Function, Plus-only): flips a mixed cart to
  due-on-fulfillment. Non-Plus splits into two fixed-term locations instead.
- **Per-fulfillment charging** (Plus-only): Plus bills each shipment separately; non-Plus charges once
  at full fulfillment.
- **Custom apps that contain Functions** (Plus-only): the force-vault Function is custom on Plus;
  non-Plus gets the same "hide pay later" from an App Store (public) app.

Beyond those three, the build is identical on either tier.

## Prerequisites

**Required and mostly not doable live.** Complete the full checklist in
[`workshop-assets/prerequisites.md`](workshop-assets/prerequisites.md) before the session; it has the
tricky Shopify Payments setup and exact steps. The short version:

- A **US Shopify Plus sandbox** dev store with **B2B on**.
- **Shopify Payments in test mode**, capture set to **manual or on-fulfillment** (not at checkout).
- **Shopify Flow** installed (free, [App Store listing](https://apps.shopify.com/flow)).
- **Node.js 20+**, **pnpm** (or npm), and **Shopify CLI 4+**.
- An **AI assistant** with the **Shopify Dev MCP** and **Shopify AI Toolkit** (the repo ships the MCP
  config, so most assistants auto-load it).
- The store structure is created for you by the seed script in **Get ready**; you don't build it by hand.

## Get ready

**Before the session, seed your store.** Clone the repo, authenticate the CLI, and run the setup
script. It provisions the whole B2B structure (products with images, collections + menu, company
**Urban Style**, buyer **Maria Cruz**, all three locations, markets, catalogs, terms, DTC catalog).
Full scopes string and options are in [`workshop-assets/setup/README.md`](workshop-assets/setup/README.md).

```bash
# from a folder you keep projects in (not inside another git repo)
git clone <this-repo-url>
cd <this-repo>/workshop-assets/setup
shopify store auth --store <your-store>.myshopify.com --scopes <see setup/README.md>
STORE=<your-store>.myshopify.com BUYER_EMAIL=you+us@example.com node setup-store.mjs
```

The pre-booking **data model** is *not* seeded here: it's app-owned (declared in `shopify.app.toml`) and
created when you run `shopify app dev` in Part 1.

**In the session, start the app:**

```bash
cd starter/b2b-prebooking-workshop
pnpm install
shopify app dev
```

The first `shopify app dev` **links the app in your Partner org** and creates the app-owned data model.
**Do not run `--reset`**: it drops the declarative data model. Expect a **storefront password** prompt
(Admin, Online Store, Preferences) and a **sudo/login password** for the local `mkcert` certificate.

## Repo structure

```
.
├── prompts/            AI prompts + CLI commands, one per build step (Plus first)
├── starter/            The Shopify app you extend (theme block + payment Function)
│   └── b2b-prebooking-workshop/   see its README for app layout + what ships vs. what you build
└── workshop-assets/    Prework, seeding, activation, Flow definitions, and reset
    ├── prerequisites.md
    ├── setup/                          store-setup script + README
    ├── data-model-seed.md
    ├── payment-customization-activation.md
    ├── flow/                           exported .flow definitions
    └── reset.md
```

`main` is the starter you build from; the `finished` branch has the completed solution.

## Your seeded store (take 2 minutes to look)

Pre-booking isn't one feature; it's a combination of vaulted cards, payment terms (due on fulfillment),
a charge-on-fulfillment Flow, and, on Plus, per-fulfillment charging and a payment-terms Function, all
scoped by markets + catalogs. The seed script already built the B2B structure this sits on. You don't
build it live, but it **is** the non-Plus pattern:

- **Two product groups** tagged `available-now` and `prebook` (pre-book titles carry a `(Pre-book)`
  suffix); smart collections + menu links per group are a legibility aid.
- **Two wholesale locations** under one company (Available Now, Pre-book) plus a Plus **Combined**
  location. All share the same address and the same buyer-as-admin: not separate places, just the lever
  for separate catalogs, terms, and orders per journey.
- **A market + catalog per location** at wholesale pricing; Combined carries both catalogs on one market
  for a mixed cart.
- **Terms per location:** Available Now = Net 30, Pre-book = **due on fulfillment**, Combined = Net 30
  (the Plus Function switches it per checkout).

Separate products (not one product in two states) avoids inventory gymnastics; pre-book keeps selling
past zero stock (inventory policy `continue`) since each order sizes the production run. The one thing
**not** seeded is the **season data model**, which you build in Part 1.

## How the workshop runs (Plus first)

Build the full Plus experience first (Parts 1 to 4), then adapt for non-Plus (Part 5). Test every step
by **logging in as your B2B buyer through the storefront** (a one-time code is emailed); the admin
preview and D2C visitors won't trigger the block or the B2B payment behavior.

| Part | Plan | You build | Prompt | Verify |
|---|---|---|---|---|
| **1. Data model + theme block** | both | `shopify app dev` creates the app-owned metaobject + product metafield; seed one season and tag pre-book products in Admin; build and place the PDP block | [`01`](prompts/01-scaffold-app.md), [`02`](prompts/02-theme-app-block.md) | Pre-book PDP shows the windows; `Season` + `Delivery window` appear on cart and checkout; available-now shows nothing |
| **2. Flow: tag pre-book orders** | both | Flow 1 (Sidekick prompt), B2B-guarded, adds the `Prebooking` order tag | [`03`](prompts/03-flow-tag-prebook-orders.md) | A B2B pre-book order gets `Prebooking`; a DTC order with the same product does not |
| **3. Flow: charge on fulfillment** | both | Flow 2 (Sidekick prompt) charges the vaulted card when fulfilled, with a `completedAt` double-charge guard | [`04`](prompts/04-flow-charge-on-fulfillment.md) | Fulfilling a pre-book order charges the vaulted method once |
| **4. Plus payment-terms Function** | Plus | build + deploy the Function, then activate the payment customization | [`05`](prompts/05-plus-payment-terms-function.md) | On Combined, a mixed cart flips to due-on-fulfillment and hides deferred; a Net-30 cart is unchanged |
| **5. Adapt for non-Plus** | non-Plus | no new code: two fixed-term locations; force-vault via an App Store app | n/a | Available-now and pre-book are ordered separately with their own terms; the app hides deferred on a pre-book cart |

Key points per part:

- **Part 1.** The data model is **app-owned**: declaring it in `shopify.app.toml` versions the schema
  with the app and avoids per-store drift (`$app` namespace). The schema is read-only; only the
  **values** (season + assignment) are yours, and `merchant_read_write` lets you author them in Admin
  (see [`data-model-seed.md`](workshop-assets/data-model-seed.md)). The block reads the season in Liquid
  and injects visible line item properties, the all-plans way to carry pre-book context to checkout.
- **Part 3.** One Flow serves both plans: non-Plus charges once at full fulfillment, Plus per
  fulfillment, driven by how each plan generates payment schedules, not by anything you author.
- **Part 4.** The Plus payoff. The Function detects a pre-book item and, for that checkout only, switches
  Net 30 to due-on-fulfillment (`paymentTermsSet`, Plus-only) and hides the deferred option (match it by
  its real input name "Deferred", not the label). Activate it per
  [`payment-customization-activation.md`](workshop-assets/payment-customization-activation.md), and
  **restart `shopify app dev` after the first deploy** (deploying while dev runs stales the block's asset URL).
- **Part 5.** Most B2B merchants aren't on Plus. Without the two Plus-only pieces they pre-separate the
  journeys (Available Now on Net 30, Pre-book on due-on-fulfillment), so each single-term order charges
  correctly via the same Flow. The theme block and both Flows work unchanged. The only non-Plus-specific
  piece is the force-vault: custom apps with Functions require Plus, so the "hide pay later" comes from an
  App Store app.

## Recap

Starting from the pre-seeded B2B structure, you built the pre-order experience: a PDP block that carries
season context to checkout, two Flows that tag and charge the vaulted card on fulfillment, and the Plus
payment Function that ties them into one smart mixed cart. Then you adapted for a non-Plus merchant, who
reaches the same outcome by splitting into two fixed-term locations.

## Reset and redo

Need to redo a part or wipe the build back to the pre-seeded baseline? See
[`workshop-assets/reset.md`](workshop-assets/reset.md).

## Where to go next (extension ideas)

- Attach line item properties on **every** add path (quick-add, bulk order), not just the PDP, via a
  site-wide app embed that intercepts `/cart/add`.
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
