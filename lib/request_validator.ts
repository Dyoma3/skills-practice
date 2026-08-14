import type { z } from 'zod'
import BadRequestException from '#exceptions/bad_request'

export default function validateRequest<T extends z.ZodTypeAny>(schema: T, data: unknown) {
  const parse = schema.safeParse(data)
  if (parse.success) return parse.data

  throw new BadRequestException(parse.error.message)
}
