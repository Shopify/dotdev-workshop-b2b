# Prompts

**In the live session, attendees follow [`SESSION.md`](../SESSION.md)** (one doc: talk track, clicks,
paste prompts, while-it-builds teach notes). These files are the same paste prompts with optional
deeper notes if you want them open separately.

Work through these in order. Each file has the exact CLI command and/or AI prompt to use,
plus what you should see when it works. They are labelled:

- **[non-Plus]** works on plans below Plus (no Plus-tier features needed)
- **[Plus]** needs Plus-tier capabilities
- **[both]** works on either

You build all of them on your dev store (dev stores include Plus features). The labels tell you
which merchant plan a capability requires, so you can build for and advise merchants on each.

Philosophy: AI is an accelerator, not the author. Use the prompt to generate the code, then
read and understand what it produced. The `starter/` app ships the extensions as **stubs** you
implement (see `../starter/b2b-prebooking-workshop/README.md`); a complete reference lives on the
`finished` branch if you want to compare.

| Step | File | Scope | Session part |
|---|---|---|---|
| 0 | `00-store-setup.md` | non-Plus + Plus | Prework (optional AI path) |
| 1 | `01-scaffold-app.md` | both | Part 1 (data model + start app) |
| 2 | `02-theme-app-block.md` | both | Part 2 (buyer: PDP) |
| 3 | `03-plus-payment-terms-function.md` | Plus | Part 3 (buyer: checkout) |
| 4 | `04-flow-tag-prebook-orders.md` | both | **Part 4a** (merchant: tag) |
| 5 | `05-flow-charge-on-fulfillment.md` | both | **Part 4b** (merchant: charge) |

Parts 4a and 4b are one workshop beat ("Flows"): keep both prompts, build them back to back. Talk track
after the data model: theme block (buyer sees pre-book context) → payment Function (right checkout) →
Flows (merchant manages orders and payments).

Step 0 provisions the store structure (B2B catalogs, markets, company locations, payment terms,
and the pre-booking data model). It assumes you've already imported the products
(`../workshop-assets/products/`) and created a company; see
`../workshop-assets/prerequisites.md`.
