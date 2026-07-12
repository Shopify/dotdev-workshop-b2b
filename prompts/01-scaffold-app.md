# 1. Open the app + run dev  [both]

You build on a Shopify app that holds the theme app extension (the PDP block) and, for the Plus
build, the payment-customization Function. The starter already **is** that app: the shell and both
extensions are scaffolded for you in `starter/b2b-prebooking-workshop`, so you don't init or generate
anything, you install dependencies and start the dev session.

## Command

```bash
cd starter/b2b-prebooking-workshop
pnpm install
pnpm run dev   # = shopify app dev --use-localhost
```

Pick your Partner org and the `b2b-prebooking` dev store when prompted. Keep this running; you'll
build against it.

**First run links the app to your org.** The starter ships unlinked (no `client_id`), so the first
`dev` asks to create the app in your org and writes the `client_id` into `shopify.app.toml` in place.
That's expected. **Do not run `shopify app dev --reset`**, reset generates a fresh minimal config and
drops the app-owned data model (the `$app` metaobject + product metafield), which breaks Part 1.
(Some other DotDev workshops tell you to `--reset` for a clean start, that's fine for them because
they don't ship a data model in the toml; here it would wipe ours, so don't.)

**When it asks for a store password**, that's your storefront password (dev stores are
password-protected and the theme app extension needs it to preview). Paste the value from Admin,
**Online Store, Preferences, Password protection**.

**First `--use-localhost` run generates a localhost certificate with mkcert**, which installs a local
CA into your system trust store and so **asks for your Mac/admin (sudo) password**. Say yes and enter
it; one-time per machine. No local admin rights? Drop `--use-localhost` and run plain
`shopify app dev` (it falls back to the Cloudflare tunnel; the only downside is tunnel throttling when
the whole room starts at once).

## What `shopify app dev` does for you here

- **Syncs your app-owned custom data.** The app's `shopify.app.toml` declares the `b2b-prebooking`
  metaobject and product metafield (the `$app` namespace). Running dev creates those definitions on
  your store for you, no mutations. Confirm them in Admin under **Settings, Custom data**: the
  "B2B Pre-booking" metaobject under **Metaobjects**, and the "B2B Pre-booking" product metafield under
  **Metafields, Products**. They show up as **app-managed**: the **schema** is read-only (declarative
  `$app` definitions change only in the toml, not in Admin or via the Admin API), but because they're
  set to `merchant_read_write`, the **values** are yours to edit in Admin, which is how you seed the
  season in Part 1. This is the data-model read in Part 1 / prompt 02.
- **Serves the theme app extension** so the block is available in the theme editor while dev runs.
- **Opens the app's GraphiQL** (press `g`). You seed the season values in the **Admin** in Part 1;
  GraphiQL is the optional code path for the same thing (`$app` resolves to this app here).

## Notes

- These docs use `pnpm`; `npm` works too (adjust the commands). Node.js 20+.
- `--use-localhost` skips the Cloudflare tunnel (it gets throttled when a whole room runs it at
  once). It's fine here: this app uses none of the tunnel-only features (webhooks/events, app proxy,
  app-defined Flow actions, POS). Localhost mode uses a reverse proxy on port 3458
  (`--localhost-port` to change it).
- `shopify app deploy` releases a version; you'll use it in Part 4 to activate the Plus Function.
  Definitions sync on both `dev` and `deploy`.
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
`g`, and the `b2b-prebooking` metaobject + product metafield present in Settings, Custom data. The
full working implementation lives on the repo's `finished` branch if you want to compare.
