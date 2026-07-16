import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'taruka-gym-secret',
  uploadsDir: process.env.UPLOADS_DIR || 'uploads',
  jwtExpiresIn: '24h',
};
