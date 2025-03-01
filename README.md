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

- [Table of contents](#table-of-contents)
- [Quickstart](#quickstart)
  - [1. Install `pino-nestjs`](#1-install-pino-nestjs)
  - [2. Import `LoggerModule` in your `AppModule`](#2-import-loggermodule-in-your-appmodule)
  - [3. Use app logger in `main.ts`](#3-use-app-logger-in-maints)
  - [4. Use `Logger` in your NestJS codebase](#4-use-logger-in-your-nestjs-codebase)
  - [5. Observe the logs](#5-observe-the-logs)
- [Key features](#key-features)
- [Comparison with other NestJS loggers](#comparison-with-other-nestjs-loggers)
- [Respecting NestJS parameter order](#respecting-nestjs-parameter-order)
- [Advanced](#advanced)
  - [Configuration](#configuration)
    - [Configuration parameters](#configuration-parameters)
    - [Synchronous configuration](#synchronous-configuration)
    - [Asynchronous configuration](#asynchronous-configuration)
    - [Asynchronous logging](#asynchronous-logging)
  - [Using `PinoLogger` directly](#using-pinologger-directly)
    - [Testing a class that uses `@InjectPinoLogger`](#testing-a-class-that-uses-injectpinologger)
  - [Extending `Logger` and `PinoLogger`](#extending-logger-and-pinologger)
  - [Reusing the Fastify logger configuration](#reusing-the-fastify-logger-configuration)
  - [Assigning extra fields for future calls](#assigning-extra-fields-for-future-calls)
  - [Changing Pino parameters at runtime](#changing-pino-parameters-at-runtime)
  - [Exposing stack trace and error class in `err` property](#exposing-stack-trace-and-error-class-in-err-property)
- [Frequently asked questions](#frequently-asked-questions)
    - [Q: How do I disable automatic request/response logs?](#q-how-do-i-disable-automatic-requestresponse-logs)
    - [Q: How do I pass `X-Request-ID` header or generate UUID for `req.id`?](#q-how-do-i-pass-x-request-id-header-or-generate-uuid-for-reqid)
    - [Q: How does it work?](#q-how-does-it-work)
    - [Q: Why use AsyncLocalStorage instead of REQUEST scope?](#q-why-use-asynclocalstorage-instead-of-request-scope)
    - [Q: What about `pino` built-in methods/levels?](#q-what-about-pino-built-in-methodslevels)
    - [Q: I use Fastify and want to configure pino at the Adapter level. Can I use that config for the logger?](#q-i-use-fastify-and-want-to-configure-pino-at-the-adapter-level-can-i-use-that-config-for-the-logger)
- [Thanks / Inspiration](#thanks--inspiration)

## Quickstart

Let's quickly set up `pino-nestjs` in your NestJS app according to [NestJS Logger best practices](https://docs.nestjs.com/techniques/logger#logger):

### 1. Install `pino-nestjs`

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

### 2. Import `LoggerModule` in your `AppModule`

```ts
// app.module.ts
import { LoggerModule } from 'pino-nestjs';

@Module({
  imports: [LoggerModule.forRoot()],
})
class AppModule {}
```

### 3. Use app logger in `main.ts`

```ts
// main.ts
import { Logger } from 'pino-nestjs';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
```

### 4. Use `Logger` in your NestJS codebase

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

### 5. Observe the logs

Your logs will now be 🌲 Pino logs with request `context` and `req.id`:

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

## Key features

* **JSON logs, structured logging, high performance** (via [pino](https://getpino.io/))
* [**Automatic request/response logging**](#5-observe-the-logs) (via [pino-http](https://github.com/pinojs/pino-http))
* **Follows [NestJS best practices](https://docs.nestjs.com/techniques/logger#logger) out of the box**
* [**Respects NestJS parameter order**](#respecting-nestjs-parameter-order)
* [**Zero config**](#2-import-loggermodule-in-your-appmodule) quickstart cost but still [highly configurable](#configuration) when needed
* [Classic Pino mode](#using-pinologger-directly) for users who prefer **Pino's native logging format**

## Comparison with other NestJS loggers

> [!NOTE]
> This is a fork of [nestjs-pino](https://github.com/iamolegga/nestjs-pino) that implements **full compatibility with NestJS's default logger** by [respecting the parameter order](#respecting-nestjs-parameter-order).
>
> To understand the motivation, see [nestjs-pino#2004](https://github.com/iamolegga/nestjs-pino/issues/2004).

| Logger | Nest App Logger | Logger Service | Auto-bind Request Data | [NestJS Parameter Order](#respecting-nestjs-parameter-order) | Active Maintenance |
|--------|:--------------:|:--------------:|:----------------------:|:----------------------:|:----------------------:|
| [nest-winston](https://github.com/gremo/nest-winston) | ✅ | ✅ | ❌ | ✅ | ✅ |
| [nestjs-pino-logger](https://github.com/jtmthf/nestjs-pino-logger) | ✅ | ✅ | ❌ | ❓ | ❌ |
| [nestjs-pino](https://github.com/iamolegga/nestjs-pino) | ✅ | ✅ | ✅ | ❌ | ✅ |
| [**pino-nestjs**](https://github.com/yamcodes/pino-nestjs) (you're here!) | ✅ | ✅ | ✅ | ✅ | ✅ |

## Respecting NestJS parameter order

This library differs from some other NestJS loggers by respecting the parameter order of the NestJS logger.

```ts
// Other loggers - violate NestJS parameter order
this.logger.log(context, 'message'); // ❌ context first, message second

// With pino-nestjs - respect NestJS parameter order
this.logger.log('message', context); // ✅ message first, context second
```

This makes it a **drop-in replacement** for the default NestJS logger.

## Advanced

### Configuration 

#### Configuration parameters

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

#### Synchronous configuration

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

#### Asynchronous configuration

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

#### Asynchronous logging

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

### Using `PinoLogger` directly

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
   - A better approach is to configure only through LoggerModule and drop the `useExisting` option entirely

4. **When to use `useExisting: true`**:
   - Only when you don't need logging for lifecycle events and application-level logging
   - Only when using pino with default parameters in Fastify-based NestJS apps

For all other scenarios, using `useExisting: true` will lead to either code duplication or unexpected behavior.

### Assigning extra fields for future calls

You can enrich your logs using the `assign` method of `PinoLogger`:

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

You can modify the pino root logger parameters at runtime:

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

Use the provided interceptor to expose detailed error information:

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
