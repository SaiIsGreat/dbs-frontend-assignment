# Meridian Banking — Vedicherla Venkata Sai Kiran

- Deployed: https://dbs-frontend-assignment-deploy.vercel.app/
- Run locally: `npm install && npm run dev`, then open http://localhost:5173

A one-page banking app for one customer: a dashboard with her balance, accounts
and recent transactions, and a three-step transfer. The brief is in
[`brief/candidate-brief.md`](brief/candidate-brief.md). The mock API runs in the
browser through MSW, so the deployed site needs no server. Its data lives in
memory, so a page refresh resets it.

No libraries were added to the starter.

## Project structure

```text
src/
  api/                  Everything that talks to the server
    client.ts           Typed fetch wrapper, and the demo params below
    types.ts            API types
    queries/            One read hook per resource
    useCreateTransfer.ts  Sends a transfer, then refreshes the data
  components/           UI used by more than one feature: Button, Skeleton
  lib/                  Formatters, and the deposit account and daily limit calculations
  theme/                Light/dark and Retail/Premium switches, and saved choices
  dashboard/
    Dashboard.tsx       Entry point: runs the queries, picks loading, error or content
    Header, BalanceHero, AccountCard, DailyLimitCard, DashboardSkeleton
    transactions/       List, row, search input, debounce and skeleton
  transfer/
    TransferDialog.tsx  Entry point: the native dialog, and loading its data
    TransferForm.tsx    The one form, the current step, and sending
    transferSchema.ts   Every validation rule
    toTransferRequest.ts  Converts form values into the API request
    Stepper, SuccessPanel, TextField, FieldError
    steps/
      recipient/        Payee list and search, and new recipient fields
      amount/           From-account, amount, quick buttons and note
      review/           Summary and the send error
  test/                 Test setup and render helper
```

Code lives with the feature that uses it, and moves to a shared folder once two
features need it. A folder only exists once it holds two or more related files.
Each folder has at most one CSS Module.

## Decisions and trade-offs

- **Server state vs UI state:**
  - All server state (data pulled from API) stays in TanStack Query, with no store or context for server state.
  - What's stored client side, is dialog state (isTransferOpen), stepper state (step) etc.
  - Totals, remaining limit and the active segment are calculated on render.
  - Forms only store IDs for chosen account and payee. Details are looked up from query data.

- **Forms and validation:**
  - One useForm hook used across all steps, so that `Back` keeps form state when a step unmounts.
  - `createTransferSchema` function used because validation rules and messages require live balance and limit. Hence, they are rebuilt on render, but only run on user events.
  - Amount stays a string until sent, which avoids awkward problems like `4.35 * 100` giving floating point errors (`434.99999999999994`).
  - Validation rules run again on Confirm, in case the balance or limit changed.
  - Messages follow the mock API's wording as much as possible.

- **Refreshing after a transfer:**
  - Chose to invalidate customer, accounts and transactions, because response has no transaction row to put in cache.
  - Chose to show success only after refresh, because a customer expects the balance to be right when they confirm a transfer. The tradeoff is 500ms of extra wait time for the user.
  - `invalidateQueries` promise doesn't reject on a failed refetch, so a sent transfer still shows success.

- **Transaction search (`q` vs filtering the 8 rows):**
  - Chose API's `q` approach, as it would filter across all server records as compared to just 8 on the client side. Justification: a customer would ask, "I made a transaction last week, why is it not there when I filter?"
  - Claude leaned towards filtering in the browser for simplicity.
  - Decision cost: debounce, `keepPreviousData`, an inline search error, and using `limit=50` query param in API request while searching so that every match shows.

- **Theming and styling:**
  - An inline script in `index.html` sets the data-theme and data-segment attributes on <html> tag before first paint, as React starts too late.
  - CSS Modules, one per folder. I was more familiar with Tailwind and MUI's design system, but design-tokens.css already work as a theme, and it made more sense to follow that structure, and not add any more dependencies.
  - `--text-subtle` on `--bg` is 4.28:1 in light mode, below AA, so small text directly on the page background uses `--text-muted`.

- **Showing demo states:**
  - `scenario` and `delay` are forwarded from page URL.
  - I didn't go with a debug menu, because it would look odd to customers and real banking apps don't have one. In addition, a debug menu would only make sense if there was a staging site, where edge cases could be visually tested.
  - The cost: `Retry` can't visibly recover on the live site.

- **Where the brief was unclear:**
  - A rejection at Review: the contract says show it under the field, but T7 says stay on Review. I chose to stay, with the message in the alert and under the field, because switching steps on an error is confusing.
  - `Esc` and `✕` while sending aren't specified. Blocked, because closing can't cancel the request and would hide the result.
  - The daily limit on mobile isn't in the wireframe. Placed above the transactions, so that the customer can easily view the daily limit without scrolling past all the transactions.
  - `Amount due` sits above the balance rather than below, so balances line up across the cards.

- **Structure**
  - I started out with horizontal slicing experience and had felt its pain when my previous apps grew.
  - Hence, I went with hybrid of feature folders and shared folders, with no flat piles of components, hooks and helpers, and no single-file folders, for better organization.

- **What I'd change:**
  - An end-to-end test, since focus and `Esc` aren't covered by the repo's tests.
  - `show more` for transactions.
  - Cross-browser and screen reader testing (Only tested on Chrome and Firefox).

