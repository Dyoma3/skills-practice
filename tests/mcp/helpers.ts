import User from '#models/user'
import { mcpOAuthScopes } from '#lib/oauth/mcp'

export const mcpHeaders = {
  'Accept': 'application/json, text/event-stream',
  'Mcp-Protocol-Version': '2025-03-26',
}

export async function getMcpHeaders(user: User, abilities: string[] = [...mcpOAuthScopes]) {
  const token = await User.mcpAccessTokens.create(user, abilities)

  return {
    ...mcpHeaders,
    Authorization: `Bearer ${token.value!.release()}`,
  }
}

export function parseMcpEvent(responseText: string) {
  const dataLine = responseText.split('\n').find((line) => line.startsWith('data: '))

  if (!dataLine) {
    throw new Error(`MCP response did not include an SSE data event: ${responseText}`)
  }

  return JSON.parse(dataLine.replace(/^data: /, ''))
}

export function parseMcpToolError(responseText: string) {
  const mcpResponse = parseMcpEvent(responseText)

  if (mcpResponse.result?.isError !== true) {
    throw new Error(`Expected MCP tool error result: ${responseText}`)
  }

  return mcpResponse.result
}
