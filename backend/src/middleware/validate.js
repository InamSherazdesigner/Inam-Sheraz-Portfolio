/**
 * VALIDATION — nothing reaches a service layer unparsed.
 *
 * The parsed result replaces the raw value, so a controller can only ever see
 * data that matched the schema. Unknown keys are stripped by zod's object
 * parsing, which is what keeps mass-assignment out of the contact model.
 */

import { ApiError } from '../lib/ApiError.js';

export const validate = (schemas) => (req, _res, next) => {
  for (const key of ['body', 'query', 'params']) {
    const schema = schemas[key];
    if (!schema) continue;

    const result = schema.safeParse(req[key]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || key,
        message: issue.message,
      }));
      return next(ApiError.badRequest('Some of that was not quite right.', details));
    }
    req[key] = result.data;
  }
  return next();
};
