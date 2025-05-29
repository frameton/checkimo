import { ExceptionFilter, Catch, ArgumentsHost, NotFoundException } from '@nestjs/common';
import { Response } from 'express';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    response
      .status(404)
      .json({
        success: false,
        statusCode: 404,
        error: {
          message: 'La route demandée est introuvable',
          path: request?.url,
        },
        timestamp: new Date().toISOString(),
      });
  }
}