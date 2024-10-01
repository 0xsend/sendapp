import {
  defaultDataConverter,
  CompositePayloadConverter,
  type PayloadConverterWithEncoding,
  type EncodingType,
  type PayloadConverter,
  type Payload,
} from '@temporalio/common'
import { SuperjsonPayloadConverter } from './superjson-payload-converter'

class DefaultPayloadConverterWrapper implements PayloadConverterWithEncoding {
  constructor(private converter: PayloadConverter) {}
  encodingType: EncodingType = 'json/plain'
  toPayload(value: unknown) {
    return this.converter.toPayload(value)
  }
  fromPayload<T>(content: Payload): T {
    return this.converter.fromPayload<T>(content)
  }
}

export const dataConverter = {
  ...defaultDataConverter,
  payloadConverter: new CompositePayloadConverter(
    new SuperjsonPayloadConverter(),
    new DefaultPayloadConverterWrapper(defaultDataConverter.payloadConverter)
  ),
}
