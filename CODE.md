# Paste-in code (fallback)

Prefer not to prompt the AI from scratch, or your build stalled? This file has the finished code for the
two things you build in the session. **Two ways to use it, either works:**

- **A. Let your AI apply it (recommended, no file hunting).** Select a file's instruction line **and** the
  code block under it, and paste the two together into your AI assistant. The instruction names the exact
  file to write; `dev` hot-reloads on save.
- **B. Copy it into the file yourself.** Open the file at the path in the heading and replace its whole
  contents with the code block.

This is the same code as the `finished` branch, so `git checkout finished -- <path>` (run from
`starter/b2b-prebooking-workshop`) does the same thing in one command. After the theme block you still
**place the block in the theme editor**; after the Function you still **activate it** (SESSION Part 2:
press `g`, run the `paymentCustomizationCreate` mutation).

---

## Part 1 code: theme block

Paste to your AI: *replace the entire contents of `extensions/prebooking-theme/blocks/b2b-prebooking.liquid` with the code below, then stop.*

```liquid
{%- comment -%}
  B2B Pre-booking block.

  Reads the season metaobject referenced by the product's custom.b2b-prebooking metafield and, for a
  B2B buyer (or in the theme editor), shows the ordering + delivery windows and injects visible line
  item properties (Season, Delivery window) onto the /cart/add request.

  target: "section" -> this renders OUTSIDE the product form, so we tag the cart line two ways:
    (1) hidden inputs in the document-level add-to-cart form(s)  -> classic themes
    (2) patching fetch + XHR to append properties on the FormData -> Horizon (builds its own request)

  CSS is inlined in a <style> block (not an assets/ file loaded via asset_url): inline is Shopify's
  recommended way to ship instance-specific block CSS and, unlike an external asset, it can't be
  knocked out by dev-preview asset-URL rotation when the sibling Function rebuilds mid-session.
{%- endcomment -%}

{%- assign season = block.settings.product.metafields["custom"]["b2b-prebooking"].value -%}

{%- if season and customer.b2b? or season and request.design_mode -%}
  {%- assign season_name = season.season_name.value -%}
  {%- assign order_start = season.order_start_date.value -%}
  {%- assign order_end = season.order_end_date.value -%}
  {%- assign delivery_start = season.delivery_start_date.value -%}
  {%- assign delivery_end = season.delivery_end_date.value -%}

  {%- capture order_window -%}{{ order_start | date: "%b %-d, %Y" }} – {{ order_end | date: "%b %-d, %Y" }}{%- endcapture -%}
  {%- capture delivery_window -%}{{ delivery_start | date: "%b %-d, %Y" }} – {{ delivery_end | date: "%b %-d, %Y" }}{%- endcapture -%}
  {%- assign order_window = order_window | strip -%}
  {%- assign delivery_window = delivery_window | strip -%}

  {%- comment -%} Neutral palette that reads on a light storefront theme; the theme owns the page
    colors, so there is intentionally no prefers-color-scheme dark-mode override. {%- endcomment -%}
  <style>
    .b2b-prebooking { margin: 1.5rem 0; padding: 1.25rem 1.5rem; border: 1px solid #d9d9d9; border-radius: 8px; background: #f7f7f5; color: #1a1a1a; font-size: 0.95rem; line-height: 1.5; }
    .b2b-prebooking__badge { display: inline-block; padding: 0.25rem 0.7rem; border-radius: 999px; background: #1a1a1a; color: #ffffff; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; }
    .b2b-prebooking__windows { display: flex; flex-wrap: wrap; gap: 1.5rem; margin: 1rem 0 0.75rem; }
    .b2b-prebooking__window { margin: 0; }
    .b2b-prebooking__label { margin: 0; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #6b6b6b; }
    .b2b-prebooking__value { margin: 0.15rem 0 0; font-size: 1rem; font-weight: 600; color: #1a1a1a; }
    .b2b-prebooking__note { margin: 0.5rem 0 0; font-size: 0.85rem; color: #4a4a4a; }
  </style>

  <section class="b2b-prebooking" aria-label="Pre-booking details">
    <span class="b2b-prebooking__badge">Pre-book: {{ season_name }}</span>

    <dl class="b2b-prebooking__windows">
      <div class="b2b-prebooking__window">
        <dt class="b2b-prebooking__label">Ordering window</dt>
        <dd class="b2b-prebooking__value">{{ order_window }}</dd>
      </div>
      <div class="b2b-prebooking__window">
        <dt class="b2b-prebooking__label">Expected delivery</dt>
        <dd class="b2b-prebooking__value">{{ delivery_window }}</dd>
      </div>
    </dl>

    <p class="b2b-prebooking__note">
      Place your order now during the ordering window. Items ship in the delivery window shown above,
      with payment due on fulfillment.
    </p>
  </section>

  <script>
    (function () {
      var PRODUCT_ID = {{ block.settings.product.id | json }};
      var PROPS = {
        "properties[Season]": {{ season_name | json }},
        "properties[Delivery window]": {{ delivery_window | json }}
      };
      var NAMES = Object.keys(PROPS);

      // Shared registry so fetch/XHR are patched once even if the block re-renders (hot reload),
      // and so multiple pre-book blocks (different products) each tag only their own line.
      var reg = (window.__b2bPrebooking = window.__b2bPrebooking || { products: {}, patched: false });
      reg.products[String(PRODUCT_ID)] = PROPS;

      // Append this product's properties onto a FormData add-to-cart body, but ONLY when the body is
      // adding THIS product. Skip when product-id is absent or is a different product (e.g. a quick-add
      // of a "you may also like" item on the same page), so we never mis-tag another product's line.
      function tagBody(body) {
        if (typeof FormData === "undefined" || !(body instanceof FormData)) return;
        var pid = body.get("product-id");
        if (pid == null) return;
        var props = reg.products[String(pid)];
        if (!props) return;
        Object.keys(props).forEach(function (name) {
          body.set(name, props[name]); // set (not append) -> idempotent across retries
        });
      }

      // (2) Horizon: it builds /cart/add from selected fields, so patch the transport layer.
      if (!reg.patched) {
        reg.patched = true;

        if (typeof window.fetch === "function") {
          var origFetch = window.fetch;
          window.fetch = function (input, init) {
            try {
              if (init && init.body) tagBody(init.body);
            } catch (e) {}
            return origFetch.apply(this, arguments);
          };
        }

        var origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (body) {
          try {
            tagBody(body);
          } catch (e) {}
          return origSend.apply(this, arguments);
        };
      }

      // (1) Classic themes: inject hidden inputs into the document-level add-to-cart form(s).
      // Idempotent, and keyed by product id so multiple blocks don't clobber each other.
      function injectInto(form) {
        NAMES.forEach(function (name) {
          var selector =
            'input[data-b2b-prebooking="' + PRODUCT_ID + '"][name="' + name + '"]';
          var input = form.querySelector(selector);
          if (!input) {
            input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.setAttribute("data-b2b-prebooking", PRODUCT_ID);
            form.appendChild(input);
          }
          input.value = PROPS[name];
        });
      }

      function injectAll() {
        document.querySelectorAll('form[action*="/cart/add"]').forEach(injectInto);
      }

      injectAll();

      // Re-inject when the selected variant changes...
      document.addEventListener("change", function (e) {
        var t = e.target;
        if (t && t.matches && t.matches('input[name="id"]')) injectAll();
      });

      // ...and when a section re-renders (variant/quantity updates swap DOM).
      if (typeof MutationObserver !== "undefined") {
        new MutationObserver(function () {
          injectAll();
        }).observe(document.body, { childList: true, subtree: true });
      }
    })();
  </script>
{%- endif -%}

{% schema %}
{
  "name": "B2B Pre-booking",
  "target": "section",
  "settings": [
    { "type": "product", "id": "product", "label": "Product", "autofill": true }
  ]
}
{% endschema %}
```

