# 1. Open the app + run dev  [both]

You build on a Shopify app that holds the theme app extension (the PDP block) and, for the Plus
build, the payment-customization Function. The starter already **is** that app: the shell and both
extensions are scaffolded for you in `starter/b2b-prebooking-workshop`, so you don't init or generate
anything, you install dependencies and start the dev session.

## Command

```bash
cd starter/b2b-prebooking-workshop
pnpm install
pnpm run dev              # = shopify app dev --use-localhost
```

- The first `dev` **links the app** in your Partner org and writes `client_id` into `shopify.app.toml`
  for you. Pick your Partner org and the `b2b-prebooking` dev store when prompted, and keep `dev`
  running, you build against it.
- **Approve the install in the browser** if it opens: pick your dev store and click **Install**. One
  click, by design (see below). The app's only scope is payment customizations, used in Part 3.
- The starter carries **no data model** in `shopify.app.toml`, so this first `dev` needs no write
  scopes and starts cleanly on a fresh store. (The season metaobject + product metafield already exist
  on your store, created store-owned by the pre-work seed script, verify them below.)

> **Why a browser step?** Installing an app that has access scopes goes through the merchant OAuth
> consent screen, a one-click browser step by design, with **no terminal-only install** (the CLI's own
> install option just opens the same page). Expect it, it's normal: pick the store, click Install,
> done. You do this once.

**When it asks for a store password**, that's your storefront password (dev stores are
password-protected and the theme app extension needs it to preview). Paste the value from Admin,
**Online Store, Preferences, Password protection**.

**First `--use-localhost` run asks you to generate a localhost certificate with mkcert.** When the CLI
prompts something like **"Yes, use mkcert to generate it"**, select that **Yes** option. mkcert then
installs a local CA into your system trust store and **asks for your Mac/admin (sudo) password**; enter
it. One-time per machine. No local admin rights? Drop `--use-localhost` and run plain
`shopify app dev` (it falls back to the Cloudflare tunnel; the only downside is tunnel throttling when
the whole room starts at once).

## What `shopify app dev` does for you here

- **Serves the theme app extension** so the block is available in the theme editor while dev runs, and
  rebuilds on every save (that's how you build the block in Part 2 and the Function in Part 3 without
  redeploying).
- **Opens the app's GraphiQL** (press `g`). You use it in **Part 3 to activate the Plus payment
  Function** with one mutation; GraphiQL runs in this app's context, so the app owns its Function.

## Verify the pre-booking data model (it's already there)

The season lives on the product via a **store-owned** metaobject + product metafield that the pre-work
seed script created. Confirm them in Admin under **Settings, Custom data**:

- **Metaobjects**, the **B2B Pre-booking** definition (the "season": name + ordering/delivery dates).
- **Metafields, Products**, the **B2B Pre-booking** field (a metaobject reference to that season).

Because they're store-owned, they're fully editable in Admin (you can even pin the metafield to the
product page), which is exactly how you seed the season in Part 1. Nothing to create here, just look.

## Notes

- These docs use `pnpm`; `npm` works too (adjust the commands). Node.js 20+.
- `--use-localhost` skips the Cloudflare tunnel (it gets throttled when a whole room runs it at
  once). It's fine here: this app uses none of the tunnel-only features (webhooks/events, app proxy,
  app-defined Flow actions, POS). Localhost mode uses a reverse proxy on port 3458
  (`--localhost-port` to change it).
- The **build is deploy-free**: `dev` serves both extensions and rebuilds on save, and Part 3
  activates the Function in the app's GraphiQL (press `g`), no `shopify app deploy` needed in the
  session. A later `shopify app deploy` is only for making the build persist after `dev` stops (an
  optional take-home step).
- `shopify app dev --reset` is harmless now (the app owns no data model to lose); use it only if the
  CLI ever links you to the wrong org/store and you want to re-pick.
- Pin every extension and the app's webhooks to the latest **production** (GA) API version, kept
  consistent. When you change a Function's `api_version`, also run `pnpm shopify app function schema`
  to refresh its `schema.graphql`, or the build fails.

## Building from scratch instead?

If you want to see where the app frame comes from rather than use the provided starter:

```bash
shopify app init --package-manager pnpm     # name it, link your Partner org
shopify app generate extension              # add the theme + payment_customization extensions
```

The first `init` and any `deploy` are interactive (org / app selection); pass `--organization-id`
to script it.

## You should see

The dev session running, the theme block available in the theme editor, GraphiQL reachable with
`g`, and the **B2B Pre-booking** metaobject + product metafield present in Settings, Custom data. The
full working implementation lives on the repo's `finished` branch if you want to compare.
