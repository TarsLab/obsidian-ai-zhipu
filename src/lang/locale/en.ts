// English

import dedent from 'ts-dedent'

export default {
	// command
	'Generate from the selected text / line / block': 'Generate from the selected text / line / block',
	'Select ✨block✨': 'Select ✨block✨',
	'Show the chat details': 'Show the chat details',
	'Open prompt template file': 'Open prompt template file',

	// main.ts
	'Cannot find a valid block.': 'Cannot find a valid block.',
	'No chat in this session yet.': 'No chat in this session yet.',
	'Cannot find prompt template file.': 'Cannot find prompt template file.',

	'Create template folder': 'Create template folder',
	'Create template file': 'Create template file',
	'ZhipuAI API Key is not provided.': 'ZhipuAI API Key is not provided.',
	'Nothing was selected': 'Nothing was selected',
	'This is the block for generating content. Copy the selected text outside of this block, and then execute the command.':
		'This is the block for generating content. Copy the selected text outside of this block, and then execute the command.',
	'Block is empty': 'Block is empty',
	'Regenerate block': 'Regenerate block',
	'Failed to generate image': 'Failed to generate image',

	// setting-tab.ts
	'Zhipu API key': 'Zhipu API key',
	'Obtain key from https://open.bigmodel.cn': 'Obtain key from https://open.bigmodel.cn',
	'Enter your key': 'Enter your key',

	'Prompt template file': 'Prompt template file',
	"Template file support both Chinese and English languages, with the default being the software's language setting.":
		"Template file support both Chinese and English languages, with the default being the software's language setting.",
	PromptTemplates: 'PromptTemplates',

	// modal.ts
	Messages: 'Messages',
	Response: 'Response',
	'Last used': 'Last used',
	TimeInfoTemplate: dedent`
	🚀 Begin : \${startTime}
	🏁 Finish: \${endTime}
	⌛ Total : \${duration}`,
	UsageInfoTemplate: dedent`
	💡 Prompt tokens: \${prompt_tokens}
	💬 Comp.  tokens: \${completion_tokens}
	✨ Total  tokens: \${total_tokens}`
}
