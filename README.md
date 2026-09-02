# cf-proxy
cf works VLESS XHTTP 

---
````
这里为你扩展了 自动识别客户端（Base64 / Clash Meta / Sing-Box）以及 Web 仪表盘（带二维码生成与独立节点生成） 的功能。

新增功能亮点：
智能客户端识别 (User-Agent 自动分发)：

用 Shadowrocket / v2rayN / PassWall 导入订阅 -> 自动返回 Base64 格式。

用 Clash / Mihomo 导入订阅 -> 自动生成并返回完整的 Clash YAML 配置文件。

用 Sing-Box 导入订阅 -> 自动生成并返回 Sing-Box JSON 配置文件。

也可以在链接末尾添加 ?target=clash 或 ?target=singbox 强制指定格式。

可视化 Dashboard 页面：

浏览器访问 https://你的域名/你的UUID 进入管理面板。

包含一键复制各种客户端订阅地址。

动态生成二维码：支持手机端（如 小火箭/NekoBox）直接扫码添加订阅或单个节点。
````
---

<img width="513" height="663" alt="image" src="https://github.com/user-attachments/assets/acd2acc8-79ec-46a2-9240-38eaba3cb440" />
