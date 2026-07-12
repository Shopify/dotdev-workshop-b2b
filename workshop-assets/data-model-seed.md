# Seed the pre-booking data model (in-session)

The pre-booking **data model** is app-owned. Its **definitions** (the `b2b-prebooking` metaobject and
the `b2b-prebooking` product metafield) are declared in `starter/b2b-prebooking-workshop/shopify.app.toml`
and are created automatically when you run `shopify app dev`. You don't create the definitions by hand.

You do create the **values**: one season entry and the per-product references. Both definitions set
`access.admin = "merchant_read_write"`, so you author the values right in the **Shopify admin**, no
GraphQL needed. (The schema stays app-owned and read-only, only the values are yours to edit.)

## 1. Create the season (Admin)

1. **Settings, Custom data, Metaobjects, B2B Pre-booking.**
2. Click **Add entry**.
3. Fill the fields and **Save**:
   - **Season name:** `Spring/Summer 2027`
   - **Order start date:** `2026-07-01`
   - **Order end date:** `2026-09-30`
   - **Delivery start date:** `2027-01-15`
   - **Delivery end date:** `2027-02-28`

## 2. Assign the season to your pre-book products (Admin, bulk)

1. **Products**, then tick your pre-book products (they carry the `(Pre-book)` suffix / `prebook` tag).
2. Click **Edit products** to open the bulk editor.
3. **Columns, Metafields, B2B Pre-booking** to add the column.
4. Click the first product's **B2B Pre-booking** cell, then **Shift-click the last product's cell** to
   select the whole column range. Pick the **Spring/Summer 2027** season once, and it applies to every
   selected cell.
5. **Save.**

> Assigning one at a time instead? Open a product, then **Metafields** (click **Show all**; the field
> isn't pinned), then **B2B Pre-booking**, and pick the season.

## Checkpoint

On a pre-book product, `product.metafield(namespace: "$app", key: "b2b-prebooking")` resolves to the
season and its dates. The theme block (which reads `product.metafields["$app"]["b2b-prebooking"]`) and
the Plus Function (which reads `metafield(namespace: "$app", key: "b2b-prebooking")`) will now see it.

## Optional: do it in GraphQL instead

Prefer code, or want to script it across many products? The app's GraphiQL does the same thing (press
`g` in `shopify app dev` so `$app` resolves to your app; the standalone GraphiQL app or
`shopify store execute` would resolve `$app` to the wrong app). Upsert the season, then bulk-set the
references.

```graphql
mutation {
  metaobjectUpsert(
    handle: { type: "$app:b2b-prebooking", handle: "spring-summer-2027" }
    metaobject: {
      fields: [
        { key: "season_name", value: "Spring/Summer 2027" }
        { key: "order_start_date", value: "2026-07-01" }
        { key: "order_end_date", value: "2026-09-30" }
        { key: "delivery_start_date", value: "2027-01-15" }
        { key: "delivery_end_date", value: "2027-02-28" }
      ]
    }
  ) {
    metaobject { id handle }
    userErrors { field message }
  }
}
```

Copy the returned `metaobject.id`, list your pre-book products (`products(first: 50, query: "tag:prebook")`),
then set each product's metafield to that id (`metafieldsSet` defaults the namespace to `$app`):

```graphql
mutation {
  metafieldsSet(metafields: [
    { ownerId: "gid://shopify/Product/AAA", key: "b2b-prebooking", type: "metaobject_reference", value: "gid://shopify/Metaobject/SEASON" }
    { ownerId: "gid://shopify/Product/BBB", key: "b2b-prebooking", type: "metaobject_reference", value: "gid://shopify/Metaobject/SEASON" }
  ]) {
    userErrors { field message }
  }
}
```

> Editing dates later: re-open the season entry in Admin (or re-run the upsert, which is idempotent on
> the handle). Both the block and the Function read from this one place.
