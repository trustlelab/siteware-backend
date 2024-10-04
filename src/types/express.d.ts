// src/types/express.d.ts

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: number; // or string, depending on your JWT payload
    }
  }
}