After pasting: place the block on a pre-book product in the theme editor (**Add block -> Apps -> B2B Pre-booking**), then verify as Maya (SESSION Part 1).

---

## Part 2 code: payment Function (two files)

Paste to your AI: *replace the entire contents of `extensions/prebooking-payment-terms/src/cart_payment_methods_transform_run.graphql` with the code below, then stop.*

```graphql
query CartPaymentMethodsTransformRunInput {
  cart {
    buyerIdentity {
      purchasingCompany {
        company {
          id
        }
      }
    }
    lines {
      merchandise {
        __typename
        ... on ProductVariant {
          product {
            metafield(namespace: "custom", key: "b2b-prebooking") {
              value
            }
          }
        }
      }
    }
  }
  paymentMethods {
    id
    name
  }
}
```

Paste to your AI: *replace the entire contents of `extensions/prebooking-payment-terms/src/cart_payment_methods_transform_run.ts` with the code below, then stop.*

```typescript
interface PaymentMethod {
  id: string;
  name: string;
}

interface ProductNode {
  metafield?: {
    value?: string | null;
  } | null;
}

interface Merchandise {
  __typename: string;
  product?: ProductNode | null;
}

interface CartLine {
  merchandise: Merchandise;
}

interface RunInput {
  cart: {
    buyerIdentity?: {
      purchasingCompany?: {
        company?: {
          id: string;
        } | null;
      } | null;
    } | null;
    lines: CartLine[];
  };
  paymentMethods: PaymentMethod[];
}

interface PaymentMethodHideOperation {
  paymentMethodHide: {
    paymentMethodId: string;
  };
}

interface PaymentTermsSetOperation {
  paymentTermsSet: {
    paymentTerms: {
      event: {
        trigger: string;
      };
    };
  };
}

type Operation = PaymentMethodHideOperation | PaymentTermsSetOperation;

interface FunctionRunResult {
  operations: Operation[];
}

// "Due on fulfillment" B2B payment terms map to an event-based term that is
// triggered when a fulfillment is created for the order.
const DUE_ON_FULFILLMENT_TRIGGER = "FULFILLMENT_CREATED";

// Deferred B2B payment methods are hidden so that a card/bank account is vaulted
// at checkout, which is what lets Flow charge automatically on fulfillment. The
// underlying method name is "Deferred" (rendered at checkout as "Choose payment
// method at a later time"); "later" is kept as a fallback for other stores.
const DEFERRED_METHOD_PATTERNS = ["deferred", "later"];

const NO_CHANGES: FunctionRunResult = { operations: [] };

export function cartPaymentMethodsTransformRun(input: RunInput): FunctionRunResult {
  const isB2B = Boolean(input.cart.buyerIdentity?.purchasingCompany?.company?.id);
  if (!isB2B) {
    return NO_CHANGES;
  }

  const hasPrebookItem = input.cart.lines.some(lineIsPrebook);
  if (!hasPrebookItem) {
    return NO_CHANGES;
  }

  const setDueOnFulfillment: PaymentTermsSetOperation = {
    paymentTermsSet: {
      paymentTerms: {
        event: {
          trigger: DUE_ON_FULFILLMENT_TRIGGER,
        },
      },
    },
  };

  const hideDeferredMethods = input.paymentMethods
    .filter((method) => methodMatchesAnyPattern(method, DEFERRED_METHOD_PATTERNS))
    .map((method) => hidePaymentMethod(method.id));

  return {
    operations: [setDueOnFulfillment, ...hideDeferredMethods],
  };
}

function lineIsPrebook(line: CartLine): boolean {
  const value = line.merchandise.product?.metafield?.value;
  return typeof value === "string" && value.trim().length > 0;
}

function hidePaymentMethod(paymentMethodId: string): PaymentMethodHideOperation {
  return {
    paymentMethodHide: {
      paymentMethodId,
    },
  };
}

function methodMatchesAnyPattern(method: PaymentMethod, patterns: string[]): boolean {
  const normalizedName = method.name.toLowerCase();
  return patterns.some((pattern) => normalizedName.includes(pattern));
}

export { DUE_ON_FULFILLMENT_TRIGGER, DEFERRED_METHOD_PATTERNS };
```

After pasting both files: activate the Function (SESSION Part 2: press `g` in the `dev` terminal, run the `paymentCustomizationCreate` mutation), then verify as Maya on Combined.
```
