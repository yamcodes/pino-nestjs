# `pino-nestjs` basic example

A basic example showcasing the `pino-nestjs` logger integration for NestJS.

## Running the example

### Install dependencies

```bash
npm install
```

### Run the app

```bash
npm run start # or `npm run dev` for watch mode
```

### Make a GET request

```bash
curl http://localhost:3000
```

### Check the logs

A similar output to the following is expected:

```
❯ npm run start

> basic@0.0.1 start
> nest start

{"level":30,"time":1740859837466,"pid":32422,"hostname":"MacBook-Pro.local","context":"NestFactory","msg":"Starting Nest application..."}
{"level":30,"time":1740859837466,"pid":32422,"hostname":"MacBook-Pro.local","context":"InstanceLoader","msg":"AppModule dependencies initialized"}
{"level":30,"time":1740859837466,"pid":32422,"hostname":"MacBook-Pro.local","context":"InstanceLoader","msg":"LoggerModule dependencies initialized"}
{"level":30,"time":1740859837468,"pid":32422,"hostname":"MacBook-Pro.local","context":"RoutesResolver","msg":"AppController {/}:"}
{"level":30,"time":1740859837469,"pid":32422,"hostname":"MacBook-Pro.local","context":"RouterExplorer","msg":"Mapped {/, GET} route"}
{"level":30,"time":1740859837469,"pid":32422,"hostname":"MacBook-Pro.local","context":"NestApplication","msg":"Nest application successfully started"}
{"level":30,"time":1740859890553,"pid":32422,"hostname":"MacBook-Pro.local","reqId":1,"context":"AppService","foo":"bar","msg":"Hello World!"}
{"level":30,"time":1740861413156,"pid":52372,"hostname":"MacBook-Pro.local","req":{"id":1,"method":"GET","url":"/","query":{},...},"res":{"statusCode":200,...},"responseTime":6,"msg":"request completed"}
```
