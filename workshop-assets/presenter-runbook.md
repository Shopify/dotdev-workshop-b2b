# Presenter runbook (live-build cue card)

The tactical companion to [`delivery-guide.md`](delivery-guide.md). The delivery guide is the
narrative + clock; **this is the do-this-next card you keep beside you while building live.** Every
step lists the exact command/tab, the prompt to paste (linked), what to verify, and the one gotcha.
Built for the **Monday dry run**, run it start to finish once and time it.

Attendee-facing source of truth **in the room** is [`SESSION.md`](../SESSION.md) (one follow-along
doc with every paste prompt and teach-aloud callout). Overview + prework: [`README.md`](../README.md).
This runbook is the presenter's do-this-next card. Parts: 1 = app setup `01` + season seed; 2 = `02`
theme block; 3 = `03` Plus Function; **4 = Flows** (`04` tag + `05` charge as sub-steps). **Talk track
after the data model:** theme block so the buyer sees pre-book context; payment Function so checkout
has the right terms; then Flows so the merchant can manage these orders and payments. **The Function
(Part 3) is built before the Flows on purpose:** on Combined, only the Function flips terms to
due-on-fulfillment, so if you build the Flows first your test orders stay Net 30 and Flow charge looks
broken. Build the Function first and every later test order already carries the right terms.

**Teaching rule:** while AI/Sidekick builds, walk the callouts in `SESSION.md` / the prompt files. Do
**not** open stubs, TOML, or source files on the projector; the callouts already quote what to say.

---

## Before you start (pre-flight, do this cold before the room fills)

- [ ] **Prereqs done on your demo store** (per [`prerequisites.md`](prerequisites.md)): US Plus sandbox,
      B2B on, Shopify Payments test mode (capture NOT at checkout), Flow installed, repo cloned, CLI
      authed, **store seeded**, AI assistant with Dev MCP + AI Toolkit.
- [ ] **Finished demo store ready (for the opening).** Keep a **second, fully built** store (data model
      seeded, block placed, both Flows on, Function active) so you can show the finished flow working
      before any code. This is **not** the store you build on live, don't reset it. Have it logged in as
      Maya Cruz on Combined in a browser tab.
- [ ] **Fresh build state (the store you build on live).** Wipe your build store back to the seeded
      baseline first with [`reset.md`](reset.md) (delete the payment customization, both Flows, the
      season entry + product metafields, the theme block, cancel/archive test orders).
- [ ] **Storefront login ready.** You test as the B2B buyer **Maya Cruz** via the storefront (one-time
      emailed code), on the **Combined** location. Have that inbox open. Admin preview and DTC do NOT
      trigger the block or the B2B payment behavior.
- [ ] **Storefront password handy** (Admin, Online Store, Preferences, Password protection), `dev` asks
      for it.
- [ ] **Two terminal tabs** (below). **Do NOT be in OS dark mode** if you can avoid it, or you'll hit
      the block-CSS gotcha in Part 2 (theme block).
- [ ] **AI tool set to auto-accept edits.** The two code builds (Parts 2, 3) are edit-only (dev
      hot-reloads), so put your AI in auto-accept-edits mode so it doesn't stop for approval on every
      file (Claude Code: Shift+Tab; Cursor: Auto-Run). The starter's `.claude/settings.json` does this
      for Claude Code. Without it, each build stalls on per-file permission prompts and eats minutes.
- [ ] **Screen legibility:** terminal >= 18pt, editor at 150%, high-contrast.

### Tab setup (this is the whole model, no third tab, no deploy)

| Tab | What runs | Rule |
|---|---|---|
| **Tab 1** | `shopify app dev` (via `pnpm run dev`) | Starts in Part 1, **stays running all session**. Press **`g`** here to open GraphiQL (browser opens, `dev` keeps running). Restart = `q` then `pnpm run dev`. |
| **Tab 2** | Your AI assistant | Where you edit code (paste the prompts). |

