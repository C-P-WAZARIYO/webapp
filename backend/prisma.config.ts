import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// 1. Manually load the .env file
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // 2. Now this will correctly find your connection string
    url: process.env.DATABASE_URL,
  },
});