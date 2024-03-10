import { ZhipuAI } from '../src/client'
import { DEFAULT_SETTINGS, ServerSettings } from '../src/settings'
import { validOrCreate } from '../src/token'

const apiKey = process.env['ZHIPU_KEY_SECRET']
if (!apiKey) {
	throw new Error('The ZHIPU_KEY_SECRET environment variable is missing or empty.')
}

const settings: ServerSettings = {
	...DEFAULT_SETTINGS,
	apiKey: apiKey
}

const chat = async (apiToken: string, baseURL: string) => {
	const client = new ZhipuAI(apiToken, baseURL)
	const runner = await client.beta.chat.completions
		.stream({
			model: 'glm-4',
			messages: [{ role: 'user', content: 'python 3 和 python 2 有什么区别？' }]
		})
		.on('message', (msg) => console.log('msg', msg))
		.on('content', (diff) => console.log('diff', diff))

	for await (const chunk of runner) {
		console.log('chunk', chunk)
	}

	const result = await runner.finalChatCompletion()
	const content = result.choices[0].message.content
	console.log('result', result)
	console.log('content', content)
}

const generateImage = async (apiToken: string, baseURL: string) => {
	const client = new ZhipuAI(apiToken, baseURL)
	const response = await client.images.generate({
		prompt: '奥特曼打怪兽',
		model: 'cogview-3'
	})
	console.log('response', response)
}

const main = async () => {
	const { token } = await validOrCreate(undefined, settings.apiKey, settings.tokenExpireInMinutes)
	await chat(token.id, settings.baseURL)
	await generateImage(token.id, settings.baseURL)
}

main()
