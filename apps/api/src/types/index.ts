import { CircleRole } from '@careo/shared';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
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
