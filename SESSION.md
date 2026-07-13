# In-session follow-along

**This is your only doc for the live build.** Keep it open. Copy prompts from the fences below; you
do not need to hunt through the repo. Prework (store seed, Payments, Flow install) is already done
per [`workshop-assets/prerequisites.md`](workshop-assets/prerequisites.md). Overview and why: the
[`README`](README.md).

Test every checkpoint **logged into the storefront as your B2B buyer (Maya Cruz)** on the **Combined**
location. Admin preview and DTC visitors do not trigger the block or B2B payment behavior.

---

## How you work (two tabs only)

| Tab | What | Rule |
|---|---|---|
| **1** | Terminal: `pnpm run dev` | Starts in Part 1, **stays running all session**. Press **`g`** here for GraphiQL. |
| **2** | Your AI assistant (Claude / Cursor / etc.) | Paste the prompts. Put it in **auto-accept edits** first. |

No third tab. No `shopify app deploy` during the build. `dev` hot-reloads on save.

**Talk track (three beats after the data model):**

1. **Theme block** so the **buyer** sees pre-book context on the PDP  
2. **Payment Function** so **checkout** has the right terms for pre-book  
3. **Flows** so the **merchant** can manage these orders and payments  

---

## Start the app (Tab 1)

```bash
cd starter/b2b-prebooking-workshop
pnpm install
pnpm run dev
```

<sub>Using npm? Swap `pnpm` for `npm`.</sub>

On first run:

1. Pick your Partner org → your Plus sandbox store → **approve Install in the browser** (one click;
   payment-customizations scope only).
2. If asked for a **storefront password**: Admin → Online Store → Preferences → Password protection.
3. On first `--use-localhost`, when mkcert asks **"Yes, use mkcert to generate it"**, select **Yes**,
   then enter your Mac/admin (sudo) password. One-time per machine.

Leave Tab 1 running.

---

## Part 1 — Data model (Admin, ~5 min)

Definitions already exist (seeded store-owned). You only author **values**.

### 1a. Look (30 sec)

**Settings → Custom data:**

- Metaobjects → **B2B Pre-booking**
- Metafields → Products → **B2B Pre-booking** (`custom.b2b-prebooking`)

### 1b. Create the season

1. **Settings → Custom data → Metaobjects → B2B Pre-booking → Add entry**
2. Fill and **Save**:

| Field | Value |
|---|---|
| Season name | `Spring/Summer 2027` |
| Order start date | `2026-07-01` |
| Order end date | `2026-09-30` |
| Delivery start date | `2027-01-15` |
| Delivery end date | `2027-02-28` |

### 1c. Assign to the five pre-book products

1. **Products** → select the five titles ending in `(Pre-book)`
2. **Edit products** (bulk editor)
3. **Columns → Metafields → B2B Pre-booking**
4. Click the first product's B2B Pre-booking cell, **Shift-click** the last, pick **Spring/Summer 2027** once → **Save**

**Checkpoint:** a pre-book product shows the season on its metafield.

---

## Part 2 — Theme block (buyer sees pre-book) (~6 min)

**Why:** based on the data model you just seeded, the buyer sees ordering + delivery windows and those
values ride on the cart line to checkout (any plan).

### Paste into Tab 2 (AI)

Confirm **auto-accept edits** is on. Copy the **entire** fence:

