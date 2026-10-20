---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
description: ""
date: {{ .Date }}
#
# 信件字段是主题契约（D5-R / CNT-08）：必须写在 params 下，
# 模板用 .Params.from / .to / .subject 读取；缺失时只隐藏对应元信息，不输出空标签。
params:
  from: ""
  to: ""
  subject: ""
---

Write the letter here.
