# Follow along

Your single doc for building B2B pre-booking in this session. Keep it open and work top to bottom.
Copy the prompts straight from the fenced blocks, you don't need to open any other file in the repo.

> **This is an AI-assisted ("vibe coding") build, not hands-on coding.** You paste the prompts below into
> your AI assistant and it writes the code, you don't hand-write or debug it. Read what it produces; if a
> step misbehaves, use the recovery steps at the end (you drop in the finished version, you never debug).

Your prework (store seed, Shopify Payments in test mode, Shopify Flow installed) is already done, per
[`workshop-assets/prerequisites.md`](workshop-assets/prerequisites.md). Background and the "why": the
[`README`](README.md).

Test every checkpoint while **logged into the storefront as your B2B buyer (Maya Cruz)** on the
**Combined** location. The admin preview and normal (DTC) visitors won't trigger the block or the B2B
payment behavior, so always check as the buyer.

---

## How you work: two tabs

| Tab | What | Notes |
|---|---|---|
| **1** | Terminal running `shopify app dev --use-localhost` | Starts in setup, **stays running all session**. Press **`g`** here to open GraphiQL. |
| **2** | Your AI assistant (Claude / Cursor / etc.) | Where you paste the build prompts. Turn on **auto-accept edits** first. |

No third tab. You don't run `shopify app deploy` during the build, `dev` rebuilds on save.

**What you'll build, in order:**

1. **Data model:** the season the rest of the build reads.
2. **Theme block:** so the buyer sees pre-book windows on the product page.
3. **Payment Function:** so checkout gets the right terms for pre-book.
4. **Flows:** so the store owner can manage these orders and payments automatically.
5. **Non-Plus:** how the same outcome looks without Plus.

---

## Set up the app (Tab 1)

