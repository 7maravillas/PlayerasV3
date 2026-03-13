// src/types/express.d.ts
// Type augmentation for Express Request — adds `user` from JWT payload

declare namespace Express {
    interface Request {
        user?: {
            sub: string;
            role: string;
        };
    }
}
