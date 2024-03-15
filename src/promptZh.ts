import dedent from 'ts-dedent'

export const promptZh = dedent`
# 提示词模版

- If you wish to use English prompts, please adjust the settings accordingly.
- 本文件按照 obsidian 的幻灯片格式，用“---”来分隔每一页的内容
- 第一页是说明，后面的每一页都是一个提示词模板
- \`##\` 是标题。当启动命令“生成内容”，标题显示在弹窗列表中
- \`%%\`里面是技术参数，参考[智谱AI的接口文档](https://open.bigmodel.cn/dev/api)
- 在✨💡和💡✨之间的文本是模板内容，插件会把 \`{{selection}}\`替换为选中的文本，得到最终的提示词
- 如果你想查看对话的最终提示词是否符合预期，或者更多技术参数，启动命令“显示对话详情”

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
