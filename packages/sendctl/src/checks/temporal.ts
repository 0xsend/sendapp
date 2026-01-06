import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CheckResult, GrpcCheckConfig } from '../types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Standard gRPC health check proto embedded as a string
// From: https://github.com/grpc/grpc/blob/master/src/proto/grpc/health/v1/health.proto
const HEALTH_PROTO = `
syntax = "proto3";

package grpc.health.v1;

message HealthCheckRequest {
  string service = 1;
}

message HealthCheckResponse {
  enum ServingStatus {
    UNKNOWN = 0;
    SERVING = 1;
    NOT_SERVING = 2;
    SERVICE_UNKNOWN = 3;
  }
  ServingStatus status = 1;
}

service Health {
  rpc Check(HealthCheckRequest) returns (HealthCheckResponse);
  rpc Watch(HealthCheckRequest) returns (stream HealthCheckResponse);
}
`

// Write proto to temp file for proto-loader
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

interface HealthCheckRequest {
  service: string
}

interface HealthCheckResponse {
  status: number
}

interface HealthClient extends grpc.Client {
  check(
    request: HealthCheckRequest,
    options: grpc.CallOptions,
    callback: (error: grpc.ServiceError | null, response?: HealthCheckResponse) => void
  ): void
}

interface HealthServiceDefinition {
  Health: grpc.ServiceClientConstructor
}

let healthClient: new (address: string, credentials: grpc.ChannelCredentials) => HealthClient

/**
 * Load the health proto definition using proto-loader
 */
async function getHealthClient(): Promise<
  new (
    address: string,
    credentials: grpc.ChannelCredentials
  ) => HealthClient
> {
  if (healthClient) return healthClient

  // Write proto to temp file since proto-loader needs a file path
  const tempDir = mkdtempSync(join(tmpdir(), 'sendctl-'))
  const protoPath = join(tempDir, 'health.proto')

  try {
    writeFileSync(protoPath, HEALTH_PROTO)

    const packageDefinition = await protoLoader.load(protoPath, {
      keepCase: true,
      longs: String,
      enums: Number,
      defaults: true,
      oneofs: true,
    })

    const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
      grpc: { health: { v1: HealthServiceDefinition } }
    }

    healthClient = proto.grpc.health.v1.Health as unknown as new (
      address: string,
      credentials: grpc.ChannelCredentials
    ) => HealthClient
    return healthClient
  } finally {
    // Clean up temp file
    try {
      rmSync(tempDir, { recursive: true })
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Check Temporal workflow engine health via gRPC
 * Uses standard grpc.health.v1.Health/Check protocol loaded via proto-loader
 * Service name: empty string for overall server health
 */
export async function checkTemporal(config: GrpcCheckConfig): Promise<CheckResult> {
  const start = Date.now()

  try {
    const HealthClient = await getHealthClient()
    const client = new HealthClient(config.address, grpc.credentials.createInsecure())

    const deadline = new Date(Date.now() + config.timeout)

    return new Promise((resolve) => {
      client.check({ service: '' }, { deadline }, (error, response) => {
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
          client.close()
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
      })
    })
  } catch (err) {
    const duration_ms = Date.now() - start
    const error = err instanceof Error ? err.message : String(err)
    return {
      status: 'failed',
      duration_ms,
      error,
    }
  }
}
