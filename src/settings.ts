export interface ServerSettings {
	apiKey: string
	baseURL: string
	tokenExpireInMinutes: number
}

export interface PluginSettings extends ServerSettings {
	model: string
	imageModel: string
	rootFolder: string
	promptFileName?: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
	apiKey: '',
	baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
	model: 'glm-4',
	imageModel: 'cogview-3',
	tokenExpireInMinutes: 60,
	rootFolder: 'Aizhipu'
}
