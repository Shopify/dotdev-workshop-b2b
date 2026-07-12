# Activating the Plus payment customization Function

The `prebooking-payment-terms` Function (Plus use case) flips a mixed cart from Net 30 to
due-on-fulfillment when a pre-book item is present, and hides "Choose payment method at a
later time" so a card or bank account is vaulted. Deploying the app registers the Function,
but it does not run at checkout until you create a **payment customization** that points at it.

Creating a payment customization requires the `paymentCustomizationCreate` Admin API mutation.
There is no native Shopify admin screen for this, so you run the mutation once through the
Shopify GraphiQL App. This is a one-time activation per store.

## Prerequisite: Shopify GraphiQL App

Install the Shopify GraphiQL App on your store:

- Install link: https://shopify-graphiql-app.shopifycloud.com/login
- Enter your store's `.myshopify.com` domain when prompted.
- Be signed in to the account that can install apps on the store, otherwise you get a
  read-only session and mutations will fail.
- When authorizing, enable these access scopes:
  - `read_payment_customizations`
  - `write_payment_customizations`

Open it later from **Shopify admin → Apps → Shopify GraphiQL App**.

## Step 1: Find your Function's ID

Run this query. `functionId` is a global UUID, so you copy it from here into the mutation.

```graphql
query {
  shopifyFunctions(first: 100) {
    nodes {
      id
      title
      apiType
      app { title }
    }
  }
}
```

Find the node where `apiType` is the payment-customization type and `app.title` is **your app**,
whatever you named it when you linked (the starter defaults the name to `b2b-prebooking-workshop`, but
if you linked with a different name, e.g. `b2b-prebooking-workshop-4`, match that). The function
`title` comes from the extension's `shopify.extension.toml`.

Copy its `id`.

## Step 2: Create and enable the payment customization

Paste the `id` from Step 1 into `functionId`:

```graphql
mutation {
  paymentCustomizationCreate(paymentCustomization: {
    title: "B2B Prebooking Payment Terms"
    enabled: true
    functionId: "PASTE_FUNCTION_ID_HERE"
  }) {
    paymentCustomization { id title enabled }
    userErrors { field message }
  }
}
```

A successful response returns the new `paymentCustomization.id` and an empty `userErrors` array.
The Function is now live at checkout for the store.

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
  `paymentCustomizationDelete` (both run the same way in GraphiQL).
- A store can have up to 25 active payment customization Functions.
