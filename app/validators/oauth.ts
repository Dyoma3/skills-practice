import { z } from 'zod'

export const approveAuthorizationValidator = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1),
  redirect_uri: z.url(),
  scope: z.string().optional(),
  state: z.string().optional(),
  code_challenge: z
    .string()
    .length(43)
    .regex(/^[A-Za-z0-9_-]+$/),
  code_challenge_method: z.literal('S256'),
  resource: z.url(),
})

export const tokenValidator = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string().min(1),
  client_id: z.string().min(1),
  redirect_uri: z.url(),
  code_verifier: z
    .string()
    .min(43)
    .max(128)
    .regex(/^[A-Za-z0-9\-._~]+$/),
  resource: z.url(),
})
