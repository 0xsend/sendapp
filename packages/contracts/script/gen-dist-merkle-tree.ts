import { join } from 'node:path'
import type { Database } from '@my/supabase/database.types'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { createClient } from '@supabase/supabase-js'
import debug from 'debug'

const log = debug('contracts:script:gen-merkle-tree')

const NEXT_PUBLIC_SUPABASE_URL = String(process.env.NEXT_PUBLIC_SUPABASE_URL)
if (!NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is not set. Please update the root .env.local and restart the server.'
  )
}
const SUPABASE_SERVICE_ROLE = String(process.env.SUPABASE_SERVICE_ROLE)
if (!SUPABASE_SERVICE_ROLE) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE is not set. Please update the root .env.local and restart the server.'
  )
}

async function genMerkleTree() {
  // read distribution id from command line
  const distributionId = Number(process.argv[2])

  log(`Generating merkle tree for distribution ${distributionId}`)

  if (Number.isNaN(distributionId)) {
    throw new Error('Distribution ID is not a number. Please pass a number as the first argument.')
  }

  const supabaseAdmin = createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE)

  // lookup active distributions
  const { data: shares, error } = await supabaseAdmin
    .from('distribution_shares')
    .select('index, address, amount_after_slash')
    .eq('distribution_id', distributionId)
    .order('index', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  if (!shares || shares.length === 0) {
    throw new Error(`No shares found for distribution ${distributionId}`)
  }

  log(`Found ${shares.length} shares for distribution ${distributionId}`)

  const tree = StandardMerkleTree.of(
    shares.map(({ index, address, amount_after_slash }, i) => [index, address, amount_after_slash]),
    ['uint256', 'address', 'uint256']
  )

  // this is what the user will need to submit to claim their tokens
  const proofs: string[][] = []
  for (const [i, v] of tree.entries()) {
    const proof = tree.getProof(i)
    proofs[i] = proof
  }

  // this is the root of the tree and is uploaded for each tranche
  console.log(tree.root)

  // save some debug data
  // write shares to local disk for debugging
  const path = join(__dirname, '..', 'var', `${distributionId}-merkle.json`)
  await Bun.write(
    path,
    JSON.stringify(
      {
        distributionId,
        root: tree.root,
        total: shares.reduce((acc, { amount_after_slash }) => acc + amount_after_slash, 0),
        proofs,
        shares,
        tree: tree.dump(),
      },
      null,
      2
    )
  )
  log(`Wrote ${path}`)
}

genMerkleTree()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
