# Hands-on guide: Building B2B Pre-booking

Follow this end to end to build the pre-booking solution on your own store. The B2B store
structure (products, collections, catalogs, markets, locations) is **set up before the workshop**,
so the in-session time goes to the code: the app's data model, the theme block, the Flows, and the
Plus Function. The pre-booking **data model** is part of the app you build (declared in the app's
`shopify.app.toml`), so you create it in-session, not in pre-work. This guide gives a checkpoint
after each part so you always know it worked.

You build every part on your dev store (dev stores include Plus features). The labels tell you
which merchant plan a capability requires: **[non-Plus]** works on Advanced and up, **[Plus]**
needs Plus-tier capabilities, **[both]** works on either. Knowing the split lets you build for
and advise merchants on each plan.

Need to redo a part or reset the build back to the pre-seeded baseline mid-session? See `reset.md`.

**Before you start,** complete `prerequisites.md` and run the pre-session setup script
(`../workshop-assets/setup/setup-store.py`). That leaves you with a B2B store that has products +
collections, two wholesale locations (Available Now and Pre-book) plus a Plus Combined location,
each with its catalog, market, and terms. The season data model is **not** pre-seeded; you create
it in Part 1 as part of the app.

---

## What you're building

A wholesale apparel store that sells two kinds of products:

- **Available Now** (in stock; you may hear this called ATS, "available to sell"): ships and
  bills on your normal terms.
- **Pre-book:** ordered now for a future season, produced to order, shipped in a delivery
  window, and paid on fulfillment.

The end goal, seen first: a B2B buyer views a pre-book product and sees its ordering and
delivery windows, adds it to the cart, and at checkout the order is set to due-on-fulfillment;
when it ships, the vaulted card is charged automatically.

---

## The structure you start from (and why)

Your pre-seeded store already has the B2B structure this build sits on. You don't build it live,
but you should understand it, because it *is* the non-Plus pattern. Take two minutes in Admin to
see it before the code begins.

**What's there:**

- **Two product groups**, tagged `available-now` and `prebook` (pre-book titles carry a
  `(Pre-book)` suffix so they stand out in mixed lists and the cart). Smart collections and
  main-menu links for each group are a workshop-legibility aid, not a merchant requirement.
- **Two wholesale locations** under one company, "Available Now" and "Pre-book", plus a Plus
  "Combined" location. Every location shares the **same shipping and billing address** and the
  **same buyer as location admin**.
- **A B2B market + catalog per location:** the Available Now catalog publishes the `available-now`
  products, the Pre-book catalog the `prebook` products, both at wholesale pricing. The Combined
  (Plus) location carries both catalogs on one market for a single mixed cart.
- **Terms per location:** Available Now = Net 30, Pre-book = **due on fulfillment**, Combined =
  Net 30 (the Plus Function switches it per checkout).

The one thing **not** pre-seeded is the **season data model** (the `b2b-prebooking` metaobject +
product metafield). That's part of the app you build: it's declared in the app's `shopify.app.toml`
(`$app` namespace) and created on `shopify app dev`, then you seed a season and tag products
in-session (Part 1). It's the backbone the theme block and Function read.

**Why it's built this way (the core teach):**

- **Separate products, not one product in two states.** It avoids inventory gymnastics on a single
  record and keeps the two buyer journeys clean. Pre-book products keep selling past zero stock
  (inventory policy `continue`) because pre-book quantity is unlimited: every order sizes up the
  production run.
- **Visibility is a data-layer concern.** B2B **catalogs** decide which products each location
  sees; the buyer switches location to move between journeys. This is Advanced+ B2B (the
  "non-Plus" tier) and stays under the three active B2B catalog cap. To hide pre-book from DTC, the
  DTC market gets an available-now-only catalog (or don't publish pre-book to the Online Store
  channel).
- **The locations aren't separate places.** They share one address on purpose. They're the lever
  that gives the buyer separate catalogs, terms, and orders for the two journeys, which is what
  lets a non-Plus merchant bill available-now on normal terms and pre-book on fulfillment.
