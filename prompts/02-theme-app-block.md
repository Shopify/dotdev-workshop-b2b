# 2. Theme app block: PDP windows + line item properties  [both]

This block shows the pre-book ordering and delivery windows on the product page for B2B
buyers, and attaches the season and delivery window to the cart line as visible line item
properties so they carry through to cart, checkout, and the order.

## Data model (comes from the app, not built here)

The season data model is **app-owned**: it's declared in the app's `shopify.app.toml` (`$app`
namespace) and created when you run `shopify app dev`. You don't build the definitions in this step.

**Read it first (30 seconds, this is the teach).** Open `shopify.app.toml` and find the two blocks:

```toml
[metaobjects.app.b2b-prebooking]        # the "season" type
...
[product.metafields.app.b2b-prebooking] # the product's reference to a season
type = "metaobject_reference<$app:b2b-prebooking>"
```

- A `b2b-prebooking` **metaobject** ("season") with fields `season_name` (single line text),
  `order_start_date`, `order_end_date`, `delivery_start_date`, `delivery_end_date` (dates),
  storefront public read, `access.admin = "merchant_read_write"`.
- A product **metafield** `b2b-prebooking` of type `metaobject_reference<$app:b2b-prebooking>`,
  storefront public read, `access.admin = "merchant_read_write"`.

`access.admin = "merchant_read_write"` opens the **values** to Admin (assign a season on the product
page); the **schema** stays app-owned/read-only. Two expected quirks of app-owned definitions: they
show as app-managed in Settings, Custom data, and they **can't be pinned** to the top of the product
page (pinning isn't supported for declarative TOML definitions), so the field lives under the
product's **Metafields** section (Show all). That's cosmetic; the customer-facing windows come from
the theme block on the storefront, not this Admin field.

Declaring the schema here (rather than hand-running `metaobjectDefinitionCreate`) is the modern,
app-owned pattern: the definitions version with your app and can't drift per store. **After
`shopify app dev` syncs them, confirm in Admin under Settings, Custom data** that a "B2B Pre-booking"
metaobject and product metafield now exist. No mutations, the app created them.

Then seed one season entry and set the metafield on each pre-book product **in the Shopify admin**
(Settings, Custom data), see `../workshop-assets/data-model-seed.md`. That's the part you author: the
**values**, not the definitions (`access.admin = "merchant_read_write"` is what makes them editable in
Admin; GraphiQL is the optional code path). The presence of that product metafield is what marks a
product as "pre-book."

## Open the scaffolded extension

The starter already includes `extensions/prebooking-theme/` with `blocks/b2b-prebooking.liquid`
as a **stub** (the `{% schema %}` + `product` setting, no logic yet) and an empty
`assets/b2b-prebooking.css`. You implement the block there, no need to generate it.

(Building from scratch instead? `shopify app generate extension --template theme_app_extension --name prebooking-theme`.)

## Prompt (Cursor / your AI tool)

> In this theme app extension, create an app block `blocks/b2b-prebooking.liquid` with a
> `product` setting (autofill true). Read the product's app-owned metaobject reference into a
> `season` variable using the reserved `$app` namespace:
> `product.metafields["$app"]["b2b-prebooking"].value`. Render only when the season is present AND the buyer is
> a B2B buyer (`customer.b2b?`), plus also render in the theme editor (`request.design_mode`)
> so the block can be positioned. When shown, display a "Pre-book: {season_name}" badge, the
> ordering window (order_start_date to order_end_date) and the expected delivery window
> (delivery_start_date to delivery_end_date), formatted as dates, and a short note that the
> item is placed now and ships in the delivery window with payment due on fulfillment. Put
> CSS in `assets/b2b-prebooking.css` and load it with `asset_url | stylesheet_tag` (theme app
> blocks cannot use the `{% stylesheet %}` tag). Add a script that injects hidden inputs
> `properties[Season]` and `properties[Delivery window]` into the product's add-to-cart form
> so they become visible line item properties.

## Place it

Deploy (`pnpm shopify app deploy`), then in the theme editor open a **pre-book product** and
add the block to the product template (Add block, Apps). The `design_mode` condition lets you
see it in the editor even though you aren't a logged-in B2B buyer.

## You should see

On a pre-book product, a logged-in B2B buyer sees the windows panel. Adding to cart from the
product page attaches `Season` and `Delivery window` to that cart line, visible on cart and
checkout. Available-now products show nothing and get no properties.

## Teach

- **Line item property `name` vs the value the theme reads.** Metafields are resolved
  server-side in Liquid and baked into the script; the JS does not read metafields client-side.
- **Coverage limit.** Because the block only knows the current product's season, adds from
  other entry points (quick-add tiles, a bulk order form) won't be tagged. Making it airtight
  across all add paths is a good extension exercise: precompute a variant-to-season map site-wide
  and intercept `/cart/add`.
