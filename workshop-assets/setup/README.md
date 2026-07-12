# Store setup

Provisions the B2B structure the build sits on: the company + buyer, company locations, B2B
catalogs, markets, payment terms, and the pre-booking data model (season metaobject + product
metafield). To minimize manual setup it creates the company (**Urban Style**) and buyer
(**Maria Cruz**) for you; the only manual prerequisites are enabling B2B and importing products.

## Primary path: the setup script

`setup-store.py` provisions the whole store in one run. This is the recommended pre-work path:
it's deterministic and mirrors how peer DotDev workshops seed stores (e.g. the Analytics
workshop ships a `scripts/seed-*.mjs` run via `pnpm seed`). Run it once against your store and
you're ready for the session.

```bash
# 1) Authenticate the CLI to your store WITH the scopes the script needs (required, one time):
shopify store auth --store <your-store>.myshopify.com --scopes \
read_products,write_products,read_inventory,write_inventory,read_locations,\
read_publications,write_publications,read_customers,write_customers,\
read_markets,write_markets,read_payment_terms,\
read_metaobjects,write_metaobjects,read_metaobject_definitions,write_metaobject_definitions,\
read_online_store_navigation,write_online_store_navigation

# 2) Run the setup:
STORE=<store>.myshopify.com BUYER_EMAIL=you+us@example.com python3 setup-store.py                 # full build
STORE=<store>.myshopify.com BUYER_EMAIL=you+us@example.com NON_PLUS_ONLY=1 python3 setup-store.py # skip Plus Combined
```

`shopify store auth` without `--scopes` errors ("Missing required flag scopes"), and without a prior
`store auth` the script fails with "No stored app authentication found for &lt;store&gt;". Both are
one-time-per-store.

It creates the **products** (from `../products/products-import.csv`: publishes them to the Online
Store, stocks available-now, leaves pre-book at 0/continue), two **smart collections** (Available
Now / Pre-book by tag) linked in the **main menu**, the company (**Urban Style**), the buyer
(**Maria Cruz**, email `BUYER_EMAIL`, required), all locations, markets, catalogs, terms, the data
model, and a **DTC catalog** on the primary market (available-now only, at retail, so storefront
visitors don't see pre-book). It looks up your Net 30 / due-on-fulfillment payment terms templates
by type.
Override `COMPANY_NAME`, `BUYER_FIRST`, `BUYER_LAST`, `PRODUCTS_CSV`, the `ADDRESS`, or the season
dates as you like; `SKIP_PRODUCTS=1` skips product creation (use it if you imported the CSV by
hand). Re-runs reuse an existing company of the same name. The only manual step is confirming B2B
is on. Provided as-is: run it on a dev store.

## Optional: AI prompt (educational)

`../../prompts/00-store-setup.md` walks the same setup by handing steps to your AI assistant, if
you'd rather see the Admin GraphQL as it runs. It's optional and lags the script on a few pieces
(collections + menu, DTC catalog, the `B2B -` naming, stray-location cleanup), so for a reliable
one-shot pre-work, use the script above.

## Company locations

Three total, and you build all three on your Plus-enabled dev store:

- **Available Now** and **Pre-book** (the non-Plus, two-location model).
- **Combined** (the Plus model) with both catalogs assigned for the single mixed cart.
