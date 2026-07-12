# Prompts

Work through these in order. Each file has the exact CLI command and/or AI prompt to use,
plus what you should see when it works. They are labelled:

- **[non-Plus]** works on Advanced and up
- **[Plus]** needs Plus-tier capabilities
- **[both]** works on either

You build all of them on your dev store (dev stores include Plus features). The labels tell you
which merchant plan a capability requires, so you can build for and advise merchants on each.

Philosophy: AI is an accelerator, not the author. Use the prompt to generate the code, then
read and understand what it produced. The `starter/` app already contains a finished version
of each piece so you can compare.

| Step | File | Scope |
|---|---|---|
| 0 | `00-store-setup.md` | non-Plus + Plus |
| 1 | `01-scaffold-app.md` | both |
| 2 | `02-theme-app-block.md` | both |
| 3 | `03-flow-tag-prebook-orders.md` | both |
| 4 | `04-flow-charge-on-fulfillment.md` | both |
| 5 | `05-plus-payment-terms-function.md` | Plus |

Step 0 provisions the store structure (B2B catalogs, markets, company locations, payment terms,
and the pre-booking data model). It assumes you've already imported the products
(`../workshop-assets/products/`) and created a company; see
`../workshop-assets/prerequisites.md`.