```text
In this theme app extension, create an app block `blocks/b2b-prebooking.liquid`
with a `product` setting (autofill true).

You only need to edit files (dev is running and hot-reloads); do not run any CLI commands.

Read the product's metaobject reference into a `season` variable from the `custom` namespace:
`product.metafields["custom"]["b2b-prebooking"].value`.

Render only when the season is present AND the buyer is a B2B buyer (`customer.b2b?`),
plus also render in the theme editor (`request.design_mode`) so the block can be positioned.

When shown, display:
- a "Pre-book: {season_name}" badge
- the ordering window (order_start_date to order_end_date)
- the expected delivery window (delivery_start_date to delivery_end_date), formatted as dates
- a short note that the item is placed now and ships in the delivery window with payment due on fulfillment

Use literal English strings for all copy; do NOT use the `| t` translation filter or add a locales
file (theme-check reports false-positive `TranslationKeyExists` errors for app-extension locales,
which is confusing on stage, and this isn't a localization exercise).

Put CSS in `assets/b2b-prebooking.css` and load it with `asset_url | stylesheet_tag`
(theme app blocks cannot use the `{% stylesheet %}` tag). Use neutral colors that read on a light
storefront theme, and do NOT add an OS `prefers-color-scheme` dark-mode media query (the storefront
theme controls the palette, not the visitor's OS).

Add a script that attaches `properties[Season]` and `properties[Delivery window]` to the cart line
so they become visible line item properties. Bake the values into the script from Liquid (`| json`);
do not read metafields client-side.

This is a `target: "section"` block that renders OUTSIDE the product form, and the default Horizon
theme builds the `/cart/add` request from selected fields rather than serializing the whole form,
so do BOTH of these:

(1) inject hidden inputs into the add-to-cart form found at the document level
    (`document.querySelectorAll('form[action*="/cart/add"]')`, not the block's own element),
    idempotently, re-injecting on variant change (`change` on `input[name="id"]`) and section
    re-render (`MutationObserver`);

AND

(2) intercept the `/cart/add` request by patching `window.fetch` and `XMLHttpRequest.prototype.send`,
    and append the `properties[...]` entries ONLY when the request body is a `FormData` whose
    `product-id` equals `block.settings.product.id` (skip when `product-id` is absent or differs,
    so a same-page quick-add of a DIFFERENT product, e.g. "you may also like", is not mis-tagged
    with this product's season).

Part (2) is what makes it work on Horizon; part (1) covers classic themes.
```

### While it builds (~2–3 min): read this with the room

You do **not** need to open any Liquid or CSS files. Two ideas:

1. **Read the season**  
   `product.metafields["custom"]["b2b-prebooking"]`  
   → one line connects the block to the season; nothing hardcoded.

2. **Carry it to checkout**  
   script writes `properties[Season]` + `properties[Delivery window]` onto the cart line  
   → works on any plan (line item properties).

### Place the block

With `dev` still running: open a **pre-book product** in the theme editor → **Add block → Apps →
B2B Pre-booking** → save. No deploy.

### Verify (as Maya Cruz on the storefront)

- Pre-book PDP shows the windows panel  
- Add to cart → `Season` + `Delivery window` on cart and checkout lines  
- Available-now product: no panel, no properties  

**Stuck?** Washed-out on storefront but fine in editor → AI likely added a dark-mode CSS media query;
delete it. Renders but no properties on the line → Horizon needs the fetch intercept (part 2 of the
prompt); confirm Network → `/cart/add` includes `properties[Season]`.

---

## Part 3 — Plus payment Function (right checkout) (~7 min)

**Why:** so a Combined / mixed cart gets **due on fulfillment** and vaults a card (hides "pay later").

### Paste into Tab 2 (AI)

```text
Implement the `cart.payment-methods.transform.run` target.

You only need to edit files in `src/` (dev is running and rebuilds on save);
do not run any CLI commands.

Input query:
- the cart's purchasing company id
- each line's merchandise ... on ProductVariant {
    product { metafield(namespace: "custom", key: "b2b-prebooking") { value } }
  }
- the available paymentMethods { id name }

Logic:
- If there's no purchasing company, return no changes.
- If any line's product has the `custom.b2b-prebooking` metafield set, it's a pre-book cart:
  - return a `paymentTermsSet` operation with an event trigger of `FULFILLMENT_CREATED`
    (due on fulfillment)
  - plus `paymentMethodHide` for any payment method whose name matches the deferred option

Match the deferred method by name. On B2B checkout the underlying name is "Deferred"
(the label shown to buyers is "Choose payment method at a later time").
Keep the match configurable.
```

