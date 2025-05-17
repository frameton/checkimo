import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string | string[];
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status: number;
    let body: ApiErrorBody;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse() as any;
      body = {
        success: false,
        error: {
          code: resp.code ?? exception.name,
          message: resp.message ?? exception.message,
        },
      };
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Une erreur inattendue est survenue',
        },
      };
    }

    res.status(status).json(body);
  }
}