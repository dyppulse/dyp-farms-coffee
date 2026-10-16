# Demo dataset

A large, repeatable set of **test data** for trying the app at realistic scale:

| What | How many |
|---|---|
| Farmers, across 70 districts in all four regions of Uganda | 1,000 |
| Farms with GPS boundary polygons (area matches `sizeHectares`) | ~1,500 |
| Buyers (roasters) and tourists | 60 and 30 |
| Harvest-ready coffee lots (robusta and arabica grades, USD/kg) | ~600 |
| Auctions: open (some with auto-bids, some with no bids yet) and finished | ~275 |
| Bids | ~1,800 |
| Warehouse receipts, loan requests (pending, approved, rejected, funded) | ~180, ~70 |
| Community posts, replies, likes; subscriptions; support tickets | 160, 240, 1,170; 45; 40 |

Logins for every account are in [`DEMO_LOGINS.txt`](./DEMO_LOGINS.txt). All demo emails end in
`@demo.dypfarms.test`, which cannot receive mail.

## Putting it on a database

On Render: set `SEED_DEMO_DATA=true`. The API loads the dataset in the background on every
start. It is safe to repeat (rows are matched by fixed `demo-…` ids) and it pushes the
"evergreen" auctions forward so there are always open auctions to bid on.

From a laptop, against whatever `DATABASE_URL` points to:

```bash
npm run demo:seed      # insert / refresh
npm run demo:remove    # delete the demo data and nothing else
```

## Taking it off again

Unset `SEED_DEMO_DATA`, then run `npm run demo:remove` with `DATABASE_URL` pointing at that
database. It deletes only rows with `demo-` ids and `@demo.dypfarms.test` users.

## Things to know

- **The logins file is plaintext.** Anyone who can read the repo can sign in as these users on
  any database that holds the demo data. Keep the repository private and remove the demo data
  before a real launch.
- District coordinates are approximate centres (good to roughly 10 km), and farms are scattered
  around them. This is realistic test data, not survey data.
- Prices are USD per kg, to match the marketplace screens. Names and farms are fictional.
- `npm run demo:generate` rewrites the data and creates **new passwords**. Only run it on purpose,
  then re-seed and commit both files together.
