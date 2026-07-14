# Delivery guide: Building B2B Pre-Orders

Presenter-facing. This is the run-of-show for the 60-minute session: timings, what you say and
show, the firsthand teaches, and the checkpoints. The attendee-facing build steps live in the
repo `README.md` ("How the workshop runs"); this guide wraps a narrative and a clock around them.

> **Building live? Keep [`presenter-runbook.md`](presenter-runbook.md) open beside you.** It's the
> step-by-step cue card (exact commands, tab, prompt link, verify, gotcha per step). This guide is the
> narrative; the runbook is the do-this-next.

> **Terminology note.** The audience-facing concept is **pre-order** (matches the event title and
> how merchants ask for it). The technical product state we tag and build against is **pre-book**
> (`prebook` tag, `b2b-prebooking` metaobject). Say "pre-order" to the room; the code says
> `prebook`. Raised with Gita 2026-07-10; confirm the split is settled at the dry run.

---

## Summary

| Field | Answer |
|---|---|
| Working title | Building B2B Pre-Orders: order now, pay and ship by season |
| Presenter (build) | Brandon Anderson (live build) |
| Supporting speaker | Gita Ravindran (intro, use cases, framing) |
| Technical assistant(s) | Austin Hoefs (booth + workshop backup; has run the exercise) + 1 TA |
| Target persona(s) | App builders and agencies building for B2B merchants (senior, multi-persona) |
| Slack channel | #dotdev-workshop-b2b-preorders |
| Approved outline | Gita's outline doc (DotDev Workshop Outline - B2B) |
| Repo | shopify-playground/dotdev-2026-building-b2b (`main` = starter, `finished` = reference) |

**Scope decision (the most important move):** one problem, one hands-on exercise. We build the
**Plus** pre-order experience end to end (the meaty custom code), then **adapt it for non-Plus**
as a lighter arrangement, not a second build. Extended functionality (polished checkout UI,
multiple seasons, delivery-date picker) is a 2-minute close demo and a take-home, never in the
protected exercise block. Store setup is **pre-seeded** as a prerequisite so no setup happens in
the room.

---

## Prerequisites + TA briefing

Attendees complete all prework **before** the session; full steps in `prerequisites.md`. In brief: a
**US** Plus sandbox with B2B on; **Shopify Payments in test mode** with a vaulted test card and capture
**not** at-checkout; the repo **cloned**; the CLI **authed** with the seed script's scope list; the
**seed script** run (products, collections, company/buyer, locations, markets, catalogs, terms, DTC);
**Shopify Flow** installed; an AI assistant with the Dev MCP + AI Toolkit. `pnpm install` is in-session.
The **data model (the season metaobject + the `custom.b2b-prebooking` product metafield) is created
store-owned by the pre-work seed script**, not by the app. In-session, the app's payment-customizations
scope is seated by `pnpm run set-scopes` during app setup, and Function activation uses the app's own
GraphiQL (press `g`), not the CLI auth.

**Contingency (stragglers).** The line that matters is **local vs server-side**. Clone + `pnpm install`
are local and fast (~100 MB, under a minute on venue wifi), and `pnpm install` is an in-session step
anyway, so a straggler catches up in the opening. What's **not** recoverable in the room is the **seeded
store** (minutes of API calls plus a 5-to-10-minute Payments KYC). So pre-seed and Payments/Flow are the
hard prereqs; anyone who skipped them follows on the presenter's screen and rebuilds from `finished`
after. Have TAs sweep in the opening with the question that matters: not "did you install?" but **"is your
store seeded?"**

**TA briefing, #1 support item: Shopify Payments.** We're the only DotDev workshop that requires it, and
onboarding is the most failure-prone prereq (US store + identity/SSN + KYC banners). Workaround, cold:
business type Individual, a made-up name, a real-looking US address, SSN `078-05-1120` (`000-00-0000` and
`987-65-...` are rejected), then **ignore** the "some details couldn't be verified" / "select a plan"
banners, test mode still processes test charges and vaults cards. Anyone stuck on Payments builds
everything and watches the live vault + charge on the presenter's screen.

---

