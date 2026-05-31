import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe<TInput = unknown, TOutput = TInput> implements PipeTransform<TInput, TOutput> {
  constructor(private readonly schema: ZodSchema<TOutput>) {}

  transform(value: TInput, metadata: ArgumentMetadata): TOutput {
    const parsed = this.schema.safeParse(value ?? {});

    if (!parsed.success) {
      throw new BadRequestException({
        message: `${metadata.type} validation failed`,
        errors: this.formatErrors(parsed.error),
      });
    }

    return parsed.data;
  }

  private formatErrors(error: ZodError) {
    return error.issues.map(issue => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
    }));
  }
}
