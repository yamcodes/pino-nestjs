import { Test } from '@nestjs/testing';

import { InjectPinoLogger, PinoLogger, getLoggerToken } from '../src';

describe('get-logger-token', () => {
  it('should work', async () => {
    class MyService {
      constructor(
        @InjectPinoLogger(MyService.name) private readonly logger: PinoLogger,
      ) {}
    }

    await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: getLoggerToken(MyService.name),
          useValue: {},
        },
      ],
    }).compile();
  });
});
