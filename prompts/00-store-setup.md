# 0. Store setup: catalogs, markets, locations, data model  [non-Plus + Plus]

> **This AI-prompt path is OPTIONAL/educational.** The recommended one-shot pre-work is the setup
> **script** (`../workshop-assets/setup/setup-store.py`, see `../workshop-assets/setup/README.md`),
> which is deterministic and matches how peer DotDev workshops seed stores. This prompt lags the
> script on a few pieces (collections + menu, DTC catalog, `B2B -` naming, stray-location cleanup).
> Use it only if you want to watch the Admin GraphQL run step by step.

This provisions the B2B structure the rest of the build sits on. Run it before the extensions
and Flows. It's a **hybrid**: you're given the Available Now side and the whole pre-booking
data model (the fiddly plumbing), then you build the Pre-book side yourself to learn the
pattern.

Prerequisites: **B2B is on** (Plus sandbox stores include it; just confirm in Settings, B2B). You
do not need to create the company, buyer, or products by hand. The fastest path is the fallback
**script** in `../workshop-assets/setup/`, which creates products + company + buyer + structure +
data model in one run. If you prefer this AI-prompt path, first import
`../workshop-assets/products/products-import.csv` (Products, Import) so the products exist, then
run the sections below (they create the company/buyer/structure and publish products by tag).

Primary path is the AI prompt below (run it with the Shopify AI Toolkit, which can execute
Admin GraphQL via the CLI). If the prompt goes sideways, use the fallback script at
`../workshop-assets/setup/` (see its README).

> **Applies to every company location you create below.** For each location:
>
> - Give it a **shipping address and a billing address**, and use the **same address for every
>   location** (pick one real address and reuse it). These aren't actually separate physical
>   places; we're using company locations as the *mechanism* to separate the pre-book and
>   available-now journeys (distinct catalogs, terms, and orders under one company). Reusing one
>   address makes that point explicit to the buyer and to your audience.
> - Assign **the same B2B buyer** (Maria Cruz, the company contact you log in as) to the location
>   as a **location admin**, so one login can access and switch between all the locations.
> - Set the location's **payment terms** as called out in its section.

---

## A. Company, buyer, and the Available Now side  [provided]

Give your assistant this prompt (it creates the company and buyer, then the resources):

> On my store, create a B2B company named "Urban Style" with a main contact (buyer) named Maria
> Cruz, email [BUYER EMAIL] (use an address I can receive mail at, since B2B login codes go
> there). Then set up the "Available Now" B2B side. Create a company location named "Available
> Now". Give it this shipping and billing address (use the same address for both): [PASTE YOUR
> ADDRESS]. Assign Maria Cruz to this location as a location admin. Create an ACTIVE B2B market
> whose condition is that company location, and an ACTIVE catalog in that market with a price
> list at 50% off the default (parent adjustment, percentage decrease). Publish every product
> tagged `available-now` to that catalog's publication. Set the Available Now location's payment
> terms to the store's **Net 30** template (look it up by name; don't hardcode an id). Show me
> the company id, buyer contact id, market id, catalog id, price list id, and how many products
> were published.

**Checkpoint.** The company "Urban Style" exists with Maria Cruz as a location admin, and a B2B
buyer on the Available Now location sees only `available-now` products, priced 50% off, on Net 30
terms.

---

## B. Pre-booking data model  [moved to the app build, NOT here]

The data model is no longer created during store setup. Its definitions are **app-owned** and
declared in the app's `shopify.app.toml` (the `$app` namespace), so they're created when you run
`shopify app dev` in the session. The season entry + per-product values are then seeded in the
app's GraphiQL. See `../workshop-assets/data-model-seed.md` and Part 1 of the hands-on guide.

Why: Shopify's Custom Data guidance says to declare static metaobject/metafield definitions in
`shopify.app.toml` rather than creating them with `metaobjectDefinitionCreate`/`metafieldDefinitionCreate`
mutations. That versions the schema with the app and avoids per-store drift.

---

## C. Pre-book side  [your turn, coached]

Now build the Pre-book side yourself, mirroring section A. Same steps, swapped values:

- Company location: "Pre-book". Same shipping/billing address as Available Now, and assign the
  same B2B buyer as location admin (see the note at the top).
- Market: condition is the Pre-book location. Catalog: publish products tagged `prebook`, 50% price list.
- Payment terms: the **Due on fulfillment** template (look it up by name).

**Checkpoint.** Switching to the Pre-book location shows only `prebook` products, 50% off, on
due-on-fulfillment terms. You now have the two-location non-Plus model.

---

## D. Combined location  [Plus]

Your dev store has Plus features, so build this too. This is the single-location model a Plus
merchant would use (a non-Plus merchant uses the two-location model from A and C instead):

> Create a company location named "Combined" (same shipping/billing address as the other
> locations, and assign my B2B buyer as location admin) and an ACTIVE B2B market whose condition
> is that location. Assign BOTH existing catalogs (Available Now and Pre-book) to the Combined
> location so it sees all products in one cart. Set the Combined location's payment terms to
> Net 30 (the Plus payment Function will switch them to due-on-fulfillment when a pre-book item
> is in the cart).

**Checkpoint.** On the Combined location, a single cart can hold both available-now and
pre-book products.

---

## Teach

- Store structure (catalogs, markets, locations, metaobjects) can't be created by a theme
  block, Function, or Flow; it's Admin API / admin work. That's why it's a setup step.
- Visibility is catalog-driven: a buyer sees the products in their location's catalog. Keep
  pre-book off the Online Store channel (or give DTC its own available-now catalog) so DTC
  shoppers don't see pre-book items.
- The locations share one address on purpose. They're not distinct physical places; they're the
  lever we pull to give the buyer separate catalogs, terms, and orders for the two journeys.
  Reusing the address (and assigning the same buyer to every location) keeps that framing honest
  and lets a single login switch locations to demo each path.
