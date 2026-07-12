# Building B2B Pre-booking on Shopify

A hands-on workshop for partners and developers: build B2B pre-order / pre-booking
solutions with today's Shopify capabilities, before selling plans are available for B2B.

This repo is a **foundation to build from**, not a turnkey product. It gives you the
patterns, prompts, and a starter app; you extend them for your merchant.

**This README is the workshop.** Read it top to bottom: it frames the problem, lists the
prerequisites, gets you ready, and then walks the build part by part. Each build step has a matching
prompt in [`prompts/`](prompts).

> ## ⚠️ Required prework, do it BEFORE the session
>
> This workshop has heavier setup than most, and **it cannot be done live in the room.** Several steps
> take time or have verification/approval delays (creating a **US Plus sandbox** with B2B, setting up
> **Shopify Payments** in test mode, installing **Shopify Flow**, and running the **store seed script**).
> If your store isn't set up beforehand, you will not be able to follow along.
>
> **Do every step in [`workshop-assets/prerequisites.md`](workshop-assets/prerequisites.md) before you
> arrive.** In the room we only clone, `pnpm install`, and build. See [Get ready](#get-ready) for the order.

## The problem

B2B on Shopify doesn't support selling plans yet, so there's no native pre-order path.
Apparel merchants in particular take pre-book orders two seasons ahead (order now, produce
and ship later, pay on fulfillment) and today often run that on another platform. This
workshop shows how to build it on Shopify now.

Pre-booking, in one line: a delayed-fulfillment order that carries a season signal and is
paid on fulfillment.

## What you'll build

By the end, running against your own dev store: a B2B buyer views a pre-book product and sees its
ordering and delivery windows, adds it to the cart, and at checkout the order is set to
due-on-fulfillment; when it ships, the vaulted card is charged automatically. You build the full
**Plus** experience first, then adapt it for a **non-Plus** merchant.

## Two use cases

| | Non-Plus | Plus |
|---|---|---|
| Product modeling | Separate available-now and pre-book products | Available-now + pre-book in one mixed cart |
| Visibility | Separate catalog + location/market per type | Single location with both catalogs |
| Payment terms | Static "due on fulfillment" on the pre-book location | Function switches Net 30 to due-on-fulfillment when a pre-book item is in the cart |
| Force a vaulted card | App Store (public) app hides "pay later" | Custom payment-customization Function hides "pay later" |
| Charge on fulfillment | One Flow, charges at full fulfillment | Same Flow, charges per fulfillment |
| Season on cart/checkout | Line item properties (all plans) | Line item properties (same mechanism) |

You build **both** on your dev store, which includes Plus features, so you can complete every
part. The **non-Plus vs. Plus labels tell you which merchant plan a capability requires**, so
you can build for a merchant below Plus or on Plus and clearly explain the differences.

## Plus vs. non-Plus: what actually changes the build

You build everything on your Plus-enabled dev store. Only three plan differences change how a *merchant*
would ship this, and those are the ones worth knowing:

- **Dynamic payment terms at checkout** (`paymentTermsSet` Function) is **Plus-only**. It's what lets the
  Plus build flip a mixed cart to due-on-fulfillment automatically. Non-Plus can't, so it pre-separates
  available-now and pre-book into two locations with fixed terms.
- **Charging per fulfillment** is **Plus-only**. Plus charges each shipment of one order separately;
  non-Plus charges once at full fulfillment.
- **Custom apps that contain Functions require Plus.** So the force-vault (hiding "pay later") is a custom
  Function on Plus, but on non-Plus it must come from an **App Store (public) app**.

Beyond those three, the build is the same on either tier. (For simplicity the workshop links **both** the
Available Now and Pre-book collections in the navigation for **every** location; making the navigation
contextual to each company location's catalog is a nice refinement, but out of scope here.)

## Prerequisites

**Required and mostly not doable live** (store creation, Payments verification, and the store seed all
take time). Complete the **full checklist in
[`workshop-assets/prerequisites.md`](workshop-assets/prerequisites.md) before the session**, it has the
tricky Shopify Payments setup and the exact steps. The short version:

- A **US Shopify Plus sandbox** development store with **B2B on** (so you get every feature the workshop
  uses, including the Plus-only pieces).
- **Shopify Payments in test mode**, with payment capture set to **manual or on-fulfillment** (not at
  checkout).
- **Shopify Flow** and the **Shopify GraphiQL App** installed (GraphiQL with
  `read_payment_customizations` + `write_payment_customizations`).
- **Node.js 20+**, **pnpm** (or npm), **Python 3**, and **Shopify CLI 4+**.
- An **AI assistant** with the **Shopify Dev MCP** and **Shopify AI Toolkit** (the repo ships the MCP
  config, so most assistants auto-load it).
- The store structure (company, buyer, locations, catalogs, markets, terms, products) is created for
  you by the setup script in **Get ready** below; you do not build it by hand.

## Get ready

**Before the session (seed your store).** Clone the repo, authenticate the CLI to your store with the
required scopes, then run the setup script. It provisions the whole B2B structure (products with
images, collections + menu, company **Urban Style**, buyer **Maria Cruz**, all three locations,
markets, catalogs, terms, DTC catalog) so in-session time goes to code. Full scopes string and options
are in [`workshop-assets/setup/README.md`](workshop-assets/setup/README.md).

```bash
# from a folder you keep projects in (not inside another git repo)
git clone <this-repo-url>
cd <this-repo>
cd workshop-assets/setup
shopify store auth --store <your-store>.myshopify.com --scopes <see setup/README.md>
STORE=<your-store>.myshopify.com BUYER_EMAIL=you+us@example.com python3 setup-store.py
```

The pre-booking **data model** is *not* seeded here. It's app-owned (declared in the app's
`shopify.app.toml`) and created when you run `shopify app dev` in Part 1.

**In the session (start the app).** Install dependencies and start dev from the starter app:

```bash
cd starter/b2b-prebooking-workshop
pnpm install
shopify app dev
```

The first `shopify app dev` **links the app in your Partner org** and creates the app-owned data
model. **Do not run `--reset`**: it generates a fresh minimal config and drops the declarative data
model. Expect a **storefront password** prompt (Admin, Online Store, Preferences) and a **sudo/login
password** for the local `mkcert` certificate.

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

`main` is the starter you build from; the `finished` branch has the completed solution for reference.

## The building blocks

Pre-orders don't map to one feature. They come from combining a handful of B2B payment and
fulfillment pieces; the whole exercise is picking the right combination for each plan:

- **Vaulted cards / ACH** on the Company Location: a stored payment method charged later.
- **Payment terms** (Net 30, due on fulfillment): when the invoice comes due. Due-on-fulfillment is
  what makes "pay when it ships" work.
- **Charge on fulfillment (Flow action):** automatically charges the vaulted method when the order (or
  a fulfillment) is fulfilled. The engine of the whole flow.
- **Per-fulfillment charging** [Plus]: bill each fulfillment separately, so one mixed cart charges the
  in-stock part now and the pre-book part when it ships.
- **Payment-terms customization Function** [Plus]: switches terms at checkout when a pre-book item is
  detected (`paymentTermsSet`), enabling one smart mixed cart.
- **Markets + catalogs:** scope which products each Company Location sees (pre-seeded in your store).

The Plus scenario combines all of these into one cart. The non-Plus scenario reaches the same outcome
without the two Plus-only pieces, by splitting into two locations.

## The structure you start from (and why)

Your seeded store already has the B2B structure the build sits on. You don't build it live, but take
two minutes in Admin to see it, because it *is* the non-Plus pattern:

- **Two product groups**, tagged `available-now` and `prebook` (pre-book titles carry a `(Pre-book)`
  suffix). Smart collections and main-menu links per group are a legibility aid, not a requirement.
- **Two wholesale locations** under one company ("Available Now", "Pre-book") plus a Plus "Combined"
  location. Every location shares the **same shipping/billing address** and the **same buyer as admin**;
  they are not separate places, they're the lever that gives the buyer separate catalogs, terms, and
  orders per journey.
- **A B2B market + catalog per location**, both at wholesale pricing; the Combined (Plus) location
  carries both catalogs on one market for a single mixed cart.
- **Terms per location:** Available Now = Net 30, Pre-book = **due on fulfillment**, Combined = Net 30
  (the Plus Function switches it per checkout).

Why separate products, not one product in two states? It avoids inventory gymnastics and keeps the two
buyer journeys clean; pre-book products keep selling past zero stock (inventory policy `continue`)
because every order sizes up the production run. Visibility is a **data-layer** concern: catalogs decide
what each location sees. The one thing **not** pre-seeded is the **season data model**, which you build
in Part 1.

## How the workshop runs (Plus first)

Build the full Plus experience first (Parts 1 to 4), then adapt for non-Plus (Part 5). Test every step
by **logging in as your B2B buyer through the storefront** (a one-time code is emailed); the admin
preview and D2C visitors won't trigger the block or the B2B payment behavior.

### Part 1: App data model + theme block  [both]

- **Build.** Follow [`prompts/01-scaffold-app.md`](prompts/01-scaffold-app.md) to run `shopify app dev`
  on the starter. **Read the two data-model blocks in `shopify.app.toml`** (the `b2b-prebooking`
  metaobject + product metafield); `shopify app dev` creates those definitions for you, confirm them in
  **Settings, Custom data** (shown app-managed / schema read-only). Then seed one season and tag your
  pre-book products **in Admin** per [`workshop-assets/data-model-seed.md`](workshop-assets/data-model-seed.md).
  Finally build and place the block from [`prompts/02-theme-app-block.md`](prompts/02-theme-app-block.md).
- **Teach.** The data model is **app-owned**: declaring it in `shopify.app.toml` versions the schema
  with the app and avoids per-store drift; the `$app` namespace scopes it to your app. The schema is
  read-only; only the **values** (the season + per-product assignment) are yours, and
  `merchant_read_write` lets you author them in Admin. The block reads the season server-side in Liquid
  and injects visible line item properties (`Season`, `Delivery window`), the all-plans way to carry
  pre-book context to checkout.
- **Checkpoint.** A B2B buyer on a pre-book product sees the windows; adding it shows `Season` and
  `Delivery window` on the cart line and at checkout. Available-now products show nothing.

### Part 2: Flow, tag pre-book orders  [both]

- **Build.** Build Flow 1 from [`prompts/03-flow-tag-prebook-orders.md`](prompts/03-flow-tag-prebook-orders.md)
  (Sidekick prompt).
- **Teach.** The B2B guard keeps DTC orders from being tagged. The `Prebooking` order tag is both a
  merchant filter and the signal Flow 2 keys on.
- **Checkpoint.** A new B2B order with a `prebook` product gets the `Prebooking` tag; a DTC order with
  the same product does not.

### Part 3: Flow, charge the vaulted card on fulfillment  [both]

- **Build.** Build Flow 2 from [`prompts/04-flow-charge-on-fulfillment.md`](prompts/04-flow-charge-on-fulfillment.md)
  (Sidekick prompt).
- **Teach.** One Flow serves both plans: non-Plus charges once at full fulfillment, Plus charges per
  fulfillment, driven by how each plan generates payment schedules, not by anything you author. The
  `completedAt does not exist` condition is your double-charge guard.
- **Checkpoint.** Fulfilling a pre-book order charges the vaulted method for the due amount, once.

### Part 4: Plus payment-terms Function  [Plus]

- **Build.** Follow [`prompts/05-plus-payment-terms-function.md`](prompts/05-plus-payment-terms-function.md)
  to build and deploy the Function, then activate it via
  [`workshop-assets/payment-customization-activation.md`](workshop-assets/payment-customization-activation.md).
  **Restart `shopify app dev` after the first deploy** (deploying while dev runs staled the theme
  block's dev asset URL).
- **Teach.** The Plus payoff. On the combined location with a mixed cart, the Function detects a
  pre-book item and, for that checkout only, switches Net 30 to due-on-fulfillment (`paymentTermsSet`,
  Plus-only) and hides the deferred option. Match the deferred method by its real input name
  ("Deferred"), not the display label.
- **Checkpoint.** On the combined location, a mixed cart flips to due-on-fulfillment and hides the
  deferred option; an available-now-only cart stays on Net 30. Flow 2 then charges per fulfillment.

### Part 5: Adapt for a non-Plus merchant  [non-Plus]

Most B2B merchants aren't on Plus. They lose the two Plus-only pieces (per-fulfillment charging and the
payment-terms Function) and reach the same outcome by pre-separating the journeys, which your seeded
store already has:

- **Two locations with fixed terms instead of one smart cart.** The buyer orders available-now and
  pre-book from **separate locations** (Available Now on Net 30, Pre-book on due-on-fulfillment). Each
  order carries a single term, so the same Flow charges correctly, once, at full fulfillment.
- **Everything else is the same build.** The theme block (Part 1) and both Flows (Parts 2 to 3) work
  unchanged; there is no new code for non-Plus.
- **Force a vaulted card** by hiding the deferred option. On non-Plus this hide is a
  payment-customization Function, and **custom apps that contain Functions require Plus**, so on non-Plus
  it must come from an **App Store (public) app**. This is the one piece a non-Plus merchant reaches for
  an app to do.

- **Checkpoint.** On the two-location store, available-now and pre-book are ordered separately with
  their own terms; with the App Store app configured, a pre-book cart hides the deferred option and
  requires a card.

## Recap

Starting from the pre-seeded B2B structure, you built the pre-order experience: a PDP block that carries
season context to checkout, two Flows that tag and charge the vaulted card on fulfillment, and the Plus
payment Function that ties them into one smart mixed cart. Then you saw how to adapt for a non-Plus
merchant, who reaches the same outcome by splitting into two locations with fixed terms.

## Reset and redo

Need to redo a part or wipe the in-session build back to the pre-seeded baseline? See
[`workshop-assets/reset.md`](workshop-assets/reset.md).

## Where to go next (extension ideas)

- Attach line item properties on **every** add path (quick-add, bulk order), not just the PDP, via a
  site-wide app embed that maps pre-book variants to their season and intercepts `/cart/add`.
- On Plus, add a **checkout UI extension** for a more polished pre-book line display.
- Support **multiple seasons** and a buyer-selected delivery date.

## Reference docs

- Payment Customization Function API: https://shopify.dev/docs/api/functions/latest/payment-customization
- Shopify Functions (plan availability): https://shopify.dev/docs/api/functions/latest
- Theme app extensions: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions
- B2B: https://shopify.dev/docs/apps/build/b2b
- Shopify Flow: https://help.shopify.com/manual/shopify-flow

---

<sup>Terminology: in prose we write **pre-book** / **pre-booking** (hyphenated); the literal identifiers
are one word (product tag `prebook`, order tag `Prebooking`, data model `b2b-prebooking`). The
unhyphenated form is always a tag or identifier.</sup>
