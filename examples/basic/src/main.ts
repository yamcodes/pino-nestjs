import { NestFactory } from '@nestjs/core'
import { Logger } from 'pino-nestjs'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })
  app.useLogger(app.get(Logger))
  app.flushLogs()
  await app.listen(3000)
}
bootstrap()
