import dedent from 'ts-dedent'

export const promptZh = dedent`
# 提示词模版

- If you want to use english prompt, please update setting in obsidian-ai-zhipu plugin.
- 本文件按照幻灯片格式，用“---”来分隔每一页的内容
- 第一页是说明，后面是正式的模板内容
- \`##\` 是标题
- \`%%\`里面是技术参数，参考[智谱AI的接口文档](https://open.bigmodel.cn/dev/api)
-  在✨💡和💡✨之间的是模板内容，插件会把 \`{{selection}}\`替换为选中的文本，得到最终的提示词
- 如果你想查看最终的提示词是否符合预期，或者更多技术参数，使用插件的“显示上次请求参数”功能

---

## ✨ 生成内容

✨💡
{{selection}}
💡✨

---

## 🖼️ 文生图

%%
model: cogview-3
%%

✨💡
{{selection}}
💡✨

---

## 📚 知识库

%%
knowledge_id: "你的知识库id"
prompt_template: |
  从文档
  """
  {{knowledge}}
  """
  中找问题
  """
  {{question}}
  """
  的答案，找到答案就仅使用文档语句回答问题，找不到答案就用自身知识回答并且告诉用户该信息不是来自文档。

  不要复述问题，直接开始回答。
%%

✨💡
{{selection}}
💡✨

---

## 🔠 翻译

✨💡
把以下文本翻译为中文：{{selection}}
💡✨
`
