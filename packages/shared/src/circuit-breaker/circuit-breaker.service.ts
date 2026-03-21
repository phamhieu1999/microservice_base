import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits: Map<string, CircuitBreaker> = new Map();

  getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuits.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 10000,
        resetTimeout: 60000,
      };
      this.circuits.set(name, new CircuitBreaker(name, { ...defaultConfig, ...config }));
    }
    return this.circuits.get(name)!;
  }

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
        circuit.state = CircuitState.HALF_OPEN;
        this.logger.log(`Circuit ${circuitName} transitioning to HALF_OPEN`);
      }
    }

    try {
      const timeout = Math.max(1000, circuit.config.timeout);
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout),
        ),
      ]);

      circuit.onSuccess();
      return result;
    } catch (error) {
      circuit.onFailure();
      this.logger.error(`Circuit ${circuitName} failure: ${(error as Error).message}`);

      if (fallback) {
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
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
}
