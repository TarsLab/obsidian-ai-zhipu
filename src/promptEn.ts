import dedent from 'ts-dedent'

export const promptEn = dedent`

- 如果你想使用中文版本的提示词模板，请在插件设置中修改。
- This document is formatted according to Obsidian's slide format, using "---" to separate the content of each page.
- The first page is an explanation; each subsequent page is a prompt template.
- \`##\` is the title. When the 'Generate from...' command is activated, the title appears in the dropdown list.
- \`%%\` contains technical parameters, referring to the documentation of [Zhipu AI](https://open.bigmodel.cn/dev/api).
- The text between ✨💡 and 💡✨ is the template content. The plugin will replace \`{{selection}}\` with the selected text to obtain the final prompt.
- If you want to check whether the final prompt of the chat meets expectations, or for more technical parameters, use the command "Show the chat details".

---

## ✨ Generate Content

✨💡
{{selection}}
💡✨

---

## 🖼️ Generate Image

%%
model: cogview-3
%%

✨💡
{{selection}}
💡✨

---

## 📚 Knowledge

%%
knowledge_id: "your-knowledge-id"
prompt_template: |
  Search for the answer to the question
  """
  {{question}}
  """
  in the document
  """
  {{knowledge}}
  """
  .
  If you find the answer, respond to the question using only the statements from the document. If the answer is not found, use your own knowledge to respond and inform the user that the information does not come from the document.
  Do not repeat the question; start answering directly.
%%

✨💡
{{selection}}
💡✨

`
