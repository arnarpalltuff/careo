import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { AppError } from '../types';

const logger = pino({ name: 'elderlink-api' });

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.code, message: err.message });
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' });
}
