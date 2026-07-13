# 4. Flow: tag pre-book B2B orders  [both]

Tag every B2B order that contains a pre-book item so it can be filtered in Admin and so the
charging Flow (Part 4b / prompt `05`) knows which orders to act on. Shopify Flow is available on
all plans. This is **Part 4a** of the workshop (Flows = tag + charge).

## Prompt (copy into Sidekick)

```text
Create a new Flow to tag orders with the tag "Prebooking"
if the order is a B2B order
and the order has a product tagged "prebook".
```

### While Sidekick builds: talk this through

1. **B2B guard:** only tag when the order has a purchasing company, so DTC stays clean.
2. **Product tag `prebook`:** detects pre-book lines; order tag **`Prebooking`** is what merchants filter on (and what Flow 2 keys on).

## What it builds

- **Trigger:** Order created
- **Conditions (all true):**
  - `order.purchasingEntity.PurchasingCompany.company.id` is not empty (the order is B2B,
    placed by a purchasing company)
  - at least one line item where `product.tags` contains `prebook`
- **Action:** add order tag `Prebooking`

## You should see

A new B2B order containing a `prebook`-tagged product gets the `Prebooking` order tag. A DTC
order with the same product does not (the B2B guard). Filter the Orders list by tag
`Prebooking` to get a clean pre-book view.

## Teach (deeper, optional)

Iterate the prompt and review what Sidekick generates. A first, simpler prompt produced a
version without the B2B guard; adding "if the order is a B2B order" is what produced the
`company.id` condition. `prebook` (lowercase) is the product tag that drives the line-item
condition; `Prebooking` is the merchant-facing order tag.
