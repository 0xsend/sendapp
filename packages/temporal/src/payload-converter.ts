import { CompositePayloadConverter, UndefinedPayloadConverter } from '@temporalio/common'
import { SuperjsonPayloadConverter } from './superjson-payload-converter'

export const payloadConverter = new CompositePayloadConverter(
  new UndefinedPayloadConverter(),
  new SuperjsonPayloadConverter()
)
