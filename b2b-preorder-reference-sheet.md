# Building B2B Pre-Orders: reference sheet

**DotDev 2026 take-home companion.**

The live session builds the first pattern below (buyers pre-order now, each order bills when its goods
ship) and the mixed in-stock + pre-order variation. The rest are common requests you'll hear from
merchants, and the platform primitives to build each one, on Plus and on non-Plus. B2B is available on
all plans; the only Plus-only pieces are custom Functions (dynamic payment terms, custom validation) and
per-fulfillment billing.

---

## Ways to build for common requests

| Pre-order pattern | On Plus | On non-Plus |
|---|---|---|
| **Let buyers pre-order now and bill each one only when their goods ship.** | **Strategy:** Assign a B2B catalog for the pre-sale window + Payment Customization Function + vaulted payment method + Flow.<br><br>**Execution:** At checkout, the Function reads the pre-order product metafield, sets Due on Fulfillment terms, and enforces card vaulting. Flow triggers the charge per fulfillment. | **Strategy:** Use a dedicated company location assigned to a market with the pre-order catalog + Payment Customization Function + vaulted payment method + Flow.<br><br>**Execution:** The buyer selects the pre-order company location to see the catalog; the Function (via a public app) applies Due on Fulfillment terms and enforces card vaulting. Flow charges the saved payment method once the entire order is fulfilled.<br><br>**Note:** Per-fulfillment billing is Plus-only. |
| **Mix in-stock and next-season items in one order.** | **Strategy:** Unified checkout with order-level payment terms.<br><br>**Execution:** As above, the Payment Customization Function forces "Due on Fulfillment" for the whole order if a pre-order item exists and enforces card vaulting. Fulfill in-stock items immediately; Flow triggers the charge per fulfillment.<br><br>**Note:** Use draft orders to split into two orders, if desired. | **Strategy:** Keep in-stock orders and pre-orders separate unless a single payment is acceptable.<br><br>**Execution:** Use separate company locations for in-stock ordering and pre-ordering. |
| **Pre-order the spring line while it stays hidden from the public (D2C), only during the window.** | **Strategy:** B2B catalog + publishing + season metaobject.<br><br>**Execution:** B2B catalog assigned to eligible company locations + product and variant publishing; exclude products from the D2C market. The storefront reads the season metaobject to toggle availability. | **Strategy:** B2B catalog + Markets + publishing.<br><br>**Execution:** Similar to Plus, but capped at 3 active B2B catalogs. Plan the seasonal architecture to remain within the catalog limit. |
| **Set ship window per item (e.g., Feb vs. April).** | **Strategy:** Line-item properties + Validation Function.<br><br>**Execution:** Assign "Season" via a line-item property at add-to-cart. A custom Cart and Checkout Validation Function enforces valid windows. | **Strategy:** Line-item properties + app.<br><br>**Execution:** Same logic as Plus. Use a public App Store validation app to enforce the delivery-window rules instead of a custom Function. |
| **Pre-book beyond on-hand inventory.** | **Strategy:** Product metafields + inventory policy + order tagging with Flow + optional Validation Function.<br><br>**Execution:** Set policy to CONTINUE so the line sells past zero and demand keeps accruing, which is the signal you plan production from. Hold the availability date in a product metafield; the theme shows the expected ship date. Tag orders and write order metafields at checkout (`prebook`, `season`) to feed forecasting and allocation; Flow can apply the tags.<br><br>**Note:** To cap demand at a ceiling, add a custom Cart and Checkout Validation Function reading a cap metafield; to close the window once production is set, flip policy to DENY. | **Strategy:** Product metafields + inventory policy + public App Store validation app (if needed).<br><br>**Execution:** The native cap works the same here and on any plan: load on-hand plus expected incoming as the variant's available count, leave inventory policy on DENY, and Shopify stops sales there with no Function and no app. The theme reads the availability-date metafield to show the ship date.<br><br>**Note:** Custom Functions are Plus-only, so if you need a rule richer than a quantity (a per-order minimum, a mixed-cart block, or selling past zero with an enforced cap), use a public App Store validation app in place of the custom Function. |
| **Continue selling sold-out items to B2B buyers only.** | **Strategy:** Inventory policy + audience split + optional Validation Function.<br><br>**Execution:** Set policy to CONTINUE per variant for the backorder. Audience split (B2B vs. D2C) via publishing or theme logic + a custom Cart and Checkout Validation Function reading an oversell-floor metafield, to enforce a backorder limit (optional). | Same as Plus, but the validation Function must be a public App Store app; custom apps are Plus-only. |

