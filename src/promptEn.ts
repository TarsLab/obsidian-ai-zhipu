import dedent from 'ts-dedent'

export const promptEn = dedent`

如果你想使用中文版本的提示词，请在插件设置中修改。

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
