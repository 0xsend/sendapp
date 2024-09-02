import {
  type EncodingType,
  METADATA_ENCODING_KEY,
  type Payload,
  type PayloadConverterWithEncoding,
  PayloadConverterError,
} from '@temporalio/common'
import superjson from 'superjson'
import { decode, encode } from '@temporalio/common/lib/encoding'

/**
 * Converts between values and [SUPERJSON](https://github.com/flightcontrolhq/superjson) Payloads.
 */
export class SuperjsonPayloadConverter implements PayloadConverterWithEncoding {
  // Use 'json/plain' so that Payloads are displayed in the UI
  public encodingType = 'json/plain' as EncodingType

  public toPayload(value: unknown): Payload | undefined {
    if (value === undefined) return undefined
    let sjson = ''
    try {
      sjson = superjson.stringify(value)
    } catch (e) {
      throw new UnsupportedSuperjsonTypeError(
        `Can't run SUPERJSON.stringify on this value: ${value}. Either convert it (or its properties) to SUPERJSON-serializable values (see https://github.com/flightcontrolhq/superjson#readme ), or create a custom data converter. SJSON.stringify error message: ${errorMessage(
          e
        )}`,
        e as Error
      )
    }

    return {
      metadata: {
        [METADATA_ENCODING_KEY]: encode('json/plain'),
        // Include an additional metadata field to indicate that this is an SuperJSON payload
        format: encode('extended'),
      },
      data: encode(sjson),
    }
  }

  public fromPayload<T>(content: Payload): T {
    return content.data ? superjson.parse<T>(decode(content.data)) : content.data
  }
}

export class UnsupportedSuperjsonTypeError extends PayloadConverterError {
  public readonly name: string = 'UnsupportedJsonTypeError'

  constructor(
    message: string | undefined,
    public readonly cause?: Error
  ) {
    super(message ?? undefined)
  }
}
// @@@SNIPEND

export function errorMessage(error: unknown): string | undefined {
  if (typeof error === 'string') {
    return error
  }
  if (error instanceof Error) {
    return error.message
  }
  return undefined
}
