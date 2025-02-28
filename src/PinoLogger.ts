/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, Scope } from '@nestjs/common'
import pino from 'pino'

import { PARAMS_PROVIDER_TOKEN, Params, isPassedLogger } from './params'
import { storage } from './storage'

type PinoMethods = Pick<
  pino.Logger,
  'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
>

/**
 * This is copy of pino.LogFn but with possibilty to make method override.
 * Current usage works:
 *
 *  trace(msg: string, ...args: any[]): void;
 *  trace(obj: object, msg?: string, ...args: any[]): void;
 *  trace(...args: Parameters<LoggerFn>) {
 *    this.call('trace', ...args);
 *  }
 *
 * But if change local LoggerFn to pino.LogFn – this will say that overrides
 * are incompatible
 */
type LoggerFn =
  | ((msg: string, ...args: any[]) => void)
  | ((obj: object, msg?: string, ...args: any[]) => void)

let outOfContext: pino.Logger | undefined

export function __resetOutOfContextForTests() {
  outOfContext = undefined
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore reset root for tests only
  PinoLogger.root = undefined
}

@Injectable({ scope: Scope.TRANSIENT })
export class PinoLogger implements PinoMethods {
  /**
   * root is the most root logger that can be used to change params at runtime.
   * Accessible only when `useExisting` is not set to `true` in `Params`.
   * Readonly, but you can change it's properties.
   */
  static readonly root: pino.Logger

  protected context = ''
  protected readonly contextName: string
  protected readonly errorKey: string = 'err'

  constructor(
    @Inject(PARAMS_PROVIDER_TOKEN) { pinoHttp, renameContext }: Params,
  ) {
    if (
      typeof pinoHttp === 'object' &&
      'customAttributeKeys' in pinoHttp &&
      typeof pinoHttp.customAttributeKeys !== 'undefined'
    ) {
      this.errorKey = pinoHttp.customAttributeKeys.err ?? 'err'
    }

    if (!outOfContext) {
      if (Array.isArray(pinoHttp)) {
        outOfContext = pino(...pinoHttp)
      } else if (isPassedLogger(pinoHttp)) {
        outOfContext = pinoHttp.logger
      } else if (
        typeof pinoHttp === 'object' &&
        'stream' in pinoHttp &&
        typeof pinoHttp.stream !== 'undefined'
      ) {
        outOfContext = pino(pinoHttp, pinoHttp.stream)
      } else {
        outOfContext = pino(pinoHttp)
      }
    }

    this.contextName = renameContext || 'context'
  }

  get logger(): pino.Logger {
    // outOfContext is always set in runtime before starts using

    return storage.getStore()?.logger || outOfContext!
  }

  trace(msg: string, ...args: any[]): void
  trace(obj: unknown, msg?: string, ...args: any[]): void
  trace(...args: Parameters<LoggerFn>) {
    this.call('trace', ...args)
  }

  debug(msg: string, ...args: any[]): void
  debug(obj: unknown, msg?: string, ...args: any[]): void
  debug(...args: Parameters<LoggerFn>) {
    this.call('debug', ...args)
  }

  info(msg: string, ...args: any[]): void
  info(obj: unknown, msg?: string, ...args: any[]): void
  info(...args: Parameters<LoggerFn>) {
    this.call('info', ...args)
  }

  warn(msg: string, ...args: any[]): void
  warn(obj: unknown, msg?: string, ...args: any[]): void
  warn(...args: Parameters<LoggerFn>) {
    this.call('warn', ...args)
  }

  error(msg: string, ...args: any[]): void
  error(obj: unknown, msg?: string, ...args: any[]): void
  error(...args: Parameters<LoggerFn>) {
    this.call('error', ...args)
  }

  fatal(msg: string, ...args: any[]): void
  fatal(obj: unknown, msg?: string, ...args: any[]): void
  fatal(...args: Parameters<LoggerFn>) {
    this.call('fatal', ...args)
  }

  setContext(value: string) {
    this.context = value
  }

  assign(fields: pino.Bindings) {
    const store = storage.getStore()
    if (!store) {
      throw new Error(
        `${PinoLogger.name}: unable to assign extra fields out of request scope`,
      )
    }
    store.logger = store.logger.child(fields)
    store.responseLogger?.setBindings(fields)
  }

  protected call(method: pino.Level, ...args: Parameters<LoggerFn>) {
    // NestJS logging style is message first, then context
    // When called from Logger.ts, message will be first arg, and context object second
    
    // We need to reformat this according to Pino's expectations
    let newArgs = [...args];
    
    // If first arg is a string message and second arg is an object (likely context)
    if (typeof args[0] === 'string' && typeof args[1] === 'object' && args.length >= 2) {
      // Pino expects: obj (with context), msg, ...args
      // So we need to merge context (args[1]) with our context if set
      const contextObj = args[1] as Record<string, any>;
      
      if (this.context) {
        // Add our context to the context object
        contextObj[this.contextName] = this.context;
      }
      
      // Pino format: contextObj, message, ...rest
      newArgs = [contextObj, args[0], ...args.slice(2)];
    }
    // Handle case where first arg is an Error or other object
    else if (isFirstArgObject(args)) {
      // Keep object as first arg but add context if set
      if (this.context) {
        const firstArg = args[0];
        if (firstArg instanceof Error) {
          // For errors, wrap with context and error
          newArgs = [
            Object.assign(
              { [this.contextName]: this.context },
              { [this.errorKey]: firstArg }
            ),
            ...args.slice(1),
          ]
        } else {
          // Add context to the existing object
          newArgs = [
            Object.assign({ [this.contextName]: this.context }, firstArg),
            ...args.slice(1),
          ]
        }
      }
    } 
    // Simple message without context object
    else if (this.context) {
      // For simple messages without context object, add context as first param
      newArgs = [{ [this.contextName]: this.context }, ...args];
    }
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore args are union of tuple types
    this.logger[method](...newArgs);
  }
}

function isFirstArgObject(
  args: Parameters<LoggerFn>,
): args is [obj: object, msg?: string, ...args: any[]] {
  return typeof args[0] === 'object'
}
