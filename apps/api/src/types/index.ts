import { CircleRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
      circleMember?: {
        id: string;
        role: CircleRole;
        userId: string;
        circleId: string;
      };
    }
  }
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
