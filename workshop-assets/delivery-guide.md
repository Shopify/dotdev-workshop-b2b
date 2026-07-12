# Delivery guide: Building B2B Pre-Orders

Presenter-facing. This is the run-of-show for the 60-minute session: timings, what you say and
show, the firsthand teaches, and the checkpoints. The attendee-facing build steps live in
`hands-on-guide.md`; this guide wraps a narrative and a clock around them.

> **Terminology note.** The audience-facing concept is **pre-order** (matches the event title and
> how merchants ask for it). The technical product state we tag and build against is **pre-book**
> (`prebook` tag, `b2b-prebooking` metaobject). Say "pre-order" to the room; the code says
> `prebook`. Raised with Gita 2026-07-10; confirm the split is settled at the dry run.

---

## Summary

| Field | Answer |
|---|---|
| Working title | Building B2B Pre-Orders: order now, pay and ship by season |
| Presenter (build) | Brandon Anderson (hands-on build) |
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

Attendees complete these **before** the session (full steps in `prerequisites.md`): a **US** Plus
sandbox store with B2B on; **Shopify Payments in test mode** with a vaulted test card; **payment
capture not set to at-checkout** (manual or on-fulfillment, either works); **clone the repo** (the setup script runs from it); run the pre-work
**setup script** (products, collections, company/buyer, locations, markets, catalogs, terms, DTC);
`shopify store auth` with the scope list; install the **GraphiQL app** and **Shopify Flow**; an AI
assistant with the Dev MCP + AI Toolkit. `pnpm install` is an **in-session** step (like the other
workshops); the store structure is scripted; the **data model is created by the app**
(`shopify app dev`), not pre-work.

**Contingency (for stragglers).** The line that matters is **local vs server-side**. The clone and
`pnpm install` are local and fast (~100 MB, well under a minute on the venue wifi), and `pnpm install`
is a normal in-session step anyway, so a straggler who's missing local pieces catches up in the
opening. What is **not** recoverable in the room is the **seeded store** (products, company,
locations, catalogs, terms, Payments, Flow): minutes of API calls plus a 5-to-10-minute manual
Payments KYC. So the pre-seed and Payments/Flow are the hard prereqs; someone who never ran them
follows along on the presenter's screen and rebuilds from `finished` after. Have TAs sweep during
the opening with the question that matters: not "did you install?" but **"is your store seeded?"**

**TA briefing, #1 support item: Shopify Payments.** We are the only DotDev workshop that requires it,
and its onboarding is the most failure-prone prereq (US store + identity/SSN + KYC banners). TAs
should know the workaround cold: business type Individual, a made-up name, a real-looking US address,
SSN `078-05-1120` (the classic voided one; `000-00-0000` and `987-65-...` are rejected), then **ignore**
the "some details couldn't be verified" / "select a plan" banners, test mode still processes test
charges and vaults cards. Anyone who can't get Payments working can still build everything and watch
the live vault + charge on the presenter's screen.

---

## Opening: show the end goal (~3 min)

**Demo, no code.** On a seeded B2B store, logged in as a Plus buyer at the Combined location:

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

> 💡 Highest-ROI 4 minutes in the session. They see the destination before any code, so every step
> later has a "why."

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

## Part 1: The toolkit (~4 min)

Walk the building blocks on screen (no code yet). This is also the reference map they take home.

- **Season data model (metaobject + product metafield):** the pre-order "season" (ordering +
  delivery windows) lives on the **product** via an app-owned metaobject; a product metafield
  references it. That metafield is also what marks a product as "pre-order."
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
else works on Advanced. The whole game is which combination you reach for on which plan."

> 💡 Liam's open question on the outline was whether the toolkit is a doc the audience gets. Yes:
> the pattern map in the close is this slide as a take-home reference.

---

## Part 2: Build the Plus experience (~25 min, hands-on)

This is the exercise. Attendees code along; the `finished` branch is the recovery path if anyone
falls behind. Each sub-part has a checkpoint.

### 2a. App data model + theme block (~11 min)  [both]
Two beats; keep them mentally separate so a stall on seeding doesn't eat the theme-block time.

