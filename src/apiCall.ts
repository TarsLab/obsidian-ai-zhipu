import { ChatCompletionStreamParams } from 'openai/resources/beta/chat/completions'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { CompletionUsage } from 'openai/resources/completions'
import { Glm4, PromptTemplate } from './prompt'

export interface ApiCallInfo {
	template: PromptTemplate
	messages: ChatCompletionMessageParam[]
	result: string | null
	usage: CompletionUsage | null
	error: string | null
	startTime: Date
	endTime: Date | null
}

export const newApiCallInfo = (template: PromptTemplate, messages: ChatCompletionMessageParam[]): ApiCallInfo => {
	return {
		template,
		messages,
		result: null,
		error: null,
		usage: null,
		startTime: new Date(),
		endTime: null
	}
}

export const toChatCompletionStreamParams = (info: ApiCallInfo): ChatCompletionStreamParams => {
	if (info.template.params.model === 'cogview-3') {
		throw new Error('Not supported')
	}
	const { model = Glm4, temperature, top_p, max_tokens } = info.template.params
	return {
		model,
		messages: info.messages,
		temperature,
		top_p,
		max_tokens
	}
}
