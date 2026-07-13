#!/usr/bin/env node
// Store setup for the B2B pre-booking workshop.
//
// Provisions the full pre-work build: the B2B company + buyer, the non-Plus structure (two
// locations/markets/catalogs), a DTC catalog, and the Plus "Combined" location (dev stores have
// Plus features). It also CREATES the products (from the import CSV), the company ("Urban Style"),
// its buyer/main contact ("Maria Cruz"), and all three locations, to keep manual setup minimal.
// The only manual step is confirming B2B is on (Plus sandbox stores include it).
//
// Requires the Shopify CLI authenticated to the store WITH scopes (one time per store; --scopes is
// required or auth errors, and without it the script fails with "No stored app authentication"):
//   shopify store auth --store <your-store>.myshopify.com --scopes \
//     read_products,write_products,read_inventory,write_inventory,read_locations,\
//     read_publications,write_publications,read_customers,write_customers,\
//     read_markets,write_markets,read_payment_terms,\
//     read_metaobjects,write_metaobjects,read_metaobject_definitions,write_metaobject_definitions,\
//     read_online_store_navigation,write_online_store_navigation,\
//     read_payment_customizations,write_payment_customizations
//   (last two scopes cover the in-session payment-customization activation; see
//    ../payment-customization-activation.md)
//
// Then:
//   STORE=<store>.myshopify.com BUYER_EMAIL=you+us@example.com node setup-store.mjs                  # full build
//   STORE=<store>.myshopify.com BUYER_EMAIL=you+us@example.com NON_PLUS_ONLY=1 node setup-store.mjs  # skip Plus Combined
//
// BUYER_EMAIL is REQUIRED and must be an address you can receive at (Maria's login codes go there).
// COMPANY_NAME / BUYER_FIRST / BUYER_LAST / PRODUCTS_CSV / ADDRESS fields are overridable via env
// vars; SKIP_PRODUCTS=1 skips product creation if you imported the CSV by hand instead. Every
// location gets the SAME shipping+billing address (they aren't separate physical places; they're
// the mechanism to split the pre-book and available-now journeys) and the buyer is granted the
// location-admin role, so one login can switch between locations. Re-runs reuse an existing company
// of the same name. No npm dependencies (Node builtins + the Shopify CLI only). Run on a dev store.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const env = process.env;
const STORE = env.STORE;
if (!STORE) die("Set STORE=<your-store>.myshopify.com");
const BUYER_EMAIL = env.BUYER_EMAIL;
if (!BUYER_EMAIL) {
  die("Set BUYER_EMAIL=<an address you can receive mail at> (the buyer, Maria Cruz, signs in with a one-time code emailed there).");
}
const SKIP_PLUS = env.NON_PLUS_ONLY === "1"; // default builds the Plus Combined location too
const SKIP_PRODUCTS = env.SKIP_PRODUCTS === "1"; // set if you imported products-import.csv by hand instead

const SEASON_NAME = "Spring/Summer 2027";
const SEASON_HANDLE = "spring-summer-2027";
const ORDER_START = "2026-07-01", ORDER_END = "2026-09-30";
const DELIVERY_START = "2027-01-15", DELIVERY_END = "2027-02-28";
const DISCOUNT_PCT = 50; // wholesale price list: percentage off the default price

// Same shipping + billing address on every location on purpose (see header). Override per field.
const ADDRESS = {
  address1: env.ADDR1 || "500 S Grand Ave",
  city: env.CITY || "Los Angeles",
  zoneCode: env.ZONE || "CA",
  countryCode: env.COUNTRY || "US",
  zip: env.ZIP || "90071",
  recipient: env.RECIPIENT || "Urban Style",
};

const COMPANY_NAME = env.COMPANY_NAME || "Urban Style";
const BUYER_FIRST = env.BUYER_FIRST || "Maria";
const BUYER_LAST = env.BUYER_LAST || "Cruz";
const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTS_CSV = env.PRODUCTS_CSV || join(__dirname, "..", "products", "products-import.csv");

function die(msg) {
  console.error(msg);
  process.exit(1);
}

