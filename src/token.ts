import * as jose from 'jose'

export interface Token {
	id: string
	exp: number
	apiKeySecret: string
}

const createToken = async (apiKeySecret: string, expireInMinutes: number): Promise<Token> => {
	const [apiKey, apiSecret] = apiKeySecret.split('.')
	if (!apiKey || !apiSecret) throw new Error('Invalid API key secret, must be in the format "apiKey.apiSecret"')
	const now = Date.now()
	const payload = {
		api_key: apiKey,
		exp: now + expireInMinutes * 60 * 1000,
		timestamp: now
	}
	const encoded = await new jose.SignJWT({ ...payload })
		.setProtectedHeader({ alg: 'HS256', sign_type: 'SIGN' })
		.sign(new TextEncoder().encode(apiSecret))
	return {
		id: encoded,
		exp: payload.exp,
		apiKeySecret: apiKeySecret
	}
}

/**
 * Validates the current token or creates a new one if it is invalid or expired.
 * @param currentToken - The current token to validate.
 * @param apiKeySecret - The API key secret used for token validation.
 * @param expireInMinutes - The expiration time for the new token in minutes.
 * @returns An object containing the validity status and the token.
 */
export const validOrCreate = async (currentToken: Token | undefined, apiKeySecret: string, expireInMinutes: number) => {
	const now = Date.now()
	if (currentToken && currentToken.apiKeySecret === apiKeySecret && currentToken.exp > now + 3 * 60 * 1000) {
		return {
			isValid: true,
			token: currentToken
		}
	}
	const newToken = await createToken(apiKeySecret, expireInMinutes)
	return {
		isValid: false,
		token: newToken
	}
}