A one-time setup that registers your app **with** the payment-customizations permission *before* you
install it, so activation in Part 3 works the first time. **Run these one at a time**, top to bottom,
each is its own step (a couple are interactive, so don't paste them as a batch).

Move into the app folder:

```bash
cd starter/b2b-prebooking-workshop
```

Install dependencies:

```bash
pnpm install
```

Create your app. When prompted, pick your Partner org, choose **create it as a new app**, name it, and **release** the version:

```bash
shopify app deploy
```

Set the payment-customizations scope your app needs, then redeploy (**release** again when prompted). This is what makes Part 3 activation work the first time:

```bash
pnpm run set-scopes
```

Start the dev session. Pick your store and **approve the install in your browser** (the consent screen now lists payment customizations). Leave this running all session; press **`g`** here to open GraphiQL:

```bash
shopify app dev --use-localhost
```

<sub>Using npm? `npm install`, `npm run set-scopes`; the `shopify …` commands are the same either way.</sub>

On the first `shopify app dev --use-localhost` run you may also be asked for your **storefront password** (Admin → Online Store → Preferences) and, for `--use-localhost`, a mkcert prompt: choose **"Yes, use mkcert to generate it"** and enter your Mac/sudo password (one-time per machine).

`--use-localhost` serves the dev session over a local HTTPS proxy instead of a Cloudflare tunnel, which avoids room-wide throttling when everyone starts at once.

Leave Tab 1 (`dev`) running for the rest of the session.

---

## Part 1: Data model (in Admin)

The definitions already exist on your store (seeded in prework). You author the **values**: one season,
then assign it to your pre-book products.

### 1a. See the definitions

**Settings → Custom data:**

- Metaobjects → **B2B Pre-booking**
- Metafields → Products → **B2B Pre-booking** (`custom.b2b-prebooking`)

### 1b. Create the season

1. **Settings → Custom data → Metaobjects → B2B Pre-booking → Add entry**
2. Fill in and **Save**:

| Field | Value |
|---|---|
| Season name | `Spring/Summer 2027` |
| Order start date | `2026-07-01` |
| Order end date | `2026-09-30` |
| Delivery start date | `2027-01-15` |
| Delivery end date | `2027-02-28` |

### 1c. Assign the season to the five pre-book products

1. **Products** → select the five titles ending in `(Pre-book)`
2. **Edit products** to open the bulk editor
3. **Columns → Metafields → B2B Pre-booking**
4. Click the first product's B2B Pre-booking cell, **Shift-click** the last one, pick **Spring/Summer
   2027** once, and it applies to all selected → **Save**

**Checkpoint:** a pre-book product shows the season on its B2B Pre-booking metafield.

---

## Part 2: Theme block

The block reads the season you just seeded, shows the ordering + delivery windows to the buyer, and
attaches those values to the cart line so they carry through to checkout (works on any plan).

### Paste into Tab 2 (your AI assistant)

Make sure **auto-accept edits** is on, then copy the **entire** block:

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

Put all CSS in a single inline `<style>` block inside the Liquid file. Do NOT use a separate
`assets/` CSS file or `asset_url` (theme app blocks cannot use the `{% stylesheet %}` tag either);
an inline `<style>` is Shopify's recommended way to ship instance-specific block CSS and, unlike an
external asset, it can't be knocked out by dev-preview asset-URL rotation when a sibling extension
rebuilds. Use neutral colors that read on a light storefront theme, and do NOT add an OS
`prefers-color-scheme` dark-mode media query (the storefront theme controls the palette, not the
visitor's OS).

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

### While it builds: what's happening

Two ideas to understand the block (no need to open the files):

1. **It reads the season** from `product.metafields["custom"]["b2b-prebooking"]`, one line, nothing
   hardcoded, so it updates automatically when the season changes.
2. **It carries context to checkout** by writing `properties[Season]` and `properties[Delivery window]`
   onto the cart line, line item properties that work on any plan.

### Place the block

With `dev` still running: open a **pre-book product** in the theme editor → **Add block → Apps → B2B
Pre-booking** → save. No deploy needed.

### Verify (as Maya Cruz on the storefront)

- A pre-book product page shows the windows panel.
- Adding it to cart puts `Season` + `Delivery window` on the cart and checkout lines.
- An available-now product shows no panel and adds no properties.

**If it looks off:** washed-out on the storefront but fine in the theme editor usually means a
dark-mode CSS media query slipped in, remove it. If the block renders but nothing appears on the cart
line, the `/cart/add` intercept (part 2 of the prompt) is missing; check DevTools → Network → the
`/cart/add` request should include `properties[Season]`.

---

## Part 3: Plus payment Function

On the Combined location, a mixed cart should switch to **due on fulfillment** and hide "pay later" so
a card gets vaulted. That's what this Function does.

### Paste into Tab 2 (your AI assistant)

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

### While it builds: what's happening

1. **It fails open:** no changes unless the cart is B2B **and** contains a pre-book item. Everything
   else passes through untouched.
2. **When it acts, it does two things:** set terms to due on fulfillment, and hide the method named
   `"Deferred"` (that's the real name, not the buyer-facing "Choose payment method at a later time").

### Activate it (Tab 1 → press `g`)

In the `dev` tab press **`g`** to open GraphiQL, set the API version to the latest stable, and run:

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

You should get back an `id` with empty `userErrors`. This mutation is the same for everyone (the
`functionHandle` is fixed in the starter).

### Verify (as Maya Cruz on Combined)

| Cart | Terms | "Pay later" |
|---|---|---|
| Mixed (available-now + pre-book) | Due on fulfillment | Hidden |
| Available-now only | Net 30 | Visible |

Tab 1 prints a line each time the Function runs at checkout.

---

## Part 4: Flows

Automate the merchant's order handling with Shopify Flow (build in **Admin → Shopify Flow** with
Sidekick). **4a (charge on fulfillment) is required, build it first.** **4b (tag) is optional**, a
filtered-view nicety you can do if there's time or leave as a take-home.

### 4a. Charge on fulfillment (required)

```text
Shopify Flow: Charge vaulted B2B payment on due installment

Trigger: Payment schedule due
Condition: paymentSchedule.completedAt is nil (installment not yet collected)
Action: Capture vaulted payment method, using paymentSchedule.id

Do not use an order-level paid check. The condition must be installment-specific to avoid
double-charging. Designed for per fulfillment B2B payment capture.
```

The trigger fires when a payment schedule comes due (for due-on-fulfillment, that's when you fulfill).
The `completedAt is nil` check is **installment-specific**, it skips any schedule that's already been
collected, so it never double-charges (an order-level "paid" check would over-charge on multi-installment
orders). It acts on the **payment schedule, not any tag**, so it stands on its own. Same Flow on both
plans: non-Plus charges once at full fulfillment, Plus charges per fulfillment.

**Prefer not to build it live?** Import the ready-made workflow instead:
[`workshop-assets/flow/flow-2-charge-on-fulfillment.flow`](workshop-assets/flow/flow-2-charge-on-fulfillment.flow)
(Shopify Flow → **Import**). Built, it looks like this:

<a href="workshop-assets/flow/images/charge-on-fulfillment-flow.png"><img src="workshop-assets/flow/images/charge-on-fulfillment-flow.png" alt="Charge vaulted B2B payment Flow: Payment schedule is due trigger, then a Payment schedule completed at does not exist condition, then a Charge vaulted payment for B2B order action" width="320"></a>

<sub>Click to enlarge.</sub>

**Checkpoint:** fulfilling a pre-book order charges the vaulted method once (you'll see this in the
run-through below).

### 4b. Tag pre-book orders (optional)

```text
Create a new Flow to tag orders with the tag "Prebooking"
if the order is a B2B order
and the order has a product tagged "prebook".
```

The B2B condition keeps normal (DTC) orders untagged. The product tag `prebook` is what identifies a
pre-book line; the order tag **`Prebooking`** lets the store owner filter their Orders list to just the
pre-book orders. Purely for visibility, the charge Flow above doesn't depend on it, so skip it if you're
short on time.

**Prefer not to build it live?** Import the ready-made workflow instead:
[`workshop-assets/flow/flow-1-tag-prebook-orders.flow`](workshop-assets/flow/flow-1-tag-prebook-orders.flow)
(Shopify Flow → **Import**). Built, it looks like this:

<a href="workshop-assets/flow/images/tag-prebook-orders-flow.png"><img src="workshop-assets/flow/images/tag-prebook-orders-flow.png" alt="Tag pre-book orders Flow: Order created trigger, then a Company id exists condition, then a product tag is prebook condition, then an Add order tags: Prebooking action" width="320"></a>

<sub>Click to enlarge.</sub>

**Checkpoint:** a new B2B pre-book order gets the `Prebooking` tag; a DTC order with the same product
does not. The tag is async (a couple of minutes) and nothing waits on it.

---

## See it all work together (on Combined)

The charge Flow charges off the payment schedule, not the tag, so you don't wait on the tag Flow here.

1. Compare three carts: available-now = Net 30 with pay-later; pre-book only and mixed = due on
   fulfillment with no pay-later (and `Season` / `Delivery window` on the line).
2. Place the **mixed** order. If you didn't save a card, you're prompted to vault one (the order carries
   terms).
3. Fulfil the available-now line → the vaulted card is charged for that fulfillment. Fulfil the
   pre-book line → it's charged again (Plus charges per fulfillment). No waiting on any tag.
4. If you built the optional tag Flow, the order is also tagged **`Prebooking`**, so the store owner can
   filter the Orders list to just pre-book orders. That tag is async (a couple of minutes) and doesn't
   gate the charge.

---

## Part 5: How this changes for a non-Plus merchant (no new code)

The theme block and both Flows work unchanged. Without Plus:

- Two locations with **fixed** terms (Available Now = Net 30, Pre-book = due on fulfillment) instead of
  one Combined location that switches terms.
- Force-vaulting a card comes from an **App Store app** (custom apps with Functions require Plus).
- No single mixed cart; the two journeys are kept separate.

Your seeded store already has both locations, so you can see the split.

---

## Quick recovery

**Golden rule:** if a step's code is broken and the fix isn't obvious in a minute, drop in the finished
version and keep moving. The `finished` branch has every file completed, so from
`starter/b2b-prebooking-workshop` you can run `git checkout finished -- <path>` and `dev` hot-reloads it.

| Problem | Fix |
|---|---|
| `dev` stopped (`AbortError`), or the block suddenly renders **unstyled** (CSS 404), often right after a build step | Work down this ladder: **1)** restart `shopify app dev --use-localhost` + hard-refresh the storefront; **2)** if the preview is stuck (`app-preview` errors, edits not landing): `shopify app dev clean` then `shopify app dev --use-localhost`; **3)** if it says **"CLI credentials are invalid"**: `shopify auth logout` → `shopify auth login`, then `shopify app dev --use-localhost`. |
| **Theme block** is broken / won't style / no properties on the cart, and you're stuck | `git checkout finished -- extensions/prebooking-theme/blocks/b2b-prebooking.liquid`, save; re-add the block in the theme editor if needed. |
| **Payment Function** behaves wrong, and you're stuck | `git checkout finished -- extensions/prebooking-payment-terms/src/*`, then re-activate via press-`g`. |
| Red `TranslationKeyExists` lines in the terminal | Ignore them (theme-check false positive); the prompt uses literal strings to avoid this |
| GraphiQL says "Could not find Function" | `dev` must be running; press `g` again |
| Activation says `ACCESS_DENIED` / needs `write_payment_customizations` | Run `pnpm run set-scopes` in `starter/b2b-prebooking-workshop`, re-approve the install in the browser, then re-run the mutation. More: [`payment-customization-activation.md`](workshop-assets/payment-customization-activation.md) |
| **Flow** (4a/4b) built wrong by Sidekick | Import the ready-made `.flow` files from [`workshop-assets/flow/`](workshop-assets/flow/) instead. |
| Want to start a part over | [`reset.md`](workshop-assets/reset.md) |

---

## More detail

The same prompts with longer explanations live in [`prompts/`](prompts/).