**Gotcha (transient dev crash):** if Tab 1 dies with `AbortError: The user aborted a request` / `ELIFECYCLE ... exit code 1`, that's a network timeout pushing the dev-preview update (common on shared venue wifi), not your code. Just `pnpm run dev` again. Ignore red `[error] TranslationKeyExists` lines too if the AI used `| t` (theme-check false-positives on app-extension locales; the block still renders). Prompt [`02`](../prompts/02-theme-app-block.md) now has the block use literal copy to avoid them.

You never run `shopify app deploy` in the session, `dev` serves everything live.

---

## Opening + framing (~12 min, no build: 3 finished demo + 5 framing + 4 toolkit; prework check ~3 min overlaps)

**Show the finished product first (~3 min).** On your **finished demo store** (the second store from
pre-flight, not your build store), logged in as Maya Cruz on Combined: put a pre-book item + an
available-now item in one cart, go to checkout (due on fulfillment, "pay later" gone, point out
`Season` / `Delivery window` on the line), place it, then fulfil a line and show the vaulted card
auto-charged. Land it: "In the next hour you'll build exactly this on your own store." Full script:
[`delivery-guide.md`](delivery-guide.md) "Opening: show the end goal."

### Prework check (~3 min hands-up triage; TAs fix reds in parallel)

Fast triage, **not** a fix-it session. Run the full list below (hands up / thumbs up per item). The
**only** item that can't be fixed in a few minutes is the **store seed** (the script takes 5-10 min), so
that's the one that truly gates building; everything else a TA can fix live while you keep moving. This
can overlap Gita's intro, don't burn dedicated clock on it.

Frame it: "Quick gut-check so we know who needs a hand. If your seed didn't run you'll follow on my
screen; everything else the TAs will sort while we build."

**The one that can't be fixed live, ask first:**
- [ ] **Store seeded** (script ran clean): 5 available-now + 5 pre-book products, the **Available Now** +
      **Pre-book** collections, and the company **Urban Style** with **three** locations (Available Now,
      Pre-book, Combined). Anyone red here follows on the presenter screen and rebuilds from `finished`
      later, a TA can kick the seed off but it won't finish in time.

**Fixable in the room (TAs handle in parallel; ~1-3 min each):**
- [ ] **US Plus sandbox store**, **US / USD** (Settings, General), **B2B on** (Settings, B2B).
- [ ] **Shopify Payments activated** (Settings, Payments; not a test gateway).
- [ ] **Payments test mode ON** (Payments, Manage, Test mode).
- [ ] **Payment capture = manual OR on-fulfillment** (Settings, Payments, Payment capture), **not**
      "automatically at checkout".
- [ ] **Can sign into the storefront as the buyer (Maya Cruz)** via the emailed code, on **Combined**
      (every in-session test runs as the buyer; a TA can resend/confirm the code).
- [ ] **Shopify Flow installed** (Admin, Apps; free App Store install if missing).
- [ ] **Repo cloned** (they `pnpm install` as the first build step).
- [ ] **CLI authed** (`shopify store execute ... 'query { shop { name } }'` returns the shop).
- [ ] **Tooling**: Node 20+, pnpm/npm, Shopify CLI 4+, AI assistant with **Dev MCP** + **AI Toolkit**.

Don't stop the room, note reds, hand them to a TA, and start building.

Then the "why the obvious approaches fail" framing (~5 min) and the Toolkit slide (~4 min), both from
[`delivery-guide.md`](delivery-guide.md). Then start building.

---

## PART 1 - Data model (~5 min) [both] - prompt [`01`](../prompts/01-scaffold-app.md)

