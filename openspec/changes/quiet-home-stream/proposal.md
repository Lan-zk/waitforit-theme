# Proposal

## Why

用户要求首页仅保留slogan、隐藏footer安歇、语言切换收成一个控件，并参考Earendil海面优化已有WebGL2溪流和草地边界。

## What Changes

- 去掉首页Recent与正文及额外滚动，内容入口只在菜单。
- footer标识隐藏；双语用一个直接切换链接，多语保留单一原生disclosure。
- 溪流交叉宽细波、视线反光、远处细波过滤、浅水缓流与湿润岸线/岸草融合。

## Capabilities

### New Capabilities

- `quiet-home-stream`: 单屏首页、精简控件与溪流材质验收。

### Modified Capabilities

无；在三个待审变更上追加，不归档前轮。

## Impact

涉及home、lang-switch、CSS、scene.js、虚构首页fixture、文档与测试。无新依赖，不复制参考代码/素材，不改溪流路径或24fps/降级。
