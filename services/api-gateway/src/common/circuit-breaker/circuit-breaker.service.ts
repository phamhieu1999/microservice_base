import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures to open circuit
  successThreshold: number; // Number of successes to close circuit (from HALF_OPEN)
  timeout: number; // Time in ms to wait before trying HALF_OPEN
  resetTimeout: number; // Time in ms before attempting to reset to HALF_OPEN
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create circuit breaker for a service
   */
  getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuits.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 10000, // 10 seconds
        resetTimeout: 60000, // 1 minute
      };
      this.circuits.set(name, new CircuitBreaker(name, { ...defaultConfig, ...config }));
    }
    return this.circuits.get(name)!;
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    circuitName: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>,
  ): Promise<T> {
    const circuit = this.getCircuitBreaker(circuitName, config);

    if (circuit.state === CircuitState.OPEN) {
      if (Date.now() - circuit.lastFailureTime < circuit.config.resetTimeout) {
        this.logger.warn(`Circuit ${circuitName} is OPEN, rejecting request`);
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit breaker ${circuitName} is OPEN`);
      } else {
        // Try to transition to HALF_OPEN
        circuit.state = CircuitState.HALF_OPEN;
        this.logger.log(`Circuit ${circuitName} transitioning to HALF_OPEN`);
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), circuit.config.timeout),
        ),
      ]);

      // Success
      circuit.onSuccess();
      return result;
    } catch (error: any) {
      // 4xx errors (client errors) - không count là circuit breaker failure
      // Chỉ count 5xx errors hoặc network errors là failures
      const status = error.status || error.response?.status;
      const isClientError = status >= 400 && status < 500;
      
      if (!isClientError) {
        // Chỉ count server errors (5xx) hoặc network errors là failures
        circuit.onFailure();
        this.logger.error(`Circuit ${circuitName} failure: ${(error as Error).message}`);
      } else {
        // Client errors (4xx) - log nhưng không count là failure, throw error thực tế
        this.logger.warn(`Circuit ${circuitName} client error (not counted as failure): ${(error as Error).message}`);
        // Re-throw để NestJS xử lý và trả về error response đúng
        const httpException: any = error;
        if (error.response?.data) {
          httpException.response = error.response.data;
        }
        throw httpException;
      }

      if (fallback) {
        // Chỉ dùng fallback cho server errors hoặc network errors
        return fallback();
      }
      throw error;
    }
  }
}

class CircuitBreaker {
  public state: CircuitState = CircuitState.CLOSED;
  public failureCount: number = 0;
  public successCount: number = 0;
  public lastFailureTime: number = 0;

  constructor(
    public readonly name: string,
    public readonly config: CircuitBreakerConfig,
  ) {}

  onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN immediately opens the circuit
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
}

