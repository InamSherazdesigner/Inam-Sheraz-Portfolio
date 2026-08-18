import { z } from 'zod';

/**
 * The honeypot: a field no human ever sees, hidden from assistive technology
 * and from the layout. A bot that fills every input fills this one too. If it
 * arrives non-empty the submission is accepted with a normal success response
 * and then dropped — telling a bot it was caught only teaches it to try again
 * differently.
 */
export const contactBodySchema = z.object({
  name: z.string().trim().min(1, 'Please add your name.').max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .email('That does not look like an email address.'),
  subject: z.string().trim().max(200).optional().default(''),
  body: z
    .string()
    .trim()
    .min(10, 'Please write a little more than that.')
    .max(5000, 'That is longer than the form accepts.'),
  website: z.string().max(200).optional().default(''), // honeypot
});
