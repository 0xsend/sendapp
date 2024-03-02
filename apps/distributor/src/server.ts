// @ts-expect-error set __DEV__ for code shared between server and client
globalThis.__DEV__ = process.env.NODE_ENV === 'development'

import app from './app'

const PORT = process.env.PORT || 3050

app.listen(PORT, () => {
  console.log(`Server running. PORT=${PORT} __DEV__=${__DEV__}`)
})