## Opening: show the end goal (~3 min)

**Demo, no code.** Run this on a **separate, fully built "finished" store** (data model, block, both
Flows, Function all live), kept aside from the store you build on live so the end state is guaranteed.
Logged in as the Plus buyer (Maya Cruz) at the Combined location:

1. Show a pre-order product PDP: the ordering window and expected delivery window render on the
   page.
2. Add it to a cart that also has an in-stock (available-now) product. One mixed cart.
3. Go to checkout: the order is set to **due on fulfillment**, and "choose payment method later"
   is gone (a card is required). Point out the `Season` and `Delivery window` on the line item.
4. Place it. Then fulfil the pre-order line and show the vaulted card charged automatically for
   just that fulfillment.

**Land this:** "In the next hour you'll build exactly this on your own store: a B2B pre-order flow
where the buyer orders now, sees when it ships, and gets charged automatically when it ships. And
you'll learn how to deliver the same outcome for merchants who aren't on Plus. Here's the finished
thing working."

> 💡 Highest-ROI 3 minutes in the session. They see the destination before any code, so every step
> later has a "why."

---

## Prework check (~3 min hands-up triage; TAs fix reds in parallel)

Fast gut-check, not a fix-it session, and it can overlap the intro/framing rather than eat dedicated
clock. Run the full list; the **only** thing that can't be fixed in a few minutes is the **store seed**
(the script takes 5-10 min), so that's the one that truly gates building. Everything else a TA sorts
live while the room keeps moving.

**The one that can't be fixed live, ask first:**
- Store **seeded**: 5 available-now + 5 pre-book products, the Available Now + Pre-book collections, and
  the company **Urban Style** with **three** locations (Available Now, Pre-book, Combined). Anyone red
  follows on the presenter screen and rebuilds from `finished` later.

**Fixable in the room (TAs, ~1-3 min each):**
- **US Plus sandbox** store, **US / USD**, **B2B on**.
- Shopify Payments **activated**, **test mode on**, capture **manual or on-fulfillment** (not at checkout).
- Can **sign into the storefront as the buyer (Maya Cruz)** via the emailed code, on Combined (every
  in-session test runs as the buyer; a TA can resend/confirm the code).
- Shopify **Flow installed** (free App Store install).
- **Repo cloned** (they `pnpm install` as the first build step) and **CLI authed** (shop query returns).
- Tooling: Node 20+, pnpm/npm, Shopify CLI 4+, AI assistant with Dev MCP + AI Toolkit.

Note reds, hand them to a TA, keep building. Don't hold the whole session.

---

## Framing: the problem and why the obvious approaches fail (~5 min)

**Setup.** Pre-orders are one of the most common B2B asks, especially apparel: a buyer commits to a
future season now, the merchant produces to that demand, it ships months later, and the buyer pays
on terms, not up front. Shopify has the pieces to do this now, but no doc shows which combination
solves which pattern. That's the exercise.

**Limitation beat (show the naive approaches breaking before the solution):**

- **"Use a pre-order / selling-plan app."** Those are built for D2C deferred purchases. They don't
  speak B2B payment terms, per-company catalogs, or vaulted-card-on-terms. Wrong tool for B2B.
- **"Put the season on the customer or company."** It falls apart the moment a buyer orders across
  two seasons, or a second buyer at the same company orders. The season describes the **product**,
  not the buyer.
- **"One product in two inventory states."** Available-now needs to stop selling at zero; pre-book
  needs to keep selling past zero (it sizes the production run). One record can't do both cleanly.
  You separate the two states into two products.
- **"Charge the card at checkout."** B2B buyers pay on terms, and a pre-order ships months later.
  Charging up front is wrong for cash flow and the relationship. Payment has to wait for
  fulfillment, which means a vaulted card plus due-on-fulfillment terms plus an automatic charge.

**Teach (firsthand, not in the docs):** "The season belongs on the product, carried by a
metaobject, and pre-order is a **product state** you tag, not a customer attribute. Get that
modeling decision wrong and every downstream piece fights you. This is the most common mistake we
see teams make on B2B pre-orders."

