import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
})
