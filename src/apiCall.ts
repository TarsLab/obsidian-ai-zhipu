import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { CompletionUsage } from 'openai/resources/completions'

export interface ApiCallParams {
	model: string
	messages: ChatCompletionMessageParam[]
}

export interface ApiCallInfo {
	params: ApiCallParams
	result: string | null
	usage: CompletionUsage | null
	error: string | null
	startTime: Date
	endTime: Date | null
}

export const newApiCallInfo = (params: ApiCallParams): ApiCallInfo => {
	return {
		params,
		result: null,
		error: null,
		usage: null,
		startTime: new Date(),
		endTime: null
	}
}