> 💡 The limitation beat carries the core domain teach and earns the solution. It also does the
> "show the obvious breaking first" work, which matters because we build Plus (the best case)
> first.

---

## The toolkit (~4 min)

Walk the building blocks on screen (no code yet). This is also the reference map they take home.

- **Season data model (metaobject + product metafield):** the pre-order "season" (ordering +
  delivery windows) lives on the **product** via a store-owned metaobject (seeded in pre-work); a
  product metafield (`custom.b2b-prebooking`) references it. That metafield is also what marks a
  product as "pre-order."
- **PDP theme block:** reads the season and renders the windows for B2B buyers, and injects
  `Season` + `Delivery window` as **line item properties** (all plans, the only cross-plan hook to
  carry pre-order context into cart and checkout).
- **Vaulted cards / ACH** on the Company Location: store once, charge later.
- **Payment terms** (Net 30, **due on fulfillment**): due-on-fulfillment is what makes "pay when
  it ships" real.
- **Charge on fulfillment (Flow action):** auto-charges the vaulted method on fulfillment. The
  engine of the flow.
- **Per-fulfillment charging** [Plus]: bill each fulfillment separately, so a mixed cart charges
  the in-stock part now and the pre-order part when it ships.
- **Payment-terms customization Function** [Plus]: switches terms at checkout when a pre-order item
  is detected (`paymentTermsSet`).
- **Markets + catalogs:** scope which products each Company Location sees (pre-seeded).

**Teach:** "Two of these are Plus-only: per-fulfillment charging and the terms Function. Everything
else works without Plus. The whole game is which combination you reach for on which plan."

> 💡 Liam's open question on the outline was whether the toolkit is a doc the audience gets. Yes:
> the pattern map in the close is this slide as a take-home reference.

---

## Build the Plus experience (~25 min, you build along)

This is the exercise. Attendees code along; the `finished` branch is the recovery path if anyone
falls behind. Each sub-part has a checkpoint.

**Talk track after the data model is seeded:** (1) theme block so the buyer sees what they need on
pre-book products, (2) payment Function so checkout has the right experience for pre-book, (3) Flows
so the merchant can manage these orders and payments. Flows are one beat with two Sidekick prompts.

### Data model + theme block (~11 min)  [both]
Two beats; keep them mentally separate so a stall on seeding doesn't eat the theme-block time.

**Beat 1, the data model (~5 min).** In the already-cloned starter app
(`starter/b2b-prebooking-workshop`), run `pnpm install`, then the one-time app setup
(`shopify app deploy` -> `pnpm run set-scopes` -> `shopify app dev --use-localhost`; exact steps in the runbook).
`set-scopes` seats the app's payment-customizations scope so Part 3 activation works later. With `dev`
running, the season **metaobject** + `custom.b2b-prebooking` product **metafield** (created store-owned
by the pre-work seed script) are visible in **Settings, Custom data**, so **show them** (Metaobjects,
then Metafields, Products). Then seed one **season** entry and assign it to the pre-order products
(`workshop-assets/data-model-seed.md`).
**Teach.** The data model is **store-owned**, created once in pre-work: a season metaobject and a
`custom.b2b-prebooking` product metafield, both fully visible and editable in Admin. Only the
**values** (the season entry + the per-product assignment) are authored live, everything reads them
via the `custom` namespace.

**Beat 2, the theme block (~6 min).** Build the block from `prompts/02-theme-app-block.md` (it reads
`custom.b2b-prebooking`), add it to the product template, and preview a pre-order product.
**Teach.** The block reads the season server-side in Liquid and injects **visible line item
properties** (`Season`, `Delivery window`) into the add-to-cart form, the all-plans way to carry
pre-order context to cart and checkout; non-Plus has no other hook there (works everywhere, not a
Plus feature).

