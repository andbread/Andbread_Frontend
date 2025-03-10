export const createLink = (nbreadId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_INVITELINK_URL

  const uniqueCode = Math.random().toString(36).substr(2, 9)

  const inviteLink = `${baseUrl}?groupId=${nbreadId}&code=${uniqueCode}`

  return inviteLink
}
