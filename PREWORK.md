# Prework

**All required, and most can't be done in the session.** This workshop has heavier setup than most (a
US Plus sandbox with B2B, Shopify Payments in test mode, Shopify Flow, and a store seed script), and
some steps have approval delays, Payments especially. Finish everything below **before you arrive**; in
the room we only clone, install, and build. Give yourself a few days of lead time for Payments.

> **Format: this is an AI-assisted ("vibe coding") build, not a hands-on coding session.** You'll prompt
> an AI assistant to write the code, not hand-write or debug it, so no prior coding experience is needed.
> That's why an AI coding assistant (see below) is a required tool.

## 1. Accounts and tools

- **Shopify Partner account + a US Plus sandbox dev store** (Partner/Dev dashboard, Add store). When you
  create it, set these options exactly:
  - **Store type: Development store** (not a production store).
  - **Build/plan: Plus** (the Plus sandbox build), this is what unlocks the Plus-only features the
    workshop uses.
  - **Uncheck "Generate/start with test data"** (you seed real workshop data with the script; sample
    products would collide with it).
  - **Uncheck "Test a feature/developer preview"** (leave it on the current stable version).
  - **Country: United States.** The create dialog is minimal and has **no** country field, so set it
    right after creating the store: **Settings, General, Store details**, set country/region to
    **United States** and currency to **USD**, and add a US **Address**. Keeps it consistent with the
    materials: USD pricing, US address, and the US SSN for Payments.
  - **B2B is on automatically**, just verify in **Settings, B2B**. You don't set up the company, buyer,
    locations, or products by hand, the seed script does that.
- **Node.js 20+** and **pnpm** (recommended) or **npm**. Node also runs the seed script. These docs
  show `pnpm` commands; if you use npm, swap `pnpm` for `npm` (e.g. `npm install`, `npm run set-scopes`); the `shopify` CLI commands are the same either way.
