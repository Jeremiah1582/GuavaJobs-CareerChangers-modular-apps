import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { AppError } from '../../shared/schemas/error.schema';
import { ZodError } from 'zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof AppError) {
      response.status(exception.status).json({
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.details ? { details: exception.details } : {}),
        },
      });
      return;
    }

    if (exception instanceof ZodError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: { issues: exception.issues },
        },
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const isMissingTable =
        exception.code === 'P2021' || exception.code === 'P2022';
      response.status(
        isMissingTable ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.BAD_REQUEST,
      ).json({
        error: {
          code: isMissingTable ? 'DATABASE_SCHEMA_MISSING' : 'DATABASE_ERROR',
          message: isMissingTable
            ? 'Database schema is not migrated. Run prisma migrate deploy on the API database.'
            : 'Database request failed',
          details: { prismaCode: exception.code },
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null && 'error' in body) {
        response.status(status).json(body);
        return;
      }
      response.status(status).json({
        error: {
          code: 'HTTP_ERROR',
          message:
            typeof body === 'string'
              ? body
              : ((body as { message?: string | string[] }).message ??
                'Request failed'),
        },
      });
      return;
    }

    console.error(exception);
    const devMode =
      process.env.DEV_MODE === 'True' ||
      process.env.DEV_MODE === 'true' ||
      process.env.NODE_ENV !== 'production';
    const prismaMessage =
      exception &&
      typeof exception === 'object' &&
      'message' in exception &&
      typeof (exception as { message: unknown }).message === 'string'
        ? (exception as { message: string }).message
        : null;
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        ...(devMode && prismaMessage
          ? { details: { message: prismaMessage.slice(0, 500) } }
          : {}),
      },
    });
  }
}
