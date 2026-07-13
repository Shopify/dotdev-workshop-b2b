# 2. Theme app block: PDP windows + line item properties  [both]

This block shows the pre-book ordering and delivery windows on the product page for B2B
buyers, and attaches the season and delivery window to the cart line as visible line item
properties so they carry through to cart, checkout, and the order.

## Data model (already on your store, not built here)

The season data model was created **store-owned** by the pre-work seed script, so it already exists on
your store. You don't build the definitions in this step. See them in Admin under **Settings, Custom
data**:

- A `b2b_prebooking` **metaobject** ("season") with fields `season_name` (single line text),
  `order_start_date`, `order_end_date`, `delivery_start_date`, `delivery_end_date` (dates),
  storefront public read.
- A product **metafield** `custom.b2b-prebooking` of type `metaobject_reference` to a season,
  storefront public read. **The presence of this metafield on a product is what marks it "pre-book."**

Because it's store-owned (not app-owned), the metafield is fully editable and pinnable in Admin, which
is how you seed one season entry and assign it to each pre-book product **in Part 1** (see
`../workshop-assets/data-model-seed.md`). That's the part you author, the **values**; the definitions
are already there. This block just reads them.

## Scaffold (already in the starter)

The starter already includes `extensions/prebooking-theme/` with a stub block and empty CSS. You
implement the block there (no generate step). You do **not** need to open those files to follow along;
the teach callouts below show what matters.

## Prompt (copy the whole fence into your AI)

> **Speed it up.** This build is **edit-only**, `shopify app dev` hot-reloads on save, so the AI only
> needs to edit files; it does **not** need to run any commands. Before you paste, put your AI tool in
> **auto-accept edits** so it doesn't stop for approval on every file (Claude Code: Shift+Tab to
> "auto-accept edits on"; Cursor: enable Auto-Run). The starter ships `.claude/settings.json` that does
> this for Claude Code automatically. Commands still prompt, so if the AI proposes one, you can decline;
> it isn't needed here.

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

### While it builds (~2–3 min): talk this through

You do **not** need to open the Liquid file. Say these two ideas out loud:

1. **Read the season (one line):**  
   `product.metafields["custom"]["b2b-prebooking"]`  
   *"This is the whole data-model connection. The block reads the season we attached to this product.
   Nothing is hardcoded, so it updates when you change the season."*

2. **Carry context to checkout (any plan):**  
   the script that writes `properties[Season]` and `properties[Delivery window]` onto the cart line  
   *"This is how pre-book context reaches cart and checkout on any plan, no Plus required. Line item
   properties show in the cart, at checkout, and on the order."*

Two sentences for the whole block: **read the season, carry it to checkout everywhere.**

> **If the block looks fine in the theme editor but washed-out on the storefront** (invisible panel,
> unreadable text), your AI likely added a `@media (prefers-color-scheme: dark)` block and your OS is
> in dark mode. The editor renders light so it hides the bug. Delete that media query, the block should
> follow the storefront theme, not the OS. (The `finished` branch CSS is the known-good reference.)

> **If the block renders but nothing appears on the cart/checkout line item**, form injection alone
> isn't reaching the request. The default Horizon theme builds the `/cart/add` body from selected fields
> (you'll see `form_type`, `product-id`, `sections` but no `properties[...]` in the payload) rather than
> serializing the whole form, so hidden inputs get dropped. Fix: also intercept `/cart/add` by patching
> `window.fetch` and `XMLHttpRequest.prototype.send` and appending the `properties[...]` to the FormData
> body (gated to this product via `product-id`), as the prompt specifies. Confirm in DevTools, Network:
> the `/cart/add` payload should now include `properties[Season]`. Also test on the real storefront as
> the B2B buyer, not the theme-editor preview.

## Place it

No deploy: with `shopify app dev` running, the block is served as a **development block** and shows up
in the theme editor immediately. Open a **pre-book product** in the theme editor and add the block to
the product template (Add block, Apps, B2B Pre-booking). The `design_mode` condition lets you see it in
the editor even though you aren't a logged-in B2B buyer. (Keep `dev` running while you preview, the
block's assets are served by `dev`.)

## You should see

On a pre-book product, a logged-in B2B buyer sees the windows panel. Adding to cart from the
product page attaches `Season` and `Delivery window` to that cart line, visible on cart and
checkout. Available-now products show nothing and get no properties.

## Teach (deeper, optional)

- **Line item property `name` vs the value the theme reads.** Metafields are resolved
  server-side in Liquid and baked into the script; the JS does not read metafields client-side.
- **Coverage limit.** The block only loads on the pre-book product's PDP and only knows *that*
  product's season, so adds from other entry points (home/collection quick-add tiles, a bulk order
  form) aren't tagged, and the `product-id` guard deliberately skips same-page quick-adds of *other*
  products (e.g. "you may also like") so they don't get the wrong season. Making it airtight across
  all add paths is a good extension exercise: precompute a variant-to-season map site-wide and
  intercept `/cart/add` globally.
