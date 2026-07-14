# Reset & redo reference

A troubleshooting companion to the README build track ("How the workshop runs"), not part of the follow-along. Use it to rewind a
single part (to redo it) or to wipe the in-session build back to the **pre-seeded baseline**.

**Scope.** This undoes only what you build *in the session*: the season values, the theme block, the
two Flows, and the Plus payment customization. It does **not** touch the pre-seeded store structure
(products, collections, catalogs, markets, locations, terms) that the setup script created. To rebuild
that, re-run `setup/setup-store.mjs` (see `prerequisites.md`, "Seed the store").

Most steps are in the **Shopify admin**. The one exception is the payment customization, which has no
Admin UI, so it's a GraphQL mutation run in your **app's own GraphiQL** (press `g` in the tab where
`shopify app dev` runs, the same place you activated it).

---

## Undo a single piece

### Plus payment customization (Part 3)
No Admin UI. In the app's GraphiQL (press `g` in the `shopify app dev` tab), list customizations and
delete yours:

```graphql
query { paymentCustomizations(first: 20) { nodes { id title enabled } } }
```

```graphql
mutation { paymentCustomizationDelete(id: "gid://shopify/PaymentCustomization/XXXX") { deletedId userErrors { field message } } }
```

Then re-activate with the `paymentCustomizationCreate` mutation from `payment-customization-activation.md`.
(To only pause it, set `enabled: false` with `paymentCustomizationUpdate` instead of deleting.)

### Season values (Part 1)
- **Un-assign from products:** Products, select the pre-book products, **Edit products**, the
  **B2B Pre-booking** column, clear the cells (or open a product, **Metafields**, clear the field).
- **Delete the season entry:** Settings, Custom data, Metaobjects, **B2B Pre-booking**, open the entry,
  **Delete**. (The *definition* stays, it's store-owned in Settings, Custom data; you're only deleting
  the value. Re-add it from `data-model-seed.md`.)

### Flows (Part 4)
Open the **Shopify Flow** app. Turn off (or delete) **Flow 1** (tag pre-book orders) and **Flow 2**
(charge the vaulted card on fulfillment). Rebuild from `prompts/04` / `prompts/05`.

### Theme block (Part 2)
Online Store, Themes, **Customize**, open a pre-book product template, select the **B2B Pre-booking**
block, **Remove block**. Rebuild from `prompts/02`.

### Test orders
Orders, open the test order, **Cancel** (void the authorization), then **Archive**. Paid test orders
can't be hard-deleted; cancel + archive clears them from the working list.

---

## Full reset to the pre-seeded baseline

Run in this order:

1. **Delete the payment customization** (CLI `paymentCustomizationDelete`, above).
2. **Turn off / delete both Flows** (Flow app).
3. **Delete the season entry + clear the product metafields** (Admin Custom data + bulk editor, above).
4. **Remove the theme block** from the product template.
5. **Cancel + archive** any test orders.
6. **(Optional, full app slate)** Settings, Apps and sales channels, **uninstall** your workshop app.
   That removes the theme app extension and the Function. It does **not** touch the data model (the
   season metaobject + `custom.b2b-prebooking` metafield are store-owned, not part of the app), so those
   definitions survive an uninstall.

> Definitions vs values: the data-model **definitions** are store-owned, so they live in Settings,
> Custom data and stay put through an app uninstall. To fully remove them, delete the metaobject and
> metafield definitions in Admin (or re-run the seed script to recreate them). Deleting metaobject
> **entries** / clearing metafield **values** leaves the definitions in place.
