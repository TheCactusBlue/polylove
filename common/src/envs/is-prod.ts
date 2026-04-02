export const isProd = () => {
  const env =
    process.env.ENVIRONMENT ?? process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'PROD'
  return env === 'PROD'
}