- **Shopify CLI 4+** (`shopify version`; upgrade with `pnpm add -g @shopify/cli@latest`).
- **Shopify Flow** installed (free, [App Store listing](https://apps.shopify.com/flow)). You build the
  two workflows in-session.
- **An AI coding assistant** (Claude Code, Codex, Cursor, VS Code, Antigravity CLI, or Hermes) with
  **both** of these:
  - **Shopify Dev MCP**, docs + API schema while you build. The repo ships the config, so most
    assistants auto-load it (approve if prompted). Add it manually only if your tool doesn't read a
    project MCP file.
  - **Shopify AI Toolkit** plugin, Shopify skills + CLI store-execute (the seed step uses it). Cursor:
    `/add-plugin shopify`. Claude Code: `claude plugin install shopify-ai-toolkit@claude-plugins-official`.
  - Install links: [AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit),
    [Dev MCP](https://shopify.dev/docs/apps/build/devmcp).

## 2. Shopify Payments (test mode)

Settings, Payments, **Activate Shopify Payments** (deactivate any test gateway first), then Manage,
Test mode, **Enable test mode**. Use **Shopify Payments, not the Bogus Gateway**, B2B vaulted cards are
Shopify-Payments-only and the pre-order flow vaults a card to charge later. Test card:
`4242 4242 4242 4242`.

Onboarding asks for account details first. These values pass on a US sandbox (use your own name/email
if you like, just not anyone else's real details; business type **Individual**):

| Field | Value |
| --- | --- |
| Name | any, e.g. `John Anderson` |
| Date of birth | any adult date, e.g. `10 / 01 / 1990` |
| Email | any inbox you control |
| Phone | `(415) 555-1234` |
| Address | `123 Brooklyn Ave`, `Brooklyn`, `New York` `11213`, US |
| SSN | `078-05-1120` (`000-00-0000` and the `987-65-...` range are rejected) |
| Store description | `this is a test store` |

After submitting you'll see "some details couldn't be verified" and a "select a plan" banner. **Ignore
both**, they only affect real payouts; test mode still works (cards charge, B2B cards vault). That
verify notice is a **~30-day window**, so do Payments **close to the workshop date**, not weeks early.

**Payment capture:** set it so payment is **not** taken at checkout (Settings, Payments, Payment
capture). Either "when fully fulfilled" or "manually" works, just not "automatically at checkout" (that
charges up front and defeats pay-on-fulfillment).

## 3. Clone the repo (before the session)

The seed step runs from it, so clone early (it's ~23 MB, mostly product images):

```bash
git clone https://github.com/Shopify/dotdev-workshop-b2b.git
```

`pnpm install` is an **in-session** step, not now (`cd starter/b2b-prebooking-workshop && pnpm install`,
under a minute on venue wifi). Clone and install are safe to do live; the store setup below is not.

## 4. Authenticate the Shopify CLI (before the session)

The seed script talks to your store through the CLI, so authenticate once with the scopes it needs.
Copy this as-is and change only the store URL:

```bash
shopify store auth --store <store>.myshopify.com --scopes read_products,write_products,read_inventory,write_inventory,read_locations,read_publications,write_publications,read_customers,write_customers,read_markets,write_markets,read_payment_terms,read_metaobjects,write_metaobjects,read_metaobject_definitions,write_metaobject_definitions,read_online_store_navigation,write_online_store_navigation
```

It opens a browser to approve the scopes and is one time per store. (These are the scopes the seed
script needs. Activating the Plus payment Function in-session uses your app's own GraphiQL, not this
CLI auth, so it isn't in this list.)

## 5. Seed the store (before the session)

Move into the setup folder:

```bash
cd workshop-assets/setup
```

Then run the seed script with your store and a buyer email:

```bash
STORE=<store>.myshopify.com BUYER_EMAIL=you+us@example.com node setup-store.mjs
```

**This takes several minutes** (roughly 5-10 on the first run: it makes many API calls and uploads the
product images). It prints each step as it goes, so let it finish, don't cancel it if it looks quiet for
a bit.

`BUYER_EMAIL` is the B2B buyer (Maya Cruz) you sign in as. Login is a one-time emailed code, so use an
inbox you control; the `+` alias trick (`you+us@example.com`) lets one inbox run several buyers.

The script creates the products, collections + navigation, the company and buyer, all three locations
(each sharing one address and the same buyer as admin), markets, catalogs, payment terms (pre-book
due-on-fulfillment, Available Now Net 30), and the pre-booking **data model** (the season metaobject +
the `custom.b2b-prebooking` product metafield, store-owned so they're fully editable in Admin). Products
come from `workshop-assets/products/products-import.csv` and carry the tags that drive collections, catalogs, and Flow
(`available-now`, `prebook`). You **don't** vault a card in advance, that's part of the build. Advanced
flags (skip products, non-Plus only, custom company/address) are documented at the top of
`setup-store.mjs`.

The data model **definitions** are seeded here; you author the season **values** (create the season,
assign it to the pre-book products) in Part 1 of the session.

## Prework checklist (validate before you arrive)

You're ready only when **every** box is true. Verify each, don't assume:

- [ ] **US Plus sandbox store exists** (Development store, Plus build, no test data, no feature
      preview), **Settings, General** shows **United States / USD**, and **Settings, B2B** shows B2B
      enabled.
- [ ] **Node 20+** (`node --version`), **pnpm** or **npm** (`pnpm --version`), and **Shopify CLI 4+**
      (`shopify version`).
- [ ] **Shopify Flow installed** (Admin, Apps lists "Shopify Flow").
- [ ] **AI assistant ready** with the Shopify **Dev MCP** and **AI Toolkit** (your assistant can run
      `shopify store execute`).
- [ ] **Shopify Payments in test mode** (Settings, Payments shows Shopify Payments active with test mode
      on), and **payment capture is NOT "automatically at checkout"** (set to "when fully fulfilled" or
      "manually").
- [ ] **Repo cloned** to a local folder.
- [ ] **CLI authed to your store**: the shop query below returns your shop name.
- [ ] **Store seeded** (the one thing that can't be fixed live). In Admin you can see:
  - the workshop products (5 available-now + 5 pre-book; pre-book titles end in `(Pre-book)`),
  - the **Available Now** and **Pre-book** collections,
  - the company **Urban Style** with **three** locations (Available Now, Pre-book, Combined),
  - the **B2B Pre-booking** metaobject + product metafield in **Settings, Custom data**,
  - and you can sign into the **storefront** as the buyer (**Maya Cruz**) using the emailed code.

Verify CLI auth:

```bash
shopify store execute --store <store>.myshopify.com --query 'query { shop { name id } }'
```

Everything except **Payments** and the **store seed** is quick to fix in the room, so double-check those
two hardest. If the seed box isn't fully true, re-run steps 4 and 5 (a couple of minutes; a TA can help
at the door).

## Plan note

B2B is now on **all plans** (Basic and up), not just Plus. You build on a Plus sandbox so you get every
feature; the only Plus-only pieces are dynamic payment terms at checkout (`paymentTermsSet`) and
per-fulfillment charging (a non-Plus merchant force-vaults with an App Store app instead). B2B also
needs new customer accounts and Shopify Markets.