---

## Strategic constraints

- **Terms are order-level, not line-level.** Payment terms apply to the entire order. You cannot mix terms (e.g., "Net 30" for in-stock and "Due on fulfillment" for pre-orders) on a single order. Plan to separate orders up front if needed (a dedicated pre-order company location, or draft orders).
- **Continue-selling is global.** The "continue selling when out of stock" policy applies to the variant, not the channel. Use publishing or theme logic to restrict availability between B2B and D2C.
- **Catalogs manage access, not inventory.** Catalogs control who sees what; they do not manage reservations or shipping dates.
- **Plan for non-Plus constraints.** Non-Plus includes Basic, Grow, and Advanced plans, capped at 3 B2B catalogs. Design your seasonal strategy to stay within these limits.
- **The data model matters.** Model seasons as metaobjects to handle open/close windows and delivery dates. Treat line-item properties as the "contract" for order details, and product metafields as the "trusted signal" for system logic.

## Tactical considerations

- **Due on Fulfillment requires manual handling.** This term doesn't auto-collect. Pair it with a vaulted card and a Flow trigger ("Payment schedule is due") to charge automatically.
- **Splitting mixed carts.** You cannot split a completed order. Use draft orders or separate the in-stock and pre-order buying journeys if you need individual orders.
- **Overselling protection.** Use synchronous validation Functions or native "DENY" inventory policies to stop overselling at checkout. Async methods (like Flow) act after the order, risking gaps in inventory counts.
- **Communicate expected ship dates.** Shopify natively assumes immediate shipment. If shipment is delayed, your storefront must explicitly surface the availability-date metaobject so the buyer is not surprised. Do not rely on email notifications alone.
- **ACH settlement delay.** ACH transfers are not instant. Build your workflows to account for the settlement lag so you don't treat orders as "paid" prematurely.
- **Tagging for operations.** Tag orders (e.g., `prebook`, `season:spring-2027`) and write order metafields at checkout. This gives your ops team immediate visibility in Admin.

## Glossary

- **Pre-order:** inventory is assigned or soon will be. A delayed-fulfillment order tied to a concrete quantity or ship date; the buyer may pay now, in part, or later.
- **Backorder:** a released product that is out of stock but still sellable ("continue selling when out of stock").
- **Pre-booking:** buyers commit demand before production quantities are finalized, so inventory may not be assigned yet. The order drives forecasting, allocation, and manufacturing planning. Common in seasonal apparel.
- **Delivery schedule:** the agreement on when items ship and in what quantities; may or may not match when the product becomes available.
- **Payment terms:** when a balance is due: fixed date, Net (N days from order creation), or event-based like due on fulfillment.
- **Payment Customization Function:** a Shopify Function that sets the order's terms and deposit from cart contents and buyer. One schedule for the whole order, not per line. Plus only.
- **Catalog and publication:** who sees which products. Publishing shows a product in a context (company location, market, channel); unpublishing hides it.
- **Inventory policy:** the per-variant switch CONTINUE (sell past zero) versus DENY (stop at zero).
- **Validation Function:** a Shopify Function that blocks checkout when a cart breaks a rule you set.
- **Vaulted card:** a card saved to charge later.
- **ACH:** a bank-to-bank transfer (US-only).
