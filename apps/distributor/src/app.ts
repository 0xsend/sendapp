import express, { Request, Response, Router } from 'express'
import pino from 'pino'
import { DistributorWorker } from './distributor'

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