### 1a. Start the app (tab 1)
```bash
cd starter/b2b-prebooking-workshop
pnpm install
pnpm run dev
```
- On first `dev`: pick org -> pick your dev store -> **approve the browser install** (one click; the
  app's only scope is payment customizations, used in Part 3). Enter the **storefront password** if asked.
  On first `--use-localhost`, when mkcert prompts **"Yes, use mkcert to generate it"**, select Yes, then
  enter the **sudo/Mac login** password.
- **Say (frame the browser step):** "Installing any app with scopes goes through the standard consent
  screen, that's a one-click browser step, not an error. There's no terminal-only install." Click Install,
  move on.
- **Why it starts clean now:** the app ships **no data model** in `shopify.app.toml`, so the first `dev`
  needs no write scopes, this is the fix for the old `write_products`/blank-scopes failure on fresh stores.
  The season metaobject + `custom.b2b-prebooking` product metafield already exist store-owned (seeded in
  pre-work).
- **STILL TO CONFIRM (store-7 dry run):** fresh clone -> `pnpm run dev` starts with NO scope error; then
  Part 3 activation (press `g`) succeeds. If activation reports a payment-customizations scope error, seat
  it once with `pnpm shopify app deploy` + reinstall (see prompt [`03`](../prompts/03-plus-payment-terms-function.md) / punch list).

### 1b. Show the data model (no code)
- Admin, Settings, Custom data: point at the **B2B Pre-booking** metaobject (Metaobjects) and the **B2B Pre-booking** product metafield (Metafields, Products). Both were seeded store-owned in pre-work.
- **Say:** "The season lives on the product as a store-owned metaobject plus a `custom.b2b-prebooking` metafield. One place to edit, and both the block and the Function read it."

### 1c. Seed one season + assign the pre-book products (Admin)
- Follow [`data-model-seed.md`](data-model-seed.md): create one **season** metaobject entry, then bulk-assign it to the 5 pre-book products (Products, select them, Edit products, B2B Pre-booking column; shift-select the range and set once).
- **Verify:** a pre-book product's metafield shows the season (store-owned, so you can pin it to the product page if you like).

---

## PART 2 - Theme block (~6 min) [both] - prompt [`02`](../prompts/02-theme-app-block.md)

- **Build (tab 2):** confirm auto-accept-edits is on, then paste [`prompts/02`](../prompts/02-theme-app-block.md) into your AI assistant. Edit-only (dev hot-reloads), decline any command the AI proposes.
- **Place it:** with `dev` running, add the block in the theme editor (a pre-book product template, Add block, Apps, B2B Pre-booking). **No deploy.**
- **Gotcha (dark mode):** if the block looks great in the theme editor but washed-out on the storefront, your AI added a `prefers-color-scheme: dark` media query and your OS is dark. Delete that media query. (`finished` branch CSS is the reference.)
- **Gotcha (no line item properties):** block renders but nothing lands on the cart/checkout line. On the default **Horizon** theme, form injection alone is dropped, Horizon builds the `/cart/add` body from selected fields, not the whole form. Fix (in prompt [`02`](../prompts/02-theme-app-block.md)): also intercept `/cart/add` by patching `fetch` + `XMLHttpRequest.send` and appending `properties[...]` to the FormData (gated by `product-id`). Confirm in Network: `/cart/add` payload should carry `properties[Season]`.
- **Say (2 lines, from `SESSION.md`, no file open):** (1) `product.metafields["custom"]["b2b-prebooking"]`, "one line reads the season, nothing hardcoded." (2) the cart-line script, "writes Season + Delivery window onto the cart line so they reach checkout on any plan."
- **Verify (as Maya Cruz on the storefront):** pre-book PDP shows the windows; add to cart -> `Season` + `Delivery window` appear on the cart line and at checkout; an available-now product shows nothing.

---

## PART 3 - Plus payment-terms Function (~7 min) [Plus] - prompt [`03`](../prompts/03-plus-payment-terms-function.md)

Built **before** the Flows so your later test orders already carry due-on-fulfillment terms (on Combined, only the Function flips them).

### 3a. Implement the Function (tab 2, paste prompt)
- Confirm auto-accept-edits is on, then paste [`prompts/03`](../prompts/03-plus-payment-terms-function.md) into your AI assistant. `dev` rebuilds on save; **no deploy, no `function build`** (decline any command the AI proposes).
- **Say (2 lines, from `SESSION.md`, no file open):** (1) the two fail-open guards, "only acts on a B2B cart with a pre-book item, everything else passes through." (2) the operations, "does exactly two things: set due-on-fulfillment, hide 'pay later' so a card gets vaulted."

### 3b. Activate it (tab 1, press `g`)
- In tab 1, press **`g`** to open the app's GraphiQL. Set API version to the latest stable.
- Run this (identical for everyone, handle is in the repo):
```graphql
mutation {
  paymentCustomizationCreate(paymentCustomization: {
    title: "B2B Prebooking Payment Terms"
    enabled: true
    functionHandle: "prebooking-payment-terms"
  }) {
    paymentCustomization { id title enabled }
    userErrors { field message }
  }
}
```
- **Verify:** response has an `id`, empty `userErrors`. Full troubleshooting: [`payment-customization-activation.md`](payment-customization-activation.md).
- **Gotcha:** `Could not find Function` -> `dev` isn't running. Scope error -> quit `dev`, rerun, approve the payment-customizations permission.

### 3c. Verify the terms switch (as Maya Cruz on Combined)
- **Mixed cart** (available-now + pre-book) -> checkout flips to **due on fulfillment**, "pay later" hidden.
- **Available-now only** -> stays **Net 30**, "pay later" visible.
- Watch tab 1, it prints the Function execution each checkout.

---

## PART 4 - Flows (~8 min) [both] - prompts [`04`](../prompts/04-flow-tag-prebook-orders.md) + [`05`](../prompts/05-flow-charge-on-fulfillment.md)

**Frame:** "We've given the buyer the PDP and the right checkout. Now we make the merchant's life easier
managing these orders and payments, two Flows, one purpose."

### 4a. Tag pre-book orders (~4 min) - prompt [`04`](../prompts/04-flow-tag-prebook-orders.md)
- Build **Flow 1** with the Sidekick prompt in [`prompts/04`](../prompts/04-flow-tag-prebook-orders.md).
- **Say:** "B2B-guarded so DTC orders stay untagged. The `Prebooking` tag is both the merchant's filter and the signal the charge Flow keys on."
- **Verify:** a new B2B pre-book order gets `Prebooking`; a DTC order with the same product does not.
- **Gotcha (timing):** Flow 1 is async, the tag can take **2-3 min**. Don't wait on stage; you'll verify during the payoff.

### 4b. Charge on fulfillment (~4 min) - prompt [`05`](../prompts/05-flow-charge-on-fulfillment.md)
- Build **Flow 2** with the Sidekick prompt in [`prompts/05`](../prompts/05-flow-charge-on-fulfillment.md).
- **Say:** "One Flow serves both plans, non-Plus charges once at full fulfillment, Plus per fulfillment, driven by how each plan makes payment schedules. `completedAt does not exist` is the double-charge guard."
- **Verify:** fulfilling a pre-book order charges the vaulted method once (you'll show this in the payoff).

---

## PAYOFF - full lifecycle (~4 min) - everything working together

Run on the **Combined** location. **Pacing (Flow is async):** place the mixed order at the *start* of
this section, narrate the rest while Flow 1's tag lands, then fulfill.

1. **Three carts, three behaviors** (same buyer/location): available-now = Net 30 + pay-later; pre-book only = due on fulfillment, no pay-later; mixed = due on fulfillment, no pay-later (point out `Season` / `Delivery window` on the line).
2. **Place the mixed order.** No "save card" checked -> buyer is prompted to add a card (order carries terms).
3. **Tagged + filterable.** Flow 1 tags it `Prebooking`; show the Orders list filtered by that tag.
4. **Two fulfillments, two auto-charges:** fulfil the available-now line -> Flow 2 charges the vaulted card for that fulfillment; later fulfil the pre-book line -> Flow 2 charges again.
- **Land it:** "Two automatic charges, one per fulfillment, no one touched the card. That's per-fulfillment charging + due-on-fulfillment terms + the Function + the Flow, together on one Plus order."

---

## ADAPT - non-Plus (~8 min, show, no code)

Walk the pre-seeded two-location arrangement per [`delivery-guide.md`](delivery-guide.md) (adapt for non-Plus):
separate Available Now (Net 30) and Pre-book (due on fulfillment) locations, same theme block + both
Flows unchanged, force-vault via an App Store app (custom Functions need Plus).

---

## Close (~2 min) + Q&A (10 min, protected)

Close + take-home (pattern map + `finished` branch) per the delivery guide. Q&A list is there too
(8 anticipated); brief the TA to field Payments questions (the #1 support item).

---

## Dry-run debrief (capture Monday)

- [ ] Total time vs 60 min (Opening 3 + Framing 5 + Toolkit 4 + Build P1-5 26 + Payoff 4 + non-Plus 7 + Close 2 + Q&A 10). Build P1-5 = data model 5, theme 6, Function 7, Flow tag 4, Flow charge 4.
- [ ] Part 1 first-run (data model moved OUT of the toml): does a plain `pnpm run dev` give ONE clean pass on a truly fresh clone, NO `write_products`/scope error, single browser install, no URL-paste gymnastics? (This is the fix for the stores 5/6/7 blank-scopes failure.) The data model should already be visible in Settings, Custom data from the pre-work seed.
- [ ] Part 3 activation: does `paymentCustomizationCreate` (press `g`) succeed on the first try, or does it report a payment-customizations scope error? If it errors, confirm the one-time `pnpm shopify app deploy` + reinstall seats the scope. (The web consent stays; there's no terminal-only install.)
- [ ] Did building the Function (Part 3) before the Flows keep test-order terms correct end to end?
- [ ] Flow tag latency, did the payoff pacing hide it?
- [ ] Any AI prompt (02, 03) that produced code needing hand-fixing on stage.
- [ ] **Time the AI generation** for Parts 2 and 3 with auto-accept-edits ON. The 6/7-min budgets assume
      a near one-shot with no per-file approvals; if generation alone runs long, widen those budgets (and
      consider trimming Q&A or the non-Plus walk) rather than rushing the payoff.
- [ ] Confirm the pre-order / pre-book terminology split with Gita.

---

## Appendix: command glossary (what each one does)

Two tools: **pnpm** (installs code libraries, runs shortcut scripts) and the **Shopify CLI** (`shopify`,
talks to Shopify). `pnpm shopify ...` runs the *project's pinned* CLI; plain `shopify ...` uses a global
one, prefer `pnpm shopify` so everyone's on the same version.

| Command | What it does | When |
|---|---|---|
| `cd starter/b2b-prebooking-workshop` | Move into the app folder (shell). All commands run from here. | Once |
| `pnpm install` | Downloads the app's code dependencies into `node_modules` (makes the CLI + build tools available). | Once per fresh clone |
| `pnpm shopify app deploy` | Bundles app config + both extensions into a new **app version** and pushes it to Shopify's servers. Not used in the session build; optional take-home to make the extensions persist after `dev` stops (also the fallback to seat the Part 3 payment scope if activation reports one). | Optional / take-home |
| `pnpm run dev` | = `shopify app dev --use-localhost`. Starts the **local dev session**: builds + serves the extensions live, hot-reloads on save, opens GraphiQL on press `g`. Stays running in Tab 1. | All session |
| `--use-localhost` | Serves `dev` over a local HTTPS proxy (the `mkcert` cert prompt) instead of a Cloudflare tunnel; avoids room-wide throttling. Applies **only** to `dev`, not `deploy`. | Inside the `dev` script |
| press `g` (in the dev tab) | Keystroke, not a command. Opens **GraphiQL** (query console) scoped to your app; how we activate the payment Function in Part 3. | Part 3 |
| `shopify store auth` | Logs the CLI into one store with a scope list. Lets the seed script make changes. | Prework |
| `shopify store execute` | Runs one GraphQL query/mutation against the store as the `store auth` identity. The seed script calls it ~80x; also the prework "does auth work" check. | Prework / seed |
| `shopify app execute` | Like `store execute` but runs in the **app's** identity (app must be installed). Terminal path we're testing for Function activation vs press-`g`. | Part 3 (testing) |
| `pnpm shopify app function run` | Runs the payment Function locally against a test-input JSON, no store. Quick unit check. | Part 3 (optional) |
| `pnpm shopify app function build` / `schema` | Compile the Function to Wasm / regenerate its GraphQL schema. `dev` does build on save, so rarely needed by hand. | As needed |

**Mental model:** `pnpm install` / `pnpm run dev` = local-machine stuff; `shopify app deploy` /
`... execute` / `store auth` = talking to Shopify's servers or your store.
