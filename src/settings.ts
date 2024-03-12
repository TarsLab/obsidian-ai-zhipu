export interface ServerSettings {
	apiKey: string
	baseURL: string
	tokenExpireInMinutes: number
}

export interface PluginSettings extends ServerSettings {
	rootFolder: string
	promptFileName?: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
	apiKey: '',
	baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
	tokenExpireInMinutes: 60,
	rootFolder: 'Aizhipu'
}
