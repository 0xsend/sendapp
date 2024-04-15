import express, { type Request, type Response, Router } from 'express'
import pino from 'pino'
import { DistributorWorker, supabaseAdmin } from './distributor'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { selectAll } from 'app/utils/supabase/selectAll'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // ...other Pino options
})

// Initialize DistributorWorker
const distributorWorker = new DistributorWorker(logger)

// Initialize Express app
const app = express()

app.use(express.json())

// Example of a route (You'll need to define your routes as per your application's need)
app.get('/', (req, res) => {
  res.send({ root: true })
})

const distributorRouter = Router()

distributorRouter.get('/', async (req: Request, res: Response) => {
  res.json({
    distributor: true,
    ...distributorWorker.toJSON(),
  })
})

// Middleware for checking authorization
const checkAuthorization = (req: Request, res: Response, next: () => void) => {
  if (!req.headers.authorization?.includes(process.env.SUPABASE_SERVICE_ROLE as string)) {
    res.status(401).json('Unauthorized')
    return
  }
  next()
}

distributorRouter.post('/merkle', checkAuthorization, async (req: Request, res: Response) => {
  const { id } = req.body as { id: string }

  if (!id) {
    res.status(400).json('Missing id')
    return
  }

  logger.info({ id }, 'Received request to distribution merkle root')

  const { data: shares, error: sharesError } = await selectAll(
    supabaseAdmin
      .from('distribution_shares')
      .select('index, address, amount', { count: 'exact' })
      .eq('distribution_id', id)
      .order('index', { ascending: true })
  )
  if (sharesError) {
    logger.error(sharesError, 'Error fetching distribution shares')
    res.status(500).json({ error: 'Error fetching distribution shares' })
    return
  }

  if (shares === null || shares.length === 0) {
    logger.error('No shares found for distribution', { id })
    res.status(500).json({ error: 'No shares found for distribution' })
    return
  }

  logger.info(`Found ${shares.length} shares for distribution ${id}`)

  const tree = StandardMerkleTree.of(
    shares.map(({ index, address, amount }, i) => [index, address, amount]),
    ['uint256', 'address', 'uint256']
  )

  // this is what the user will need to submit to claim their tokens
  const proofs: string[][] = []
  for (const [i] of tree.entries()) {
    const proof = tree.getProof(i)
    proofs[i] = proof
  }

  const total = shares.reduce((acc, { amount }) => acc + amount, 0)
  const result = {
    id,
    root: tree.root,
    total,
    proofs,
    shares,
    tree: tree.dump(),
  }

  res.json(result)
})

distributorRouter.post('/', checkAuthorization, async (req, res) => {
  const { id } = req.body as { id: string }
  logger.info({ id }, 'Received request to calculate distribution')
  try {
    await distributorWorker.calculateDistribution(id)
  } catch (err) {
    logger.error(err, 'Error while calculating distribution')
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.',
    })
    return
  }

  res.json({
    distributor: true,
    id: id,
  })
})

app.use('/distributor', distributorRouter)

export default app
export { app }
