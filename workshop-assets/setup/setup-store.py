#!/usr/bin/env python3
"""Fallback store setup for the B2B pre-booking workshop.

Primary path is the AI prompt in ../../prompts/00-store-setup.md. Use this only if the prompt
route gets stuck. It provisions the full build: the B2B company + buyer, the non-Plus structure,
the pre-booking data model, and the Plus "Combined" location (dev stores have Plus features).

To minimize manual setup it CREATES the products (from the import CSV), the company ("Urban
Style"), its buyer/main contact ("Maria Cruz"), and all three locations. The only manual step is
confirming B2B is on (Plus sandbox stores include it). BUYER_EMAIL is REQUIRED and must be an
address you can receive at (Maria's login codes go there); COMPANY_NAME / BUYER_FIRST /
BUYER_LAST / PRODUCTS_CSV are overridable, and SKIP_PRODUCTS=1 skips product creation if you
imported the CSV by hand instead.

Requires the Shopify CLI authenticated to the store WITH scopes (one time per store; `--scopes`
is required or auth errors, and without it the script fails with "No stored app authentication"):
    shopify store auth --store <your-store>.myshopify.com --scopes \
      read_products,write_products,read_inventory,write_inventory,read_locations,\
      read_publications,write_publications,read_customers,write_customers,\
      read_markets,write_markets,read_payment_terms,\
      read_metaobjects,write_metaobjects,read_metaobject_definitions,write_metaobject_definitions,\
      read_online_store_navigation,write_online_store_navigation

Then:
    STORE=<store>.myshopify.com BUYER_EMAIL=you+us@example.com python3 setup-store.py                 # full build
    STORE=<store>.myshopify.com BUYER_EMAIL=you+us@example.com NON_PLUS_ONLY=1 python3 setup-store.py # skip Plus Combined

Every location gets the SAME shipping+billing address (edit ADDRESS below, or override with
ADDR1/CITY/ZONE/COUNTRY/ZIP/RECIPIENT env vars) and the buyer is granted the location-admin role,
so one login can switch between locations. Re-runs reuse an existing company of the same name.
Derived from a tested build but provided as-is; run it on a dev store.
"""
import csv, json, os, re, subprocess, sys

STORE = os.environ.get("STORE")
if not STORE:
    sys.exit("Set STORE=<your-store>.myshopify.com")
BUYER_EMAIL = os.environ.get("BUYER_EMAIL")
if not BUYER_EMAIL:
    sys.exit("Set BUYER_EMAIL=<an address you can receive mail at> (the buyer, Maria Cruz, signs "
             "in with a one-time code emailed there).")
SKIP_PLUS = os.environ.get("NON_PLUS_ONLY") == "1"       # default builds the Plus Combined location too
SKIP_PRODUCTS = os.environ.get("SKIP_PRODUCTS") == "1"   # set if you imported products-import.csv by hand instead

SEASON_NAME = "Spring/Summer 2027"
SEASON_HANDLE = "spring-summer-2027"
ORDER_START, ORDER_END = "2026-07-01", "2026-09-30"
DELIVERY_START, DELIVERY_END = "2027-01-15", "2027-02-28"
DISCOUNT_PCT = 50  # wholesale price list: percentage off the default price

# Every location gets the SAME shipping + billing address on purpose: these aren't separate
# physical places, they're the mechanism to split the pre-book and available-now journeys.
# Override any field with an env var (ADDR1, CITY, ZONE, COUNTRY, ZIP, RECIPIENT).
ADDRESS = {
    "address1": os.environ.get("ADDR1", "500 S Grand Ave"),
    "city": os.environ.get("CITY", "Los Angeles"),
    "zoneCode": os.environ.get("ZONE", "CA"),
    "countryCode": os.environ.get("COUNTRY", "US"),
    "zip": os.environ.get("ZIP", "90071"),
    "recipient": os.environ.get("RECIPIENT", "Urban Style"),
}

# The B2B company, its buyer (main contact), all locations, AND the products are created by this
# script to keep manual setup to a minimum. The only thing you do by hand is confirm B2B is on
# (Plus sandbox stores include it). Override any of these via env vars. BUYER_EMAIL is required
# (above) because the buyer is created with it and can't receive login codes otherwise.
COMPANY_NAME = os.environ.get("COMPANY_NAME", "Urban Style")
BUYER_FIRST = os.environ.get("BUYER_FIRST", "Maria")
BUYER_LAST = os.environ.get("BUYER_LAST", "Cruz")
PRODUCTS_CSV = os.environ.get(
    "PRODUCTS_CSV",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "products", "products-import.csv"))


