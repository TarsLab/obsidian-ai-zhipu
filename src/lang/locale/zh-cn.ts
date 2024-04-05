// 简体中文

import dedent from 'ts-dedent'

export default {
	// command
	'Generate from the selected text / line / block': '生成内容（基于选中的文本、行、区块）',
	'Select ✨block✨': '选取 ✨区块✨',
	'Show the chat details': '显示对话详情',
	'Open prompt template file': '打开提示词模板文件',

	// block.ts
	'Expect start mark, but found end mark at line ': '要找开始标记，然而是结束标记，行号：',

	// main.ts
	'Cannot find a valid block.': '找不到有效的区块',
	'No chat in this session yet.': '本次会话中还没有对话',
	'Cannot find prompt template file.': '找不到提示词模板文件',

	'Create template folder': '创建模版文件夹',
	'Create template file': '创建模板文件',
	'ZhipuAI API Key is not provided.': '请先设置智谱AI的 API Key',
	'Nothing was selected': '请先选定文本',
	'This is the block for generating content. Copy the selected text outside of this block, and then execute the command.':
		'这是生成内容的区块。把选中的文本复制到这个区块外面，再执行命令。',
	'Block is empty': '区块是空的',
	'Regenerate block': '重新生成区块',
	'Failed to generate image': '生成图片失败',
	Round: '第',
	'generate content': '轮生成内容',

	// settingTab.ts
	'Zhipu API key': '智谱 API key',
	'Obtain key from https://open.bigmodel.cn': '从 https://open.bigmodel.cn 获取 key',
	'Enter your key': '输入你的 key',

	'Single Round Conversation': '单轮会话',
	'Prompt template file': '提示词模板文件',
	"Template file support both Chinese and English languages, with the default being the software's language setting.":
		'模版文件支持中文语言和英文语言，默认是软件的语言设置',
	PromptTemplates: '提示词模板',
	'The starting mark of Multi-round conversation is two consecutive lines of horizontal dashes, such as two lines of "---", and the ending mark is a single line of horizontal dashes.':
		'多轮会话的开始标记是连续两行的水平线，例如两行的“---”，结束标记是一行水平线',
	'Sampling temperature controls the randomness of the output. A higher value makes the output more random and creative; a lower value makes the output more stable or deterministic.':
		'采样温度，控制输出的随机性。值越大，会使输出更随机，更具创造性；值越小，输出会更加稳定或确定',
	'0.1 means that the model decoder only considers taking tokens from the candidate set of the top 10% probability.':
		'核取样。0.1 意味着模型解码器只考虑从前 10% 的概率的候选集中取 tokens',
	'The maximum number of tokens to generate in the completion': '模型输出最大 tokens',

	// modal.ts
	Messages: '发送消息',
	'Multi-round Conversation': '多轮会话',
	'Generate content': '生成内容',
	'Last used': '上次使用',
	TimeInfoTemplate: dedent`
	🚀 开始：\${startTime}
	🏁 结束：\${endTime}
	⌛ 耗时：\${duration}`,
	UsageInfoTemplate: dedent`
	💡 用户输入 tokens：\${prompt_tokens}
	💬 模型输入 tokens：\${completion_tokens}
	✨ 合计数量 tokens：\${total_tokens}`
}