- **One metaobject reference is the backbone.** It marks a product as pre-book, carries the
  season's dates, and is read by both the theme block (display) and the Plus Function (detection).
  Dates live in one place. It's **app-owned** (the `$app` namespace), declared in the app's
  `shopify.app.toml`, so the schema ships and versions with the app rather than being hand-created
  per store.

> The pre-seeded structure comes from the setup script (`../workshop-assets/setup/setup-store.py`):
> products, collections, locations, markets, catalogs, terms, and the DTC catalog. The season data
> model is created by the app in Part 1, not the script. An optional AI-prompt path for the store
> structure is `../prompts/00-store-setup.md`.

---

## The toolkit: the building blocks you'll combine

Pre-orders don't map to one feature. They come from combining a handful of B2B payment and
fulfillment pieces. Know these before we build, because the whole exercise is picking the right
combination for each plan:

- **Vaulted cards / ACH** on the Company Location: the buyer stores a card or bank account to be
  charged later, without re-entering details.
- **Payment terms** (Net 30, due on fulfillment): when the invoice comes due. Due-on-fulfillment
  is what makes "pay when it ships" work.
- **Charge on fulfillment (Flow action):** automatically charges the vaulted method when the order
  (or a fulfillment) is fulfilled. This is the engine of the whole flow.
- **Per-fulfillment charging** [Plus]: bill each fulfillment separately, so one mixed cart can
  charge the in-stock part now and the pre-book part when it ships.
- **Payment-terms customization Function** [Plus]: switches terms at checkout when a pre-book item
  is detected (`paymentTermsSet`), enabling one smart mixed cart.
- **Markets + catalogs:** scope which products each Company Location sees, so available-now and
  pre-book are organized cleanly (pre-seeded in your store).

The Plus scenario combines all of these into one cart. The non-Plus scenario reaches the same
outcome without the two Plus-only pieces, by splitting into two locations.

---

## Build the pre-order experience (Plus first)

We build the full Plus experience first: the shared building blocks (theme block, both Flows) plus
the Plus-only payment Function that ties them into one smart mixed cart. Then we adapt it for a
non-Plus merchant, who reaches the same outcome with a slightly different arrangement.

## Part 1: App data model + theme block  [both]