> **Highlight (say this). Do not open the Liquid file; say the ideas while the AI builds:**
> 1. `product.metafields["custom"]["b2b-prebooking"]`: *"This one line is the whole data-model
>    connection. The block reads the season we attached to this product, nothing is hardcoded, so it
>    updates automatically when you change the season."*
> 2. The cart-line script: *"And this is how pre-book context reaches checkout on any plan, no Plus
>    required. It writes the Season and Delivery window onto the cart line as line-item properties, so
>    they show in the cart, at checkout, and on the order."*
> That's the whole file in two sentences: **read the season, carry it to checkout everywhere.**
> (Same callouts live in [`SESSION.md`](../SESSION.md) Part 2 for attendees.)

**Checkpoint.** ✅ Settings, Custom data shows the **B2B Pre-booking** metaobject + the
`custom.b2b-prebooking` product metafield; a B2B buyer on a pre-order product sees the windows; adding
it shows `Season` and `Delivery window` on the cart line and at checkout. Available-now shows nothing.

### Plus payment-terms Function (~7 min)  [Plus]: the Plus differentiator
Built **before** the Flows on purpose: on the combined location only the Function flips terms to
due-on-fulfillment, so the test orders you place while building the Flows already carry the right
terms (build the Flows first and your test orders stay Net 30, and the charge Flow looks broken).
**Step.** Implement the Function from `prompts/03-plus-payment-terms-function.md` (no deploy: `dev`
serves it), then activate it with one mutation in the app's GraphiQL, press `g` in the `dev` tab and
run the `paymentCustomizationCreate` from `payment-customization-activation.md`. The mutation is
identical for everyone (stable function handle).
**Teach.** On the combined location, a mixed cart flips **only that checkout** from Net 30 to
due-on-fulfillment (`paymentTermsSet`, Plus-only) and hides the deferred option, so the buyer gets
one smart cart. Two firsthand gotchas: (1) match the deferred method by its **real input name**
(`"Deferred"`), not the display label; (2) fail open, return no change for non-B2B and
available-now-only carts, because the Function runs on every checkout.

> **Highlight (say this). Do not open the Function source; say the ideas while the AI builds:**
> 1. The two fail-open guards: *"The function only acts on a B2B cart that actually contains a
>    pre-book item. Every other checkout, DTC or available-now-only, passes through untouched, that's
>    the fail-open safety."*
> 2. The two operations: *"When it does act, it does exactly two things: switch the terms to
>    due-on-fulfillment, and hide the 'pay later' option so a card gets vaulted, which is what lets
>    Flow charge automatically on shipment."*
> Two sentences: **only on a B2B pre-book cart, do exactly two things.**
> (Same callouts live in [`SESSION.md`](../SESSION.md) Part 3 for attendees.)

**Checkpoint.** ✅ Mixed cart on the combined location flips to due-on-fulfillment and hides
deferred; available-now-only cart stays Net 30. (The Flows you build next do the charging.)

### Flows (~4-5 min live)  [both]: merchant ops after the buyer-facing build
**Frame.** Theme block = buyer sees pre-book context; Function = right checkout. Now the Flows so the
merchant can manage these orders and payments without manual tagging or charging.

**Time-saver:** arrive with **Flow 1 already built on your demo store** (it's just a merchant-visibility
helper and its tag is async, so building it live wastes minutes). You build **Flow 2 live**. Attendees
can still build both from the prompts, the SESSION doc keeps Flow 1.

**Sub-step 4a, tag (pre-built, ~30 sec to show).** Flow 1 (`prompts/04`) tags B2B pre-book orders
`Prebooking`. **Teach.** The B2B guard keeps DTC orders untagged; the tag is a merchant filter for
pre-book orders. It's purely for visibility, the charge Flow does not depend on it.

**Sub-step 4b, charge (~4 min, build live).** Build Flow 2 from `prompts/05-flow-charge-on-fulfillment.md`
(Sidekick). **Teach.** It charges the vaulted method when a B2B order's payment schedule comes due, with
a safety check that skips any schedule already collected (`completedAt does not exist`, so a
re-fulfillment can't double-charge). It's **independent of Flow 1**, it keys off the schedule, not the
tag, so nothing waits on the tag. One Flow, both plans: non-Plus once at full fulfillment, Plus per
fulfillment, driven by how each plan generates payment schedules.
**Checkpoint.** ✅ Fulfilling a pre-order order charges the vaulted method for the due amount, once.

> 💡 Every sub-part carries a firsthand teach (line-item-properties as the all-plans hook, the
> double-charge guard, the input-name gotcha, fail-open). That density is the "why in-person."

---

## Payoff: the pre-order lifecycle, end to end (~4 min)

Everything is built; now run the whole lifecycle live on the **combined** location. This is the
high point, it's what they just built, all working together. (The Opening was a quick teaser; here
you go deeper, so the repeat is deliberate reinforcement.)