// Run a GraphQL op via the Shopify CLI and return the unwrapped data object (top-level keys are the
// query fields, matching how `shopify store execute --json` reports; tolerant of a `data` wrapper).
function run(query, variables = null, mutate = false) {
  const args = ["store", "execute", "--store", STORE, "--json", "--query", query];
  if (mutate) args.push("--allow-mutations");
  if (variables !== null) args.push("--variables", JSON.stringify(variables));
  const r = spawnSync("shopify", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const strip = (s) => (s || "").replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  const out = strip(r.stdout);
  const i = out.indexOf("{"), j = out.lastIndexOf("}");
  if (i < 0 || j < 0) {
    let err = strip(r.stderr).replace(/[│╭╮╰╯─]/g, "").trim();
    throw new Error("no json (GraphQL error?). stderr=" + err.slice(0, 1500));
  }
  const parsed = JSON.parse(out.slice(i, j + 1));
  return parsed && parsed.data !== undefined ? parsed.data : parsed;
}

function errs(node, label) {
  const e = (node && node.userErrors) || [];
  if (e.length) console.log(`  ${label} ERR: ${JSON.stringify(e)}`);
  return e;
}

function productIds(tag) {
  return run(
    "query($q: String!) { products(first: 250, query: $q) { nodes { id } } }",
    { q: `tag:${tag}` }
  ).products.nodes.map((n) => n.id);
}

// kind: 'net30' or 'fulfillment'. Looks up the template id by type instead of hardcoding.
function paymentTermsTemplate(kind) {
  const tpls = run("query { paymentTermsTemplates { id name paymentTermsType dueInDays } }").paymentTermsTemplates;
  for (const t of tpls) {
    if (kind === "net30" && t.paymentTermsType === "NET" && t.dueInDays === 30) return t.id;
    if (kind === "fulfillment" && t.paymentTermsType === "FULFILLMENT") return t.id;
  }
  console.log(`  WARN: no ${kind} payment terms template found; set terms manually.`);
  return null;
}

// The buyer to log in as, and the company's 'Location admin' role, so we can grant access to every
// location we create. Falls back gracefully if either can't be found.
function buyerAndAdminRole(companyId) {
  const d = run(
    "query($id: ID!) { company(id: $id) {" +
      "  contacts(first: 1) { nodes { id } }" +
      "  contactRoles(first: 20) { nodes { id name } } } }",
    { id: companyId }
  ).company;
  const contacts = (d.contacts && d.contacts.nodes) || [];
  const contactId = contacts.length ? contacts[0].id : null;
  let roleId = null;
  for (const r of (d.contactRoles && d.contactRoles.nodes) || []) {
    if ((r.name || "").toLowerCase().includes("admin")) {
      roleId = r.id;
      break;
    }
  }
  if (!contactId) console.log("  WARN: no company contact found; assign your buyer to the locations manually.");
  if (!roleId) console.log("  WARN: no 'Location admin' role found; assign the buyer's role manually.");
  return [contactId, roleId];
}

function assignAddress(loc, name) {
  // Same address for shipping AND billing, reused across every location (see ADDRESS note).
  const a = run(
    "mutation($loc: ID!, $addr: CompanyAddressInput!, $t: [CompanyAddressType!]!) {" +
      "  companyLocationAssignAddress(locationId: $loc, address: $addr, addressTypes: $t) {" +
      "    userErrors { field message } } }",
    { loc, addr: ADDRESS, t: ["SHIPPING", "BILLING"] },
    true
  ).companyLocationAssignAddress;
  errs(a, `address ${name}`);
}

function assignAdmin(loc, name, contactId, roleId) {
  // Grant the same buyer location-admin access so one login can switch between locations.
  if (!(contactId && roleId)) return;
  const r = run(
    "mutation($loc: ID!, $roles: [CompanyLocationRoleAssign!]!) {" +
      "  companyLocationAssignRoles(companyLocationId: $loc, rolesToAssign: $roles) {" +
      "    userErrors { field message } } }",
    { loc, roles: [{ companyContactId: contactId, companyContactRoleId: roleId }] },
    true
  ).companyLocationAssignRoles;
  errs(r, `location admin ${name}`);
}

function createLocation(companyId, name, contactId = null, roleId = null) {
  const d = run(
    "mutation($companyId: ID!, $input: CompanyLocationInput!) {" +
      "  companyLocationCreate(companyId: $companyId, input: $input) {" +
      "    companyLocation { id name } userErrors { field message } } }",
    { companyId, input: { name } },
    true
  ).companyLocationCreate;
  errs(d, `location ${name}`);
  const loc = d.companyLocation ? d.companyLocation.id : null;
  if (!loc) return null;
  assignAddress(loc, name);
  assignAdmin(loc, name, contactId, roleId);
  return loc;
}

// Create the B2B company + main contact (the buyer we log in as) so no manual company or customer
// setup is needed. Reuses an existing company of the same name on re-runs. Returns [companyId,
// anLoc] where anLoc is the 'Available Now' location if present, else null.
function findOrCreateCompany(name, email, first, last) {
  for (const c of run(
    "query { companies(first: 50) { nodes { id name locations(first: 10) { nodes { id name } } } } }"
  ).companies.nodes) {
    if (c.name === name) {
      const locs = (c.locations && c.locations.nodes) || [];
      const an = (locs.find((l) => l.name === "Available Now") || {}).id || null;
      console.log(`  reusing company ${name} (${c.id})`);
      return [c.id, an];
    }
  }
  // Create the company + main contact with NO location. companyCreate would otherwise auto-assign
  // the contact as "Ordering only" on the created location, which blocks our Location-admin
  // assignment. Creating all locations via createLocation instead gives the buyer admin on each.
  const d = run(
    "mutation($input: CompanyCreateInput!) { companyCreate(input: $input) {" +
      "  company { id } userErrors { field message } } }",
    { input: { company: { name }, companyContact: { email, firstName: first, lastName: last } } },
    true
  ).companyCreate;
  errs(d, `company ${name}`);
  const c = d.company || {};
  console.log(`  created company ${name} (${c.id}) + contact ${first} ${last} <${email}>`);
  return [c.id, null];
}

function setTerms(locationId, templateId, label) {
  if (!templateId) return;
  const d = run(
    "mutation($id: ID!, $in: CompanyLocationUpdateInput!) {" +
      "  companyLocationUpdate(companyLocationId: $id, input: $in) {" +
      "    userErrors { field message } } }",
    { id: locationId, in: { buyerExperienceConfiguration: { paymentTermsTemplateId: templateId } } },
    true
  ).companyLocationUpdate;
  errs(d, `terms ${label}`);
}

function marketWithCatalog(name, handle, locationId, tag) {
  const m = run(
    "mutation($i: MarketCreateInput!) { marketCreate(input: $i) {" +
      "  market { id } userErrors { field message } } }",
    { i: { name, handle, status: "ACTIVE", conditions: { companyLocationsCondition: { companyLocationIds: [locationId] } } } },
    true
  ).marketCreate;
  errs(m, `market ${name}`);
  const marketId = m.market.id;
  const cat = run(
    "mutation($i: CatalogCreateInput!) { catalogCreate(input: $i) {" +
      "  catalog { id } userErrors { field message } } }",
    { i: { title: name, status: "ACTIVE", context: { marketIds: [marketId] } } },
    true
  ).catalogCreate;
  errs(cat, `catalog ${name}`);
  const catalogId = cat.catalog.id;
  const pub = run(
    "mutation($i: PublicationCreateInput!) { publicationCreate(input: $i) {" +
      "  publication { id } userErrors { message } } }",
    { i: { catalogId, defaultState: "EMPTY" } },
    true
  ).publicationCreate.publication.id;
  run(
    "mutation($i: PriceListCreateInput!) { priceListCreate(input: $i) {" +
      "  priceList { id } userErrors { field message } } }",
    { i: { name: `${name} Prices`, currency: "USD", parent: { adjustment: { value: DISCOUNT_PCT, type: "PERCENTAGE_DECREASE" } }, catalogId } },
    true
  );
  const ids = productIds(tag);
  for (const pid of ids) {
    run(
      "mutation($id: ID!, $in: [PublicationInput!]!) {" +
        "  publishablePublish(id: $id, input: $in) { userErrors { message } } }",
      { id: pid, in: [{ publicationId: pub }] },
      true
    );
  }
  console.log(`  ${name}: market ${marketId}, catalog ${catalogId}, ${ids.length} products at ${DISCOUNT_PCT}% off`);
  return [marketId, catalogId];
}

// NOTE: the pre-booking data model is NOT created here. The metaobject + product metafield
// DEFINITIONS are declared in the app's shopify.app.toml under the reserved $app namespace and are
// created on `shopify app dev`. The season entry + per-product values are app-owned, so they're
// written in-session (Admin bulk editor, or the app's `press g` GraphiQL). See data-model-seed.md.
// SEASON_* above are the reference values for that in-session step.

// The store's fulfillment location (for inventory) and the Online Store publication (so products
// appear on the storefront).
function shopLocationAndOnlinePublication() {
  const d = run(
    "query { locations(first: 1) { nodes { id } } publications(first: 30) { nodes { id name } } }"
  );
  const locs = (d.locations && d.locations.nodes) || [];
  const locId = locs.length ? locs[0].id : null;
  const pubId = ((d.publications && d.publications.nodes) || []).find((p) => p.name === "Online Store");
  return [locId, pubId ? pubId.id : null];
}

// Minimal RFC4180 CSV parse (handles quoted fields, embedded commas/newlines, "" escapes).
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let k = 0; k < text.length; k++) {
    const ch = text[k];
    if (inQuotes) {
      if (ch === '"') {
        if (text[k + 1] === '"') { field += '"'; k++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch === "\r") { /* skip */ }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1)
    .filter((r) => r.some((c) => c !== ""))
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx] !== undefined ? r[idx] : ""])));
}