### While it builds: read this with the room

You do **not** need to open the Function source. Two ideas:

1. **Fail open** — no changes unless B2B **and** a pre-book metafield is present.  
2. **When it acts, two operations** — set due on fulfillment + hide method named `"Deferred"`
   (not the buyer-facing label).

### Activate (Tab 1 → press `g`)

In the `dev` tab, press **`g`**. Set API version to latest stable. Paste:

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

Expect an `id` and empty `userErrors`. Same mutation for everyone (`functionHandle` is fixed).

### Verify (Maya Cruz on Combined)

| Cart | Terms | "Pay later" |
|---|---|---|
| Mixed (available-now + pre-book) | Due on fulfillment | Hidden |
| Available-now only | Net 30 | Visible |

Watch Tab 1 print Function executions on each checkout.

---

## Part 4 — Flows (merchant ops) (~8 min)

**Why:** buyer already has PDP + checkout. Now make **merchant** life easier: filterable pre-book
orders, then auto-charge the vaulted card on fulfillment. **One part, two Sidekick prompts.**

Build both in **Admin → Shopify Flow** (Sidekick).

### 4a. Tag pre-book orders

```text
Create a new Flow to tag orders with the tag "Prebooking"
if the order is a B2B order
and the order has a product tagged "prebook".
```

**While it builds:** B2B guard keeps DTC clean; product tag `prebook` → order tag **`Prebooking`**
(merchant filter + signal for 4b).

**Checkpoint:** a B2B pre-book order gets `Prebooking`; a DTC order with the same product does not.
(Tag can take **2–3 minutes**. Don't wait on stage; you'll re-check in the payoff.)

### 4b. Charge on fulfillment

```text
Create a new Flow to charge the vaulted B2B payment method on a B2B order when:
1) the order has payment terms due on fulfillment,
2) the order is tagged "Prebooking",
3) the order due date has arrived.
```

**While it builds:** trigger = payment schedule due (fulfillment for due-on-fulfillment);
`completedAt` missing = double-charge guard; same Flow serves non-Plus (once) and Plus (per
fulfillment).

**Checkpoint:** fulfilling a pre-book order charges the vaulted method once (show in payoff).

---

## Payoff — full lifecycle on Combined (~4 min)

**Pacing:** place the mixed order first, talk while Flow 1 tags (2–3 min), then fulfill.

1. Three carts: available-now = Net 30 + pay-later; pre-book only / mixed = due on fulfillment, no
   pay-later (point at `Season` / `Delivery window` on the line).
2. Place the **mixed** order. If no card saved, buyer is prompted to vault one.
3. Confirm order tag **`Prebooking`**; filter Orders by that tag.
4. Fulfil available-now line → card charged for that fulfillment; later fulfil pre-book line → charged
   again (Plus per-fulfillment).

---

## Part 5 — Non-Plus adaptation (talk, no new code) (~8 min)

Same theme block + both Flows. Without Plus:

- Two locations with **static** terms (Available Now = Net 30, Pre-book = due on fulfillment)
- Force-vault via an **App Store** app (custom Function apps need Plus)
- No mixed smart cart; journeys are pre-separated

Your seeded store already has those two locations so you can demo the split.

---

## Quick recovery

| Problem | Fix |
|---|---|
| `dev` died with `AbortError` | Restart: `pnpm run dev` |
| Red `TranslationKeyExists` in terminal | Ignore (theme-check false positive) if you used `| t`; prompt asks for literal strings |
| GraphiQL: Could not find Function | `dev` must be running; retry press `g` |
| Scope error on activation | See [`payment-customization-activation.md`](workshop-assets/payment-customization-activation.md) |
| Need a full reset | [`reset.md`](workshop-assets/reset.md) |

---

## Optional deeper detail

Prompt files with the same paste blocks plus longer teach notes:
[`prompts/`](prompts/). Presenter clock/cue card:
[`workshop-assets/presenter-runbook.md`](workshop-assets/presenter-runbook.md).
