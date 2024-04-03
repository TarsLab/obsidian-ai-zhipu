import { PromptTemplate } from './prompt'

export interface ServerSettings {
	apiKey: string
	baseURL: string
	tokenExpireInMinutes: number
}

export interface PluginSettings extends ServerSettings {
	rootFolder: string
	promptFileName?: string
	multiRoundTemplate: PromptTemplate
}

export const DEFAULT_SETTINGS: PluginSettings = {
	apiKey: '',
	baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
	tokenExpireInMinutes: 60,
	rootFolder: 'Aizhipu',
	multiRoundTemplate: {
		title: 'multi-round',
		template: '',
		params: {
			model: 'glm-4',
			multiRound: true,
			temperature: 0.95,
			top_p: 0.7,
			max_tokens: 8192
		}
	}
}
