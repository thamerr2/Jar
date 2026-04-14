import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message, errors: error.errors });
        return;
      }
      next(error);
    }
  };
}
