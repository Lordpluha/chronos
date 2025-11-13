import type { Configuration, Environment } from '../index'

export declare function maskSensitiveInfo(
  value: string,
  visibleChars?: number,
): string

export declare function logValidationSuccess(category: string): void

export declare function logValidationErrors(errors: string[]): void

export declare function logConfiguration(
  config: Configuration,
  env: Environment,
): void