**1. Three carts, three behaviors** (same buyer, same location):
- **Available-now only** → checkout is **Net 30** and "choose payment method later" is available.
- **Pre-order only** → checkout flips to **due on fulfillment**; "pay later" is gone (a card is
  required).
- **Mixed** (available-now + pre-order) → **due on fulfillment**, "pay later" gone. Point out
  `Season` and `Delivery window` on the pre-order line. One cart, terms auto-set by the Function.

**2. Place the mixed order.** If the buyer doesn't check "save card," they're **prompted to add a
card**: the order carries terms, so a vaulted method is required. Place it.

> ⏱ **No tag wait anymore.** Flow 2 charges off the payment schedule, not the `Prebooking` tag, so you
> can fulfill immediately, nothing to wait on. Flow 1's tag (for the filtered Orders view) is async and
> can take a couple of minutes, but it doesn't gate the charge, show the filter whenever the tag lands.

**3. Two fulfillments, two automatic charges** (the payoff):
- Fulfil the **available-now** line → Flow 2 charges the vaulted card for **that** fulfillment.
- Later, fulfil the **pre-order** line → Flow 2 charges the vaulted card **again**, for that
  fulfillment. No waiting on any tag.

**4. It's tagged and filterable too.** Flow 1 auto-tags the order `Prebooking`, so show the Orders list
**filtered by the `Prebooking` tag**, the merchant's clean pre-order view (whenever the async tag lands).

**Land it:** "Two automatic charges, one per fulfillment, and no one ever touched the card. That's
per-fulfillment charging + due-on-fulfillment terms + the Function + the Flow, all working together
on one Plus order."

> 💡 The single most impressive minute in the session (two hands-off charges on one order). It's
> also the exact thing non-Plus **can't** do, which sets up the pivot.

---

## Adapt for a non-Plus merchant (~8 min)

**Step / show.** On the pre-seeded two-location store, walk the non-Plus arrangement: the buyer
orders available-now and pre-order from **separate Company Locations**, each with fixed terms
(Available Now = Net 30, Pre-book = due on fulfillment). The theme block and both Flows you just
built work unchanged. No new code.

**Teach (the discovery):** "Your merchant isn't on Plus. You lose exactly two things: per-fulfillment
charging and the terms Function. So you can't switch terms mid-checkout and you can't split charges
on one order. The move is to pre-separate the journeys into two locations with fixed terms. Same
building blocks, different arrangement. The one thing you still need is to force a vaulted card,
and since custom-app Functions require Plus, on non-Plus that hide comes from an **App Store app**,
not your own."

**Checkpoint.** ✅ Available-now and pre-order are ordered from separate locations with their own
terms; the same Flow charges correctly; the App Store app forces a card on the pre-order location.

