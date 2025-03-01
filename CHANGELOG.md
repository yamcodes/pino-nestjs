# pino-nestjs

## 0.1.3

### Patch Changes

- Fix parameter order _[`5a7dbcd`](https://github.com/yamcodes/pino-nestjs/commit/5a7dbcd9b18b524e13339bb9c1f02c46d329fe52) [@yamcodes](https://github.com/yamcodes)_

  Fix an issue where the parameter order was incorrect, resulting in missing context.

## 0.1.2

### Patch Changes

- Fix build issue _[`b8445e7`](https://github.com/yamcodes/pino-nestjs/commit/b8445e76e4dd8d35549c375ba7ed704f38966737) [@yamcodes](https://github.com/yamcodes)_

  Fix build issue by including the dist folder in the package.

## 0.1.1

### Patch Changes

- Fix package build issue _[`27e2405`](https://github.com/yamcodes/pino-nestjs/commit/27e2405d7c67f6d89b3ccdf83e0a33d661164b90) [@yamcodes](https://github.com/yamcodes)_

  Fix an issue with the package build causing the dist folder to be excluded from the package.
  Now, the dist folder is included in the package and installation should work as expected.

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