// Create the workshop products from the import CSV (single source of truth), publish them to the
// Online Store, and stock the available-now ones. Pre-book stays at 0 with continue policy.
function createProducts(csvPath, locationId, onlinePub) {
  const rows = parseCsv(readFileSync(csvPath, "utf8")).filter((r) => (r.Handle || "").trim());
  // Idempotency: skip any product whose handle already exists, so re-runs don't duplicate.
  const handles = rows.map((r) => r.Handle.trim());
  const existing = new Set();
  if (handles.length) {
    const q = handles.map((h) => `handle:${h}`).join(" OR ");
    for (const n of run("query($q: String!) { products(first: 250, query: $q) { nodes { handle } } }", { q }).products.nodes) {
      existing.add(n.handle);
    }
  }
  let created = 0, skipped = 0;
  for (const r of rows) {
    const handle = r.Handle.trim();
    if (existing.has(handle)) { skipped++; continue; }
    const tags = (r.Tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    const policy = (r["Variant Inventory Policy"] || "").trim().toLowerCase() === "deny" ? "DENY" : "CONTINUE";
    let qty = parseInt(r["Variant Inventory Qty"] || "0", 10);
    if (Number.isNaN(qty)) qty = 0;
    const image = (r["Image Src"] || "").trim();
    const pinput = {
      handle,
      title: r.Title,
      vendor: r.Vendor || "",
      productType: r.Type || "",
      tags,
      status: "ACTIVE",
      productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
      variants: [{
        optionValues: [{ optionName: "Title", name: "Default Title" }],
        price: r["Variant Price"] || "0",
        inventoryPolicy: policy,
        inventoryItem: { tracked: true, sku: r["Variant SKU"] || "" },
      }],
    };
    if (image) pinput.files = [{ originalSource: image, contentType: "IMAGE" }];
    const d = run(
      "mutation($input: ProductSetInput!) { productSet(input: $input, synchronous: true) {" +
        "  product { id variants(first: 1) { nodes { inventoryItem { id } } } }" +
        "  userErrors { field message } } }",
      { input: pinput },
      true
    ).productSet;
    if (errs(d, `product ${handle}`).length) continue;
    const prod = d.product || {};
    const pid = prod.id;
    if (onlinePub && pid) {
      run(
        "mutation($id: ID!, $in: [PublicationInput!]!) {" +
          "  publishablePublish(id: $id, input: $in) { userErrors { message } } }",
        { id: pid, in: [{ publicationId: onlinePub }] },
        true
      );
    }
    // Stock available-now products. New tracked items auto-stock at the location with on-hand 0, so
    // we set on-hand from 0 (no inventoryActivate needed); @idempotent is required here.
    if (qty > 0 && locationId) {
      const vnodes = (prod.variants && prod.variants.nodes) || [];
      const item = vnodes.length ? vnodes[0].inventoryItem.id : null;
      if (item) {
        run(
          "mutation($in: InventorySetOnHandQuantitiesInput!) {" +
            '  inventorySetOnHandQuantities(input: $in) @idempotent(key: "onhand-' + handle + '") {' +
            "    userErrors { field message } } }",
          { in: { reason: "correction", setQuantities: [{ inventoryItemId: item, locationId, quantity: qty, changeFromQuantity: 0 }] } },
          true
        );
      }
    }
    created++;
  }
  console.log(`  products: created ${created}, skipped ${skipped} existing, of ${rows.length} (from ${basename(csvPath)})`);
}

// Append the collection links to the main menu, preserving its existing items. Needs the
// read/write_online_store_navigation scopes; wrapped non-fatally by the caller.
function linkCollectionsInMenu(links) {
  const menus = run("query { menus(first: 20) { nodes { id handle title items { title type url resourceId } } } }").menus.nodes;
  const mainMenu = menus.find((m) => m.handle === "main-menu");
  if (!mainMenu) {
    console.log("  WARN: main-menu not found; link the collections in Online Store, Navigation manually.");
    return;
  }
  const existingTitles = new Set(mainMenu.items.map((it) => it.title));
  const items = mainMenu.items.map((it) => {
    const d = { title: it.title, type: it.type };
    if (it.resourceId) d.resourceId = it.resourceId;
    if (it.url) d.url = it.url;
    return d;
  });
  let added = 0;
  for (const [title, cid] of links) {
    if (existingTitles.has(title)) continue;
    items.push({ title, type: "COLLECTION", resourceId: cid });
    added++;
  }
  if (!added) {
    console.log("  menu: collection links already present");
    return;
  }
  const r = run(
    "mutation($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {" +
      "  menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {" +
      "    menu { id } userErrors { field message } } }",
    { id: mainMenu.id, title: mainMenu.title, handle: "main-menu", items },
    true
  ).menuUpdate;
  errs(r, "menu");
  console.log("  menu: linked Available Now + Pre-book in the main menu");
}

// Two smart collections (by tag) so the two product groups are obvious on the storefront, then link
// them in the main menu. Workshop-legibility aid, not a merchant requirement. Idempotent.
// Collections must be published to the Online Store or their storefront pages 404.
function createCollections(onlinePub) {
  const specs = [["Available Now", "available-now"], ["Pre-book", "prebook"]];
  const existing = {};
  for (const c of run("query { collections(first: 250) { nodes { id handle } } }").collections.nodes) {
    existing[c.handle] = c.id;
  }
  const links = [];
  for (const [title, tag] of specs) {
    const handle = title.toLowerCase().replace(/ /g, "-");
    let cid = existing[handle];
    if (!cid) {
      const d = run(
        "mutation($in: CollectionInput!) { collectionCreate(input: $in) {" +
          "  collection { id handle } userErrors { field message } } }",
        { in: { title, ruleSet: { appliedDisjunctively: false, rules: [{ column: "TAG", relation: "EQUALS", condition: tag }] } } },
        true
      ).collectionCreate;
      if (errs(d, `collection ${title}`).length) continue;
      cid = d.collection.id;
    }
    // Publish to the Online Store so the collection page exists on the storefront (else 404).
    if (onlinePub) {
      run(
        "mutation($id: ID!, $in: [PublicationInput!]!) {" +
          "  publishablePublish(id: $id, input: $in) { userErrors { message } } }",
        { id: cid, in: [{ publicationId: onlinePub }] },
        true
      );
    }
    links.push([title, cid]);
  }
  console.log(`  collections: ${links.map(([t]) => t).join(", ")} (published to Online Store)`);
  try {
    linkCollectionsInMenu(links);
  } catch (e) {
    console.log(`  WARN: main-menu not updated (${String(e.message || e).slice(0, 160)}); link the collections in Navigation manually (needs read/write_online_store_navigation scopes).`);
  }
}

// companyCreate auto-creates a default location named after the company (with the contact as
// 'Ordering only'). We build our own named locations instead, so remove that stray default.
function deleteDefaultLocation(companyId, name) {
  const locs = run(
    "query($id: ID!) { company(id: $id) { locations(first: 25) { nodes { id name } } } }",
    { id: companyId }
  ).company.locations.nodes;
  for (const l of locs) {
    if (l.name === name) {
      const d = run(
        "mutation($id: ID!) { companyLocationDelete(companyLocationId: $id) {" +
          "  deletedCompanyLocationId userErrors { field message } } }",
        { id: l.id },
        true
      ).companyLocationDelete;
      if (!errs(d, `delete stray location ${name}`).length) {
        console.log(`  removed stray default location '${name}'`);
      }
    }
  }
}

// Give the DTC (non-B2B / primary) market an available-now-only catalog at RETAIL (no wholesale
// price list), so storefront visitors see available-now at full price and don't see pre-book. The
// primary market is identified as the one whose handle isn't one of our B2B market handles.
function createDtcCatalog() {
  const b2b = new Set(["available-now", "pre-book", "combined-b2b"]);
  const markets = run("query { markets(first: 30) { nodes { id name handle catalogs(first: 5) { nodes { id title } } } } }").markets.nodes;
  const dtc = markets.find((m) => !b2b.has(m.handle));
  if (!dtc) {
    console.log("  WARN: no DTC/primary market found; skipping DTC catalog.");
    return;
  }
  if (dtc.catalogs.nodes.length) {
    console.log(`  DTC catalog already present on '${dtc.name}'; skipping.`);
    return;
  }
  const cat = run(
    "mutation($i: CatalogCreateInput!) { catalogCreate(input: $i) {" +
      "  catalog { id } userErrors { field message } } }",
    { i: { title: "DTC - Available Now", status: "ACTIVE", context: { marketIds: [dtc.id] } } },
    true
  ).catalogCreate;
  if (errs(cat, "DTC catalog").length) return;
  const pub = run(
    "mutation($i: PublicationCreateInput!) { publicationCreate(input: $i) {" +
      "  publication { id } userErrors { message } } }",
    { i: { catalogId: cat.catalog.id, defaultState: "EMPTY" } },
    true
  ).publicationCreate.publication.id;
  const ids = productIds("available-now");
  for (const pid of ids) {
    run(
      "mutation($id: ID!, $in: [PublicationInput!]!) {" +
        "  publishablePublish(id: $id, input: $in) { userErrors { message } } }",
      { id: pid, in: [{ publicationId: pub }] },
      true
    );
  }
  // No price list on this catalog on purpose: DTC sees default (retail) prices, not the 50% wholesale.
  console.log(`  DTC catalog on '${dtc.name}': ${ids.length} available-now products at retail (pre-book excluded)`);
}

function main() {
  const [locId, onlinePub] = shopLocationAndOnlinePublication();

  if (!SKIP_PRODUCTS) {
    console.log("Products:");
    createProducts(PRODUCTS_CSV, locId, onlinePub);
  }

  console.log("Collections + navigation:");
  createCollections(onlinePub);

  const [companyId, anLocExisting] = findOrCreateCompany(COMPANY_NAME, BUYER_EMAIL, BUYER_FIRST, BUYER_LAST);
  if (!companyId) die("Could not create or find the company. Is B2B enabled on the store (Settings, B2B)?");

  const net30 = paymentTermsTemplate("net30");
  const dof = paymentTermsTemplate("fulfillment");
  const [buyer, adminRole] = buyerAndAdminRole(companyId);

  console.log("Available Now side:");
  let anLoc = anLocExisting;
  if (anLoc) {
    assignAddress(anLoc, "Available Now");
    assignAdmin(anLoc, "Available Now", buyer, adminRole);
  } else {
    anLoc = createLocation(companyId, "Available Now", buyer, adminRole);
  }
  const [, anCat] = marketWithCatalog("B2B - Available Now", "available-now", anLoc, "available-now");
  setTerms(anLoc, net30, "Available Now");

  console.log("Pre-book side:");
  const pbLoc = createLocation(companyId, "Pre-book", buyer, adminRole);
  const [, pbCat] = marketWithCatalog("B2B - Pre-book", "pre-book", pbLoc, "prebook");
  setTerms(pbLoc, dof, "Pre-book");

  console.log("DTC catalog:");
  try {
    createDtcCatalog();
  } catch (e) {
    console.log(`  WARN: DTC catalog step failed (${String(e.message || e).slice(0, 160)}); create it manually if you want the storefront (DTC) to show available-now at retail and hide pre-book.`);
  }

  if (!SKIP_PLUS) {
    console.log("Plus Combined location:");
    const cbLoc = createLocation(companyId, "Combined", buyer, adminRole);
    const m = run(
      "mutation($i: MarketCreateInput!) { marketCreate(input: $i) {" +
        "  market { id } userErrors { message } } }",
      { i: { name: "B2B - Combined", handle: "combined-b2b", status: "ACTIVE", conditions: { companyLocationsCondition: { companyLocationIds: [cbLoc] } } } },
      true
    ).marketCreate;
    errs(m, "Combined market");
    const cbMarket = (m.market || {}).id;
    // Assign both catalogs to the Combined MARKET (not the company location): that's what makes the
    // Combined location resolve both product sets in one cart. A MarketCatalog can serve multiple
    // markets, so each catalog now serves its own market plus Combined.
    if (cbMarket) {
      for (const cat of [anCat, pbCat]) {
        run(
          "mutation($id: ID!, $add: CatalogContextInput) {" +
            "  catalogContextUpdate(catalogId: $id, contextsToAdd: $add) {" +
            "    userErrors { field message } } }",
          { id: cat, add: { marketIds: [cbMarket] } },
          true
        );
      }
    }
    setTerms(cbLoc, net30, "Combined");
    console.log("  Combined market sees both catalogs (Net 30; Plus Function switches terms).");
  }

  // Remove the default location companyCreate auto-made (named after the company).
  deleteDefaultLocation(companyId, COMPANY_NAME);

  console.log("DONE");
}

main();
