import { PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { AppError } from '../../shared/schemas/error.schema';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const field = first?.path.length ? first.path.join('.') : 'request';
      const hint =
        first?.code === 'invalid_enum_value' && field === 'country'
          ? 'Pick a supported country from the list.'
          : (first?.message ?? 'Check your input and try again.');
      throw new AppError('VALIDATION_ERROR', `${field}: ${hint}`, 400, {
        issues: parsed.error.issues,
      });
    }
    return parsed.data;
  }
}