**Beat 1, the data model (~5 min).** In the already-cloned starter app
(`starter/b2b-prebooking-workshop`), run `pnpm install` (~100 MB, under a minute on the venue wifi)
then `shopify app dev` (`--use-localhost`). Before seeding, **open `shopify.app.toml` and read the
two data-model blocks**: the app declares the `b2b-prebooking` metaobject + product metafield, so
`dev` creates those definitions (in the `$app` namespace) for you, no mutations, confirm them in
**Settings, Custom data**. Then seed one **season** entry and assign it to the pre-order products
(`workshop-assets/data-model-seed.md`).
**Teach.** The data model is **app-owned**: declaring the metaobject + metafield in
`shopify.app.toml` versions the schema with the app and avoids per-store mutation drift; `$app`
scopes it to your app. Only the **values** (the season entry + the per-product assignment) are
authored at runtime.

**Beat 2, the theme block (~6 min).** Build the block from `prompts/02-theme-app-block.md` (it reads
`$app:b2b-prebooking`), add it to the product template, and preview a pre-order product.
**Teach.** The block reads the season server-side in Liquid and injects **visible line item
properties** (`Season`, `Delivery window`) into the add-to-cart form, the all-plans way to carry
pre-order context to cart and checkout; non-Plus has no other hook there (works everywhere, not a
Plus feature).

**Checkpoint.** ✅ `metafieldDefinitions(ownerType: PRODUCT)` shows the `$app` `b2b-prebooking` field;
a B2B buyer on a pre-order product sees the windows; adding it shows `Season` and `Delivery window`
on the cart line and at checkout. Available-now shows nothing.

### 2b. Flow: tag pre-order B2B orders (~4 min)  [both]
**Step.** Build Flow 1 from `prompts/03-flow-tag-prebook-orders.md` (Sidekick prompt).
**Teach.** Iterate the Sidekick prompt and read what it generates. The B2B guard keeps DTC orders
untagged; the `Prebooking` tag is both a merchant filter and the signal Flow 2 keys on.
**Checkpoint.** ✅ A new B2B order with a pre-order product gets the `Prebooking` tag; a DTC order
does not.

### 2c. Flow: charge the vaulted card on fulfillment (~4 min)  [both]
**Step.** Build Flow 2 from `prompts/04-flow-charge-on-fulfillment.md` (Sidekick prompt).
**Teach.** One Flow serves both plans: non-Plus charges once at full fulfillment, Plus charges per
fulfillment, driven by how each plan generates payment schedules, not by anything you author. The
`completedAt does not exist` condition is your double-charge guard. (Hard-won: without it, a
re-fulfillment double-charges.)
**Checkpoint.** ✅ Fulfilling a pre-order order charges the vaulted method for the due amount, once.

### 2d. Plus payment-terms Function (~7 min)  [Plus]: the payoff
**Step.** Build and deploy the Function from `prompts/05-plus-payment-terms-function.md`, then
activate it via `payment-customization-activation.md` (GraphiQL).
**Teach.** This is the Plus payoff: on the combined location, a mixed cart flips **only that
checkout** from Net 30 to due-on-fulfillment (`paymentTermsSet`, Plus-only) and hides the deferred
option, so the buyer gets one smart cart. Two firsthand gotchas: (1) match the deferred method by
its **real input name** (`"Deferred"`), not the display label; (2) fail open, return no change for
non-B2B and available-now-only carts, because the Function runs on every checkout.
**Checkpoint.** ✅ Mixed cart on the combined location flips to due-on-fulfillment and hides
deferred; available-now-only cart stays Net 30; Flow 2 then charges per fulfillment.

> 💡 Every sub-part carries a firsthand teach (line-item-properties as the all-plans hook, the
> double-charge guard, the input-name gotcha, fail-open). That density is the "why in-person."

---

## Part 2 payoff: the pre-order lifecycle, end to end (~4 min)

Everything is built; now run the whole lifecycle live on the **combined** location. This is the
money shot, it's what they just built, all working together. (The Opening was a ~30-60s teaser; here
you go deeper, so the repeat is deliberate reinforcement.)

**1. Three carts, three behaviors** (same buyer, same location):
- **Available-now only** → checkout is **Net 30** and "choose payment method later" is available.
- **Pre-order only** → checkout flips to **due on fulfillment**; "pay later" is gone (a card is
  required).
- **Mixed** (available-now + pre-order) → **due on fulfillment**, "pay later" gone. Point out
  `Season` and `Delivery window` on the pre-order line. One cart, terms auto-set by the Function.

**2. Place the mixed order.** If the buyer doesn't check "save card," they're **prompted to add a
card**: the order carries terms, so a vaulted method is required. Place it.

**3. It's tagged and filterable.** Flow 1 auto-tags the order `Prebooking`. Show the Orders list
**filtered by the `Prebooking` tag**, the merchant's clean pre-order view.

