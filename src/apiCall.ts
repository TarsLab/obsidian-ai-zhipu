import { ChatCompletionStreamParams } from 'openai/resources/beta/chat/completions'
import { CompletionUsage } from 'openai/resources/completions'
import { ApiParams, Glm4 } from './prompt'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export interface ApiCallInfo {
	params: ApiParams
	messages: ChatCompletionMessageParam[]
	result: string | null
	usage: CompletionUsage | null
	error: string | null
	startTime: Date
	endTime: Date | null
}

export const newApiCallInfo = (params: ApiParams, messages: ChatCompletionMessageParam[]): ApiCallInfo => {
	return {
		params,
		messages,
		result: null,
		error: null,
		usage: null,
		startTime: new Date(),
		endTime: null
	}
}

export const toChatCompletionStreamParams = (info: ApiCallInfo): ChatCompletionStreamParams => {
	if (info.params.model === 'cogview-3') {
		throw new Error('Not supported')
	}
	const { model = Glm4, temperature, top_p, max_tokens } = info.params
	return {
		model,
		messages: info.messages,
		temperature,
		top_p,
		max_tokens
	}
}
