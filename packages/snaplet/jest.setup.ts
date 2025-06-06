module.exports = async () => {
  process.env.TZ = 'UTC'

  // Ensure we have database URL for testing
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error('SUPABASE_DB_URL environment variable is required for snaplet tests')
  }
}
