import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error ? exception.message : 'Internal server error';
    const stack = exception instanceof Error ? exception.stack : 'No stack trace';

    console.error('--- GLOBAL ERROR CATCHED ---');
    console.error(`URL: ${request.url}`);
    console.error(`Status: ${status}`);
    console.error(`Message: ${message}`);
    console.error(`Stack: ${stack}`);
    console.error('----------------------------');

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      error: status === 500 ? 'Internal Server Error' : (exception as any).name || 'Error',
      // Include trace in the response so the user can see it in their browser
      trace: status === 500 ? stack : undefined,
    });
  }
}
