import { z } from "zod";
import { config } from "dotenv";

config();

const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  NODE_ENV: z.enum(["dev", "prod", "test"]).optional().default("dev"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  EMAIL_USER: z.string(),
  EMAIL_PASSWORD: z.string(),
  MOBILE_APP_URL: z.string(),
});

const { success, data: env, error } = envSchema.safeParse(process.env);

if (!success || !env) {
  throw new Error(`Config validation error: ${error}`);
}

export { env };
