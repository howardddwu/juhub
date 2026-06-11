# JuHub（聚汇）设计文档

> 聚会工具箱：分账、随机分组、投票决策……一个 PWA 装下朋友聚会需要的所有小工具。
> 前身是分账工具 Farely（其原始设计见 [docs/split-tool.md](docs/split-tool.md)），2026-06 转型。

## 1. 重定位

**演进逻辑**：分账解决的是"聚会结束时"的问题；分组、投票解决的是"聚会进行中"的问题——同一拨人、同一台手机、同一个场景，工具天然该长在一起。

**产品原则不变**（这是 Farely 验证过的）：
- 无登录、无后端、打开即用
- 链接即分享（数据压缩编码进 URL）
- 手机优先的 PWA，离线可用
- 一个人操作、全员受益（记账员模式 / 传手机模式）

**整合的核心价值**：聚会的人是同一拨。如果每个工具都要重新输一遍名字，那 JuHub 只是个书签收藏夹；让"这拨人"在工具间流动起来，才是工具箱成立的理由。

## 2. 信息架构与路由

现状是 state 路由，单工具够用，多工具必须上真路由（手写 hash 路由，零依赖）：

```
#/                    工具中心（hub 首页）
#/split               分账：账本列表
#/split/:tripId       分账：账本页 / 结算页
#/teams               分组工具
#/vote                投票决策器
```

- 浏览器返回键可用、PWA 深链可分享
- **旧链接永久兼容**：`#restore=` / `#view=` 重定向到分账工具处理，已发出去的分享链接不能死

## 3. 共享基建

**直接复用现有的**：i18n、主题（深色）、Dialogs（toast/confirm）、Avatar、clipboard、PWA 配置、URL 编解码（把 `backup.ts` 泛化成 `encodePayload(kind, data)`，kind 区分账本/投票等未来类型）。

**新增两件**：

1. **最近名字池**（整合的第一块胶水）：所有工具录入的名字写入共享池，任何工具输名字时联想补全。一晚上玩三个工具，名字只打一遍。
2. **工具注册表**：新增工具 = `tools/` 下一个目录 + 注册表一行，hub 自动出卡片，`React.lazy` 代码分割保证首屏不变重。

```ts
interface ToolMeta {
  id: string;
  icon: string;
  title: (t: Texts) => string;
  desc: (t: Texts) => string;
  path: string;
  component: React.LazyExoticComponent<...>;
}
```

```
src/
  shared/        i18n、theme、dialogs、avatar、clipboard、payload、名字池
  tools/
    split/       现有分账全部代码迁入，功能不动
    teams/       分组工具
    vote/        投票决策器
  Hub.tsx        工具中心首页
  router.ts      hash 路由
```

## 4. 工具设计

### 4.1 分账（tools/split，现有能力迁移）

功能不动。localStorage key 继续读旧的 `farely.trips.v1`（或一次性迁移到 `juhub.*` 并保留回退），老用户无感。

### 4.2 分组工具（tools/teams）

- **输入**：名字 chips（名字池联想）；模式二选一：分 N 组 / 每组 K 人
- **可选约束**：配对标记"必须同组"/"必须分开"（情侣别拆 / 卧底别凑）
- **算法**：必须同组用并查集合并成块 → Fisher-Yates 洗牌 → 块按大小降序贪心放入当前人数最少的组 → 校验必须分开，违反则重摇（上限 500 次，聚会规模毫秒收敛；超限提示约束矛盾）
- **输出**：分组卡片 + 🎲 重摇 + 复制结果文案
- 结果不持久化（用完即弃），只回写名字池

### 4.3 投票决策器（tools/vote）

坚持无后端，所以是**传手机模型**（本地诚实方案）：

- 建议题 + 2~8 个选项
- 投票流程：全屏过场"请把手机交给 ××" → 本人点选（可选匿名）→ 传下一人 → 全员投完唱票动画 + 柱状图
- 平票：一键随机决胜
- **快速决策子模式（转盘）**：不需要计票的"今晚吃什么"，选项进转盘，动画随机定一个

远程投票（发链接各自投）需要后端聚合 → 列入 V2，与分账协作共用 Supabase。

### 4.4 候选池（看使用数据再加）

顺序随机器（谁先来）、骰子、数字炸弹、真心话大冒险题库、AA 倒计时。每个都是注册表一行的成本。

## 5. 渐进路线

| 阶段 | 内容 | 量级 |
|---|---|---|
| **V1** | hash 路由重构 + hub 首页 + 名字池 + 分组工具 + 投票（传手机 + 转盘） | 2~3 天 |
| V1.5 | "聚会"容器：一次聚会一个 session，成员一处维护全工具共享；聚会时间线 | |
| V2 | Supabase：远程投票 + 分账多人协作，工具间共享一个房间码 | |

## 6. 迁移与兼容清单

- [x] `farely.trips.v1` 等旧 localStorage key 继续可读（trips/lang/theme 均沿用旧 key）
- [x] `#restore=` / `#view=` 旧分享链接重定向兼容（router 重定向到 `#/split/restore|view/:payload`，旧版裸 Trip 载荷由 decodePayload 识别）
- [x] PWA manifest 更名 JuHub（已安装用户更新后自动改名）
- [x] 品牌串更新：标题、tagline、hero 图标（"分" → "聚"）
- [ ] PNG 图标（icon-192/512、apple-touch-icon）仍是 Farely 旧图，需要重新出图
- [x] 项目目录 Farely → JuHub，package name 更新
