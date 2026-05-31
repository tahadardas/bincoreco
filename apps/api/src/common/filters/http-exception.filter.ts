import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { errorResponse } from '../response.interface';

interface ApiError {
  field: string;
  message: string;
}

interface ExceptionBody {
  message?: string | string[];
  errors?: ApiError[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody = isHttpException ? exception.getResponse() : null;
    const body = this.normalizeBody(exceptionBody, isHttpException ? exception.message : 'Internal server error');

    const isDev = process.env.NODE_ENV === 'development';

    const apiResponse = errorResponse(body.message, body.errors.length ? body.errors : undefined);
    apiResponse.meta = {
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(isDev && status >= 500 ? { error: exception instanceof Error ? exception.stack : undefined } : {}),
    };

    response.status(status).json(apiResponse);
  }

  private normalizeBody(exceptionBody: unknown, fallbackMessage: string): { message: string; errors: ApiError[] } {
    if (typeof exceptionBody === 'object' && exceptionBody !== null) {
      const body = exceptionBody as ExceptionBody;
      const message = Array.isArray(body.message) ? 'Validation failed' : body.message || fallbackMessage;
      const errors = body.errors ?? this.messagesToErrors(body.message);
      return { message, errors };
    }

    if (typeof exceptionBody === 'string') {
      return { message: exceptionBody, errors: [] };
    }

    return { message: fallbackMessage, errors: [] };
  }

  private messagesToErrors(message: string | string[] | undefined): ApiError[] {
    if (!Array.isArray(message)) {
      return [];
    }

    return message.map(item => ({
      field: 'request',
      message: item,
    }));
  }
}
