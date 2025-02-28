---
"pino-nestjs": minor
---

NestJS drop-in compatibility

Make the logger compatible with NestJS by switching the order of the arguments:

```ts
// With nestjs-pino:
this.logger.log(context, 'message'); // ❌ context first, message second

// With NestJS standard logger and pino-nestjs:
this.logger.log('message', context); // ✅ message first, context second
```