# WXPush 说明 — 清爽白皮肤 + 主脚本小修

日期：2026-11-13
对应服务：`wx.djcf.pp.ua`（frankiejun / WXPush，微信公众号模板消息推送）
来源：主脚本 `frankiejun/wxpush` 的 `src/index.js`，皮肤 `frankiejun/wxpushSkin` 的 `静谧的夜空-饭奇骏/index.js`

> ⚠️ **部署分两版，皮肤一定不要放 Cloudflare：主程序在 Cloudflare，皮肤单独在阿里云中国站。**
> 皮肤和主程序合并成一个放在 CF 上时，微信点模板消息会拦截、打不开网页；
> 分开后皮肤在阿里云才能在微信里打开。
>
> **你要的两版都在下面两个文件夹里（2026-11-13 新做的）：**
> - `v1-二合一/index.js`：二合一，一个文件就是全部（原主程序 + KV 3 天 + 清爽白皮肤），**部署在阿里云中国站**，微信才能打开
> - `v2-分开/`：分开版，`main.js`（原主程序 + KV 3 天，无皮肤，部署在 Cloudflare）+ `skin.js`（清爽白皮肤，部署在阿里云），正式部署用这个

## 一、文件清单

| 文件 | 说明 |
|---|---|
| `v1-二合一/index.js` | **二合一**：原主程序 + KV 历史 3 天 + 清爽白皮肤，部署在阿里云 |
| `v2-分开/main.js` | **分开版主程序**：原主程序 + KV 历史 3 天，无皮肤，部署在 Cloudflare |
| `v2-分开/skin.js` | **分开版皮肤**：清爽白皮肤，部署在阿里云中国站 |
| `skin-clean.js` | 清爽白皮肤单文件（与 `v2-分开/skin.js` 同款） |
| `main-kv-backend-fixed.js` | 后端精简版（带 KV 历史，无皮肤）：`/wxsend` + `/history` + `/health` + 保活 |
| `main-index-clean-skin.js` | 旧合并版（仅本地测试，不要正式部署） |
| `main-kv-clean-skin.js` | 旧合并版（仅本地测试，不要正式部署） |
| `main-index.js` | 原主脚本（对照用，未改） |
| `skin-original.js` | 原皮肤（对照用，未改） |

## 二、新皮肤「清爽白」是什么

浅色、干净的微信消息展示页：白卡片、翡翠绿点缀、系统字体，手机微信里打开也舒服。
去掉了原皮肤的深色背景、25 个漂浮粒子和呼吸动画。

- 参数与原版完全一致：`?title=标题&message=内容&date=时间`
- 支持 Markdown（标题、粗体、列表、代码、表格、链接），链接自动新窗口打开
- 带「复制内容」按钮和时间行，自动跟随手机深色模式
- 最大宽度 660px，专为手机阅读排版

### 安全修补（原皮肤的最大问题）

原皮肤是服务端直接把参数插进 HTML，没有任何转义：

```html
<title>${title}</title>
<div id="message">${message}</div>
```

消息里带 `<script>` 或 `<img onerror=...>`，点开模板消息的人的微信内置浏览器里就会执行。
新皮肤做了两层防护：

1. 服务端先转义 `& < > " '`，危险字符只会当文字显示；
2. 前端用锁版本的 `marked@12.0.2` + `DOMPurify@3.2.4` 渲染 Markdown 并消毒，`onerror`、`script` 这类内容会被去掉。

CDN 挂了也不影响阅读，会退回纯文本显示。另外还加了 `Cache-Control: no-store`、
`X-Content-Type-Options: nosniff`，非 GET 请求返回 405，标题限 120 字、内容限 10000 字。

## 三、部署步骤

### v1 二合一：部署在阿里云中国站

把 `v1-二合一/index.js` 粘贴到阿里云（ESA）部署，一个文件就是全部。
`WX_BASE_URL` 不设时默认用自己的 `/skin`，也可以显式填 `https://你的阿里云域名/skin`。
**不要把 v1 部署在 Cloudflare 上**，微信会拦截 CF 上的皮肤页。

### v2 分开版：主程序在 Cloudflare，皮肤在阿里云

1. 皮肤：把 `v2-分开/skin.js` 粘贴到阿里云（ESA）部署，记下它的地址，例如 `https://你的皮肤域名/`。
2. 主程序：把 `v2-分开/main.js` 粘贴到 Cloudflare Worker（`wx.djcf.pp.ua`）部署，
   这个文件没有 `/skin`，首页只显示一行 `WXPush Backend Service Running` 是正常的。
3. 主程序的 `WX_BASE_URL` 改成上面阿里云皮肤的地址，**不要带 `?` 参数**：

```
WX_BASE_URL=https://你的阿里云皮肤域名
```

这样模板消息点开跳的是阿里云皮肤，微信才能打开；`WX_BASE_URL` 不要指回 Cloudflare 主程序自己的 `/skin`，微信会拦截。

### KV 绑定（两版通用）

Cloudflare 上按 KV 命名空间绑定方式绑 `WX_HISTORY`；阿里云 ESA 上没有绑定这一说，
在 ESA 控制台 → 边缘计算和 AI → KV 存储 → 创建存储空间，空间名称填 `WX_HISTORY`
（已建好，空间 ID 1059614091120824320），不要把它填成环境变量。
代码会自动适配：CF 走 env 绑定，ESA 走 `new EdgeKV({ namespace: "WX_HISTORY" })`。

### 3. 主脚本要不要换（可选）

`main-index-fixed.js` 只修了下面 6 处，不换也能用，换了更稳：

