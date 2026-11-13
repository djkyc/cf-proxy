// Gemini 生成版改版：亮色皮肤 + ESA 兼容（2026-11-13）
// 改动说明：
// 1. 皮肤由黑客终端黑绿改成亮色清爽白（白卡片、翡翠绿点缀、系统字体），与清爽白皮肤同款风格。
// 2. ESA 兼容：ESA 的 fetch 是 fetch(request, context, env)，env 在第 3 个参数；
//    Cloudflare 是 fetch(request, env, ctx)，env 在第 2 个参数。这里把第 2、3 个参数合并，
//    两边都能读到 API_TOKEN。之前按 CF 写法在 ESA 上 env.API_TOKEN 是 undefined，
//    /history、测试页、/wxsend 永远报 Invalid token。scheduled 也同样处理。
// 3. /skin 由 includes 改成精确匹配，/skinXYZ 不再误命中。
// 4. base_url 未设置时不再拼出 undefined?message=... 的无效链接，改为不发 url 字段。
// 5. KV 历史改为只在至少一人发送成功后写（之前是发送前就写，失败的消息也进了历史），
//    时间改成北京时间；ESA 上用 EdgeKV（__index__ 列表 + value 内过期时间，3 天），CF 上用 env 绑定。
// 6. 新增 GET /history（token 鉴权，最近 20 条）和 GET /health（kv:true 表示 KV 通了）。
// 7. getStableToken 加 10 秒超时，拿不到 token 时打微信返回的原样错误到日志。
// 8. ALIVE_DAYS 不是数字时不再静默保活，改为直接返回不保活。
// 部署：二合一放阿里云 ESA（皮肤在 /skin，WX_BASE_URL 填 https://你的域名/skin）；
//      也可以放 Cloudflare，但皮肤在 CF 上微信会拦截，正式用建议放阿里云。

// Helper function to extract parameters from any request type
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
                    if (typeof jsonBody === 'string') {
                        bodyParams = { content: jsonBody };
                    } else if (jsonBody && typeof jsonBody === 'object') {
                        if (jsonBody.params && typeof jsonBody.params === 'object') {
                            bodyParams = jsonBody.params;
                        } else if (jsonBody.data && typeof jsonBody.data === 'object') {
                            bodyParams = jsonBody.data;
                        } else {
                            bodyParams = jsonBody;
                        }
                    }
                }
            } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
                const formData = await request.formData();
                bodyParams = Object.fromEntries(formData.entries());
            } else {
                const text = await request.text();
                if (text) {
                    try {
                        const parsed = JSON.parse(text);
                        if (parsed && typeof parsed === 'object') {
                            if (parsed.params && typeof parsed.params === 'object') {
                                bodyParams = parsed.params;
                            } else if (parsed.data && typeof parsed.data === 'object') {
                                bodyParams = parsed.data;
                            } else {
                                bodyParams = parsed;
                            }
                        } else {
                            bodyParams = { content: text };
                        }
                    } catch (e) {
                        bodyParams = { content: text };
                    }
                }
            }
        } catch (error) {
            console.error('Failed to parse request body:', error);
        }
    }
    return { ...urlParams, ...bodyParams };
}

