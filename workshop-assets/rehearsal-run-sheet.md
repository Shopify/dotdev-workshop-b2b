# Rehearsal run-sheet: B2B Pre-Orders workshop

Presenter prep. One page to rehearse from: the throughline, a running clock, say/do per beat,
transitions, cut rules, and live-build safety. Sources: [`delivery-guide.md`](delivery-guide.md)
(narrative) + [`presenter-runbook.md`](presenter-runbook.md) (tactical).

## The throughline (say this to yourself before you start)

**"A B2B buyer orders next season now, sees when it ships, and gets charged automatically when it ships,
and here's how to build it on Shopify today, on Plus and below."**

Spine of the build, three beats after the data model:
1. **Buyer** sees pre-book context on the PDP (theme block).
2. **Checkout** gets the right terms for pre-book (payment Function).
3. **Merchant** manages orders + payments automatically (Flows).

Everything ladders to that one sentence. If a tangent doesn't serve it, cut it.

## Time model (60-min slot)

| Owner | Segment | Target |
|---|---|---|
| Gita | Intro + use cases + framing (problem, why naive approaches fail) | ~8 min |
| **You** | Finished-product demo (the destination) | 3 min |
| **You** | Toolkit (the building blocks slide) | 3 min |
| **You** | Build Part 1 data model (author season + assign) | 4 min |
| **You** | Build Part 2 theme block (prompt + place + verify) | 6 min |
| **You** | Build Part 3 payment Function (prompt + activate + verify) | 6 min |
| **You** | Part 4 Flows (Flow 1 pre-built; build Flow 2 live) | 4 min |
| **You** | Payoff (full lifecycle on Combined) | 4 min |
| **You** | Non-Plus adaptation (talk/show) | 6 min |
| **You** | Close + take-home | 2 min |
| Both | Q&A | 10 min |

Your hands-on window is **~40 min** (finished demo through close). Prework check (~3 min hands-up) overlaps
Gita's intro, don't spend dedicated clock on it.

## Running clock (your window; start your timer when you take over from Gita)

- **0:00** take over. Finished-product demo. → **by 0:03**
- **0:03** toolkit slide. → **by 0:06**
- **0:06** Part 1 data model (author the season, bulk-assign). → **by 0:10**
- **0:10** Part 2 theme block: paste prompt, talk the 2 ideas while it builds, place, verify as Maya. → **by 0:16**
- **0:16** Part 3 Function: paste prompt, talk the 2 ideas, press `g` + activate mutation, verify terms switch. → **by 0:22**
- **0:22** Part 4 Flows: Flow 1 is pre-built (just show it), build **Flow 2** live (charge-when-due). Place the payoff order now. → **by 0:26**
- **0:26** Payoff: three carts, two auto-charges, then the tagged/filtered view. → **by 0:30**
- **0:30** Non-Plus: two-location arrangement, what you lose (dynamic terms + per-fulfillment), force-vault via App Store app. → **by 0:36**
- **0:36** Close + take-home (pattern map + finished branch). → **by 0:38**
- **0:38** hand to Q&A (a couple minutes of buffer).

**Checkpoints to say out loud while rehearsing:** "block placed by 16," "Function activated by 22,"
"payoff order placed by 26." Fulfill whenever, Flow 2 doesn't wait on the tag. If you're past a checkpoint, trigger a cut rule.

## Transitions (the bridges, memorize these one-liners)

- Demo → toolkit: *"That's the destination. Here are the building blocks that get us there."*
- Toolkit → Part 1: *"Only two of those are Plus-only. Let's start building the parts that work everywhere."*
- Part 1 → 2: *"The season's on the product. Now let's show it to the buyer."*
- Part 2 → 3: *"Buyer sees it. Now let's make checkout do the right thing for pre-book."*
- Part 3 → 4: *"Right checkout. Now let's make the merchant's life easy, tag and charge automatically."*
- Part 4 → payoff: *"Let's watch the whole thing run end to end."*
- Payoff → non-Plus: *"That's the Plus experience. Most B2B merchants aren't on Plus, here's the same outcome one tier down."*
- Non-Plus → close: *"Same building blocks, different arrangement. Here's what to take home."*

## If you're behind (cut rules, in order)

1. **Talk less while the AI builds.** The two "while it builds" ideas are the floor; don't add.
2. **Non-Plus to 4 min:** describe it, don't click through every location.
3. **Payoff:** show the two auto-charges only; skip re-showing all three carts (you showed terms at each build step).
4. **Last resort:** if a build stalls >60-90s, `git checkout finished -- <path>`, say "here's the working version," move on. Never debug live.

## Live-build safety (rehearse these as reflexes)

- **Auto-accept edits ON** in your AI before you start (so builds don't stall on approvals).
- **Two tabs only:** Tab 1 `shopify app dev --use-localhost` (running the whole time; press `g` here for GraphiQL), Tab 2 AI.
- **Block goes unstyled / dev crash:** restart `shopify app dev --use-localhost` + hard-refresh → `shopify app dev clean` → `shopify auth logout`/`login`. (Know this ladder cold; it's the most common live hiccup.)
- **Activation `ACCESS_DENIED`:** `pnpm run set-scopes` → re-approve install → re-run. (Shouldn't happen if app setup was done right.)
- Have the **finished demo store** in a browser tab already logged in as Maya on Combined, so the opening demo is instant and guaranteed.

## What makes this land (keep these front of mind)

- **Is there one clear story?** Lead and end with the throughline sentence. Don't let it become a feature tour.
- **The two "wow" moments land:** the finished demo up front (they see the destination) and the **two hands-off charges** in the payoff (the single most impressive minute).
- **It fits the clock** with margin, and Q&A is protected. Show you can cut gracefully.
- **The non-Plus takeaway** (most merchants aren't on Plus) is delivered as value, not a footnote.
- **Polish under pressure:** if something breaks, the finished-branch recovery makes you look prepared, not stuck.

## Rehearsal method

1. **One full timed pass, solo, out loud, actually building** on a fresh seeded store. Note every spot you
   run long against the checkpoints above.
2. **Second pass:** fix the long spots, tighten the transitions, and rehearse the finished-branch recovery
   once on purpose so it's muscle memory.
3. Confirm the finished demo store and your build store are both ready, auto-accept-edits on, two tabs set,
   fresh `shopify auth login` so the token can't expire mid-run.