## Loading, empty and error states

Add these to the deployed URL. The app forwards `scenario` and `delay` from the
page URL to its API requests. This is a demo-only hook, which a real product
wouldn't ship.

| To see | Do this | What appears |
| --- | --- | --- |
| Loading | Open `/?delay=3000` | Skeletons in the same layout as the content |
| Dashboard error | Open `/?scenario=error` | `We couldn't load your dashboard.` and `Retry`, after about 3 seconds because each query tries twice |
| Empty | Open `/?scenario=empty` | Empty accounts and transactions messages, and no saved payees in the transfer |
| No search results | Search for `zzz` | `No transactions match your search.` and `Clear search` |
| Field errors | Press `Continue` with a step empty, or enter `99999` as the amount | Errors under the fields, with focus on the first invalid one |
| Daily limit error | Choose Savings Plus and enter `5000.01` | The remaining limit message |
| Send failure | Put `#fail` in the note, then confirm | The send error on the review step, with everything kept |
| Slow send | Open `/?delay=3000`, then send a transfer | `Sending…`, with closing blocked |

`Retry` keeps failing under `?scenario=error`, because the parameter stays in the
URL. Recovery is covered by a test. A failed search and a failed payee load can't
be triggered from the URL without the dashboard failing first, so those are also
covered by tests only.

## Tests

90 tests with Vitest, Testing Library and the real mock API handlers. Run them
with `npm test`, or `npm run check` to include lint and types.

The three required by the brief:

1. An amount over the balance shows the error and sends no request
   (`TransferDialog.test.tsx`), with a related test for the limit changing while
   on the review step (`TransferSend.test.tsx`).
2. A successful transfer shows the success screen and the dashboard updates
   (`TransferSend.test.tsx`).
3. A failed dashboard request shows the error, and `Retry` loads it
   (`Dashboard.test.tsx`).

| File | Covers |
| --- | --- |
| `transfer/transferSchema.test.ts` | Each validation rule and message, including boundary values |
| `transfer/TransferDialog.test.tsx` | Opening and closing, both steps, focus on the first invalid field, and `Back` keeping values |
| `transfer/TransferSend.test.tsx` | The request sent, one send on double-click, blocked closing, and each failure |
| `dashboard/Dashboard.test.tsx` | Loading, errors, a failed background refresh, and balance calculations |
| `dashboard/transactions/TransactionList.test.tsx` | Rows, search, debounce, stale rows and search failure |
| `theme/theme.test.tsx` | Theme and segment choices, and which one wins |
| `api/client.test.ts` | Forwarding the demo params |
| `lib/` | Formatting and limit rounding |

Tests were checked by deliberately breaking the code and confirming they fail.

jsdom doesn't implement `<dialog>`, so `src/test/setup.ts` has a small stand-in.
That means focus trapping, `Esc` and focus returning to the button aren't covered
by these tests. They were checked with a temporary Playwright script in headless Chromium, which
isn't in the repo.

I focused on where a bug would cost the customer money or trust: sending twice, showing success after a failure, or a wrong balance. Most tests run through the real mock API handlers and the rendered UI, so they check behaviour and survive refactoring. The validation rules are also tested directly, because boundary values like 4280.55 versus 4280.56 are quicker to cover there. I didn’t test styling or the formatting library’s output beyond the brief’s examples.

## AI use

Tools: Claude Code, in the desktop app (used Claude Opus 5.5 model). 

What for: Claude wrote all of the code, tests and CSS from decisions I discussed with it, and ran the checks in a headless browser (chromium installed using playwright).

Where I changed, rejected or fixed what Claude produced, and why:

1. **Search:** Claude leaned towards browser filtering, and I went with passing `q` to the API, for the data completeness reason stated in 'Transaction Search' section above.
2. **Bank list:** Claude added four banks that aren't in the data. I told it to keep to available data, so the list is now the four in the mock data. Making up banks would be confusing to real customers.
3. **Blank screen on load:** I noticed the delay before the skeleton appeared in my browser, which led to rendering the skeleton while the worker starts. If unhandled, a blank page would be seen by the customer before the page renders, which might be confusing.

## Not done / known issues

Optional items not built: daily limit progress bar, `Discard this transfer?`
confirmation, debug menu, balance-hide toggle, third segment, `#transfer` deep
link, end-to-end test and CI workflow.

Also left out: a `show more` control for transactions, which I'd add for a real
product, as well as the wireframe's optional date line, ✓ icon and `Make another
transfer` button.

Known issues:

- Tested in Chromium, including its phone emulation, and Firefox. Not tested in 
  Safari, on real phones or with a screen reader.
- The skeleton and dashboard error screens have no `<h1>`. An accessibility
  checker flags this as a best-practice issue, not a WCAG failure.
- At 360 px, one long transaction description wraps, so the list ends 14 px taller
  than its skeleton. Nothing sits below it, so nothing moves.
- If `localStorage` is blocked, the theme switches still work, but the mock API
  can't start because MSW needs it, so the dashboard shows its error screen.
- The send error says the money hasn't left the account, as the brief specifies,
  including on a network failure when the app can't actually know that.
- On a first visit with no saved choice, a customer whose default was Premium
  would see the Retail colour until their data loads. Ava is Retail, so it doesn't
  show here.