**Step.** Follow `../prompts/01-scaffold-app.md` to install and run `shopify app dev` on the
provided starter app. Before seeding anything, **open `shopify.app.toml` and read the two data-model
blocks** (the `b2b-prebooking` metaobject and the product metafield that references it): this is your
season schema, declared as app design. Because they're declared there, `shopify app dev` creates
those definitions for you (no mutations); confirm they appear in Admin under **Settings, Custom
data** (metaobject under **Metaobjects**, metafield under **Metafields, Products**), shown
**app-managed** (the schema is read-only), which is expected since the app owns the schema. Then seed
one season and tag your pre-book products **in the Shopify admin** (Settings, Custom data), following
`../workshop-assets/data-model-seed.md`: that's the values, which you author (`access.admin =
"merchant_read_write"` on the definitions is what makes the values editable in Admin). Finally follow
`../prompts/02-theme-app-block.md` to build and place the block; add it to the product template in the
theme editor (preview a pre-book product so it renders).

**Teach.** The data model is **app-owned**: declaring the metaobject + metafield in `shopify.app.toml`
versions the schema with your app and avoids per-store mutation drift, and the `$app` namespace keeps
it scoped to your app. The **schema** is read-only (it changes only in the toml); only the **values**
(the season entry + the per-product assignment) are yours, and `merchant_read_write` lets you author
them right in Admin (GraphiQL is the optional code path). The block then reads the season server-side in Liquid
and injects visible line item properties (`Season`, `Delivery window`) into the add-to-cart form.
Visible line item properties are the all-plans way to carry pre-book context to checkout, where
non-Plus has no other hook.

> To test this and every step from here on, **log in as your B2B buyer through the storefront
> customer login** (a one-time code is emailed). The admin preview and D2C visitors won't
> trigger the block or the B2B payment behavior.

**Checkpoint.** A B2B buyer on a pre-book product sees the windows; adding it from the product
page shows `Season` and `Delivery window` on the cart line and at checkout. Available-now
products show nothing.

---

## Part 2: Flow: tag pre-book orders  [both]

**Step.** Build Flow 1 from `../prompts/03-flow-tag-prebook-orders.md` (Sidekick prompt).

**Teach.** Iterate the prompt and read what Sidekick generates; the B2B guard is what keeps DTC
orders from being tagged. The `Prebooking` order tag is both a merchant filter and the signal
Flow 2 keys on.

**Checkpoint.** A new B2B order with a `prebook` product gets the `Prebooking` tag; a DTC order
with the same product does not.

---

## Part 3: Flow: charge the vaulted card on fulfillment  [both]

**Step.** Build Flow 2 from `../prompts/04-flow-charge-on-fulfillment.md` (Sidekick prompt).

**Teach.** One Flow serves both plans: non-Plus charges once at full fulfillment, Plus charges
per fulfillment, driven by how each plan generates payment schedules, not by anything you
author. The `completedAt does not exist` condition is your double-charge guard.

**Checkpoint.** Fulfilling a pre-book order charges the vaulted method for the due amount, once.

---

## Part 4: Plus payment-terms Function  [Plus]

**Step.** Follow `../prompts/05-plus-payment-terms-function.md` to build and deploy the Function,
then activate it via `payment-customization-activation.md`.

**Teach.** This is the Plus payoff. On Plus you get one combined location and a mixed cart. The
Function detects a pre-book item and, for that checkout only, switches Net 30 to due-on-fulfillment
(`paymentTermsSet`, Plus-only) and hides the deferred option, so the buyer gets the smart,
single-cart experience. Match the deferred method by its real input name ("Deferred"), not the
display label.

**Checkpoint.** On the combined location, a mixed cart flips to due-on-fulfillment and hides the
deferred option; an available-now-only cart stays on Net 30. Flow 2 then charges per fulfillment.

---

## Part 5: Adapt for a non-Plus merchant  [non-Plus]

Most B2B merchants aren't on Plus. They lose the two Plus-only pieces, per-fulfillment charging and
the payment-terms Function, and reach the same pre-order outcome by pre-separating the two journeys,
which your seeded store already has:

- **Two locations with fixed terms instead of one smart cart.** Because you can't switch terms at
  checkout (`paymentTermsSet` is Plus-only) and can't charge per fulfillment, the buyer orders
  available-now and pre-book from **separate locations**: Available Now on Net 30, Pre-book on
  due-on-fulfillment. Each order carries a single term, so the same Flow charges the vaulted card
  correctly, once, at full fulfillment.
- **Everything else is the same build.** The theme block (Part 1) and both Flows (Parts 2 to 3)
  work unchanged; there is no new code for non-Plus.

**Force a vaulted card.** For automatic charging to work, the buyer must have a card vaulted, so you
hide the deferred "choose payment method at a later time" option. On non-Plus this hide is a
payment-customization Function, and **custom apps that contain Functions require Plus**, so on
Advanced it must come from an **App Store (public) app** (an existing checkout-rules app, or one you
publish). This is the one piece an Advanced merchant reaches for an app to do.

**Checkpoint.** On the two-location store, available-now and pre-book are ordered separately with
their own terms; with the App Store app configured, a pre-book cart hides the deferred option and
requires a card or bank account.

---

## Recap

Starting from the pre-seeded B2B structure (separated products and catalogs, two locations, and the
season data model), you built the pre-order experience: a PDP block that carries season context to
checkout, two Flows that tag and charge the vaulted card on fulfillment, and the Plus payment
Function that ties them into one smart mixed cart. Then you saw how to adapt for a non-Plus
merchant, who reaches the same outcome by splitting into two locations with fixed terms. Along the
way you saw exactly which pieces each plan gets, so you can build for and advise either.

## Where to go next (extension ideas)

- Attach line item properties on **every** add path (quick-add, bulk order), not just the PDP,
  via a site-wide app embed that maps pre-book variants to their season and intercepts
  `/cart/add`.
- On Plus, add a **checkout UI extension** for a more polished pre-book line display.
- Support **multiple seasons** and a buyer-selected delivery date.
