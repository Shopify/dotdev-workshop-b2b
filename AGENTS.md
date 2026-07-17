# Working in this repo (AI build rules)

This is an AI-assisted workshop build. When you implement the theme block or the payment Function from
the prompts in `SESSION.md`, follow these rules so the build stays fast (a live workshop has a tight
clock):

- **Edit-only.** `shopify app dev` is already running and rebuilds on save. Only edit files (the
  extension `blocks/` and `src/` files). Do NOT run `shopify app deploy`, `shopify app function build`,
  codegen, or any other CLI command. Decline any command you are tempted to run.
- **Do not wait on the environment.** Do NOT run `sleep`/polling loops, do NOT inspect running processes
  (`ps`, `pgrep`, etc.), and do NOT wait for or inspect `generated/api.ts` (GraphQL type codegen is a
  separate step that does not hot-reload). Write against the GraphQL input query given in the prompt.
- **Do not investigate.** If generated types look stale or the environment looks off, note it in one
  line and proceed. If a build is actually broken, drop in the finished file from the
  `finished` branch; you do not debug the environment.
- **One-shot the code.** The prompts give the exact input query and logic. Write the file(s) once, let
  the validator / typecheck run, fix a genuine error if flagged, and stop, do not re-verify repeatedly.

## Key facts (so you never hunt or guess)

- The season **data model lives on the store** (seeded in prework), not in this repo: metaobject
  `b2b_prebooking` with `season_name`, `order_start_date`, `order_end_date`, `delivery_start_date`,
  `delivery_end_date`; product metafield `custom.b2b-prebooking` (metaobject reference). Use these keys
  as-is; don't search the repo to confirm them.
- Payment Function: purchasing company is `cart.buyerIdentity.purchasingCompany.company.id`; the deferred
  method's name is `"Deferred"`; type the input/output locally (do NOT import `../generated/api`, the
  tsconfig `rootDir` is `./src`).

Building the extensions? The full contract and gotchas are in
`starter/b2b-prebooking-workshop/AGENTS.md`. The complete reference implementation lives on the
`finished` branch.
