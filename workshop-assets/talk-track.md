# Talk track (word-for-word starting point)

Presenter prep. A first-draft script to rehearse from, in your own voice. `[Brackets]` are stage
directions (what you do), the rest is what you say. Adjust freely; this is a scaffold, not a
teleprompter. Pairs with [`rehearsal-run-sheet.md`](rehearsal-run-sheet.md) (clock + cut rules).

---

## [If you're covering Gita's framing] ~2 min

"Pre-orders are one of the most common asks in B2B, especially in apparel. A buyer commits to next
season now, the brand produces to that demand, it ships months later, and the buyer pays on terms, not
up front. Shopify has all the pieces to do this today. What there isn't is a single doc that tells you
which pieces to combine. That's what we're going to build.

Quick word on the traps, because they're tempting and they all break. A pre-order app? Those are built
for D2C deferred purchases, they don't speak B2B terms or per-company catalogs. Put the season on the
customer or the company? It falls apart the second a buyer orders across two seasons. One product in two
inventory states? Available-now has to stop selling at zero; pre-book has to keep selling past zero to
size the run, one record can't do both. And charging the card at checkout? Wrong for a B2B buyer who
pays on terms for something that ships in months. So the season belongs on the *product*, pre-order is a
product *state* you tag, and payment waits for fulfillment. Get that modeling right and everything
downstream is easy. Get it wrong and every piece fights you."

## Opening: show the finished product (~3 min)

[Finished demo store, already logged in as Maya Cruz on the Combined location, in a browser tab.]

"Before we build anything, let me show you where we're going, so every step has a reason.

[Open a pre-book product PDP.] This is a pre-book product. Notice what a B2B buyer sees: the ordering
window, and the expected delivery window. This isn't in the theme by default, it's coming from data we
put on the product.

[Add it to a cart that already has an available-now item.] I've got one in-stock item and one pre-book
item in a single cart.

[Go to checkout.] Watch checkout. The order is set to due on fulfillment, and the option to choose a
payment method later is gone, a card is required. And on the line item you can see the Season and the
delivery window carried all the way to checkout.

[Place the order, then fulfill one line.] I'll place it, then fulfill just the in-stock line, and the
vaulted card gets charged automatically for that shipment. Later, when the pre-book item ships, it
charges again, on its own.

In the next forty minutes you'll build exactly this on your own store, and you'll learn how to deliver
the same outcome for a merchant who isn't on Plus. Let's build it."

[Bridge:] "That's the destination. Here are the building blocks that get us there."

## Toolkit (~3 min)

[Toolkit slide.]

"Seven building blocks. The season lives on the product as a metaobject plus a product metafield, that's
our data model. A theme block reads it and shows the windows, and it carries the season onto the cart
line as line item properties, which works on every plan. On the company location we have vaulted cards
and payment terms, including due on fulfillment, which is what makes 'pay when it ships' real. A Flow
charges the vaulted card automatically on fulfillment. And two of these are Plus-only: per-fulfillment
charging, and a Function that switches payment terms at checkout.

Hold onto that last point: only two things need Plus. Everything else works without it. The whole game
is which combination you reach for on which plan.

[Bridge:] Let's start building the parts that work everywhere."

## App setup (terminal, ~1-2 min while you talk)

[Tab 1. Kick `pnpm install` off during the opening/toolkit so it's done by now; then run the rest as you
narrate. Commands are raw so the room sees exactly what's happening.]

"Quick setup in the terminal, and I'm running the real commands so you can see them.

[`pnpm install`] Install the app's dependencies.

[`shopify app deploy`] This creates my app in my Partner org and registers a version.

[`pnpm run set-scopes`] This one writes the payment-customizations permission my app needs into its
config and redeploys, so when I install in a second, that permission is already granted. That's what
makes the Plus activation later work on the first try.

[`shopify app dev --use-localhost`] And this starts the dev session, which stays running the whole time.
`--use-localhost` just serves it locally so a full room doesn't get throttled. I approve the install in
the browser once, and I'm ready to build.

[Bridge:] App's running. Let's look at the data model."

## Part 1: Data model (~4 min)

[Admin, Settings, Custom data.]

"The definitions already exist on the store, they were created in pre-work. Here's the B2B Pre-booking
metaobject, our 'season,' with the ordering and delivery dates. And here's the product metafield that
points a product at a season. The presence of that metafield is what marks a product as pre-book.

[Create one season entry with the dates.] I'll create one season, Spring/Summer 2027, with its ordering
and delivery windows.

[Bulk editor, assign to the five pre-book products.] Then I assign that season to my pre-book products
in one shot, select them, edit, pick the season once for all of them.

[Checkpoint:] And now a pre-book product carries its season. Nothing's hardcoded, it's data on the
product.

[Bridge:] The season's on the product. Now let's show it to the buyer."

## Part 2: Theme block (~6 min)

[Tab 2, AI assistant, auto-accept edits on.]

"I'll build the theme block by prompting my AI assistant. I'm not going to hand-write this, I'm going to
prompt it and read what it produces. [Paste the prompt.]

[While it builds:] Two ideas while this builds. First, one line does the whole data connection:
`product.metafields custom b2b-prebooking`. The block reads the season we attached to this product,
nothing hardcoded, so it updates automatically when the season changes. Second, there's a small script
that writes the Season and delivery window onto the cart line as line item properties. That's the
all-plans way to carry pre-book context into the cart and checkout, no Plus required.

[Place the block in the theme editor.] With dev running, the block shows up in the theme editor, I add
it to a pre-book product template. No deploy needed.

[Verify as Maya on the storefront.] As the B2B buyer: the windows render on the pre-book product, and
when I add to cart, Season and delivery window show on the cart line and at checkout. An available-now
product shows nothing. That's the checkpoint.

[Bridge:] The buyer sees it. Now let's make checkout do the right thing for pre-book."

## Part 3: Plus payment Function (~6 min)

[Tab 2.]

"On the Combined location a buyer can have both in-stock and pre-book items in one cart. We want that
checkout to switch to due on fulfillment and force a vaulted card. That's this Function. [Paste the
prompt.]

