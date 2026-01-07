import pg from 'pg'

const { Pool } = pg

/**
 * Get active vault addresses from the database.
 */
export async function getActiveVaults(dbUrl: string): Promise<`0x${string}`[]> {
  const pool = new Pool({ connectionString: dbUrl })

  try {
    const result = await pool.query<{ send_earn: Buffer }>(
      'SELECT DISTINCT send_earn FROM send_earn_create ORDER BY send_earn'
    )

    if (!result.rows || result.rows.length === 0) {
      return []
    }

    // Convert bytea to hex addresses
    const vaults = result.rows.map((row) => {
      const hex = row.send_earn
      if (Buffer.isBuffer(hex)) {
        return `0x${hex.toString('hex')}` as `0x${string}`
      }
      // Handle string format if returned as such
      const str = hex as unknown as string
      if (typeof str === 'string' && str.startsWith('\\x')) {
        return `0x${str.slice(2)}` as `0x${string}`
      }
      return str as `0x${string}`
    })

    return vaults
  } finally {
    await pool.end()
  }
}
