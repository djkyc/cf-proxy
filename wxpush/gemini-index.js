// Helper function to extract parameters
async function getParams(request) {
    const { searchParams } = new URL(request.url);
    const urlParams = Object.fromEntries(searchParams.entries());
    let bodyParams = {};
    
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        const contentType = (request.headers.get('content-type') || '').toLowerCase();
        try {
            if (contentType.includes('application/json')) {
                const text = await request.text();
                if (text) {
                    const jsonBody = JSON.parse(text);
                    bodyParams = (typeof jsonBody === 'object') ? jsonBody : { content: jsonBody };
                }
            } else {
                const text = await request.text();
                bodyParams = { content: text };
            }
        } catch (e) {}
    }
    return { ...urlParams, ...bodyParams };
}

export default {
    // 智能自适应入口：同时完美兼容 ESA 与 Cloudflare 不同的参数顺序
    async fetch(request, arg2, arg3) {
        let env, ctx;
        // 自动识别当前运行环境
        if (arg3 && (arg3.API_TOKEN !== undefined || typeof arg3.fetch === 'function' || !arg2?.waitUntil)) {
            env = arg3; // 阿里云 ESA 环境
            ctx = arg2;
        } else {
            env = arg2; // Cloudflare 环境
            ctx = arg3;
        }

        const url = new URL(request.url);
        
        // 1. 终端皮肤页面 (/skin)
        if (url.pathname.includes('/skin')) {
            const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系统通知中心</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%); color: #f8fafc; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .terminal { width: 100%; max-width: 750px; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.7); overflow: hidden; }
        .terminal-header { background: rgba(30, 41, 59, 0.6); padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; }
        .terminal-buttons { display: flex; gap: 8px; }
        .terminal-button { width: 12px; height: 12px; border-radius: 50%; background: #ef4444; }
        .terminal-button:nth-child(2) { background: #f59e0b; }
        .terminal-button:nth-child(3) { background: #10b981; }
        .terminal-title { margin-left: 15px; color: #94a3b8; font-size: 13px; font-weight: 600; }
        .terminal-body { padding: 28px; }
        .info-card { background: rgba(30, 41, 59, 0.4); border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.06); border-left: 4px solid #8b5cf6; }
        .info-card:nth-child(2) { border-left-color: #3b82f6; }
        .info-card:nth-child(3) { border-left-color: #10b981; }
        .info-label { font-size: 0.85rem; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; font-weight: 700; }
        .info-content { font-size: 1.05rem; color: #e2e8f0; line-height: 1.6; white-space: pre-line; }
    </style>
</head>
<body>
    <div class="terminal">
        <div class="terminal-header">
            <div class="terminal-buttons"><div class="terminal-button"></div><div class="terminal-button"></div><div class="terminal-button"></div></div>
            <div class="terminal-title" id="windowTitle">系统通知中心</div>
        </div>
        <div class="terminal-body">
            <div class="info-card"><div class="info-label">通知标题</div><div class="info-content" id="title">无标题</div></div>
            <div class="info-card"><div class="info-label">通知内容</div><div class="info-content" id="message">无告警信息</div></div>
            <div class="info-card"><div class="info-label">时间</div><div class="info-content" id="date">无时间信息</div></div>
        </div>
    </div>
    <script>
        const p = new URLSearchParams(window.location.search);
        document.getElementById('windowTitle').textContent = p.get('title') || '系统通知中心';
        document.getElementById('title').textContent = p.get('title') || '无标题';
        document.getElementById('message').textContent = p.get('message') || '无告警信息';
        document.getElementById('date').textContent = p.get('date') || '无时间信息';
    </script>
</body>
</html>`;
            return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        // 2. Token 测试后台页面 (/sb123)
        const singleSeg = url.pathname.match(/^\/([^\/]+)\/?$/);
        if (singleSeg && singleSeg[1] && singleSeg[1] !== 'wxsend' && singleSeg[1] !== 'index.html') {
            const token = singleSeg[1];
            if (token !== env.API_TOKEN) {
                return new Response(JSON.stringify({ msg: 'Invalid token' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
            const html = `<!doctype html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>WXPush 测试控制台</title>
    <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%); padding: 24px; box-sizing: border-box; }
        .container { background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); border-radius: 24px; padding: 40px; max-width: 720px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        h1 { margin: 0 0 12px; font-size: 28px; text-align: center; color: #7c3aed; }
        label { display: block; margin: 16px 0 8px; font-weight: 700; color: #374151; }
        input, textarea { width: 100%; padding: 12px; border: 1px solid #d4d4d8; border-radius: 12px; box-sizing: border-box; font-size: 14px; }
        button { margin-top: 24px; width: 100%; padding: 14px; border-radius: 12px; border: 0; background: #8b5cf6; color: #fff; font-weight: 700; cursor: pointer; font-size: 16px; }
        pre { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 12px; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <h1>WXPush 测试控制台</h1>
        <form id="f">
            <label>通知标题</label>
            <input name="title" type="text" value="系统终端告警" />
            <label>通知内容</label>
            <textarea name="content" rows="4">CPU 负载正常，服务运行中。</textarea>
            <button type="submit">立即发送测试请求</button>
        </form>
        <div id="resCard" style="display:none; margin-top: 20px;">
            <label>接口返回响应</label>
            <pre id="resArea"></pre>
        </div>
    </div>
    <script>
        document.getElementById('f').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const res = await fetch('/wxsend', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': '${token}' }, body: JSON.stringify(Object.fromEntries(fd)) });
            document.getElementById('resArea').textContent = await res.text();
            document.getElementById('resCard').style.display = 'block';
        });
    </script>
</body>
</html>`;
            return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        // 3. 微信发信核心接口 (/wxsend) - 带有 5 秒自动超时与连接断开保护
        if (url.pathname === '/wxsend') {
            const params = await getParams(request);
            const { content, title } = params;
            let token = params.token || request.headers.get('Authorization') || request.headers.get('authorization');
            if (token && token.startsWith('Bearer ')) token = token.split(' ')[1];

            if (!content || !title || !token) {
                return new Response(JSON.stringify({ msg: 'Missing required parameters: content, title, token' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
            if (token !== env.API_TOKEN) {
                return new Response(JSON.stringify({ msg: 'Invalid token' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }

            const { WX_APPID: appid, WX_SECRET: secret, WX_USERID: useridStr, WX_TEMPLATE_ID: template_id, WX_BASE_URL: base_url } = env;
            if (!appid || !secret || !useridStr || !template_id) {
                return new Response(JSON.stringify({ msg: 'Missing required environment variables' }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }

            try {
                // 5 秒超时保护机制
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const tokenRes = await fetch('https://api.weixin.qq.com/cgi-bin/stable_token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json;charset=utf-8' },
                    body: JSON.stringify({ grant_type: 'client_credential', appid, secret, force_refresh: false }),
                    signal: controller.signal
                });
                const tokenData = await tokenRes.json();
                clearTimeout(timeoutId);

                if (!tokenData.access_token) {
                    return new Response(JSON.stringify({ msg: 'Failed to get WeChat access token', detail: tokenData }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
                }

                const beijingTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
                const sep = base_url?.includes('?') ? '&' : '?';
                const userList = useridStr.split('|').map(u => u.trim()).filter(Boolean);

                const results = await Promise.all(userList.map(async (touser) => {
                    const sendCtrl = new AbortController();
                    const sendTimeout = setTimeout(() => sendCtrl.abort(), 5000);
                    try {
                        const sendRes = await fetch(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${tokenData.access_token}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                            body: JSON.stringify({
                                touser,
                                template_id,
                                url: `${base_url}${sep}message=${encodeURIComponent(content)}&date=${encodeURIComponent(beijingTime)}&title=${encodeURIComponent(title)}`,
                                data: { title: { value: title }, content: { value: content } }
                            }),
                            signal: sendCtrl.signal
                        });
                        clearTimeout(sendTimeout);
                        return await sendRes.json();
                    } catch (err) {
                        clearTimeout(sendTimeout);
                        return { errcode: -1, errmsg: 'Request timeout or aborted' };
                    }
                }));

                return new Response(JSON.stringify({ msg: 'Success', results }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            } catch (err) {
                return new Response(JSON.stringify({ msg: 'Error', error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
        }

        return new Response('WXPush Service Running (Universal Smart Mode)', { status: 200 });
    }
};