[While it builds:] Two ideas. First, it fails open: it does nothing unless the cart is B2B and actually
contains a pre-book item, every other checkout passes through untouched. Second, when it does act, it
does exactly two things, set the terms to due on fulfillment, and hide the 'pay later' option so a card
gets vaulted, which is what lets the Flow charge automatically later.

[Activate: Tab 1, press g, run the mutation.] The Function is built, now I activate it. In the dev tab I
press `g` to open the app's own GraphiQL, and run one mutation to turn it on. This is the same for
everyone, the handle is fixed in the repo. [Run it, show the id back.]

[Verify as Maya on Combined.] Mixed cart, checkout flips to due on fulfillment and 'pay later' is gone.
Available-now-only cart stays on Net 30 with pay-later available. That's the checkpoint.

[Bridge:] Right checkout. Now let's make the merchant's life easy, tag and charge these automatically."

## Part 4: Flows (~4-5 min)

[Admin, Shopify Flow, Sidekick.]

"Two Flows so the store owner never touches this by hand. The first one I built ahead of time, so let me
just show it. [Show Flow 1.] It tags any B2B order that has a pre-book item as Prebooking. The B2B
condition keeps regular orders untagged. That tag is purely so the merchant can filter their orders to
the pre-book ones, the charge Flow doesn't depend on it. You'd build this from the prompt; I pre-built
mine to save time.

[Build Flow 2 with the Sidekick prompt.] This second one I'll build live. It charges the vaulted card
when a B2B order's payment schedule comes due, which for due-on-fulfillment is when you fulfill. And
there's a safety check: it skips any schedule that's already been paid, so it never double-charges.
Notice it keys off the payment schedule, not the tag, so it doesn't wait on the first Flow at all.

[Place the payoff order now.] I'll place my mixed order now so we can fulfill it in a second.

[Bridge:] Let's watch the whole thing run end to end."

## Payoff: the full lifecycle (~4 min)

[On Combined, as Maya.]

"Three carts, three behaviors [show quickly]: available-now is Net 30 with pay-later; pre-book only and
mixed are both due on fulfillment with no pay-later, and the season shows on the line.

[Fulfill.] Here's the payoff. I fulfill the in-stock line, and the vaulted card is charged automatically
for that shipment. Then I fulfill the pre-book line, and it charges again, on its own. Two automatic
charges, one per shipment, and nobody ever touched the card. No waiting on anything.

[Show the filter.] And the order's also tagged Prebooking, so the merchant can filter their orders to
just the pre-book ones. [Show the filtered Orders list.]

That's per-fulfillment charging, plus due-on-fulfillment terms, plus the Function, plus the Flow, all
working together on one Plus order.

[Bridge:] That's the Plus experience. Most B2B merchants aren't on Plus, so here's the same outcome one
tier down."

## Non-Plus adaptation (~6 min)

[Pre-seeded two-location arrangement.]

"On non-Plus you lose exactly two things: the Function that switches terms at checkout, and per-fulfillment
charging. That's it. So the move is to pre-separate the two journeys into two company locations, each
with a fixed term, Available Now on Net 30, Pre-book on due on fulfillment. The buyer orders from the
right location, gets the right term, and the same charge-on-fulfillment Flow collects when it ships. The
theme block and both Flows work unchanged.

The one piece that needs a substitute: forcing a vaulted card. Custom apps with Functions need Plus, so
on non-Plus that 'hide pay later' comes from an App Store app instead of your own. Same building blocks,
different arrangement.

[Bridge:] Here's what to take home."

## Close (~2 min)

"So you built a B2B pre-order flow: a product-page block that carries season context to checkout, two
Flows that tag and auto-charge on fulfillment, and, on Plus, the Function that ties it into one smart
mixed cart, plus the non-Plus version that reaches the same outcome with two locations.

The takeaways are the pattern map, which combination solves which pre-order pattern, and the finished
branch in the repo if you want the reference. If you want to go further, the extensions are a polished
checkout display, multiple seasons, and a buyer-selected delivery date. Come find us at the booth.
Thank you."

[Then Q&A.]
