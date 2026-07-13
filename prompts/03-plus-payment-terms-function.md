# 3. Plus payment-terms Function  [Plus]

This is the Plus differentiator for the single-location mixed cart. A payment-customization
Function detects a pre-book item in the cart and, for that checkout only:

1. switches payment terms from Net 30 to due-on-fulfillment (`paymentTermsSet`), and
2. hides the deferred "choose payment method at a later time" option to force a vaulted card.

## Why Plus

- The `paymentTermsSet` operation is Plus + B2B only.
- On non-Plus, a static location default handles the terms (the pre-book location is set to
  due-on-fulfillment), and force-vaulting comes from an **App Store (public) app**, because
  custom apps that contain Functions require Plus.

## Scaffold (already in the starter)

The starter already includes `extensions/prebooking-payment-terms/` with a stub Function and stub
input query. You implement the query + logic there. You do **not** need to open those files to follow
along; the teach callouts below show what matters.

## Prompt (copy the whole fence into your AI)

> **Speed it up.** This build is **edit-only**, `shopify app dev` rebuilds the Function on save, so the
> AI only needs to edit `src/` files; it does **not** need to run `function build`, `deploy`, or any
> command. Before you paste, put your AI tool in **auto-accept edits** (Claude Code: Shift+Tab to
> "auto-accept edits on"; Cursor: enable Auto-Run). The starter ships `.claude/settings.json` that does
> this for Claude Code automatically. Commands still prompt, so decline any the AI proposes.

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

### While it builds (~2–3 min): talk this through

You do **not** need to open the TypeScript file. Say these two ideas out loud:

1. **Fail open (two guards):**  
   return no changes unless it's a B2B cart **and** at least one line has `custom.b2b-prebooking`  
   *"The function only acts on a B2B cart that actually contains a pre-book item. Every other checkout,
   DTC or available-now-only, passes through untouched."*

2. **When it acts, do exactly two things:**  
   `paymentTermsSet` (due on fulfillment) + hide the method named `"Deferred"`  
   *"Switch terms so payment is due when it ships, and hide 'pay later' so a card gets vaulted, which
   is what lets Flow charge automatically on shipment."*

Two sentences: **only on a B2B pre-book cart, do exactly two things.**

## No deploy needed

`shopify app dev` is already serving this Function (it rebuilds on every save). You don't run
`shopify app deploy` in the session, you activate the **development** Function directly. (Optional
local unit test, no store: `cat src/*.test.json | pnpm shopify app function run`.)

## Activate

Activation is one GraphQL mutation in your **app's own GraphiQL**. In the tab where `shopify app dev`
runs, press **`g`** to open GraphiQL, then run:

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

The `functionHandle` is fixed in the starter (`prebooking-payment-terms`), so this mutation is
identical for everyone, nothing to fill in. Expect an `id` back and empty `userErrors`. Full
troubleshooting (`Could not find Function`, scope errors) is in
`../workshop-assets/payment-customization-activation.md`.

## You should see

On the combined (Plus) location, a mixed cart (an available-now item plus a pre-book item)
switches to due-on-fulfillment and hides the deferred payment option; an available-now-only
cart stays on Net 30 with the deferred option visible. The `shopify app dev` tab prints each
Function execution as you check out. Flow (Part 4b) then charges the vaulted card per fulfillment.

## Teach (deeper, optional)

- The deferred method's `name` ("Deferred") is not the checkout display label ("Choose payment
  method at a later time"). Match against real Function input, not the visible text. Watch the
  `shopify app dev` output to see the actual input each checkout hands your Function.
- A Function only runs at checkout once a **payment customization** points at it. Only the app that
  owns the Function can create that customization, which is why you activate in the app's own
  GraphiQL (press `g`), not the CLI or a standalone GraphiQL app (those are a different app identity
  and can't see your Function). The stable `functionHandle` means no id lookup and the same mutation
  for every attendee.
