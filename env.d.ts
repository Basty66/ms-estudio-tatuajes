declare namespace NodeJS {
  interface ProcessEnv {
    NEON_DATABASE_URL: string
    ADMIN_PASSWORD: string
  }
}

declare var process: {
  env: NodeJS.ProcessEnv
}
