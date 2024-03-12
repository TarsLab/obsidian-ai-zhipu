import dedent from 'ts-dedent'

export const promptZh = dedent`
# 提示词模版

  [源码穿越的B站链接](https://space.bilibili.com/416606821)

- if you want to use english prompt, please update setting in obsidian-ai-zhipu plugin.
- 插件在打开选择模版的时候，去检查该文件的最后修改时间，有修改则重新加载模板。没有则在该目录下创建文件。
- 请谨慎修改\`%%\`里面参数，不正确会导致接口服务失败，先阅读智谱的相关文档
- 该文件的第一张 slide 是说明，以下的 slide 是正式内容。
- 文件解析功能处于 beta 状态

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