// ---------- KV 历史（3 天自动过期，CF + ESA 双兼容） ----------
function beijingNow() {
    const parts = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

function getKV(env) {
    // Cloudflare：env.WX_HISTORY 是 KV 绑定（有 .put 方法）
    if (env.WX_HISTORY && typeof env.WX_HISTORY.put === 'function') return env.WX_HISTORY;
    // 阿里云 ESA：没有 env 绑定，用全局 EdgeKV，空间名默认 WX_HISTORY
    // 注意：不要把 WX_HISTORY 填成环境变量字符串，那样没有 .put 方法，历史写不进去。
    if (typeof EdgeKV !== 'undefined') return new EsaKV(env.KV_NAMESPACE || 'WX_HISTORY');
    return null;
}

// ESA 的 EdgeKV 只有 get/put/delete，没有 list()，也没有 expirationTtl。
// 用 __index__ 键存所有消息 key 的列表，用 value 里的过期时间实现 3 天过期。
class EsaKV {
    constructor(namespace) { this.kv = new EdgeKV({ namespace }); }
    async list() {
        const raw = await this.kv.get('__index__');
        let keys = [];
        try { keys = raw ? JSON.parse(raw) : []; } catch { keys = []; }
        return { keys: keys.map((name) => ({ name })) };
    }
    async get(key) {
        const raw = await this.kv.get(key);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.__esa_exp && Date.now() > parsed.__esa_exp) {
                await this.kv.delete(key).catch(() => {});
                return null;
            }
            return parsed && parsed.__esa_wrapped ? parsed.value : raw;
        } catch { return raw; }
    }
    async put(key, value, opts) {
        const ttl = (opts && opts.expirationTtl) || 259200;
        const wrapped = JSON.stringify({ __esa_wrapped: true, __esa_exp: Date.now() + ttl * 1000, value });
        await this.kv.put(key, wrapped);
        const raw = await this.kv.get('__index__');
        let keys = [];
        try { keys = raw ? JSON.parse(raw) : []; } catch { keys = []; }
        if (!keys.includes(key)) {
            keys.push(key);
            await this.kv.put('__index__', JSON.stringify(keys.slice(-100)));
        }
    }
}

function newHistoryId() {
    const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 7);
    return 'msg_' + Date.now() + '_' + rand;
}

async function saveHistory(env, title, content, sent, failed, total) {
    // 只有至少一人成功才写；失败的消息不进历史。没绑 KV 也能正常发消息。
    const kv = getKV(env);
    if (!kv || sent <= 0) return;
    try {
        await kv.put(
            newHistoryId(),
            JSON.stringify({ title, content, date: beijingNow(), sent, failed, total }),
            { expirationTtl: 259200 } // 3 天
        );
    } catch (e) {
        console.error('Failed to save history to KV:', e);
    }
}

// CF 与 ESA 的 env 位置不一样，统一在这里合并：
// Cloudflare fetch(request, env, ctx) / scheduled(event, env, ctx)
// 阿里云 ESA fetch(request, context, env) / scheduled(event, context, env)
function resolveEnv(arg2, arg3) {
    return { ...(arg2 && typeof arg2 === 'object' ? arg2 : {}), ...(arg3 && typeof arg3 === 'object' ? arg3 : {}) };
}

