# Building B2B Pre-booking on Shopify

A hands-on workshop for partners and developers: build B2B pre-order / pre-booking on today's
Shopify capabilities, before selling plans are available for B2B. This repo is a **foundation to
build from**, not a turnkey product: patterns, prompts, and a starter app you extend for your merchant.

> **Format: AI-assisted ("vibe coding"), not hands-on coding.** You build by prompting an AI assistant
> (Claude, Cursor, etc.), which writes the code; your job is to prompt it, then read and understand what
> it produced, not to write or debug code by hand. No prior coding experience needed. If a step's AI
> output misbehaves, you drop in the `finished` version and keep going.

**This README is the workshop overview + prework.** For the live build, attendees use one doc:
[`SESSION.md`](SESSION.md) (copy-paste prompts, Admin steps, and checkpoints in one place). Each step
also has a matching prompt file in [`prompts/`](prompts); the `finished` branch is the reference
solution.

> ## ⚠️ Required prework, do it BEFORE the session
>
> Setup is heavier than most workshops and **cannot be done live** (a US Plus sandbox with B2B,
> Shopify Payments in test mode, Shopify Flow, and the store seed script all take time or have
> verification delays). **Do every step in
> [`workshop-assets/prerequisites.md`](workshop-assets/prerequisites.md) before you arrive.** In the
> room, open [`SESSION.md`](SESSION.md) and build. See [Get ready](#get-ready).

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

- A **US Shopify Plus sandbox** dev store with **B2B on** (Development store + Plus build; **no** test
  data, **no** feature preview; country United States / USD).
- **Shopify Payments in test mode**, capture set to **manual or on-fulfillment** (not at checkout).
- **Shopify Flow** installed (free, [App Store listing](https://apps.shopify.com/flow)).
- **Node.js 20+**, **pnpm** (or npm), and **Shopify CLI 4+**.
- An **AI assistant** with the **Shopify Dev MCP** and **Shopify AI Toolkit** (the repo ships the MCP
  config, so most assistants auto-load it).
- The store structure is created for you by the seed script in **Get ready**; you don't build it by hand.

You're done with prework only when the **validation checklist at the end of
[`prerequisites.md`](workshop-assets/prerequisites.md) passes**. The two that can't be fixed live are
**Shopify Payments** and the **store seed**, so confirm those especially.

## Get ready

**Before the session, seed your store.** It provisions the whole B2B structure (products with images,
collections + menu, company **Urban Style**, buyer **Maya Cruz**, all three locations, markets, catalogs,
terms, DTC catalog, and the pre-booking data model). Run each command on its own. Advanced flags are
documented at the top of `setup-store.mjs`.

Clone the repo (from a folder you keep projects in, not inside another git repo):

```bash
git clone <this-repo-url>
```

Authenticate the CLI to your store (one time; edit only the store URL):

```bash
shopify store auth --store <your-store>.myshopify.com --scopes read_products,write_products,read_inventory,write_inventory,read_locations,read_publications,write_publications,read_customers,write_customers,read_markets,write_markets,read_payment_terms,read_metaobjects,write_metaobjects,read_metaobject_definitions,write_metaobject_definitions,read_online_store_navigation,write_online_store_navigation
```

Move into the setup folder:

```bash
cd <this-repo>/workshop-assets/setup
```

Seed the store (several minutes; it prints each step):

```bash
STORE=<your-store>.myshopify.com BUYER_EMAIL=you+us@example.com node setup-store.mjs
```

The seed also creates the pre-booking **data model** (the `b2b_prebooking` season metaobject and the
`custom.b2b-prebooking` product metafield), **store-owned** so it's fully visible and editable in Admin.
You author the season **values** in Part 1; the definitions are ready before the session.

**In the session, set up the app** (one-time; Tab 1 stays running afterward). Run each on its own.

Move into the app folder:

```bash
cd starter/b2b-prebooking-workshop
```

Install dependencies:

```bash
pnpm install
```

Create your app (pick your org, choose create it as a new app, name it, release the version):

```bash
shopify app deploy
```

Set the payment-customizations scope your app needs, then redeploy:

```bash
pnpm run set-scopes
```

Start the dev session (= `shopify app dev --use-localhost`); approve the install in your browser and press `g` here for GraphiQL:

```bash
pnpm run dev
```

<sub>Using npm instead of pnpm? `npm install`, `npm run set-scopes`, `npm run dev` (run `shopify app deploy` as-is).</sub>

`set-scopes` writes your app's payment-customizations scope into `shopify.app.toml` and deploys it, so
the install grants that permission and Part 3 activation works the first time. Expect a **storefront
password** prompt (Admin, Online Store, Preferences) and, on the first `--use-localhost` run, a
**mkcert** prompt: select **"Yes, use mkcert to generate it"**, then enter your Mac/admin (sudo)
password. Details: [`prompts/01`](prompts/01-scaffold-app.md).

## Repo structure

```
.
├── SESSION.md          In-session follow-along (attendees: keep this open)
├── prompts/            Same paste prompts + deeper teach notes (optional)
├── starter/            The Shopify app you extend (theme block + payment Function)
│   └── b2b-prebooking-workshop/   see its README for app layout + what ships vs. what you build
└── workshop-assets/    Prework, seeding, activation, Flow definitions, and reset
    ├── prerequisites.md
    ├── setup/                          store-setup script (setup-store.mjs)
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
past zero stock (inventory policy `continue`) since each order sizes the production run. The data model
(season metaobject + product metafield) is seeded too; the one thing you author live is the **season
values** (create the season, assign it to the pre-book products), which is Part 1.

## How the workshop runs (Plus first)

> **Follow along in [`SESSION.md`](SESSION.md)**, keep it open the whole session. It has everything you
> need to build: copy-paste prompts, Admin steps, and checkpoints, in order.
> You do not need to open Liquid, TypeScript, or TOML files to follow along.

**The session opens with a live demo of the finished flow** on a fully built store, so you see exactly
what you're building toward before you write anything. Then you build it. Build the full Plus experience
first (Parts 1 to 4), then adapt for non-Plus (Part 5). Test every step by **logging in as your B2B buyer
through the storefront** (a one-time code is emailed); the admin preview and D2C visitors won't trigger
the block or the B2B payment behavior.

**Talk track (three build beats after the data model):** theme block so the **buyer** sees pre-book
context on the PDP; payment Function so checkout has the **right terms** for pre-book; then the two
**Flows** so the **merchant** can manage these orders and payments without manual work. The Flows are
one session part with two sub-steps (still two separate Sidekick prompts).

**How to work: two terminal tabs.** Tab 1 runs `shopify app dev` the whole session (it serves the theme
block and the Function, and rebuilds on every save); when you need GraphiQL, press `g` **here** and it
opens in your browser while `dev` keeps running. Tab 2 is your AI assistant, where you paste the prompts and it writes the code. You
don't run `shopify app deploy` during the build; `dev` serves everything live, so there's no third tab
and no deploy/restart dance.

| Part | Plan | You build | Prompt | Verify |
|---|---|---|---|---|
| **1. Data model** | both | the season metaobject + product metafield already exist (seeded); create one season and assign it to the pre-book products in Admin | [`01`](prompts/01-scaffold-app.md) | The **B2B Pre-booking** metaobject + `custom.b2b-prebooking` product metafield show in Settings > Custom data; a pre-book product shows the season |
| **2. Theme block** | both | build and place the PDP block that reads the season and injects line item properties | [`02`](prompts/02-theme-app-block.md) | Pre-book PDP shows the windows; `Season` + `Delivery window` appear on cart and checkout; available-now shows nothing |
| **3. Plus payment-terms Function** | Plus | implement the Function, then activate it with one mutation in the app's GraphiQL (press `g`) | [`03`](prompts/03-plus-payment-terms-function.md) | On Combined, a mixed cart flips to due-on-fulfillment and hides deferred; a Net-30 cart is unchanged |
| **4. Flows** | both | two Sidekick workflows: tag pre-book B2B orders, then charge the vaulted card on fulfillment | [`04`](prompts/04-flow-tag-prebook-orders.md) then [`05`](prompts/05-flow-charge-on-fulfillment.md) | Order gets `Prebooking`; fulfilling charges the vaulted method once |
| **5. Adapt for non-Plus** | non-Plus | no new code: two fixed-term locations; force-vault via an App Store app | n/a | Available-now and pre-book are ordered separately with their own terms; the app hides deferred on a pre-book cart |

Key points per part:

- **Part 1.** The data model is **store-owned** (created in pre-work by the seed script): a season
  metaobject and a `custom.b2b-prebooking` product metafield, both fully visible and editable in Admin.
  The definitions are already there; only the **values** (create the season, assign it to the pre-book
  products) are yours to author, right in Admin (see
  [`data-model-seed.md`](workshop-assets/data-model-seed.md)).
- **Part 2.** Buyer-facing: the block reads the season in Liquid and injects visible line item
  properties, the all-plans way to carry pre-book context to checkout.
- **Part 3.** Checkout experience: the Plus differentiator, built before the Flows so your test orders
  already carry the right terms. The Function detects a pre-book item and, for that checkout only,
  switches Net 30 to due-on-fulfillment (`paymentTermsSet`, Plus-only) and hides the deferred option
  (match it by its real input name "Deferred", not the label). No deploy: `shopify app dev` already
  serves the Function, so you activate it with **one mutation in the app's GraphiQL** (press `g`), using
  the stable function handle, so the mutation is identical for everyone. See
  [`payment-customization-activation.md`](workshop-assets/payment-customization-activation.md).
- **Part 4.** Merchant ops, one part / two prompts: (4a) tag pre-book B2B orders so they're filterable;
  (4b) charge the vaulted card on fulfillment. One charge Flow serves both plans: non-Plus charges once
  at full fulfillment, Plus per fulfillment, driven by how each plan generates payment schedules, not by
  anything you author.
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
