import OpenAI from 'openai'

export class ZhipuAI extends OpenAI {
	protected override authHeaders() {
		return { Authorization: `${this.apiKey}` }
	}

	constructor(apiToken: string, baseUrl: string) {
		super({
			apiKey: apiToken,
			baseURL: baseUrl,
			dangerouslyAllowBrowser: true
		})
		this.apiKey = apiToken
	}
}
