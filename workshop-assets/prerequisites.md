# Prerequisites

**Everything here is required, and most of it cannot be done during the session.** This workshop has
heavier setup than most: a US Plus sandbox with B2B, Shopify Payments in test mode, Shopify Flow, and a
store seed script, and some steps have verification or approval delays (Payments especially). **Finish
all of it before you arrive.** If your store isn't set up ahead of time, you won't be able to follow
along; in the room we only clone, install, and build. Give yourself a few days of lead time for Payments.

## Accounts and tools

- A **Shopify Partner account** and a **development store** created as a **Shopify Plus sandbox**
  build (Partner dashboard, Add store, Create development store, choose the Plus sandbox build),
  or a Partner sandbox org. This gives you B2B **and** the Plus-tier features the workshop uses
  (the payment-customization Function's `paymentTermsSet`). A standard/basic development store
  can use B2B but does not expose Plus-tier features, so you couldn't build the Plus parts.
  - **Create it as a United States store.** You pick the store's country when you create it,
    regardless of where you're based, so anyone can do this. US keeps everything in the materials
    consistent: USD pricing (the setup script's price lists are USD), Net 30 / due-on-fulfillment
    terms, the US business address, and the US SSN used in Shopify Payments onboarding. A non-US
    store would change the currency and the Payments identity fields and won't match the scripts.
- **B2B on** (Plus sandbox stores include it; just confirm in **Settings, B2B**, and enable it if
  it isn't). You do **not** need to create the company, buyer, locations, or products by hand: the
  setup step (`../prompts/00-store-setup.md` or the fallback script) creates the products, the
  company **Urban Style**, the buyer **Maria Cruz**, and all three locations for you.
- **Set up Shopify Payments in test mode.** In Settings, Payments, **Activate Shopify Payments** (if
  another provider like a test gateway is already active, deactivate it first), then Manage, Test mode,
  **Enable test mode**. Use test cards like `4242 4242 4242 4242`. Without a card gateway, checkout shows
  no card option and the buyer can't vault a card. Use Shopify Payments, **not the "Bogus Gateway"**: B2B
  vaulted cards are Shopify-Payments-only ([Help Center](https://help.shopify.com/en/manual/b2b/vaulted-cards)),
  and the pre-order flow needs the card vaulted and charged later on fulfillment. A Plus sandbox supports
  this. Not scriptable (no Admin API to enable a payment provider), so it's a manual step.
  - **Onboarding on a sandbox:** you click through Shopify Payments account setup first. **Use your own
    name or a made-up one** (not anyone else's), business type Individual, a real-looking **US** address,
    and an adult date of birth. For the SSN, `000-00-0000` and the ad-reserved `987-65-...` range are
    rejected as invalid format; the classic voided **`078-05-1120`** passes. After submitting you'll see
    **"Some of your details couldn't be verified"** / "update your business details by [date]" and a
    Payments banner saying it "isn't processing transactions, select a plan." **All of that is expected
    and ignorable on a dev sandbox**, it only affects real payouts/live selling. **Test mode still works**:
    test cards charge and B2B cards vault. Confirm by seeing the save-payment-method option at checkout.
  - **Heads up on the grace period:** the "update your business details by [date]" notice is roughly a
    **30-day** window, after which test payments on the sandbox can get restricted. So do this Payments
    setup **close to the workshop date**, not weeks early, or it may lapse before the session.
  - **Optional, ACH Direct Debit** (bank-account vaulting, the flows charge card *or* bank): to offer it,
    turn **off Managed payment methods** and enable **ACH Direct Debit**. Card alone is enough for the
    demo, so this is optional.
- **Set payment capture so it is NOT taken at checkout** (Settings, Payments, Payment capture). The
  default, *automatically at checkout*, takes payment immediately and defeats the pay-on-fulfillment
  model. **Either of the other two options works for this build: "Automatically capture payment for
  orders when they're fully fulfilled" or "Manually capture payments for orders."** Both leave the B2B
  payment authorized/vaulted so the charge-on-fulfillment Flow collects it when the order ships; the
  charge-vaulted-payment Flow action behaves the same regardless of which of the two you pick.
- **An email you can receive mail at, for the buyer.** B2B uses **new customer accounts**, so you
  sign in as Maria Cruz from the store's customer login with a one-time code emailed to that
  address. Pass it as `BUYER_EMAIL` when you run setup. You need this to place test orders as a
  logged-in B2B buyer; the pre-book PDP block and the checkout payment behavior only apply to
  logged-in B2B buyers, not to the admin or to D2C visitors.
  - **Tip: use the `+` email alias trick** to run several buyer accounts from one inbox. For
    example `brandon.anderson+urbanstyle@shopify.com` and `+us2@...` are distinct Shopify
    customers, but every login code still lands in `brandon.anderson@shopify.com`. Handy for
    testing different buyers/locations without extra inboxes.
- **Node.js 20+** and a package manager: **pnpm or npm** (the commands in these docs use pnpm;
  substitute `npm` if you prefer). Node also runs the pre-seed **setup script** (`setup-store.mjs`).
- **Shopify CLI 4+** installed and authenticated (`shopify version`). On an older major, upgrade
  with `pnpm add -g @shopify/cli@latest` (or `npm install -g @shopify/cli@latest`).
- A supported **AI coding assistant**: Claude Code, Codex, Cursor, VS Code, Antigravity CLI,
  or Hermes.
- **Install BOTH of the following** in your assistant (they cover different needs and don't
  conflict; the plugin does not auto-register the Dev MCP):
  - The **Shopify Dev MCP** server, docs, API schema, and GraphQL validation while you build the
    extensions. **The repo already ships this config** (`.mcp.json`, `.cursor/mcp.json`, and
    `.vscode/mcp.json`, at both the repo root and in `starter/b2b-prebooking-workshop`), so most
    assistants auto-load `@shopify/dev-mcp@latest` when you open the folder, just approve it if
    prompted. Only add it manually if your tool doesn't read a project MCP file. Claude Code:
    `claude mcp add --transport stdio shopify-dev-mcp -- npx -y @shopify/dev-mcp@latest`.
  - The **Shopify AI Toolkit** plugin, adds Shopify skills and **CLI store-execute**, which the
    store-setup prompt (`00-store-setup.md`) uses to provision your store. Cursor: `/add-plugin shopify`.
    Claude Code: `claude plugin install shopify-ai-toolkit@claude-plugins-official`.
  - All install paths per tool: https://shopify.dev/docs/apps/build/ai-toolkit
    and https://shopify.dev/docs/apps/build/devmcp.
- **Shopify Flow** installed (free, from the App Store: `apps.shopify.com/flow`). The two workflows
  (tag pre-book orders; charge the vaulted card on fulfillment) are built in Flow, so it must be
  installed. App installs aren't scriptable, so this is a manual step.
- **Sidekick** is built into the Shopify admin (no setup needed); you'll use it in-session to
  build the two Flows.
- **The Plus payment Function is activated in-session** with the Shopify CLI (or by asking your AI
  assistant), using the `read_payment_customizations` and `write_payment_customizations` scopes that
  are already in the `shopify store auth` step below.

## Get the project (clone)

Clone the workshop repo **before the session** (it's small, ~23 MB, mostly the product images the
setup step imports). You need it early because the pre-seed setup step below runs from it, and you'll
build in it during the session.

```bash
# from a folder you keep projects in (not inside another git repo)
git clone https://github.com/brandon-s-anderson/dotdev-b2b-coldtest.git
```

**You install the app's dependencies in the session, not now** (same as the other DotDev workshops).
The first thing you do in the build is `cd starter/b2b-prebooking-workshop && pnpm install` (~100 MB,
well under a minute on the venue wifi), then `shopify app dev`. What you can't catch up on in the
room is the **store setup** (the pre-seed script plus Shopify Payments and Flow), so make sure that
is done well before the session; the clone and install are quick and safe to do live.

## Store data

- **Apparel products.** The setup step **creates these for you** from
  `products/products-import.csv` (10 products, pre-split into **Available Now** and **Pre-book**,
  published to the Online Store, available-now stocked and pre-book at 0 with continue policy).
  Fallback if you skip the script: import the CSV by hand (Shopify admin, Products, Import) and
  keep **"Publish new products to all sales channels"** checked, then run setup with
  `SKIP_PRODUCTS=1`.
- The products carry the tags that drive your collections, B2B catalogs, and Flow conditions:
  `available-now` for available-now products, `prebook` (plus `season:spring-summer-2027`) for
  pre-book products. You can bring your own products instead, as long as they carry those tags.
- **You do not need to vault a card in advance.** Forcing a vaulted card is part of the workshop
  itself: when you place a pre-order test order as the buyer, checkout requires a card, and Flow 2
  then charges it on fulfillment.

## Store structure to pre-seed (before the session)

From the repo you cloned above, first authenticate the Shopify CLI to your store **with the required
scopes** (one time per store, the script fails without it):
`shopify store auth --store <your-store>.myshopify.com --scopes ...`.
The exact scopes string is in `setup/README.md`. Then run the **setup script** (`setup/setup-store.mjs`,
the recommended one-shot path) to provision everything **before** the workshop, so the in-session
time goes to code. (An optional AI-prompt path, `../prompts/00-store-setup.md`, exists for those who
want to see the Admin GraphQL step by step, but the script is the reliable route.) It creates:

- **B2B catalogs, markets, and company locations** that separate Available Now from pre-book:
  - Non-Plus: two locations/markets, each with one catalog (Available Now vs pre-book).
  - Plus: one combined location with both catalogs assigned (mixed cart).
  - Every location shares the same shipping/billing address and the same buyer as location admin.
- **Payment terms:** the pre-book location set to due-on-fulfillment; the Available Now location
  on your normal terms (for example Net 30).

The **pre-booking data model is not pre-seeded.** Its definitions live in the app's `shopify.app.toml`
(`$app` namespace) and are created when you run `shopify app dev` in the session; you seed the season
and tag products in-session (see `data-model-seed.md`). Nothing to do here in advance.

## Plan note

**B2B is now available on all plans** (Basic and up), not just Plus, a recent change worth knowing. You
build everything on your Plus sandbox, so you get every feature the workshop uses. The only plan
differences that change how a *merchant* ships this are the ones we build around: dynamic payment terms
at checkout (`paymentTermsSet` Function) and per-fulfillment charging are **Plus-only**, and **custom
apps that contain Functions require Plus** (so a non-Plus merchant does the force-vault with an App Store
app instead). Everything else in the build is the same on either tier. Note: B2B also requires **new
customer accounts** and **Shopify Markets** (enable B2B-with-Markets via feature test drive if prompted).
