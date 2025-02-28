# pino-nestjs

## 0.1.0

### Minor Changes

- NestJS drop-in compatibility _[`#1`](https://github.com/yamcodes/pino-nestjs/pull/1) [`b9306c4`](https://github.com/yamcodes/pino-nestjs/commit/b9306c41b4b74962a51755c2f53948bb19b6a53c) [@yamcodes](https://github.com/yamcodes)_

  Make the logger compatible with NestJS by switching the order of the arguments:

  ```ts
  // With nestjs-pino:
  this.logger.log(context, "message"); // ❌ context first, message second

  // With NestJS standard logger and pino-nestjs:
  this.logger.log("message", context); // ✅ message first, context second
  ```