def run(query, variables=None, mutate=False):
    cmd = ["shopify", "store", "execute", "--store", STORE, "--json", "--query", query]
    if mutate:
        cmd.append("--allow-mutations")
    if variables is not None:
        cmd += ["--variables", json.dumps(variables)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    out = re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", r.stdout)
    i, j = out.find("{"), out.rfind("}")
    if i < 0:
        err = re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", r.stderr)
        err = re.sub(r"[│╭╮╰╯─]", "", err).strip()  # strip CLI error-box drawing chars
        raise RuntimeError("no json (GraphQL error?). stderr=" + err[:1500])
    return json.loads(out[i:j + 1])


def errs(node, label):
    e = (node or {}).get("userErrors") or []
    if e:
        print(f"  {label} ERR: {e}")
    return e


def product_ids(tag):
    return [n["id"] for n in run(
        'query($q: String!) { products(first: 250, query: $q) { nodes { id } } }',
        {"q": f"tag:{tag}"})["products"]["nodes"]]


def payment_terms_template(kind):
    """kind: 'net30' or 'fulfillment'. Looks up the template id by type instead of hardcoding."""
    tpls = run('query { paymentTermsTemplates { id name paymentTermsType dueInDays } }')["paymentTermsTemplates"]
    for t in tpls:
        if kind == "net30" and t.get("paymentTermsType") == "NET" and t.get("dueInDays") == 30:
            return t["id"]
        if kind == "fulfillment" and t.get("paymentTermsType") == "FULFILLMENT":
            return t["id"]
    print(f"  WARN: no {kind} payment terms template found; set terms manually.")
    return None


def buyer_and_admin_role(company_id):
    """The buyer to log in as, and the company's 'Location admin' role, so we can grant access
    to every location we create. Falls back gracefully if either can't be found."""
    d = run('query($id: ID!) { company(id: $id) {'
            '  contacts(first: 1) { nodes { id } }'
            '  contactRoles(first: 20) { nodes { id name } } } }',
            {"id": company_id})["company"]
    contacts = (d.get("contacts") or {}).get("nodes") or []
    contact_id = contacts[0]["id"] if contacts else None
    role_id = None
    for r in (d.get("contactRoles") or {}).get("nodes") or []:
        if "admin" in (r.get("name") or "").lower():
            role_id = r["id"]
            break
    if not contact_id:
        print("  WARN: no company contact found; assign your buyer to the locations manually.")
    if not role_id:
        print("  WARN: no 'Location admin' role found; assign the buyer's role manually.")
    return contact_id, role_id


def assign_address(loc, name):
    # Same address for shipping AND billing, reused across every location (see ADDRESS note).
    a = run('mutation($loc: ID!, $addr: CompanyAddressInput!, $t: [CompanyAddressType!]!) {'
            '  companyLocationAssignAddress(locationId: $loc, address: $addr, addressTypes: $t) {'
            '    userErrors { field message } } }',
            {"loc": loc, "addr": ADDRESS, "t": ["SHIPPING", "BILLING"]},
            mutate=True)["companyLocationAssignAddress"]
    errs(a, f"address {name}")


def assign_admin(loc, name, contact_id, role_id):
    # Grant the same buyer location-admin access so one login can switch between locations.
    if not (contact_id and role_id):
        return
    r = run('mutation($loc: ID!, $roles: [CompanyLocationRoleAssign!]!) {'
            '  companyLocationAssignRoles(companyLocationId: $loc, rolesToAssign: $roles) {'
            '    userErrors { field message } } }',
            {"loc": loc, "roles": [{"companyContactId": contact_id, "companyContactRoleId": role_id}]},
            mutate=True)["companyLocationAssignRoles"]
    errs(r, f"location admin {name}")


def create_location(company_id, name, contact_id=None, role_id=None):
    d = run('mutation($companyId: ID!, $input: CompanyLocationInput!) {'
            '  companyLocationCreate(companyId: $companyId, input: $input) {'
            '    companyLocation { id name } userErrors { field message } } }',
            {"companyId": company_id, "input": {"name": name}}, mutate=True)["companyLocationCreate"]
    errs(d, f"location {name}")
    loc = d["companyLocation"]["id"] if d.get("companyLocation") else None
    if not loc:
        return None
    assign_address(loc, name)
    assign_admin(loc, name, contact_id, role_id)
    return loc


def find_or_create_company(name, email, first, last):
    """Create the B2B company + main contact (the buyer we log in as) so no manual company or
    customer setup is needed. Reuses an existing company of the same name on re-runs. Returns
    (company_id, an_loc) where an_loc is the 'Available Now' location if present, else None."""
    for c in run('query { companies(first: 50) { nodes { id name '
                 'locations(first: 10) { nodes { id name } } } } }')["companies"]["nodes"]:
        if c["name"] == name:
            locs = (c.get("locations") or {}).get("nodes") or []
            an = next((l["id"] for l in locs if l["name"] == "Available Now"), None)
            print(f"  reusing company {name} ({c['id']})")
            return c["id"], an
    # Create the company + main contact with NO location. companyCreate would otherwise auto-assign
    # the contact as "Ordering only" on the created location, which blocks our Location-admin
    # assignment. Creating all locations via create_location instead gives the buyer admin on each.
    d = run('mutation($input: CompanyCreateInput!) { companyCreate(input: $input) {'
            '  company { id }'
            '  userErrors { field message } } }',
            {"input": {"company": {"name": name},
                       "companyContact": {"email": email, "firstName": first, "lastName": last}}},
            mutate=True)["companyCreate"]
    errs(d, f"company {name}")
    c = d.get("company") or {}
    print(f"  created company {name} ({c.get('id')}) + contact {first} {last} <{email}>")
    return c.get("id"), None


def set_terms(location_id, template_id, label):
    if not template_id:
        return
    d = run('mutation($id: ID!, $in: CompanyLocationUpdateInput!) {'
            '  companyLocationUpdate(companyLocationId: $id, input: $in) {'
            '    userErrors { field message } } }',
            {"id": location_id,
             "in": {"buyerExperienceConfiguration": {"paymentTermsTemplateId": template_id}}},
            mutate=True)["companyLocationUpdate"]
    errs(d, f"terms {label}")


def market_with_catalog(name, handle, location_id, tag):
    m = run('mutation($i: MarketCreateInput!) { marketCreate(input: $i) {'
            '  market { id } userErrors { field message } } }',
            {"i": {"name": name, "handle": handle, "status": "ACTIVE",
                   "conditions": {"companyLocationsCondition": {"companyLocationIds": [location_id]}}}},
            mutate=True)["marketCreate"]
    errs(m, f"market {name}")
    market_id = m["market"]["id"]
    cat = run('mutation($i: CatalogCreateInput!) { catalogCreate(input: $i) {'
              '  catalog { id } userErrors { field message } } }',
              {"i": {"title": name, "status": "ACTIVE", "context": {"marketIds": [market_id]}}},
              mutate=True)["catalogCreate"]
    errs(cat, f"catalog {name}")
    catalog_id = cat["catalog"]["id"]
    pub = run('mutation($i: PublicationCreateInput!) { publicationCreate(input: $i) {'
              '  publication { id } userErrors { message } } }',
              {"i": {"catalogId": catalog_id, "defaultState": "EMPTY"}},
              mutate=True)["publicationCreate"]["publication"]["id"]
    run('mutation($i: PriceListCreateInput!) { priceListCreate(input: $i) {'
        '  priceList { id } userErrors { field message } } }',
        {"i": {"name": f"{name} Prices", "currency": "USD",
               "parent": {"adjustment": {"value": DISCOUNT_PCT, "type": "PERCENTAGE_DECREASE"}},
               "catalogId": catalog_id}}, mutate=True)
    ids = product_ids(tag)
    for pid in ids:
        run('mutation($id: ID!, $in: [PublicationInput!]!) {'
            '  publishablePublish(id: $id, input: $in) { userErrors { message } } }',
            {"id": pid, "in": [{"publicationId": pub}]}, mutate=True)
    print(f"  {name}: market {market_id}, catalog {catalog_id}, {len(ids)} products at {DISCOUNT_PCT}% off")
    return market_id, catalog_id


# NOTE: the pre-booking data model is NOT created here anymore. The metaobject + product metafield
# DEFINITIONS are declared in the app's shopify.app.toml under the reserved $app namespace and are
# created on `shopify app dev`. The season entry + per-product values are app-owned, so they're
# written in-session in the app's GraphiQL (press `g` during `shopify app dev`) using metaobjectUpsert
# + metafieldsSet, where $app resolves to the workshop app. See workshop-assets/data-model-seed.md.
# The SEASON_* constants below are the reference values for that in-session step.


def shop_location_and_online_publication():
    """The store's fulfillment location (for inventory) and the Online Store publication (so the
    products appear on the storefront)."""
    d = run('query { locations(first: 1) { nodes { id } } '
            '  publications(first: 30) { nodes { id name } } }')
    locs = (d.get("locations") or {}).get("nodes") or []
    loc_id = locs[0]["id"] if locs else None
    pub_id = next((p["id"] for p in (d.get("publications") or {}).get("nodes") or []
                   if p.get("name") == "Online Store"), None)
    return loc_id, pub_id


def create_products(csv_path, location_id, online_pub):
    """Create the workshop products from the import CSV (single source of truth), publish them to
    the Online Store, and stock the available-now ones. Pre-book stays at 0 with continue policy."""
    with open(csv_path, newline="") as f:
        rows = [r for r in csv.DictReader(f) if (r.get("Handle") or "").strip()]
    # Idempotency: skip any product whose handle already exists, so re-runs don't duplicate.
    handles = [r["Handle"].strip() for r in rows]
    existing = set()
    if handles:
        q = " OR ".join(f"handle:{h}" for h in handles)
        for n in run('query($q: String!) { products(first: 250, query: $q) { nodes { handle } } }',
                     {"q": q})["products"]["nodes"]:
            existing.add(n["handle"])
    created = skipped = 0
    for r in rows:
        handle = r["Handle"].strip()
        if handle in existing:
            skipped += 1
            continue
        tags = [t.strip() for t in (r.get("Tags") or "").split(",") if t.strip()]
        policy = "DENY" if (r.get("Variant Inventory Policy") or "").strip().lower() == "deny" else "CONTINUE"
        try:
            qty = int(r.get("Variant Inventory Qty") or 0)
        except ValueError:
            qty = 0
        image = (r.get("Image Src") or "").strip()
        pinput = {
            "handle": handle,
            "title": r.get("Title"),
            "vendor": r.get("Vendor") or "",
            "productType": r.get("Type") or "",
            "tags": tags,
            "status": "ACTIVE",
            "productOptions": [{"name": "Title", "values": [{"name": "Default Title"}]}],
            "variants": [{
                "optionValues": [{"optionName": "Title", "name": "Default Title"}],
                "price": r.get("Variant Price") or "0",
                "inventoryPolicy": policy,
                "inventoryItem": {"tracked": True, "sku": r.get("Variant SKU") or ""},
            }],
        }
        if image:
            pinput["files"] = [{"originalSource": image, "contentType": "IMAGE"}]
        d = run('mutation($input: ProductSetInput!) { productSet(input: $input, synchronous: true) {'
                '  product { id variants(first: 1) { nodes { inventoryItem { id } } } }'
                '  userErrors { field message } } }',
                {"input": pinput}, mutate=True)["productSet"]
        if errs(d, f"product {handle}"):
            continue
        prod = d.get("product") or {}
        pid = prod.get("id")
        if online_pub and pid:
            run('mutation($id: ID!, $in: [PublicationInput!]!) {'
                '  publishablePublish(id: $id, input: $in) { userErrors { message } } }',
                {"id": pid, "in": [{"publicationId": online_pub}]}, mutate=True)
        # Stock available-now products. New tracked items auto-stock at the location with on-hand 0,
        # so we set on-hand from 0 (no inventoryActivate needed); @idempotent is required here.
        if qty > 0 and location_id:
            vnodes = ((prod.get("variants") or {}).get("nodes")) or []
            item = vnodes[0]["inventoryItem"]["id"] if vnodes else None
            if item:
                run('mutation($in: InventorySetOnHandQuantitiesInput!) {'
                    '  inventorySetOnHandQuantities(input: $in) @idempotent(key: "onhand-' + handle + '") {'
                    '    userErrors { field message } } }',
                    {"in": {"reason": "correction",
                            "setQuantities": [{"inventoryItemId": item, "locationId": location_id,
                                               "quantity": qty, "changeFromQuantity": 0}]}}, mutate=True)
        created += 1
    print(f"  products: created {created}, skipped {skipped} existing, of {len(rows)} (from {os.path.basename(csv_path)})")


def link_collections_in_menu(links):
    """Append the collection links to the main menu, preserving its existing items. Needs the
    read/write_online_store_navigation scopes; wrapped non-fatally by the caller."""
    menus = run('query { menus(first: 20) { nodes { id handle title items { title type url resourceId } } } }')["menus"]["nodes"]
    main_menu = next((m for m in menus if m["handle"] == "main-menu"), None)
    if not main_menu:
        print("  WARN: main-menu not found; link the collections in Online Store, Navigation manually.")
        return
    existing_titles = {it["title"] for it in main_menu["items"]}
    items = []
    for it in main_menu["items"]:
        d = {"title": it["title"], "type": it["type"]}
        if it.get("resourceId"):
            d["resourceId"] = it["resourceId"]
        if it.get("url"):
            d["url"] = it["url"]
        items.append(d)
    added = 0
    for title, cid in links:
        if title in existing_titles:
            continue
        items.append({"title": title, "type": "COLLECTION", "resourceId": cid})
        added += 1
    if not added:
        print("  menu: collection links already present")
        return
    r = run('mutation($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {'
            '  menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {'
            '    menu { id } userErrors { field message } } }',
            {"id": main_menu["id"], "title": main_menu["title"], "handle": "main-menu", "items": items},
            mutate=True)["menuUpdate"]
    errs(r, "menu")
    print("  menu: linked Available Now + Pre-book in the main menu")


def create_collections(online_pub):
    """Two smart collections (by tag) so the two product groups are obvious on the storefront, then
    link them in the main menu. Workshop-legibility aid, not a merchant requirement. Idempotent.
    Collections must be published to the Online Store or their storefront pages 404."""
    specs = [("Available Now", "available-now"), ("Pre-book", "prebook")]
    existing = {c["handle"]: c["id"]
                for c in run('query { collections(first: 250) { nodes { id handle } } }')["collections"]["nodes"]}
    links = []
    for title, tag in specs:
        handle = title.lower().replace(" ", "-")
        cid = existing.get(handle)
        if not cid:
            d = run('mutation($in: CollectionInput!) { collectionCreate(input: $in) {'
                    '  collection { id handle } userErrors { field message } } }',
                    {"in": {"title": title, "ruleSet": {"appliedDisjunctively": False,
                            "rules": [{"column": "TAG", "relation": "EQUALS", "condition": tag}]}}},
                    mutate=True)["collectionCreate"]
            if errs(d, f"collection {title}"):
                continue
            cid = d["collection"]["id"]
        # Publish to the Online Store so the collection page exists on the storefront (else 404).
        if online_pub:
            run('mutation($id: ID!, $in: [PublicationInput!]!) {'
                '  publishablePublish(id: $id, input: $in) { userErrors { message } } }',
                {"id": cid, "in": [{"publicationId": online_pub}]}, mutate=True)
        links.append((title, cid))
    print(f"  collections: {', '.join(t for t, _ in links)} (published to Online Store)")
    try:
        link_collections_in_menu(links)
    except Exception as e:
        print(f"  WARN: main-menu not updated ({str(e)[:160]}); link the collections in Navigation "
              "manually (needs read/write_online_store_navigation scopes).")


def delete_default_location(company_id, name):
    """companyCreate auto-creates a default location named after the company (with the contact as
    'Ordering only'). We build our own named locations instead, so remove that stray default."""
    locs = run('query($id: ID!) { company(id: $id) { locations(first: 25) { nodes { id name } } } }',
               {"id": company_id})["company"]["locations"]["nodes"]
    for l in locs:
        if l["name"] == name:
            d = run('mutation($id: ID!) { companyLocationDelete(companyLocationId: $id) {'
                    '  deletedCompanyLocationId userErrors { field message } } }',
                    {"id": l["id"]}, mutate=True)["companyLocationDelete"]
            if not errs(d, f"delete stray location {name}"):
                print(f"  removed stray default location '{name}'")


def create_dtc_catalog():
    """Give the DTC (non-B2B / primary) market an available-now-only catalog at RETAIL (no wholesale
    price list), so storefront visitors see available-now at full price and don't see pre-book. The
    primary market is identified as the one whose handle isn't one of our B2B market handles."""
    b2b = {"available-now", "pre-book", "combined-b2b"}
    markets = run('query { markets(first: 30) { nodes { id name handle '
                  '  catalogs(first: 5) { nodes { id title } } } } }')["markets"]["nodes"]
    dtc = next((m for m in markets if m["handle"] not in b2b), None)
    if not dtc:
        print("  WARN: no DTC/primary market found; skipping DTC catalog.")
        return
    if dtc["catalogs"]["nodes"]:
        print(f"  DTC catalog already present on '{dtc['name']}'; skipping.")
        return
    cat = run('mutation($i: CatalogCreateInput!) { catalogCreate(input: $i) {'
              '  catalog { id } userErrors { field message } } }',
              {"i": {"title": "DTC - Available Now", "status": "ACTIVE",
                     "context": {"marketIds": [dtc["id"]]}}}, mutate=True)["catalogCreate"]
    if errs(cat, "DTC catalog"):
        return
    pub = run('mutation($i: PublicationCreateInput!) { publicationCreate(input: $i) {'
              '  publication { id } userErrors { message } } }',
              {"i": {"catalogId": cat["catalog"]["id"], "defaultState": "EMPTY"}},
              mutate=True)["publicationCreate"]["publication"]["id"]
    ids = product_ids("available-now")
    for pid in ids:
        run('mutation($id: ID!, $in: [PublicationInput!]!) {'
            '  publishablePublish(id: $id, input: $in) { userErrors { message } } }',
            {"id": pid, "in": [{"publicationId": pub}]}, mutate=True)
    # No price list on this catalog on purpose: DTC sees default (retail) prices, not the 50% wholesale.
    print(f"  DTC catalog on '{dtc['name']}': {len(ids)} available-now products at retail (pre-book excluded)")


def main():
    loc_id, online_pub = shop_location_and_online_publication()

    if not SKIP_PRODUCTS:
        print("Products:")
        create_products(PRODUCTS_CSV, loc_id, online_pub)

    print("Collections + navigation:")
    create_collections(online_pub)

    company_id, an_loc = find_or_create_company(COMPANY_NAME, BUYER_EMAIL, BUYER_FIRST, BUYER_LAST)
    if not company_id:
        sys.exit("Could not create or find the company. Is B2B enabled on the store (Settings, B2B)?")

    net30 = payment_terms_template("net30")
    dof = payment_terms_template("fulfillment")
    buyer, admin_role = buyer_and_admin_role(company_id)

    print("Available Now side:")
    if an_loc:
        assign_address(an_loc, "Available Now")
        assign_admin(an_loc, "Available Now", buyer, admin_role)
    else:
        an_loc = create_location(company_id, "Available Now", buyer, admin_role)
    _, an_cat = market_with_catalog("B2B - Available Now", "available-now", an_loc, "available-now")
    set_terms(an_loc, net30, "Available Now")

    print("Pre-book side:")
    pb_loc = create_location(company_id, "Pre-book", buyer, admin_role)
    _, pb_cat = market_with_catalog("B2B - Pre-book", "pre-book", pb_loc, "prebook")
    set_terms(pb_loc, dof, "Pre-book")

    print("DTC catalog:")
    try:
        create_dtc_catalog()
    except Exception as e:
        print(f"  WARN: DTC catalog step failed ({str(e)[:160]}); create it manually if you want the "
              "storefront (DTC) to show available-now at retail and hide pre-book.")

    if not SKIP_PLUS:
        print("Plus Combined location:")
        cb_loc = create_location(company_id, "Combined", buyer, admin_role)
        m = run('mutation($i: MarketCreateInput!) { marketCreate(input: $i) {'
                '  market { id } userErrors { message } } }',
                {"i": {"name": "B2B - Combined", "handle": "combined-b2b", "status": "ACTIVE",
                       "conditions": {"companyLocationsCondition": {"companyLocationIds": [cb_loc]}}}},
                mutate=True)["marketCreate"]
        errs(m, "Combined market")
        cb_market = (m.get("market") or {}).get("id")
        # Assign both catalogs to the Combined MARKET (not the company location): that's what makes the
        # Combined location resolve both product sets in one cart. A MarketCatalog can serve multiple
        # markets, so each catalog now serves its own market plus Combined.
        if cb_market:
            for cat in (an_cat, pb_cat):
                run('mutation($id: ID!, $add: CatalogContextInput) {'
                    '  catalogContextUpdate(catalogId: $id, contextsToAdd: $add) {'
                    '    userErrors { field message } } }',
                    {"id": cat, "add": {"marketIds": [cb_market]}}, mutate=True)
        set_terms(cb_loc, net30, "Combined")
        print("  Combined market sees both catalogs (Net 30; Plus Function switches terms).")

    # Remove the default location companyCreate auto-made (named after the company).
    delete_default_location(company_id, COMPANY_NAME)

    print("DONE")


if __name__ == "__main__":
    main()
