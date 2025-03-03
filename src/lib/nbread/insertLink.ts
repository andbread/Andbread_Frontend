export const createLink = (nbreadId: string) => {
  const baseUrl = 'http://localhost:3000/inviteAccept'

  const uniqueCode = Math.random().toString(36).substr(2, 9)

  const inviteLink = `${baseUrl}?groupId=${nbreadId}&code=${uniqueCode}`

  return inviteLink
}
