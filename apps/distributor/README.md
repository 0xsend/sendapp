# Send Token Distributor

This is a singleton Fastify app that analyzes Ethereum mainnet blocks for Send token transfers and re-calculates the distribution shares for each Send token holder.

## Recalculating distribution shares

The distributor app will re-calculate the distribution shares for each Send token holder by analyzing the Ethereum mainnet blocks for Send token transfers. The distributor app will then update the distribution shares for each Send token holder in the database.

To manually request a distribution be recalculated, send a `POST` request to the `/distributor` endpoint:

```js
import 'zx/globals'

const err = require('dotenv').config({ path: __dirname + '/../.env.local' })

if (err.error) {
  throw err.error
}

// send post request to distributor running at localhost:3050

const response = await fetch('http://localhost:3050/distributor/v2', {
  method: 'POST',
  body: JSON.stringify({ id: 1 }),
  headers: {
    'Content-Type': 'application/json',
    Authorization: process.env.SUPABASE_SERVICE_ROLE,
  },
})

// get the response body
const body = await response.json()
console.log(body)
```

## Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)

This project was bootstrapped with Fastify-CLI.

## Available Scripts

In the project directory, you can run:

### `yarn run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `yarn start`

For production mode

### `yarn run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://www.fastify.io/docs/latest/).
