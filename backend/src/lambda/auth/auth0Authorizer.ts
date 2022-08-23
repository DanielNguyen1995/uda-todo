import { APIGatewayTokenAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { Auth0Key } from '../../auth/Auth0Key'
import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
import { certToPEM } from '../../auth/utils'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-pw0dey3l.us.auth0.com/.well-known/jwks.json'

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing for credential: '.concat(JSON.stringify(event.authorizationToken)))
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('Access granted: '.concat(JSON.stringify(jwtToken)))
    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (err) {
    logger.error('Access denied: '.concat(err.message))
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  try {
    const token = getToken(authHeader)
    const jwt: Jwt = decode(token, { complete: true }) as Jwt
    const requestedKeyID: string = jwt?.header?.kid as string
    const jwks = await Axios.get(jwksUrl)
    const keyset: Array<Auth0Key> = jwks.data.keys
    const matchedKey = keyset.filter((key) => key.kid === requestedKeyID)
    if (!matchedKey || !matchedKey.length)
      throw new Error('Auth header contained invalid key ID')
    const PEM: string = certToPEM(matchedKey[0].x5c[0])
    return verify(token, PEM, { algorithms: ['RS256'] }) as JwtPayload;
  } catch (err) {
    logger.error('Authorizer failed with error: ', err)
  }
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')
  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')
  const split = authHeader.split(' ')
  const token = split[1]
  return token
}


