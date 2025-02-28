<h1 align="center">
  🌲🐱<br /><code>pino-nestjs</code>
</h1>
<p align="center">
  Drop-in Pino logger for NestJS with request context in every log
</p>
<p align="center">
  <a href="https://github.com/yamcodes/pino-nestjs/actions"><img alt="Tests Status" src="https://github.com/yamcodes/pino-nestjs/actions/workflows/tests.yml/badge.svg?event=push&branch=main"></a>
  <a href="https://www.npmjs.com/package/pino-nestjs"><img alt="Total Downloads" src="https://badgen.net/npm/dt/pino-nestjs/total?icon=npm&color=859947"></a>
  <a href="https://www.npmjs.com/package/pino-nestjs"><img alt="Bundle Size" src="https://badgen.net/bundlephobia/min/pino-nestjs?icon=npm&color=859947&label=bundle%20size"></a>
  <a href="https://www.npmjs.com/package/pino-nestjs"><img alt="Dependency Count" src="https://badgen.net/bundlephobia/dependency-count/pino-nestjs?icon=npm&color=859947&label=dependencies"></a>
  <a href="https://getpino.io/"><img alt="Powered By pino" src="https://badgen.net/static/powered%20by/pino?color=859947"></a>
</p>



`pino-nestjs` is a [NestJS](https://nestjs.com/) logger powered by [pino](https://getpino.io/) and [pino-http](https://github.com/pinojs/pino-http). 

This fork of [nestjs-pino](https://github.com/iamolegga/nestjs-pino) fixes the [parameter order inconsistency issue](https://github.com/iamolegga/nestjs-pino/issues/2004):

```ts
// With nestjs-pino:
this.logger.log(context, 'message'); // ❌ context first, message second

// With NestJS standard logger and pino-nestjs:
this.logger.log('message', context); // ✅ message first, context second
```

This makes `pino-nestjs` **a true drop-in replacement for NestJS's built-in logger**.

Now you can keep your NestJS logs while gaining all the benefits of [pino](https://getpino.io/) and [pino-http](https://github.com/pinojs/pino-http): structured JSON logs, exceptional performance, and automatic request context tracking.

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Comparison with other loggers](#comparison-with-other-loggers)
- [Configuration](#configuration)
  - [Zero configuration](#zero-configuration)
  - [Configuration parameters](#configuration-parameters)
  - [Synchronous configuration](#synchronous-configuration)
  - [Asynchronous configuration](#asynchronous-configuration)
  - [Asynchronous logging](#asynchronous-logging)
- [Testing](#testing-a-class-that-uses-injectpinologger)
- [Extending logger classes](#logger-and-pinologger-class-extension)
- [Notes on logger injection](#notes-on-logger-injection-in-constructor)
- [Additional features](#assign-extra-fields-for-future-calls)
  - [Assign extra fields](#assign-extra-fields-for-future-calls)
  - [Change Pino parameters at runtime](#change-pino-params-at-runtime)
  - [Expose stack trace](#expose-stack-trace-and-error-class-in-err-property)
- [Frequently asked questions](#frequently-asked-questions)

## Installation

```sh
npm i pino-nestjs pino-http
```

## Usage

### Import the module

Import `LoggerModule` in your root module:

```ts
import { LoggerModule } from 'pino-nestjs';

@Module({
  imports: [LoggerModule.forRoot()],
})
class AppModule {}
```

### Set up app logger

```ts
import { Logger } from 'pino-nestjs';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
```

### Use one of two logger options

#### Option 1: NestJS standard logger (recommended)

```ts
// NestJS standard built-in logger.
// Logs will be produced by pino internally
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name);
  
  foo() {
    // NestJS parameter order: message first, then context (if needed)
    // With pino-nestjs, you can use the standard NestJS logging pattern
    this.logger.verbose('My verbose message', MyService.name);
    this.logger.debug('User data processed', { userId: '123', status: 'success' });
    this.logger.log('Operation completed', MyService.name);
    
    // Object logging also works with NestJS parameter order
    this.logger.warn({ operation: 'data_sync', status: 'warning' }, MyService.name);
    
    // Error logging
    try {
      // Some operation
    } catch (error) {
      this.logger.error(error, error.stack, MyService.name);
    }
  }
}
```

#### Option 2: Direct Pino Logger

```ts
import { PinoLogger, InjectPinoLogger } from 'pino-nestjs';

export class MyService {
  constructor(
    private readonly logger: PinoLogger
  ) {
    // Optionally set context in constructor
    this.logger.setContext(MyService.name);
  }

  // Alternative: use decorator to set context
  constructor(
    @InjectPinoLogger(MyService.name)
    private readonly logger: PinoLogger
  ) {}

  foo() {
    // When using PinoLogger directly, you still have access to Pino's native format
    // But pino-nestjs also supports NestJS parameter order: message first, then context
    this.logger.trace('This is a trace message');
    this.logger.debug('Debug information', { userId: '123' });
    this.logger.info('Information message', MyService.name);
    
    // Traditional Pino object + message format also works
    this.logger.trace({ operation: 'init' }, 'System initialized');
  }
}
```

### Log output example

```json
// App logs
{"level":30,"time":1629823318326,"pid":14727,"hostname":"my-host","context":"NestFactory","msg":"Starting Nest application..."}
{"level":30,"time":1629823318326,"pid":14727,"hostname":"my-host","context":"InstanceLoader","msg":"LoggerModule dependencies initialized"}
{"level":30,"time":1629823318327,"pid":14727,"hostname":"my-host","context":"InstanceLoader","msg":"AppModule dependencies initialized"}
{"level":30,"time":1629823318327,"pid":14727,"hostname":"my-host","context":"RoutesResolver","msg":"AppController {/}:"}
{"level":30,"time":1629823318327,"pid":14727,"hostname":"my-host","context":"RouterExplorer","msg":"Mapped {/, GET} route"}
{"level":30,"time":1629823318327,"pid":14727,"hostname":"my-host","context":"NestApplication","msg":"Nest application successfully started"}

// Service logs with request context and req.id
{"level":10,"time":1629823792023,"pid":15067,"hostname":"my-host","req":{"id":1,"method":"GET","url":"/","query":{},"params":{"0":""},"headers":{"host":"localhost:3000","user-agent":"curl/7.64.1","accept":"*/*"},"remoteAddress":"::1","remotePort":63822},"context":"MyService","foo":"bar","msg":"baz qux"}
{"level":20,"time":1629823792023,"pid":15067,"hostname":"my-host","req":{"id":1,"method":"GET","url":"/","query":{},"params":{"0":""},"headers":{"host":"localhost:3000","user-agent":"curl/7.64.1","accept":"*/*"},"remoteAddress":"::1","remotePort":63822},"context":"MyService","msg":"foo bar {\"baz\":\"qux\"}"}
{"level":30,"time":1629823792023,"pid":15067,"hostname":"my-host","req":{"id":1,"method":"GET","url":"/","query":{},"params":{"0":""},"headers":{"host":"localhost:3000","user-agent":"curl/7.64.1","accept":"*/*"},"remoteAddress":"::1","remotePort":63822},"context":"MyService","msg":"foo"}

// Automatic request/response logs
{"level":30,"time":1629823792029,"pid":15067,"hostname":"my-host","req":{"id":1,"method":"GET","url":"/","query":{},"params":{"0":""},"headers":{"host":"localhost:3000","user-agent":"curl/7.64.1","accept":"*/*"},"remoteAddress":"::1","remotePort":63822},"res":{"statusCode":200,"headers":{"x-powered-by":"Express","content-type":"text/html; charset=utf-8","content-length":"12","etag":"W/\"c-Lve95gjOVATpfV8EL5X4nxwjKHE\""}},"responseTime":7,"msg":"request completed"}
```

## Comparison with other loggers

Key features of this module:

- Idiomatic NestJS logger
- JSON format logging (via [pino](https://getpino.io/) - [super fast logger](https://github.com/pinojs/pino/blob/master/docs/benchmarks.md))
- Automatic request/response logging (via [pino-http](https://github.com/pinojs/pino-http))
- Request data binding to logs from any service without passing context (via [AsyncLocalStorage](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage))
- Alternative `PinoLogger` with the same API as `pino` for experienced pino users
- **NestJS compatible parameter order** (message first, context second) for direct compatibility with NestJS Logger

### Differences from nestjs-pino

This library is a fork of [nestjs-pino](https://github.com/iamolegga/nestjs-pino) with one key improvement: **parameter order compatibility with NestJS**.

While nestjs-pino follows Pino's convention (context first, then message), pino-nestjs follows NestJS's approach (message first, then context). This makes pino-nestjs a true drop-in replacement for NestJS's built-in Logger.

**Example usage:**
```typescript
// With nestjs-pino (Pino style):
this.logger.log({ context: 'MyService' }, 'Hello World');

// With pino-nestjs (NestJS style):
this.logger.log('Hello World', 'MyService');
```

| Logger | Nest App Logger | Logger Service | Auto-bind Request Data | NestJS Parameter Order |
|--------|:--------------:|:--------------:|:----------------------:|:----------------------:|
| [nest-winston](https://github.com/gremo/nest-winston) | ✅ | ✅ | ❌ | ✅ |
| [nestjs-pino-logger](https://github.com/jtmthf/nestjs-pino-logger) | ✅ | ✅ | ❌ | ✅ |
| [nestjs-pino](https://github.com/iamolegga/nestjs-pino) | ✅ | ✅ | ✅ | ❌ |
| [**pino-nestjs**](https://github.com/yamcodes/pino-nestjs) | ✅ | ✅ | ✅ | ✅ |

## Configuration

### Zero configuration

```ts
import { LoggerModule } from 'pino-nestjs';

@Module({
  imports: [LoggerModule.forRoot()],
  // ...
})
class MyModule {}
```

### Configuration parameters

```ts
interface Params {
  /**
   * Optional parameters for `pino-http` module
   * @see https://github.com/pinojs/pino-http#api
   */
  pinoHttp?:
    | pinoHttp.Options
    | DestinationStream
    | [pinoHttp.Options, DestinationStream];

  /**
   * Optional parameter for routing. Implements interface of
   * NestJS built-in `MiddlewareConfigProxy['forRoutes']`.
   * @see https://docs.nestjs.com/middleware#applying-middleware
   */
  forRoutes?: Parameters<MiddlewareConfigProxy['forRoutes']>;

  /**
   * Optional parameter for routing. Implements interface of
   * NestJS built-in `MiddlewareConfigProxy['exclude']`.
   * @see https://docs.nestjs.com/middleware#applying-middleware
   */
  exclude?: Parameters<MiddlewareConfigProxy['exclude']>;

  /**
   * Optional parameter to skip pino configuration when using
   * FastifyAdapter with pre-configured logger.
   * @see https://github.com/yamcodes/pino-nestjs#faq
   */
  useExisting?: true;

  /**
   * Optional parameter to change property name `context` in logs
   */
  renameContext?: string;
}
```

### Synchronous configuration

```ts
import { LoggerModule } from 'pino-nestjs';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: [
        {
          name: 'my-app-name',
          level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
          // Install 'pino-pretty' package to use this option
          transport: process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
          // Other pino-http options:
          // https://github.com/pinojs/pino-http#api
          // https://github.com/pinojs/pino/blob/HEAD/docs/api.md#options-object
        },
        someWritableStream
      ],
      forRoutes: [MyController],
      exclude: [{ method: RequestMethod.ALL, path: 'check' }]
    })
  ],
  // ...
})
class MyModule {}
```

### Asynchronous configuration

```ts
import { LoggerModule } from 'pino-nestjs';

@Injectable()
class ConfigService {
  public readonly level = 'debug';
}

@Module({
  providers: [ConfigService],
  exports: [ConfigService]
})
class ConfigModule {}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        await somePromise();
        return {
          pinoHttp: { level: config.level },
        };
      }
    })
  ],
  // ...
})
class TestModule {}
```

### Asynchronous logging

> Asynchronous logging enables even faster performance by pino but risks losing the most recently buffered logs in case of system failure.

Read [pino asynchronous mode docs](https://github.com/pinojs/pino/blob/master/docs/asynchronous.md) first.

```ts
import pino from 'pino';
import { LoggerModule } from 'pino-nestjs';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        stream: pino.destination({
          dest: './my-file', // omit for stdout
          minLength: 4096, // Buffer before writing
          sync: false, // Asynchronous logging
        }),
      },
    }),
  ],
  // ...
})
class MyModule {}
```

See [pino.destination](https://github.com/pinojs/pino/blob/master/docs/api.md#pino-destination)

## Testing a class that uses @InjectPinoLogger

The package exposes a `getLoggerToken()` function that returns an injection token based on the provided context:

```ts
const module: TestingModule = await Test.createTestingModule({
  providers: [
    MyService,
    {
      provide: getLoggerToken(MyService.name),
      useValue: mockLogger,
    },
  ],
}).compile();
```

## Logger and PinoLogger class extension

Both classes can be extended:

```ts
// logger.service.ts
import { Logger, PinoLogger, Params, PARAMS_PROVIDER_TOKEN } from 'pino-nestjs';

@Injectable()
class LoggerService extends Logger {
  constructor(
    logger: PinoLogger,
    @Inject(PARAMS_PROVIDER_TOKEN) params: Params
  ) {
    super();
    // ...
  }
  // Extended method
  myMethod(): any {}
}

// Alternative: Extend PinoLogger
@Injectable()
class LoggerService extends PinoLogger {
  constructor(
    @Inject(PARAMS_PROVIDER_TOKEN) params: Params
  ) {
    super();
    // ...
  }
  // Extended method
  myMethod(): any {}
}

// logger.module.ts
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
  imports: [LoggerModule.forRoot()],
})
class LoggerModule {}
```

## Notes on logger injection in constructor

Since NestJS@8, the main purpose of the `Logger` class is to be registered via `app.useLogger(app.get(Logger))`. With this usage, NestJS passes the logger's context as the last optional argument in logging functions.

This creates a limitation in detecting whether a method was called by app internals (where the last argument is context) or by an injected `Logger` instance in a service (where the last argument might be an interpolation value).

## Reuse the Fastify logger configuration

> [!WARNING]
> This feature is not recommended for most cases. Read on to understand the caveats.

If you use `useExisting: true` with Fastify, you can reuse the Fastify logger configuration by providing the same options in `forRoot`/`forRootAsync`:

```ts
import { LoggerModule } from 'pino-nestjs'; 

@Module({
  imports: [
    LoggerModule.forRoot({
      useExisting: true,
    }),
  ],
})
class MyModule {} 
```

When working with Fastify and pino-nestjs together, you need to understand how logger instances are managed:

1. **Request vs. Application Context**:
   - Fastify creates a logger with your configuration for each request
   - NestJS has additional execution contexts (like lifecycle events) that occur outside request context
   - For these non-request contexts, `Logger`/`PinoLogger` services use a separate pino instance configured via `forRoot`/`forRootAsync`

2. **Configuration Sharing Issues**:
   - When configuring pino via `FastifyAdapter`, there's no way to extract that configuration and apply it to the out-of-context logger
   - Without explicit configuration in `forRoot`/`forRootAsync`, the out-of-context logger will use default parameters

3. **Potential Solutions**:
   - For consistency, you must provide identical configurations to both Fastify and LoggerModule
   - Better approach: configure only through LoggerModule and drop the `useExisting` option entirely

4. **When to use `useExisting: true`**:
   - Only when you don't need logging for lifecycle events and application-level logging
   - Only when using pino with default parameters in Fastify-based NestJS apps

For all other scenarios, using `useExisting: true` will lead to either code duplication or unexpected behavior.

## Assign extra fields for future calls

You can enrich logs using the `assign` method of `PinoLogger`:

```ts
@Controller('/')
class TestController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly service: MyService,
  ) {}

  @Get()
  get() {
    // Assign extra fields in one place...
    this.logger.assign({ userID: '42' });
    return this.service.test();
  }
}

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name);

  test() {
    // ...and it will be logged in another place
    this.logger.log('hello world');
  }
}
```

Set the `assignResponse` parameter to `true` to also enrich request completion logs.

## Change Pino parameters at runtime

You can modify pino root logger parameters at runtime:

```ts
@Controller('/')
class TestController {
  @Post('/change-logging-level')
  setLevel() {
    PinoLogger.root.level = 'info';
    return null;
  }
}
```

## Expose stack trace and error class in `err` property

Use the provided interceptor to expose actual error details:

```typescript
import { LoggerErrorInterceptor } from 'pino-nestjs';

const app = await NestFactory.create(AppModule);
app.useGlobalInterceptors(new LoggerErrorInterceptor());
```

## Frequently asked questions

#### Q: How do I disable automatic request/response logs?

**A**: Use the [autoLogging field of pino-http](https://github.com/pinojs/pino-http#pinohttpopts-stream) in the `pinoHttp` configuration.

#### Q: How do I pass `X-Request-ID` header or generate UUID for `req.id`?

**A**: Use the [genReqId field of pino-http](https://github.com/pinojs/pino-http#pinohttpopts-stream) in the `pinoHttp` configuration.

#### Q: How does it work?

**A**: It uses [pino-http](https://github.com/pinojs/pino-http) to create a child-logger for each request, and with [AsyncLocalStorage](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage), `Logger` and `PinoLogger` can access it from any service. This allows logs to be grouped by `req.id`.

#### Q: Why use [AsyncLocalStorage](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage) instead of [REQUEST scope](https://docs.nestjs.com/fundamentals/injection-scopes#per-request-injection)?

**A**: REQUEST scope can have [performance issues](https://docs.nestjs.com/fundamentals/injection-scopes#performance) as it creates new instances of each service per request.

#### Q: What about `pino` built-in methods/levels?

**A**: Here's the mapping between methods:

| `pino` | `PinoLogger` | NestJS `Logger` |
|--------|--------------|-----------------|
| **trace** | **trace** | **verbose** |
| debug | debug | debug |
| **info** | **info** | **log** |
| warn | warn | warn |
| error | error | error |
| fatal | fatal | fatal (since nestjs@10.2) |

#### Q: I use Fastify and want to configure pino at the Adapter level. Can I use that config for the logger?

**A**: You can use `useExisting: true`, but there are [caveats](#reuse-the-fastify-logger-configuration).