**4. Two fulfillments, two automatic charges** (the payoff):
- Fulfil the **available-now** line → Flow 2 charges the vaulted card for **that** fulfillment.
- Later, fulfil the **pre-order** line → Flow 2 charges the vaulted card **again**, for that
  fulfillment.

**Land it:** "Two automatic charges, one per fulfillment, and no one ever touched the card. That's
per-fulfillment charging + due-on-fulfillment terms + the Function + the Flow, all working together
on one Plus order."

> 💡 The single most impressive minute in the session (two hands-off charges on one order). It's
> also the exact thing non-Plus **can't** do, which sets up the pivot.

---

## Part 3: Adapt for a non-Plus merchant (~8 min)

**Step / show.** On the pre-seeded two-location store, walk the non-Plus arrangement: the buyer
orders available-now and pre-order from **separate Company Locations**, each with fixed terms
(Available Now = Net 30, Pre-book = due on fulfillment). The theme block and both Flows you just
built work unchanged. No new code.

**Teach (the discovery):** "Your merchant isn't on Plus. You lose exactly two things: per-fulfillment
charging and the terms Function. So you can't switch terms mid-checkout and you can't split charges
on one order. The move is to pre-separate the journeys into two locations with fixed terms. Same
building blocks, different arrangement. The one thing you still need is to force a vaulted card,
and since custom-app Functions require Plus, on Advanced that hide comes from an **App Store app**,
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
6. **Where do the season dates live, and who edits them?** In the app-owned `b2b-prebooking`
   metaobject (`$app` namespace), declared in the app's `shopify.app.toml`; edit them in one place
   and both the block and the Function read them.
7. **Why is the data model in the app config instead of a mutation?** Shopify's Custom Data guidance:
   declare static metaobject/metafield definitions in `shopify.app.toml` so they version with the app
   and don't drift per store. Only the values (season entry + product references) are written at runtime.
8. **My Shopify Payments won't verify / says "select a plan."** Expected on a sandbox. Use the test
   SSN, ignore the "couldn't be verified" and "select a plan" banners, test mode still processes test
   charges and vaults cards. (TA: this is the top support item.)

---

## Materials checklist

| Material | Status | Location |
|---|---|---|
| Slide deck (open + framing + toolkit + close) | TODO | DotDev 26 Workshops template (Light/Orange) |
| Starter repo (scaffold + pre-seed prompt/script) | In progress | `dotdev-2026-building-b2b` |
| Finished-state branch (reference/recovery) | TODO | `finished` branch |
| Attendee HOK guide | ✅ | `workshop-assets/hands-on-guide.md` |
| Prerequisites (frozen) | ✅ draft | `workshop-assets/prerequisites.md` |
| Pre-seed setup (script primary; AI prompt optional) | ✅ | `workshop-assets/setup/`, `prompts/00-store-setup.md` |
| Data model seed (in-session, Admin; GraphiQL optional) | ✅ | `workshop-assets/data-model-seed.md` |
| Reset / redo reference | ✅ | `workshop-assets/reset.md` |
| Pattern map take-home | TODO | reference doc / toolkit slide |
| Practice recordings | TODO | dry run Monday |

## Pre-submission checklist

- [ ] Every part has ≥1 Step and ≥1 Teach; each ends with an observable checkpoint
- [ ] HOK is followable independently; code blocks complete and tested
- [ ] Starter puts attendees at the exercise start; `finished` branch linked
- [ ] Anticipated Q&A listed (6); Q&A protected at 10 min
- [ ] Close names a concrete take-home (pattern map + finished branch)
- [ ] Screen legibility: ≥18pt terminal / 150% editor / high-contrast
- [ ] Timed: Opening 3 + Framing 5 + Toolkit 4 + Build 25 + Payoff 4 + Non-Plus 7 + Close 2 + Q&A 10 = 60
- [ ] TA has run the full exercise end to end
- [ ] Prerequisites specific and frozen; store structure pre-seeded (script), data model created by the app
- [ ] **Shopify Payments** (test mode) + capture not at-checkout (manual or on-fulfillment) + US store called out in the attendee prereq email; **TAs briefed on Payments as the #1 support item**
- [ ] Data model declared in `shopify.app.toml` (`$app`); created on `shopify app dev`, not pre-work
- [ ] Gita aligned on Plus-first order and the pre-order/pre-book terminology split
- [ ] Repo made public by an org admin (attendees clone it; hosts product images)
- [ ] Final external copy approved; deck submitted for AV check
