export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Auth')
  const session = await getUserSession(event)

  log.debug('Session check', { hasUser: !!session?.user })

  if (!session?.user) {
    return { user: null }
  }

  return { user: session.user }
})