> 💡 This is the higher-value takeaway for much of the room (most B2B merchants aren't on Plus).
> Framing it as "here's the same outcome one tier down" lands the plan-tier teach cleanly.

---

## Close (~2 min) + Q&A (10 min, protected)

**Close.** "You built a B2B pre-order flow: a PDP block that carries season context to checkout,
two Flows that tag and auto-charge on fulfillment, and the Plus Function that makes it one smart
cart, plus the non-Plus arrangement. Take-home: the pattern map (which feature combo solves which
pre-order pattern) and the `finished` branch." 60-second demo of extended functionality: polished
checkout UI extension, multiple seasons, a delivery-date picker. Point them to the B2B/Collective
booth.

**Anticipated Q&A (so a TA can field them too):**

1. **Can non-Plus do the dynamic terms switch at all?** No. `paymentTermsSet` is Plus-only, and
   custom-app Functions require Plus. Non-Plus pre-separates terms by location instead.
2. **Why two products instead of one with two inventory states?** Available-now denies at zero;
   pre-order continues past zero to size the run. One record can't do both cleanly; separate
   products keep the two journeys and inventory policies clean.
3. **How does the vaulted card get charged without a human?** The Flow "charge vaulted payment for
   B2B order" action fires on fulfillment against the stored card/ACH; the `completedAt` guard
   prevents double charges.
4. **Does the Function slow every checkout?** No. Functions are sandboxed WASM, sub-millisecond,
   and this one returns no change for non-B2B and available-now-only carts.
5. **Can a buyer bypass the hidden "pay later" option?** No; the payment customization re-runs at
   checkout completion. On non-Plus the App Store app enforces the same.
6. **Where do the season dates live, and who edits them?** In the store-owned `b2b_prebooking`
   metaobject (read via `custom.b2b-prebooking` on the product); edit them in one place in Admin and
   both the block and the Function read them.
7. **Where does the data model come from?** The pre-work seed script creates it store-owned (a season
   metaobject + a `custom.b2b-prebooking` product metafield), so it's fully editable in Admin and the
   app itself carries no data model. Only the values (season entry + product references) are written in
   the session.
8. **My Shopify Payments won't verify / says "select a plan."** Expected on a sandbox. Use the test
   SSN, ignore the "couldn't be verified" and "select a plan" banners, test mode still processes test
   charges and vaults cards. (TA: this is the top support item.)

---

## Materials checklist

| Material | Status | Location |
|---|---|---|
| Slide deck (open + framing + toolkit + close) | TODO | DotDev 26 Workshops template (Light/Orange) |
| Starter repo (scaffold + pre-seed prompt/script) | In progress | `dotdev-2026-building-b2b` |
| Finished-state branch (reference/recovery) | ✅ | `origin/finished` |
| Attendee build track | ✅ | `README.md` ("How the workshop runs") |
| Presenter live-build runbook | ✅ | `workshop-assets/presenter-runbook.md` |
| Prerequisites (frozen) | ✅ draft | `workshop-assets/prerequisites.md` |
| Pre-seed setup (script primary; AI prompt optional) | ✅ | `workshop-assets/setup/`, `prompts/00-store-setup.md` |
| Data model seed (in-session, Admin; GraphiQL optional) | ✅ | `workshop-assets/data-model-seed.md` |
| Reset / redo reference | ✅ | `workshop-assets/reset.md` |
| Pattern map take-home | TODO | reference doc / toolkit slide |
| Practice recordings | TODO | dry run Monday |

## Pre-submission checklist

- [ ] Every part has ≥1 Step and ≥1 Teach; each ends with an observable checkpoint
- [ ] README build track is followable independently; code blocks complete and tested
- [ ] Starter puts attendees at the exercise start; `finished` branch linked
- [ ] Anticipated Q&A listed (8); Q&A protected at 10 min
- [ ] Close names a concrete take-home (pattern map + finished branch)
- [ ] Screen legibility: ≥18pt terminal / 150% editor / high-contrast
- [ ] Timed (hard 60-min slot; Gita ~10 up front, Q&A ~10 protected): Opening 3 + Framing 5 + Toolkit 4 + Build 25 + Payoff 4 + Non-Plus 7 + Close 2 + Q&A 10 = 60. **Prework check = ~3-min hands-up triage that overlaps the opening/framing** (TAs work reds in parallel), so it doesn't add to the clock.
- [ ] TA has run the full exercise end to end
- [ ] Prerequisites specific and frozen; store structure + data model pre-seeded (script)
- [ ] **Shopify Payments** (test mode) + capture not at-checkout (manual or on-fulfillment) + US store called out in the attendee prereq email; **TAs briefed on Payments as the #1 support item**
- [ ] Data model created store-owned by the pre-work seed script (`custom.b2b-prebooking`); the app carries none
- [ ] Gita aligned on Plus-first order and the pre-order/pre-book terminology split
- [ ] Repo made public by an org admin (attendees clone it; hosts product images)
- [ ] Final external copy approved; deck submitted for AV check
