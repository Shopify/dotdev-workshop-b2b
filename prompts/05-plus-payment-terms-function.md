# 5. Plus payment-terms Function  [Plus]

This is the Plus differentiator for the single-location mixed cart. A payment-customization
Function detects a pre-book item in the cart and, for that checkout only:

1. switches payment terms from Net 30 to due-on-fulfillment (`paymentTermsSet`), and
2. hides the deferred "choose payment method at a later time" option to force a vaulted card.

## Why Plus

- The `paymentTermsSet` operation is Plus + B2B only.
- On non-Plus, a static location default handles the terms (the pre-book location is set to
  due-on-fulfillment), and force-vaulting comes from an **App Store (public) app**, because
  custom apps that contain Functions require Plus.

## Open the scaffolded extension

The starter already includes `extensions/prebooking-payment-terms/` with a **stubbed**
`src/cart_payment_methods_transform_run.ts` (returns no changes) and a stub input query in
`src/cart_payment_methods_transform_run.graphql`. You implement the query + logic there.

(Building from scratch instead? `shopify app generate extension --template payment_customization --name prebooking-payment-terms`.)

## Prompt (Cursor / your AI tool)

> Implement the `cart.payment-methods.transform.run` target. Input query: the cart's
> purchasing company id, each line's `merchandise ... on ProductVariant { product { metafield(namespace:"$app", key:"b2b-prebooking"){ value } } }`,
> and the available `paymentMethods { id name }`. Logic: if there's no purchasing company,
> return no changes. If any line's product has the app-owned `$app` `b2b-prebooking` metafield
> set, it's a pre-book cart: return a `paymentTermsSet` operation with an event trigger of
> `FULFILLMENT_CREATED` (due on fulfillment), plus `paymentMethodHide` for any payment method
> whose name matches the deferred option. Match the deferred method by name; on B2B checkout
> the underlying name is "Deferred" (the label shown to buyers is "Choose payment method at a
> later time"). Keep the match configurable.

## Build and test locally

```bash
pnpm shopify app function build
cat src/run.test.json | pnpm shopify app function run
```

## Deploy and activate

```bash
pnpm shopify app deploy
```

**Restart `shopify app dev` after this first deploy.** Deploying while your `dev` session is still
attached rotates the app version and leaves the theme app extension's *dev* asset URL stale, so the
PDP block's CSS (`asset_url`) starts returning 404 and the block renders unstyled. Quit `dev` (`q`)
and run it again; the block re-styles immediately. (Symptom: the block content shows but the panel,
badge, and grid disappear; the CSS request in DevTools is a `…/dev-…/assets/b2b-prebooking.css` 404.)

Activation is a one-time step done in the Shopify GraphiQL App: query `shopifyFunctions` to
get this function's global id, then run `paymentCustomizationCreate`. Full steps and mutations
are in `../workshop-assets/payment-customization-activation.md`.

## You should see

On the combined (Plus) location, a mixed cart (an available-now item plus a pre-book item)
switches to due-on-fulfillment and hides the deferred payment option; an available-now-only
cart stays on Net 30 with the deferred option visible. Flow (step 4) then charges the vaulted
card per fulfillment.

## Teach

- The deferred method's `name` ("Deferred") is not the checkout display label ("Choose payment
  method at a later time"). Match against real Function input, not the visible text. Inspect
  input via the Partner dashboard function runs (the CLI `shopify app logs` only attaches to
  dev stores in the app's org, not a demo store).
- `functionId` is global, so the GraphiQL App can create the payment customization even though
  it isn't the owning app.
