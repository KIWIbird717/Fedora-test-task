import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { toAckError, toHttpStatus } from './error-mapping';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const error = toAckError(exception);
    if (error.code === 'INTERNAL_ERROR') {
      this.logger.error(exception);
    }
    response.status(toHttpStatus(error)).json(error);
  }
}
