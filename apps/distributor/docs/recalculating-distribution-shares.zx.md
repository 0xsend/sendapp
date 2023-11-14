# Recalculating Distribution Shares

The distributor app will re-calculate the distribution shares for each Send token holder by analyzing the Ethereum mainnet blocks for Send token transfers. The distributor app will then update the distribution shares for each Send token holder in the database.

To manually request a distribution be recalculated, send a `POST` request to the `/distributor` endpoint:

> You can run this script from the command line:
>
> ```shell
> export DISTRIBUTOR_URL=https://distributor.stage.send.it
> export DISTRIBUTION_ID=1
> export SUPABASE_SERVICE_ROLE=<same service role configured on distributor>
> zx apps/distributor/docs/recalculating-distribution-shares.zx.md
> ```

```js
const response = await fetch(`${$.env.DISTRIBUTOR_URL}/distributor`, {
  method: 'POST',
  body: JSON.stringify({ id: $.env.DISTRIBUTION_ID }),
  headers: {
    'Content-Type': 'application/json',
    Authorization: $.env.SUPABASE_SERVICE_ROLE,
  },
})

// get the response body
const body = await response.json()
console.log(body)
```
