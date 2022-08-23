import { decode } from 'jsonwebtoken'
import { JwtPayload } from './JwtPayload'

/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(jwtToken: string): string {
  const decodedJwt = decode(jwtToken) as JwtPayload
  return decodedJwt.sub
}

export const certToPEM = (certificate: string) => {
  return `-----BEGIN CERTIFICATE-----\n${certificate
    .match(/.{1,64}/g)
    .join('\n')}\n-----END CERTIFICATE-----\n`
}