export default {
    async fetch(request, arg2, arg3) {
        const env = resolveEnv(arg2, arg3);
        const url = new URL(request.url);

        // 1. 亮色皮肤页面 (/skin) —— 清爽白风格
        if (url.pathname === '/skin' || url.pathname === '/skin/') {
            const html = `<!DOCTYPE html>
<html lang="zh-CN" dir="ltr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>消息推送</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
            background: #f5f7fa; color: #1f2937; min-height: 100vh;
            display: flex; justify-content: center; align-items: flex-start; padding: 24px 16px;
        }
        .card {
            width: 100%; max-width: 660px; background: #ffffff;
            border: 1px solid #e5e7eb; border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); overflow: hidden;
        }
        .card-header {
            padding: 20px 24px 0; display: flex; align-items: center; gap: 10px;
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: #059669; flex-shrink: 0; }
        .card-header h1 { font-size: 18px; font-weight: 700; color: #111827; word-break: break-word; }
        .card-body { padding: 16px 24px 24px; }
        .info-label { font-size: 13px; color: #6b7280; margin: 16px 0 6px; }
        .info-content { font-size: 16px; color: #1f2937; line-height: 1.7; word-break: break-word; white-space: pre-line; }
        .date-row { margin-top: 20px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 13px; color: #9ca3af; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .copy-btn {
            border: 1px solid #d1fae5; background: #ecfdf5; color: #059669;
            border-radius: 999px; padding: 6px 14px; font-size: 13px; cursor: pointer; flex-shrink: 0;
        }
        .copy-btn:active { background: #d1fae5; }
        @media (prefers-color-scheme: dark) {
            body { background: #111827; color: #f3f4f6; }
            .card { background: #1f2937; border-color: #374151; }
            .card-header h1 { color: #f9fafb; }
            .info-content { color: #e5e7eb; }
            .date-row { border-top-color: #374151; }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="card-header">
            <span class="dot"></span>
            <h1 id="title">消息推送</h1>
        </div>
        <div class="card-body">
            <div class="info-label">通知内容</div>
            <div class="info-content" id="message">无告警信息</div>
            <div class="date-row">
                <span id="date">无时间信息</span>
                <button class="copy-btn" id="copyBtn" type="button">复制内容</button>
            </div>
        </div>
    </div>

    <script>
        function getUrlParams() {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                title: urlParams.get('title') || '消息推送',
                message: urlParams.get('message') || '无告警信息',
                date: urlParams.get('date') || '无时间信息'
            };
        }

        function fillContent() {
            const params = getUrlParams();
            // textContent 赋值，不解析 HTML，消息里的 <script> 只会当文字显示
            document.title = params.title;
            document.getElementById('title').textContent = params.title;
            document.getElementById('message').textContent = params.message;
            document.getElementById('date').textContent = params.date;
        }

        document.getElementById('copyBtn').addEventListener('click', async function() {
            const text = document.getElementById('message').textContent;
            try {
                await navigator.clipboard.writeText(text);
                this.textContent = '已复制';
            } catch (e) {
                const ta = document.createElement('textarea');
                ta.value = text; document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); this.textContent = '已复制'; } catch (err) { this.textContent = '复制失败'; }
                document.body.removeChild(ta);
            }
            const btn = this;
            setTimeout(function() { btn.textContent = '复制内容'; }, 2000);
        });

        window.onload = function() {
            fillContent();
        };
    </script>
</body>
</html>`;
            return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
        }

        // 历史查询：GET /history?token=xxx（或 Authorization 头），最近 20 条，新的在前
        if (url.pathname === '/history') {
            if (request.method !== 'GET') {
                return new Response(JSON.stringify({ msg: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
            let ht = url.searchParams.get('token');
            if (!ht) {
                const h = request.headers.get('Authorization') || request.headers.get('authorization');
                if (h) { const p = h.split(' '); ht = p.length === 2 && /^Bearer$/i.test(p[0]) ? p[1] : h; }
            }
            if (ht !== env.API_TOKEN) {
                return new Response(JSON.stringify({ msg: 'Invalid token' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
            const kv = getKV(env);
            if (!kv) {
                return new Response(JSON.stringify({ msg: 'KV is not bound: create a namespace in ESA console (KV Storage) or bind WX_HISTORY in Cloudflare' }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
            try {
                const listed = await kv.list({ limit: 100 });
                const keys = listed.keys.map((k) => k.name).sort().reverse().slice(0, 20);
                const items = [];
                for (const key of keys) {
                    const raw = await kv.get(key);
                    if (!raw) continue;
                    try { items.push({ id: key, ...JSON.parse(raw) }); } catch { items.push({ id: key, raw }); }
                }
                return new Response(JSON.stringify({ count: items.length, items }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            } catch (e) {
                console.error('Failed to read history from KV:', e);
                return new Response(JSON.stringify({ msg: `Failed to read history: ${e.message}` }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
        }

        // 健康检查：判断部署的是不是这个版本
        if (url.pathname === '/health') {
            const body = { status: 'ok', kv: Boolean(getKV(env)), time: beijingNow() };
            return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
        }

        if (url.pathname === '/favicon.ico' || url.pathname === '/robots.txt') {
            return new Response('Not Found', { status: 404 });
        }

        // 2. Token 测试后台页面（例如 /sb123）
        const singleSeg = url.pathname.match(/^\/([^\/]+)\/?$/);
        if (singleSeg && singleSeg[1] && singleSeg[1] !== 'wxsend' && singleSeg[1] !== 'index.html' && singleSeg[1] !== 'history' && singleSeg[1] !== 'health') {
            const rawTokenFromPath = singleSeg[1];
            if (rawTokenFromPath !== env.API_TOKEN) {
                return new Response(JSON.stringify({ msg: 'Invalid token' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
            const sanitizedToken = rawTokenFromPath.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

            const html = `<!doctype html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>WXPush 测试页面</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; background: linear-gradient(170deg, #f3e8ff 0%, #ffffff 100%); color: #1f2937; box-sizing: border-box; }
        .container { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(10px); border-radius: 24px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); padding: 40px; max-width: 720px; width: 100%; text-align: left; }
        h1 { margin: 0 0 12px; font-size: 28px; text-align: center; background: linear-gradient(90deg, #8b5cf6, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hint { color: #4b5563; margin: 0 0 24px; font-size: 14px; text-align: center; }
        label { display: block; margin: 16px 0 8px; font-weight: 700; color: #374151; }
        input[type=text], textarea { width: 100%; padding: 12px; border: 1px solid #d4d4d8; border-radius: 12px; background: #f4f4f5; box-sizing: border-box; font-size: 14px; }
        input:focus, textarea:focus { outline: none; border-color: #8b5cf6; background: #fff; }
        button { margin-top: 24px; padding: 12px 20px; border-radius: 12px; border: 0; background: #8b5cf6; color: #fff; cursor: pointer; font-weight: 700; }
        button:hover { background: #7c3aed; }
        pre { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 12px; white-space: pre-wrap; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <h1>WXPush 测试页面</h1>
        <p class="hint">当前 Token：<strong>${sanitizedToken}</strong></p>
        <form id="testForm" method="POST" action="/wxsend">
            <label for="title">标题 (title)</label>
            <input id="title" name="title" type="text" value="系统终端告警" />
            <label for="content">内容 (content)</label>
            <textarea id="content" name="content" rows="4">Root 登录检测：CPU 负载正常，服务运行中。</textarea>
            <input type="hidden" name="token" id="hiddenToken" value="${sanitizedToken}" />
            <button id="sendBtn" type="submit">发送测试请求</button>
        </form>
        <div id="responseCard" style="display:none; margin-top: 20px;">
            <label>响应</label>
            <pre id="responseArea"></pre>
        </div>
    </div>
    <script>
        const form = document.getElementById('testForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const payload = {};
            for (const [k, v] of formData.entries()) { if (k !== 'token' && v) payload[k] = v; }
            const response = await fetch('/wxsend', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': document.getElementById('hiddenToken').value }, body: JSON.stringify(payload) });
            document.getElementById('responseArea').textContent = await response.text();
            document.getElementById('responseCard').style.display = 'block';
        });
    </script>
</body>
</html>`;
            return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        // 3. 核心接口：发送微信模板消息 (/wxsend)
        if (url.pathname === '/wxsend') {
            const params = await getParams(request);
            const content = params.content;
            const title = params.title;
            let requestToken = params.token;
            if (!requestToken) {
                const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
                if (authHeader) {
                    const parts = authHeader.split(' ');
                    requestToken = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : authHeader;
                }
            }

            if (!content || !title || !requestToken) {
                return new Response(JSON.stringify({ msg: 'Missing required parameters: content, title, token' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
            if (requestToken !== env.API_TOKEN) {
                return new Response(JSON.stringify({ msg: 'Invalid token' }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }

            const appid = params.appid || env.WX_APPID;
            const secret = params.secret || env.WX_SECRET;
            const useridStr = params.userid || env.WX_USERID;
            const template_id = params.template_id || env.WX_TEMPLATE_ID;
            const base_url = params.base_url || env.WX_BASE_URL;

            if (!appid || !secret || !useridStr || !template_id) {
                return new Response(JSON.stringify({ msg: 'Missing required environment variables' }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }

            const user_list = useridStr.split('|').map(uid => uid.trim()).filter(Boolean);
            try {
                const accessToken = await getStableToken(appid, secret);
                if (!accessToken) {
                    return new Response(JSON.stringify({ msg: 'Failed to get access token' }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
                }

                const results = await Promise.allSettled(user_list.map(userid => sendMessage(accessToken, userid, template_id, base_url, title, content)));
                const settled = results.map(r => r.status === 'fulfilled' ? r.value : { errmsg: r.reason?.message || 'Unknown error' });
                const successfulMessages = settled.filter(r => r.errmsg === 'ok');

                // 只有至少一人成功才写历史，失败的消息不进历史
                await saveHistory(env, title, content, successfulMessages.length, settled.length - successfulMessages.length, settled.length);

                if (successfulMessages.length > 0) {
                    return new Response(JSON.stringify({ msg: `Successfully sent messages to ${successfulMessages.length} user(s).`, sent: successfulMessages.length, failed: settled.length - successfulMessages.length, total: settled.length }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
                } else {
                    return new Response(JSON.stringify({ msg: `Failed to send messages. First error: ${settled[0]?.errmsg || 'Unknown'}` }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
                }
            } catch (error) {
                return new Response(JSON.stringify({ msg: `An error occurred: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            }
        }

        // 4. 默认主页
        if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
            return new Response('WXPush 微信消息推送服务运行中 (Light Skin Loaded)', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }

        return new Response('Not Found', { status: 404 });
    },

    // 定时保活任务
    async scheduled(event, arg2, arg3) {
        const env = resolveEnv(arg2, arg3);
        if (!env.ALIVE_DAYS) return;
        const aliveDays = parseInt(env.ALIVE_DAYS, 10);
        if (!Number.isFinite(aliveDays) || aliveDays < 1) return;
        const anchor = Date.UTC(2026, 0, 1);
        const daysSince = Math.floor((Date.now() - anchor) / 86400000);
        if (daysSince % aliveDays !== 0) return;

        const { WX_APPID: appid, WX_SECRET: secret, WX_USERID: useridStr, WX_TEMPLATE_ID: template_id, WX_BASE_URL: base_url } = env;
        if (!appid || !secret || !useridStr || !template_id) return;

        try {
            const accessToken = await getStableToken(appid, secret);
            if (!accessToken) return;
            const user_list = useridStr.split('|').map(uid => uid.trim()).filter(Boolean);
            await Promise.allSettled(user_list.map(userid => sendMessage(accessToken, userid, template_id, base_url, '保活测试', '测试账号保活心跳消息')));
        } catch (error) {
            console.error('[alive] error:', error);
        }
    }
};

async function getStableToken(appid, secret) {
    const tokenUrl = 'https://api.weixin.qq.com/cgi-bin/stable_token';
    let response;
    try {
        response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify({ grant_type: 'client_credential', appid, secret, force_refresh: false }),
            signal: AbortSignal.timeout(10000),
        });
    } catch (e) {
        console.error('Failed to get access token (fetch error):', e.message);
        return null;
    }
    let data;
    try { data = await response.json(); } catch (e) { console.error('Failed to parse token response:', e.message); return null; }
    if (!data.access_token) console.error('Failed to get access token, WeChat response:', JSON.stringify(data));
    return data.access_token || null;
}

async function sendMessage(accessToken, userid, template_id, base_url, title, content) {
    const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    const date = beijingNow();
    const separator = base_url?.includes('?') ? '&' : '?';

    const payload = {
        touser: userid,
        template_id: template_id,
        // base_url 未设置时不要拼 url：之前会得到 "undefined?message=..." 的无效链接
        ...(base_url ? { url: `${base_url}${separator}message=${encodeURIComponent(content)}&date=${encodeURIComponent(date)}&title=${encodeURIComponent(title)}` } : {}),
        data: {
            title: { value: title },
            content: { value: content }
        }
    };

    const response = await fetch(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
    });
    return await response.json();
}
