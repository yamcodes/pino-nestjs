import { Inject, Injectable, LoggerService } from '@nestjs/common'
import pino, { Level } from 'pino'
import { isObject, last } from 'radashi'

import { PinoLogger } from './PinoLogger'
import { PARAMS_PROVIDER_TOKEN, Params } from './params'

/**
 * Given a message and an object, returns true if the object should be interpolated into the message.
 * @param message - The message to check.
 * @param objIndex - The index of the object in the message context as a cutoff point.
 * @returns True if the object should be interpolated into the message, false otherwise.
 */
function isInterpolated(message: unknown, objIndex: number) {
  if (typeof message !== 'string') {
    return false
  }

  // Match only valid placeholders (excluding standalone % symbols)
  const numPlaceholders = (message.match(/%[sdjo]/g) || []).length

  // Use objIndex as a cutoff to determine if obj should be interpolated
  if (objIndex !== undefined) {
    return objIndex < numPlaceholders
  }

  return numPlaceholders > 0
}

@Injectable()
export class Logger implements LoggerService {
  private readonly contextName: string

  constructor(
    protected readonly logger: PinoLogger,
    @Inject(PARAMS_PROVIDER_TOKEN) { renameContext }: Params,
  ) {
    this.contextName = renameContext || 'context'
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.call('trace', message, ...optionalParams)
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    this.call('debug', message, ...optionalParams)
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    this.call('info', message, ...optionalParams)
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.call('warn', message, ...optionalParams)
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.call('error', message, ...optionalParams)
  }

  fatal(message: unknown, ...optionalParams: unknown[]) {
    this.call('fatal', message, ...optionalParams)
  }

  /**
   * Central logging method that handles different message formats with guard clauses
   *
   * Processing flow:
   * 1. Extract context from the last parameter if available
   * 2. Process optional parameters and determine what should be merged vs interpolated
   * 3. Handle different message types with guard clauses:
   *    - Error objects
   *    - Exception handler special cases
   *    - Non-Error objects
   *    - String/primitive messages
   */
  private call(level: Level, message: unknown, ...optionalParams: unknown[]) {
    // Object to hold context and other metadata
    const mergingObject: Record<string, unknown> = {}

    // Extract context (last parameter) if available
    let optionalParamsWithoutContext: unknown[] = []
    const contextOrUndefined = last(optionalParams)
    if (contextOrUndefined !== undefined) {
      const context = contextOrUndefined
      mergingObject[this.contextName] = context
      optionalParamsWithoutContext = optionalParams.slice(0, -1)
    }

    // Determine which values should be used for interpolation vs merging
    let interpolationValues: unknown[] = []
    const maybeMergingObject = last(optionalParamsWithoutContext)
    if (
      isObject(maybeMergingObject) &&
      !isInterpolated(message, optionalParamsWithoutContext.length - 1)
    ) {
      // If last parameter is an object and not needed for interpolation, merge it
      interpolationValues = optionalParamsWithoutContext.slice(0, -1)
      Object.assign(mergingObject, maybeMergingObject)
    } else {
      // Otherwise use all parameters for interpolation
      interpolationValues = optionalParamsWithoutContext
    }

    // GUARD CLAUSE 1: Handle Error objects
    if (message instanceof Error) {
      mergingObject.err = message
      this.logger[level](
        mergingObject,
        message.message || 'Error',
        ...interpolationValues,
      )
      return
    }

    // GUARD CLAUSE 2: Handle special case with exceptions handler
    if (
      this.isWrongExceptionsHandlerContract(
        level,
        message,
        optionalParamsWithoutContext,
      )
    ) {
      const err = new Error(message as string)
      err.stack = optionalParamsWithoutContext[0]
      mergingObject.err = err
      this.logger[level](mergingObject)
      return
    }

    // GUARD CLAUSE 3: Handle non-Error objects
    if (typeof message === 'object') {
      this.logger[level](
        { ...mergingObject, ...message },
        undefined,
        ...interpolationValues,
      )
      return
    }

    // DEFAULT CASE: Handle string/primitive messages
    this.logger[level](mergingObject, String(message), ...interpolationValues)
  }

  /**
   * Unfortunately built-in (not only) `^.*Exception(s?)Handler$` classes call `.error`
   * method with not supported contract:
   *
   * - ExceptionsHandler
   * @see https://github.com/nestjs/nest/blob/35baf7a077bb972469097c5fea2f184b7babadfc/packages/core/exceptions/base-exception-filter.ts#L60-L63
   *
   * - ExceptionHandler
   * @see https://github.com/nestjs/nest/blob/99ee3fd99341bcddfa408d1604050a9571b19bc9/packages/core/errors/exception-handler.ts#L9
   *
   * - WsExceptionsHandler
   * @see https://github.com/nestjs/nest/blob/9d0551ff25c5085703bcebfa7ff3b6952869e794/packages/websockets/exceptions/base-ws-exception-filter.ts#L47-L50
   *
   * - RpcExceptionsHandler @see https://github.com/nestjs/nest/blob/9d0551ff25c5085703bcebfa7ff3b6952869e794/packages/microservices/exceptions/base-rpc-exception-filter.ts#L26-L30
   *
   * - all of them
   * @see https://github.com/search?l=TypeScript&q=org%3Anestjs+logger+error+stack&type=Code
   */
  private isWrongExceptionsHandlerContract(
    level: Level,
    message: unknown,
    params: unknown[],
  ): params is [string] {
    return (
      level === 'error' &&
      typeof message === 'string' &&
      params.length === 1 &&
      typeof params[0] === 'string' &&
      /\n\s*at /.test(params[0])
    )
  }
}
