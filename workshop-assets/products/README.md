# Products import

`products-import.csv` is the starter catalog for the workshop. Import it into your dev store
**before** the session (Shopify admin, Products, Import), so you come in with products already
tagged and ready to organize into catalogs.

## What's in it

10 apparel products in the standard Shopify product CSV format, split into the two sets the
workshop uses (5 each, so each collection fills one clean row on the storefront grid):

- **Available Now** (5 products), tag `available-now`, inventory tracked, policy `deny` (stop
  selling when out of stock), stock on hand.
- **Pre-book** (5 products), tags `prebook, season:spring-summer-2027`, inventory tracked,
  policy `continue` (keep selling when out of stock), starting quantity 0.

Why the inventory difference: pre-book quantity is effectively unlimited (every order sizes up
a production run), so those products keep selling past zero and go negative, which tells you
how much to produce. Available-now items sell against real stock.

## Notes

- These are 10 apparel products, each with a product **image** committed to `images/` in this
  repo. The `Image Src` column points at the **raw GitHub URLs** for those files
  (`raw.githubusercontent.com/.../workshop-assets/products/images/<handle>.png`), so images come
  in on import with no separate upload, and the catalog is self-contained (no dependency on any
  Shopify demo store). The raw URLs resolve once this repo is public.
- The `available-now` and `prebook` tags drive your collections, B2B catalogs, and the Flow
  conditions later. Keep them as-is.
- Pre-book product titles carry a `(Pre-book)` suffix so they're easy to spot in a mixed list
  (`collections/all`) and in the cart. This is a workshop-visibility aid, not something a real
  merchant needs (the season metafield + PDP block are the true pre-book signal).
- Products are single-variant for simplicity. A real apparel catalog would carry size variants;
  add them if you want a richer demo.
- Importing publishes to the Online Store by default. You control who actually sees pre-book
  products (B2B vs DTC) at the catalog/publication layer during setup, not here.
- Images live in `images/` (resized to 1600px max). They're referenced by raw GitHub URL, which
  requires this repo to be **public** (which it is at event time, like the other DotDev workshop
  repos). Before the repo is public, those URLs 404, so a pre-publish test run won't pull images.
