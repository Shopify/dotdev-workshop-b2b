# Activating the Plus payment customization Function

The `prebooking-payment-terms` Function (Plus use case) flips a mixed cart from Net 30 to
due-on-fulfillment when a pre-book item is present, and hides "Choose payment method at a
later time" so a card or bank account is vaulted. Deploying the app registers the Function,
but it does not run at checkout until you create a **payment customization** that points at it.

Creating one is a single Admin API mutation, `paymentCustomizationCreate`. There's no native admin
screen for it, so you run it once with the **Shopify CLI** (`shopify store execute`), the same tool the
pre-work setup script uses. This is a one-time activation per store.

> **Prerequisite (already done in pre-work):** `shopify store auth` was run with
> `read_payment_customizations` and `write_payment_customizations` in the scope list (see
> `setup/README.md`). Those two scopes are what let the CLI create the customization. If you authed
> before those were added, re-run `shopify store auth` with the full scope string once.

You can run the two steps yourself in a terminal, or just ask your AI assistant to do it. Both use the
same CLI under the hood.

## Option A: Ask your AI assistant (simplest)

With `shopify app dev` context and the CLI authed to your store, prompt your assistant:

> Using `shopify store execute` against my store, find my payment-customization Function's id with the
> `shopifyFunctions` query (the one whose `app.title` is my workshop app), then run
> `paymentCustomizationCreate` with `enabled: true` pointing at that id. Confirm `userErrors` is empty.

The assistant runs the query, reads the id, fills it into the mutation, and reports back. Nothing to
copy by hand.

## Option B: One command

From the app folder (`starter/b2b-prebooking-workshop`), with the store authed:

```bash
STORE=<your-store>.myshopify.com pnpm run activate
```

`activate` queries for this app's payment-customization Function, then creates and enables the
customization pointing at it. It prints the new customization id on success.

## Option C: Run the two calls yourself

**Step 1, find the Function's id.** `functionId` is a global id, so you copy it from here into the
mutation:

```bash
shopify store execute --store <your-store>.myshopify.com --json \
  --query 'query { shopifyFunctions(first: 100) { nodes { id title apiType app { title } } } }'
```

Find the node where `apiType` is the payment-customization type and `app.title` is **your app**
(the starter defaults the name to `b2b-prebooking-workshop`; if you linked with a different name, match
that). The function `title` comes from the extension's `shopify.extension.toml`. Copy its `id`.

**Step 2, create and enable the payment customization.** Paste the `id` from Step 1 into `functionId`
(`--allow-mutations` is required for any mutation):

```bash
shopify store execute --store <your-store>.myshopify.com --json --allow-mutations \
  --query 'mutation {
    paymentCustomizationCreate(paymentCustomization: {
      title: "B2B Prebooking Payment Terms"
      enabled: true
      functionId: "PASTE_FUNCTION_ID_HERE"
    }) {
      paymentCustomization { id title enabled }
      userErrors { field message }
    }
  }'
```

A successful response returns the new `paymentCustomization.id` and an empty `userErrors` array. The
Function is now live at checkout for the store.

## Verify

Logged in as a B2B buyer on the combined (Plus) company location:

- Mixed cart (an available-now item plus a pre-book item): payment terms switch to
  due-on-fulfillment and "Choose payment method at a later time" is hidden.
- Available-now only: terms stay on the location default (Net 30) and pay-later still shows.

## Notes

- The Function hides payment methods whose name contains "later" (matches "Choose payment
  method at a later time"). If your store shows a different label, update
  `DEFERRED_METHOD_PATTERNS` in
  `starter/b2b-prebooking-workshop/extensions/prebooking-payment-terms/src/cart_payment_methods_transform_run.ts`
  and redeploy.
- To change the customization later, use `paymentCustomizationUpdate`; to remove it, use
  `paymentCustomizationDelete` (both run the same way with `shopify store execute --allow-mutations`).
- A store can have up to 25 active payment customization Functions.
