export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Auth')
  await clearUserSession(event)
  log.info('Session cleared')
  return { success: true }
})
