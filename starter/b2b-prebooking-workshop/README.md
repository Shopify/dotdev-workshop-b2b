# b2b-prebooking-workshop (starter app)

The Shopify app you extend in the B2B pre-booking workshop. It holds two extensions:

- **`extensions/prebooking-theme`**: a theme app extension. Its `b2b-prebooking.liquid` block
  shows the pre-book ordering and delivery windows on the product page for B2B buyers, and
  injects the season and delivery window as line item properties.
- **`extensions/prebooking-payment-terms`**: a payment customization Function (Plus). When a
  pre-book item is in the cart it switches payment terms to due-on-fulfillment and hides the
  deferred payment option.

Build the pieces by following the repo's `README.md` ("How the workshop runs") and the matching
`prompts/`.

## What ships vs. what you build

- **`extensions/prebooking-theme`** ships as a **stub**: `blocks/b2b-prebooking.liquid` has a
  comment/TODO and the block schema only (its CSS goes inline in a `<style>` block in that same file,
  no separate `assets/` CSS). You implement the window display + line item properties in Part 2
  (`../../prompts/02-theme-app-block.md`).
- **`extensions/prebooking-payment-terms`** ships as a **stub**: `src/cart_payment_methods_transform_run.ts`
  returns no operations. You implement the due-on-fulfillment + hide-deferred logic in Part 3
  (`../../prompts/03-plus-payment-terms-function.md`).

The app config and both extension scaffolds ship complete; the business logic in those two source
files is yours to build. The pre-booking data model (the season metaobject + `custom.b2b-prebooking`
product metafield) is **not** in this app, it's created store-owned by the pre-work seed script.

## Commands

One-time app setup, run each on its own:

Install dependencies:

```shell
pnpm install
```

Create the app (pick your org, create it as a new app, name it, release the version):

```shell
shopify app deploy
```

Set the app's payment-customizations scope and redeploy:

```shell
pnpm run set-scopes
```

Start the dev session (= `shopify app dev --use-localhost`); approve the install and keep it running:

```shell
pnpm run dev
```

`set-scopes` writes the app's `read/write_payment_customizations` scope into `shopify.app.toml` and
deploys it, so the install grants it and the Part 3 Function activation works the first time. After
setup, the **code build is deploy-free**:
`shopify app dev` serves both extensions live and rebuilds on save, and the Function is activated with
**one mutation in the app's own GraphiQL** (press `g` in the `dev` tab); see
`../../workshop-assets/payment-customization-activation.md`.

The `dev` script uses `--use-localhost` to skip the Cloudflare tunnel (important when a full room runs
it at once). Localhost mode serves over `https://localhost` with a reverse proxy on port 3458 (override
with `--localhost-port`). It's safe here because this app uses none of the tunnel-only features
(webhooks/events, app proxy, app-defined Flow actions, POS).

## Working with your AI assistant

Both builds (theme block, Function) are **edit-only**, `dev` hot-reloads on save, so the AI just edits
files and never needs to run a command. Turn on **auto-accept edits** so it doesn't stop for approval on
every file: Claude Code reads `.claude/settings.json` (shipped here, auto-accepts edits while still
prompting on commands); in Cursor, enable **Auto-Run**. If the AI proposes a CLI command, you can decline
it, it isn't needed in the session.

## Notes

- Uses `pnpm`.
- Pin extensions and the app's webhooks to the latest production (GA) API version. After
  changing a Function's `api_version`, run `pnpm shopify app function schema` to refresh its
  `schema.graphql`.

## Resources

- [Theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [Payment Customization Function API](https://shopify.dev/docs/api/functions/latest/payment-customization)
- [Shopify Functions](https://shopify.dev/docs/api/functions)
- [Shopify CLI](https://shopify.dev/docs/apps/build/cli-for-apps)
