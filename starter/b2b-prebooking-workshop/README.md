# b2b-prebooking-workshop (starter app)

The Shopify app you extend in the B2B pre-booking workshop. It holds two extensions:

- **`extensions/prebooking-theme`**: a theme app extension. Its `b2b-prebooking.liquid` block
  shows the pre-book ordering and delivery windows on the product page for B2B buyers, and
  injects the season and delivery window as line item properties.
- **`extensions/prebooking-payment-terms`**: a payment customization Function (Plus). When a
  pre-book item is in the cart it switches payment terms to due-on-fulfillment and hides the
  deferred payment option.

Build the pieces by following the repo's `prompts/` and `workshop-assets/hands-on-guide.md`.

## Common commands

```shell
pnpm shopify app dev       # local development (runs with --use-localhost, see below)
pnpm shopify app deploy    # release a new app version
```

Deploy releases both extensions. The Plus payment Function is then activated once via the
Shopify GraphiQL App (see `../../workshop-assets/payment-customization-activation.md`).

This workshop is deploy-based, so you rarely need `app dev`. When you do, the `dev` script uses
`--use-localhost` to skip the Cloudflare tunnel (important when a full room runs it at once).
Localhost mode serves over `https://localhost` with a reverse proxy on port 3458 (override with
`--localhost-port`). It's safe here because this app uses none of the tunnel-only features
(webhooks/events, app proxy, app-defined Flow actions, POS).

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