1. `base_url` 未设置时不再拼出 `undefined?message=...` 的无效跳转链接，改为不发 `url` 字段。
2. `/skin` 路由由 `includes('/skin')` 改为精确匹配，`/skinXYZ` 不再误命中。
3. `getStableToken` 拿不到 token 时，把微信返回的原样错误打到日志，方便定位（之前只返回空）。
4. `WX_USERID` 为空或只有 `|` 时，明确报 `WX_USERID is empty`，不再报误导人的 `Unknown error`。
5. `/favicon.ico`、`/robots.txt` 直接返回 404，不再返回 403 `Invalid token`。
6. 测试页的 `WX_SECRET` 输入框由明文改为密码框。

**不要动的部分：** token 鉴权保持原样。测试页只把裸 token 放进 `Authorization` 头，
`/wxsend` 接受裸 token 和 `Bearer` 两种，这是 2026-11-12 修好 403 的做法，改了会重新 403。

其他环境变量不变：`API_TOKEN`、`WX_APPID`、`WX_SECRET`、`WX_USERID`、`WX_TEMPLATE_ID`、
`WX_BASE_URL`，保活 `ALIVE_DAYS`（可选）。保活 cron 是每天 02:00 UTC 一次，不会一天发多次。

## 部署变量

两版主程序用的变量完全一样（皮肤 `skin.js` 不需要任何变量，只读 URL 参数）。
`WX_HISTORY` 不是普通变量，是 KV 命名空间绑定。

| 变量 | 必填 | 说明 |
|---|---|---|
| `API_TOKEN` | 必填 | 自己定的一串随机字符串，`/wxsend`、测试页、`/history` 的鉴权口令。必须和调用方填的一致（CF 三网优选脚本里就是 GitHub Secret `WECHAT_AUTH_TOKEN`）。换了要两边一起换。勾选加密，不要用简单口令，不要写进代码或 GitHub。 |
| `WX_APPID` | 必填 | 微信公众号的 AppID。微信公众平台 → 设置与开发 → 基本配置 → 开发者 ID（AppID）。 |
| `WX_SECRET` | 必填 | 微信公众号的 AppSecret，和 AppID 在同一个页面。启用后只能看到一次，丢了要重置。勾选加密，绝不要发到聊天记录。 |
| `WX_USERID` | 必填 | 接收消息的人的 OpenID，关注公众号后在公众号后台用户管理里看。多个人用 `\|` 分隔，例如 `openid1\|openid2`，中间不要加空格。 |
| `WX_TEMPLATE_ID` | 必填 | 模板消息的 ID。微信公众平台 → 模板消息里创建，模板必须包含 `title` 和 `content` 两个字段，否则发送会失败。 |
| `WX_BASE_URL` | v1 可选，v2 必填 | 点模板消息后跳到的皮肤地址，不要带 `?` 参数。v1 不设时默认用自己的 `/skin`；v2 必须填阿里云皮肤地址，例如 `https://你的阿里云皮肤域名`，不要指回 Cloudflare 主程序。 |
| `WX_HISTORY` | 可选 | **不是普通环境变量。** Cloudflare 上是 KV 命名空间绑定；阿里云 ESA 上没有绑定这一说，要在 ESA 控制台 → 边缘计算和 AI → KV 存储 → 创建存储空间，空间名称填 `WX_HISTORY`，代码里用 `new EdgeKV({ namespace: "WX_HISTORY" })` 读写。**不要把它填成环境变量**，填了也只是个字符串，没有 `.put` 方法，历史写不进去（发消息不受影响）。绑了才有历史功能（`/history` 查最近 20 条，3 天自动过期）；不绑也能正常发消息。另可设 `KV_NAMESPACE` 指定空间名称，默认就是 `WX_HISTORY`。 |
| `ALIVE_DAYS` | 可选 | 保活间隔天数，只填数字，例如 `7`。不设就不保活。设了以后每隔这么多天发一次“保活测试”心跳（cron 每天 02:00 UTC 触发一次，从 2026-01-01 开始算天数）。 |

另外注意：`appid`、`secret`、`userid`、`template_id`、`base_url` 这 5 个每次请求也可以临时传参覆盖默认值，这是原项目就有的功能，不是部署变量；`API_TOKEN`、`WX_APPID` 等缺了会直接报 500，并说清缺的是哪一个。

## 四、测试方法

### 皮肤直接测试

在浏览器打开（把地址换成你自己的皮肤地址）：

```
https://你的皮肤地址/?title=CF三网优选&message=电信%201.2.3.4%0A联通%205.6.7.8&date=2026-11-13%2008:00:00
```

应看到白卡片、标题、时间和两行内容，点「复制内容」应提示「已复制」。

### 完整链路测试

1. 打开主脚本测试页：`https://你的主脚本域名/<API_TOKEN>`
2. 填标题和内容，点发送测试请求，应返回 200。
3. 微信里收到模板消息，点开应跳到新皮肤页面，而不是旧深色页面。

### 安全测试（可选）

用下面这个链接打开皮肤，页面应只显示文字，不应弹窗、不应加载图片：

```
https://你的皮肤地址/?title=<script>alert(1)</script>&message=<img%20src=x%20onerror=alert(2)>
```

## 五、注意事项

- `API_TOKEN`、`WX_SECRET` 是密钥，不要发到聊天记录、不要放进 GitHub 公开仓库。
- `WX_BASE_URL` 不要带 `?title=...` 这类参数，主脚本会自动在后面拼 `?message=...&date=...&title=...`。
- 皮肤 Worker 和主脚本 Worker 是两个独立部署，改皮肤不用重新部署主脚本，反之亦然。
- 模板消息本身只显示标题和内容两行，皮肤只影响「点开后看到的页面」，不影响微信里收到的那条消息。
- 如果点开还是旧皮肤，先确认 `WX_BASE_URL` 是否已改成新皮肤地址并已保存部署，再重新发一条测试消息（旧消息里的链接还是旧地址）。
