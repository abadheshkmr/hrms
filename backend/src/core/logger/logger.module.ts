import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Global module that provides logging services to the entire application
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
