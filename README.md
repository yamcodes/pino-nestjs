<h1 align="center">
  🌲🐱<br /><code>pino-nestjs</code>
</h1>
<p align="center">
  Drop-in Pino logger for NestJS with request context in every log
</p>
<p align="center">
  <a href="https://github.com/yamcodes/pino-nestjs/actions/workflows/tests.yml?query=branch%3Amain+event%3Apush"><img alt="Tests Status" src="https://github.com/yamcodes/pino-nestjs/actions/workflows/tests.yml/badge.svg?event=push&branch=main"></a>
  <a href="https://getpino.io/"><img alt="Powered By pino" src="https://badgen.net/static/powered%20by/pino?color=859947"></a>
  <a href="https://github.com/pinojs/pino-http"><img alt="Powered By pino-http" src="https://badgen.net/static/powered%20by/pino-http?color=859947"></a>
</p>

Keep your NestJS logs while gaining all the benefits of [pino](https://getpino.io/) and [pino-http](https://github.com/pinojs/pino-http): structured JSON logs, exceptional performance, and automatic request context tracking.

```ts
// Other loggers - violate NestJS parameter order
this.logger.log(context, 'message'); // ❌ context first, message second

// With pino-nestjs - respect NestJS parameter order
this.logger.log('message', context); // ✅ message first, context second
```

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
  - [Import the module](#import-the-module)
  - [Set up app logger](#set-up-app-logger)
  - [Using the logger](#using-the-logger)
- [Zero config](#zero-config)
- [Configuration](#configuration)
  - [Configuration parameters](#configuration-parameters)
  - [Synchronous configuration](#synchronous-configuration)
  - [Asynchronous configuration](#asynchronous-configuration)
  - [Asynchronous logging](#asynchronous-logging)
- [Advanced](#advanced)
  - [Direct Pino Logger usage](#direct-pino-logger-usage)
    - [Testing a class that uses `@InjectPinoLogger`](#testing-a-class-that-uses-injectpinologger)
  - [Extending `Logger` and `PinoLogger`](#extending-logger-and-pinologger)
  - [Reusing the Fastify logger configuration](#reusing-the-fastify-logger-configuration)
  - [Assigning extra fields](#assigning-extra-fields-for-future-calls)
  - [Changing Pino parameters at runtime](#changing-pino-parameters-at-runtime)
  - [Exposing stack trace](#exposing-stack-trace-and-error-class-in-err-property)
- [Frequently asked questions](#frequently-asked-questions)

## Installation

<details open>
<summary>npm</summary>

```sh
npm install pino-nestjs pino-http
```
</details>

<details>
<summary>pnpm</summary>

```sh
pnpm add pino-nestjs pino-http
```
</details>

<details>
<summary>Yarn</summary>

```sh
yarn add pino-nestjs pino-http
```
</details>

<details>
<summary>Bun</summary>

```sh
bun add pino-nestjs pino-http
```
</details>

## Usage

### Import the module

```ts
// app.module.ts
import { LoggerModule } from 'pino-nestjs';

@Module({
  imports: [LoggerModule.forRoot()],
})
class AppModule {}
```

### Set up app logger

```ts
// main.ts
import { Logger } from 'pino-nestjs';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
```

### Use the logger

```ts
// my.service.ts
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name);
  
  foo() {
    // NestJS parameter order: message first, then context (if needed)
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

### Observe logs

Example output:

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

## Zero config

This package is designed to work with 0 configuration. Just import the module into your root module:

```ts
// app.module.ts
import { LoggerModule } from 'pino-nestjs';

@Module({
  imports: [LoggerModule.forRoot()],
  // ...
})
class MyModule {}
```

However, if you do need to configure the logger, read on.

## Configuration 

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
// my.module.ts
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
// my.module.ts
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

Read the [pino asynchronous mode docs](https://github.com/pinojs/pino/blob/master/docs/asynchronous.md) first.

```ts
// my.module.ts
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

## Advanced

### Direct Pino Logger usage

While the recommended approach is to use the standard NestJS logger, you can also use Pino's native logging format directly through the `PinoLogger` class. This gives you access to Pino's full feature set and might be preferred by developers already familiar with Pino.

```ts
// my.service.ts
import { PinoLogger, InjectPinoLogger } from 'pino-nestjs';

export class MyService {
  constructor(
    @InjectPinoLogger(MyService.name)
    private readonly logger: PinoLogger
  ) {}

  foo() {
    // When using PinoLogger directly, use Pino's native format
    this.logger.trace('This is a trace message');
    
    // Traditional Pino object + message format
    this.logger.trace({ operation: 'init' }, 'System initialized');
  }
}
```

#### Testing a class that uses `@InjectPinoLogger`

When using the direct Pino logger, you can test a class that uses `@InjectPinoLogger` by providing a mock logger, with the help of the `getLoggerToken()` function:

```ts
// my.service.spec.ts
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

### Extending `Logger` and `PinoLogger`

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
```

```ts
// logger.service.ts
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
```

```ts
// logger.module.ts
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
  imports: [LoggerModule.forRoot()],
})
class LoggerModule {}
```

### Reusing the Fastify logger configuration

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

### Assigning extra fields for future calls

You can enrich logs using the `assign` method of `PinoLogger`:

```ts
// my.controller.ts
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
```

```ts
// my.service.ts
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

### Changing Pino parameters at runtime

You can modify pino root logger parameters at runtime:

```ts
// my.controller.ts
@Controller('/')
class MyController {
  @Post('/change-logging-level')
  setLevel() {
    PinoLogger.root.level = 'info';
    return null;
  }
}
```

### Exposing stack trace and error class in `err` property

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

## Thanks / Inspiration

- [nestjs-pino](https://github.com/iamolegga/nestjs-pino) by [iamolegga](https://github.com/iamolegga) makes up the bulk of the codebase. To support the author, please donate to [Armed Forces of Ukraine](https://war.ukraine.ua/donate/) or [The Come Back Alive foundation](https://comebackalive.in.ua/).
