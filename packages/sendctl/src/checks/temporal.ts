import * as grpc from '@grpc/grpc-js'
import type { CheckResult, GrpcCheckConfig } from '../types.js'

interface HealthResponse {
  status: number
}

/**
 * Check Temporal workflow engine health via gRPC
 * Uses standard grpc.health.v1.Health/Check protocol
 * Service name: empty string for overall server health
 */
export async function checkTemporal(config: GrpcCheckConfig): Promise<CheckResult> {
  const start = Date.now()

  return new Promise((resolve) => {
    const deadline = Date.now() + config.timeout

    // Create client with insecure credentials (local dev only)
    const client = new grpc.Client(config.address, grpc.credentials.createInsecure())

    // Set deadline for the call
    const callOptions: grpc.CallOptions = {
      deadline: new Date(deadline),
    }

    // Manually encode the health check request
    // HealthCheckRequest { service = "" } is just an empty message for overall health
    const requestBuffer = Buffer.alloc(0) // Empty service name = overall health

    // Define serialize and deserialize functions with proper return types
    const serialize = (_arg: Record<string, never>): Buffer => requestBuffer

    const deserialize = (buffer: Buffer): HealthResponse => {
      // Decode HealthCheckResponse
      // Field 1 (status) is a varint, tag = 0x08
      if (buffer.length >= 2 && buffer[0] === 0x08) {
        return { status: buffer[1] as number }
      }
      // If response is empty or malformed, assume UNKNOWN (0)
      return { status: 0 }
    }

    client.makeUnaryRequest<Record<string, never>, HealthResponse>(
      '/grpc.health.v1.Health/Check',
      serialize,
      deserialize,
      {},
      callOptions,
      (error: grpc.ServiceError | null, response?: HealthResponse) => {
        const duration_ms = Date.now() - start

        if (error) {
          let errorMessage = error.message

          if (error.code === grpc.status.DEADLINE_EXCEEDED) {
            errorMessage = `Connection timeout after ${config.timeout}ms`
          } else if (error.code === grpc.status.UNAVAILABLE) {
            errorMessage = 'Connection refused'
          }

          resolve({
            status: 'failed',
            duration_ms,
            error: errorMessage,
          })
          return
        }

        // SERVING = 1
        if (response?.status === 1) {
          resolve({ status: 'ok', duration_ms })
        } else {
          const statusNames = ['UNKNOWN', 'SERVING', 'NOT_SERVING', 'SERVICE_UNKNOWN']
          const statusName = statusNames[response?.status ?? 0] ?? 'UNKNOWN'
          resolve({
            status: 'failed',
            duration_ms,
            error: `Health status: ${statusName}`,
          })
        }

        client.close()
      }
    )
  })
}
