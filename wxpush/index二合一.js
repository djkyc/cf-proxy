// v1 二合一：原主程序（frankiejun/wxpush）+ KV 历史 3 天 + 清爽白皮肤（2026-11-13）
// 一个文件就是全部：/wxsend + /skin + /history + /health + 测试页 + 保活。
// 部署在阿里云中国站上，微信才能打开皮肤；不要部署在 Cloudflare 上（微信会拦截 CF 的皮肤页）。
// WX_BASE_URL 不设时默认用自己的 /skin。
// NEW: Helper function to extract parameters from any request type
async function getParams(request) {
  const { searchParams } = new URL(request.url);
  const urlParams = Object.fromEntries(searchParams.entries());

  let bodyParams = {};
  // Only try to parse a body if it's a POST/PUT/PATCH request
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    const contentType = (request.headers.get('content-type') || '').toLowerCase();
    try {
      if (contentType.includes('application/json')) {
        const jsonBody = await request.json();
        // jsonBody can be a string, an object, or other types
        if (typeof jsonBody === 'string') {
          // treat raw string as content
          bodyParams = { content: jsonBody };
        } else if (jsonBody && typeof jsonBody === 'object') {
          // support nested containers like { params: {...} } or { data: {...} }
          if (jsonBody.params && typeof jsonBody.params === 'object') {
            bodyParams = jsonBody.params;
          } else if (jsonBody.data && typeof jsonBody.data === 'object') {
            bodyParams = jsonBody.data;
          } else {
            bodyParams = jsonBody;
          }
        }
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        bodyParams = Object.fromEntries(formData.entries());
      } else {
        // Fallback: try to read raw text and parse as JSON, otherwise treat as raw content
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
      // Ignore body parsing errors and proceed with URL params
    }
  }

  // Merge params, giving body parameters precedence over URL parameters
  return { ...urlParams, ...bodyParams };
}


// 与独立皮肤 skin-clean.js 相同的转义函数：/skin 路由用，防 XSS。
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- KV 历史（3 天自动过期） ----------
function beijingNow() {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
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
      { expirationTtl: 259200 }, // 3 天
    );
  } catch (e) {
    console.error('Failed to save history to KV:', e);
  }
}

// ---------- KV 适配：Cloudflare 和阿里云 ESA 两种写法都能用 ----------
// Cloudflare：env.WX_HISTORY 是 KV 命名空间绑定（有 put/get/list）。
// 阿里云 ESA：没有 env 绑定这一说。先在 ESA 控制台建存储空间，
// 再用内置的 new EdgeKV({ namespace }) 读写；EdgeKV 只有 get/put/delete，
// 没有 list()，put 也没有 expirationTtl，所以下面用一个 __index__ 键
// 自己维护键列表，用 value 里带的过期时间自己实现 3 天过期。
// 你截图里把 WX_HISTORY 填成普通环境变量是错的：那只是一个字符串，
// 没有 .put 方法，历史写不进去（发消息不受影响，saveHistory 会兜底跳过）。
// 正确做法：删掉 WX_HISTORY 那个环境变量，在 ESA 控制台 > 边缘计算和 AI >
// KV 存储 > 创建存储空间，空间名称填 WX_HISTORY（或另设 KV_NAMESPACE 变量指定）。
let _kvCache = null;
function getKV(env) {
  if (_kvCache) return _kvCache;
  if (env.WX_HISTORY && typeof env.WX_HISTORY.put === 'function') {
    _kvCache = env.WX_HISTORY; // Cloudflare
    return _kvCache;
  }
  if (typeof EdgeKV !== 'undefined') {
    _kvCache = new EsaKV(env.KV_NAMESPACE || 'WX_HISTORY'); // 阿里云 ESA
    return _kvCache;
  }
  return null;
}
class EsaKV {
  constructor(namespace) { this.kv = new EdgeKV({ namespace }); }
  async _readIndex() {
    try {
      const raw = await this.kv.get('__index__', { type: 'text' });
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  async put(key, value, opts = {}) {
    const exp = opts.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : 0;
    await this.kv.put(key, JSON.stringify({ v: value, exp }));
    const idx = await this._readIndex();
    if (!idx.includes(key)) {
      idx.push(key);
      await this.kv.put('__index__', JSON.stringify(idx));
    }
  }
  async get(key) {
    const raw = await this.kv.get(key, { type: 'text' });
    if (raw == null) return null;
    try {
      const o = JSON.parse(raw);
      if (o && typeof o === 'object' && 'v' in o) {
        if (o.exp && Date.now() > o.exp) { try { await this.kv.delete(key); } catch {} return null; }
        return o.v;
      }
      return raw;
    } catch { return raw; }
  }
  async list(opts = {}) {
    const idx = await this._readIndex();
    const limit = opts.limit || 100;
    return { keys: idx.slice(-limit).map((name) => ({ name })) };
  }
  async delete(key) {
    try { await this.kv.delete(key); } catch {}
    const idx = (await this._readIndex()).filter((k) => k !== key);
    await this.kv.put('__index__', JSON.stringify(idx));
  }
}

export default {
  async fetch(request, arg2, arg3) {
    // Cloudflare: fetch(request, env, ctx)；阿里云 ESA: fetch(request, context, env)
    // 两家 env 的位置不一样：CF 在第 2 个参数，ESA 在第 3 个参数。
    // 之前按 CF 写法在 ESA 上拿到的 env 其实是 context，env.API_TOKEN 是 undefined，
    // 所以 /history、测试页、/wxsend 永远报 Invalid token。这里把第 2、3 个参数合并，
    // 带 API_TOKEN/WX_APPID 等键的那个就是真正的 env，两边都能用。
    const env = { ...(arg2 && typeof arg2 === 'object' ? arg2 : {}), ...(arg3 && typeof arg3 === 'object' ? arg3 : {}) };
    const ctx = arg3;
    const url = new URL(request.url);

    if (url.pathname === '/skin' || url.pathname === '/skin/') {
      // 清爽白皮肤（2026-11-13）：服务端先转义 title/message/date，
      // 前端再用 marked + DOMPurify 渲染 Markdown，与独立皮肤 skin-clean.js 同款。
      const skinTitle = (url.searchParams.get('title') || '消息推送').trim().slice(0, 120) || '消息推送';
      const skinMessage = (url.searchParams.get('message') || '无告警信息').slice(0, 10000) || '无告警信息';
      const skinDate = (url.searchParams.get('date') || '无时间信息').trim().slice(0, 64) || '无时间信息';
      const safeTitle = escapeHtml(skinTitle);
      const safeMessage = escapeHtml(skinMessage);
      const safeDate = escapeHtml(skinDate);
      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>${safeTitle}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #f3f5f4;
    --card: #ffffff;
    --text: #1f2937;
    --muted: #6b7280;
    --faint: #9ca3af;
    --line: #e8ebe9;
    --accent: #059669;
    --accent-soft: #ecfdf5;
    --accent-2: #0ea5e9;
    --code-bg: #f3f4f6;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    padding: 28px 16px 40px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .page { max-width: 660px; margin: 0 auto; }
  .card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 20px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, .04), 0 8px 24px rgba(15, 23, 42, .06);
    overflow: hidden;
  }
  .card::before {
    content: ""; display: block; height: 4px;
    background: linear-gradient(90deg, var(--accent), var(--accent-2));
  }
  .head { padding: 28px 28px 0; }
  .badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; letter-spacing: .08em; color: var(--accent);
    background: var(--accent-soft); border-radius: 999px; padding: 4px 10px;
    margin-bottom: 14px; font-weight: 600;
  }
  .badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  h1 {
    font-size: 22px; line-height: 1.45; font-weight: 700;
    letter-spacing: .01em; word-break: break-word;
  }
  .meta {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 14px 28px 18px; border-bottom: 1px solid var(--line);
    color: var(--muted); font-size: 13.5px; flex-wrap: wrap;
  }
  .meta .date { display: inline-flex; align-items: center; gap: 6px; }
  .meta svg { width: 15px; height: 15px; flex: none; }
  .copy {
    border: 1px solid var(--line); background: #fff; color: var(--text);
    border-radius: 999px; padding: 6px 12px; font-size: 13px; cursor: pointer;
    font-family: inherit;
  }
  .copy:active { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
  .body { padding: 22px 28px 28px; }
  .label { font-size: 12px; letter-spacing: .12em; color: var(--faint); margin-bottom: 10px; }
  .message {
    font-size: 16px; line-height: 1.85; word-break: break-word;
    white-space: pre-line;
  }
  .message h1, .message h2, .message h3 { line-height: 1.5; margin: .9em 0 .4em; font-size: 18px; }
  .message h2 { font-size: 17px; } .message h3 { font-size: 16px; }
  .message p { margin-bottom: .8em; }
  .message strong { font-weight: 700; }
  .message a { color: var(--accent); text-decoration: none; word-break: break-all; }
  .message a:hover { text-decoration: underline; }
  .message code {
    background: var(--code-bg); color: #0f766e; padding: 2px 6px;
    border-radius: 6px; font-size: .88em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .message pre {
    background: #111827; color: #f9fafb; padding: 14px 16px; border-radius: 12px;
    overflow-x: auto; margin: .8em 0; white-space: pre;
  }
  .message pre code { background: transparent; color: inherit; padding: 0; }
  .message blockquote {
    border-left: 3px solid var(--accent); margin: .8em 0; padding: 2px 0 2px 14px; color: var(--muted);
  }
  .message ul, .message ol { margin: .4em 0 .8em; padding-left: 1.4em; }
  .message li { margin-bottom: .35em; }
  .message table { width: 100%; border-collapse: collapse; margin: .8em 0; font-size: 14.5px; display: block; overflow-x: auto; }
  .message th, .message td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--line); }
  .message th { background: #f9fafb; font-weight: 600; }
  .message hr { border: 0; border-top: 1px solid var(--line); margin: 18px 0; }
  .foot { text-align: center; color: var(--faint); font-size: 12px; margin-top: 18px; }
  @media (max-width: 520px) {
    body { padding: 16px 12px 32px; }
    .head { padding: 22px 20px 0; } h1 { font-size: 20px; }
    .meta { padding: 12px 20px 16px; } .body { padding: 18px 20px 22px; }
    .message { font-size: 15.5px; }
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #101613; --card: #182019; --text: #e7edea; --muted: #9aa5a0;
      --faint: #6b756f; --line: #2a332d; --accent: #34d399; --accent-soft: #123527; --code-bg: #232d26;
    }
    .card { box-shadow: 0 8px 24px rgba(0, 0, 0, .3); }
    .copy { background: #1e2822; color: var(--text); }
    .message th { background: #1e2822; }
    .message pre { background: #0b0f0c; }
  }
</style>
</head>
<body>
  <div class="page">
    <article class="card">
      <div class="head">
        <span class="badge">微信消息推送</span>
        <h1 id="title">${safeTitle}</h1>
      </div>
      <div class="meta">
        <span class="date">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          <span id="date">${safeDate}</span>
        </span>
        <button class="copy" id="copyBtn" type="button">复制内容</button>
      </div>
      <div class="body">
        <div class="label">通知内容</div>
        <div class="message" id="message">${safeMessage}</div>
      </div>
    </article>
    <p class="foot">由 WXPush 推送</p>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.umd.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dompurify@3.2.4/dist/purify.min.js"></script>
  <script>
    (function () {
      var messageEl = document.getElementById('message');
      // Markdown 渲染：只有 marked 和 DOMPurify 都加载成功才转 HTML，
      // DOMPurify 会去掉 <script>、onerror 这类危险内容；CDN 挂了就保持纯文本照常显示。
      if (messageEl && window.marked && window.DOMPurify) {
        try {
          var raw = messageEl.textContent;
          var html = DOMPurify.sanitize(marked.parse(raw, { breaks: true, gfm: true }));
          messageEl.innerHTML = html;
          messageEl.style.whiteSpace = 'normal';
          messageEl.querySelectorAll('a').forEach(function (a) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
          });
        } catch (e) { /* 渲染失败就保留纯文本，不影响阅读 */ }
      }
      var btn = document.getElementById('copyBtn');
      if (btn && messageEl) {
        btn.addEventListener('click', function () {
          var text = messageEl.textContent || '';
          var done = function () { btn.textContent = '已复制'; setTimeout(function () { btn.textContent = '复制内容'; }, 2000); };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
          } else { fallbackCopy(text, done); }
          function fallbackCopy(t, cb) {
            var ta = document.createElement('textarea');
            ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); cb(); } catch (e) {}
            document.body.removeChild(ta);
          }
        });
      }
    })();
  </script>
</body>
</html>`;
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store',
        },
      });
    }
    // 历史查询：GET /history?token=xxx（或 Authorization 头），最近 20 条，新的在前
    if (url.pathname === '/history') {
      if (request.method !== 'GET') {
        return new Response(JSON.stringify({ msg: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
      }
      let ht = params_token(request);
      function params_token(req) {
        const u = new URL(req.url);
        let t = u.searchParams.get('token');
        if (!t) {
          const h = req.headers.get('Authorization') || req.headers.get('authorization');
          if (h) { const p = h.split(' '); t = p.length === 2 && /^Bearer$/i.test(p[0]) ? p[1] : h; }
        }
        return t;
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

    // If path is a single segment like '/<token>', serve an interactive test page
    // but ignore reserved paths like '/wxsend' and '/index.html'
    if (url.pathname === '/favicon.ico' || url.pathname === '/robots.txt') {
      return new Response('Not Found', { status: 404 });
    }
    const singleSeg = url.pathname.match(/^\/([^\/]+)\/?$/);
    if (singleSeg && singleSeg[1] && singleSeg[1] !== 'wxsend' && singleSeg[1] !== 'index.html' && singleSeg[1] !== 'history' && singleSeg[1] !== 'health') {
      const rawTokenFromPath = singleSeg[1];

      // 1. Authenticate the token first
      if (rawTokenFromPath !== env.API_TOKEN) {
        const responseBody = { msg: 'Invalid token' };
        return new Response(JSON.stringify(responseBody), {
          status: 403,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      // 2. Sanitize the token for safe embedding into HTML value attributes
      const sanitizedToken = rawTokenFromPath
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

      const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>WXPush 测试页面</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        background: linear-gradient(170deg, #f3e8ff 0%, #ffffff 100%);
        color: #1f2937;
        box-sizing: border-box;
      }
      .container {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 40px;
        max-width: 720px;
        width: 100%;
        text-align: left;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .container:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
        font-weight: 700;
        text-align: center;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .hint {
        color: #4b5563;
        margin: 0 0 24px;
        font-size: 16px;
        line-height: 1.6;
        text-align: center;
      }
      label {
        display: block;
        margin: 16px 0 8px;
        font-weight: 700;
        color: #374151;
      }
      input[type=text], textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #d4d4d8;
        border-radius: 12px;
        background: #f4f4f5;
        transition: all 0.2s ease;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 14px;
      }
      input[type=text]:focus, textarea:focus {
        outline: none;
        border-color: #8b5cf6;
        background: #ffffff;
        box-shadow: 0 0 0 2px #c4b5fd;
      }
      button {
        margin-top: 24px;
        padding: 12px 20px;
        border-radius: 12px;
        border: 0;
        background: #8b5cf6;
        color: #fff;
        cursor: pointer;
        font-weight: 700;
        transition: all 0.2s ease;
      }
      button:hover {
        background: #7c3aed;
        transform: translateY(-2px);
      }
      button#clearBtn {
         background: #f4f4f5;
         color: #374151;
         border: 1px solid #e4e4e7;
      }
       button#clearBtn:hover {
         background: #ffffff;
         border-color: #d4d4d8;
         color: #1f2937;
      }
      pre {
        background: #1f2937;
        color: #e5e7eb;
        padding: 16px;
        border-radius: 12px;
        white-space: pre-wrap;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>WXPush 测试页面</h1>
      <p class="hint">当前 token (来自路径)：<strong>${sanitizedToken}</strong></p>

      <form id="testForm" method="POST" action="/wxsend">

        <label for="title">标题 (title)</label>
        <input id="title" name="title" type="text" value="测试标题" />

        <label for="content">内容 (content)</label>
        <textarea id="content" name="content" rows="4">这是测试内容</textarea>

        <label for="userid">用户 ID (userid，可选，多用户用 | 分隔)</label>
        <input id="userid" name="userid" type="text" placeholder="例如: OPENID1|OPENID2" />

        <label for="appid">WX_APPID (可选，留空使用环境变量)</label>
        <input id="appid" name="appid" type="text" />

        <label for="secret">WX_SECRET (可选，留空使用环境变量)</label>
        <input id="secret" name="secret" type="password" autocomplete="off" />

        <label for="template_id">模板 ID (template_id，可选)</label>
        <input id="template_id" name="template_id" type="text" />

        <label for="base_url">跳转链接 base_url (可选)</label>
        <input id="base_url" name="base_url" type="text" />

        <input type="hidden" name="token" id="hiddenToken" value="${sanitizedToken}" />

        <div style="display:flex;gap:12px;align-items:center">
          <button id="sendBtn" type="submit">发送测试请求</button>
          <button type="button" id="clearBtn">清空</button>
        </div>
      </form>
      <div id="responseCard" style="display:none; margin-top: 20px;">
        <label for="responseArea">响应</label>
        <pre id="responseArea"></pre>
      </div>
    </div>

    <script>
      const form = document.getElementById('testForm');
      const sendBtn = document.getElementById('sendBtn');
      const clearBtn = document.getElementById('clearBtn');
      const responseArea = document.getElementById('responseArea');
      const responseCard = document.getElementById('responseCard');

      if (form && sendBtn && clearBtn && responseArea && responseCard) {
        clearBtn.addEventListener('click', () => {
          document.getElementById('title').value = '';
          document.getElementById('content').value = '';
          document.getElementById('userid').value = '';
          document.getElementById('appid').value = '';
          document.getElementById('secret').value = '';
          document.getElementById('template_id').value = '';
          document.getElementById('base_url').value = '';
          responseArea.textContent = '';
          responseCard.style.display = 'none';
        });

        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          sendBtn.disabled = true;
          const originalText = sendBtn.textContent;
          sendBtn.textContent = '发送中...';
          responseCard.style.display = 'none';

          const formData = new FormData(form);
          const payload = {};
          for (const [k, v] of formData.entries()) {
             if (k !== 'token' && v) {
                payload[k] = v;
             }
          }

          try {
            const headers = { 'Content-Type': 'application/json' };
            const token = document.getElementById('hiddenToken').value;
            if (token) headers['Authorization'] = token;

            const response = await fetch('/wxsend', { method: 'POST', headers, body: JSON.stringify(payload) });
            const responseText = await response.text();
            responseArea.textContent = 'Status: ' + response.status + '\\n\\n' + responseText;
            responseCard.style.display = 'block';
          } catch (err) {
            responseArea.textContent = 'Fetch error: ' + err.message;
            responseCard.style.display = 'block';
          } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = originalText;
          }
        });
      }
    </script>
  </body>
</html>`;

      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Route: only handle message sending on '/wxsend'
    if (url.pathname === '/wxsend') {
      // MODIFIED: Use the new helper function to get all parameters
      const params = await getParams(request);

      // MODIFIED: Read parameters from the unified 'params' object
      const content = params.content;
      const title = params.title;
      // token can come from body/url params or from Authorization header
      let requestToken = params.token;
      if (!requestToken) {
        const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
        if (authHeader) {
          // support formats: 'Bearer <token>' or raw token
          const parts = authHeader.split(' ');
          requestToken = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : authHeader;
        }
      }

      if (!content || !title || !requestToken) {
        const responseBody = { msg: 'Missing required parameters: content, title, token' };
        return new Response(JSON.stringify(responseBody), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      if (requestToken !== env.API_TOKEN) {
        const responseBody = { msg: 'Invalid token' };
        return new Response(JSON.stringify(responseBody), {
          status: 403,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      const appid = params.appid || env.WX_APPID;
      const secret = params.secret || env.WX_SECRET;
      const useridStr = params.userid || env.WX_USERID;
      const template_id = params.template_id || env.WX_TEMPLATE_ID;
      const base_url = params.base_url || env.WX_BASE_URL || `${url.origin}/skin`;

      if (!appid || !secret || !useridStr || !template_id) {
          const responseBody = { msg: 'Missing required environment variables: WX_APPID, WX_SECRET, WX_USERID, WX_TEMPLATE_ID' };
          return new Response(JSON.stringify(responseBody), {
            status: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          });
      }

      const user_list = useridStr.split('|').map(uid => uid.trim()).filter(Boolean);
      if (user_list.length === 0) {
          const responseBody = { msg: 'Missing required environment variables: WX_USERID is empty' };
          return new Response(JSON.stringify(responseBody), {
            status: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          });
      }

      try {
        const accessToken = await getStableToken(appid, secret);
        if (!accessToken) {
          const responseBody = { msg: 'Failed to get access token' };
          return new Response(JSON.stringify(responseBody), {
            status: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          });
        }

        const settled = await Promise.allSettled(user_list.map(userid =>
          sendMessage(accessToken, userid, template_id, base_url, title, content)
        ));
        const results = settled.map((st, i) => {
          if (st.status === 'fulfilled') {
            const r = st.value || {};
            return { userid: user_list[i], ok: r.errmsg === 'ok', errmsg: r.errmsg || 'Unknown' };
          }
          return { userid: user_list[i], ok: false, errmsg: String(st.reason?.message || st.reason || 'Unknown') };
        });

        const successfulMessages = results.filter(r => r.ok);
        await saveHistory(env, title, content, successfulMessages.length, results.length - successfulMessages.length, results.length);

        if (successfulMessages.length > 0) {
          const responseBody = { msg: `Successfully sent messages to ${successfulMessages.length} user(s). First response: ok`, sent: successfulMessages.length, failed: results.length - successfulMessages.length, total: results.length, results };
          return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          });
        } else {
          const firstError = results.length > 0 ? results[0].errmsg : "Unknown error";
          const responseBody = { msg: `Failed to send messages. First error: ${firstError}`, sent: 0, failed: results.length, total: results.length, results };
          return new Response(JSON.stringify(responseBody), {
            status: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          });
        }

      } catch (error) {
        console.error('Error:', error);
        const responseBody = { msg: `An error occurred: ${error.message}` };
        return new Response(JSON.stringify(responseBody), {
          status: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
    }


    // If not /wxsend, handle homepage or other paths
    // If request is a GET to root, serve a simple HTML homepage describing the service
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>WXPush — 微信消息推送服务</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: linear-gradient(170deg, #f3e8ff 0%, #ffffff 100%);
        color: #1f2937;
      }
      .card {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 40px;
        max-width: 720px;
        width: 90%;
        text-align: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .card:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
        font-weight: 700;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      p {
        color: #4b5563;
        margin: 0 0 24px;
        font-size: 16px;
        line-height: 1.6;
      }
      .author {
        margin: 20px 0;
        color: #374151;
        font-size: 14px;
      }
      .icons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 24px;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border-radius: 12px;
        text-decoration: none;
        color: #374151;
        background: #f4f4f5;
        border: 1px solid #e4e4e7;
        font-weight: 700;
        transition: all 0.2s ease;
      }
      .btn:hover {
        background: #ffffff;
        border-color: #d4d4d8;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .icon {
        width: 22px;
        height: 22px;
        display: inline-block;
      }
      footer {
        margin-top: 24px;
        color: #6b7280;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>WXPush</h1>
      <p>一个极简、可靠的微信消息推送服务，通过简单的 Webhook 请求，即可向微信用户发送模板消息。</p>
      <div class="author">作者：<strong>饭奇骏</strong></div>
      <div class="icons">
        <a class="btn" href="https://github.com/frankiejun" target="_blank" rel="noopener noreferrer">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.93 3.2 9.11 7.64 10.59.56.1.76-.24.76-.53 0-.26-.01-.95-.02-1.87-3.11.68-3.77-1.5-3.77-1.5-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1.0 1.72 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.53 0-1.22.44-2.21 1.16-2.99-.12-.28-.5-1.41.11-2.94 0 0 .95-.31 3.12 1.15.9-.25 1.86-.38 2.82-.39.96.01 1.92.14 2.82.39 2.17-1.46 3.12-1.15 3.12-1.15.61 1.53.23 2.66.11 2.94.72.78 1.16 1.77 1.16 2.99 0 4.3-2.62 5.25-5.11 5.53.4.35.75 1.04.75 2.09 0 1.51-.01 2.72-.01 3.09 0 .29.2.63.77.52C19.05 20.86 22.25 16.68 22.25 11.75 22.25 5.48 17.27.5 12 .5z"/></svg>
          GitHub
        </a>
        <a class="btn" href="https://www.youtube.com/@frankiejun8965" target="_blank" rel="noopener noreferrer">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M23.5 6.2s-.23-1.63-.94-2.34C21.55 3 19.9 3 19.12 2.9 16.54 2.6 12 2.6 12 2.6s-4.53 0-7.12.3C4.1 3 2.45 3.1 1.44 3.86.73 4.47.5 6.1.5 6.1S.25 8 .25 9.9v2.2c0 1.93.25 3.8.25 3.8s.23 1.63.94 2.34c.99.76 2.64.76 3.42.86 2.6.3 7.12.3 7.12.3s4.53 0 7.12-.3c.79-.1 2.44-.1 3.43-.86.7-.7.94-2.34.94-2.34s.25-1.9.25-3.8V9.9c0-1.9-.25-3.7-.25-3.7zM9.75 15.3V8.7l6.18 3.3-6.18 3.3z"/></svg>
          YouTube
        </a>
      </div>
      <footer>点击上方图标前往关注，以获取更多项目更新和演示。</footer>
    </div>
  </body>
</html>`;

      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // For any other path/method, return 404
    return new Response('Not Found', { status: 404 });
  },

  async scheduled(event, arg2, arg3) {
    // 与 fetch 一样：CF 是 (event, env, ctx)，ESA 是 (event, context, env)，合并后两边都能读到 env
    const env = { ...(arg2 && typeof arg2 === 'object' ? arg2 : {}), ...(arg3 && typeof arg3 === 'object' ? arg3 : {}) };
    const ctx = arg3;
    if (!env.ALIVE_DAYS) {
      return;
    }
    const aliveDays = Math.max(1, parseInt(env.ALIVE_DAYS, 10));
    if (Number.isNaN(aliveDays)) {
      return;
    }
    const anchor = Date.UTC(2026, 0, 1);
    const daysSince = Math.floor((Date.now() - anchor) / 86400000);

    if (daysSince % aliveDays !== 0) {
      return;
    }

    const appid = env.WX_APPID;
    const secret = env.WX_SECRET;
    const useridStr = env.WX_USERID;
    const template_id = env.WX_TEMPLATE_ID;
    const base_url = env.WX_BASE_URL;

    if (!appid || !secret || !useridStr || !template_id) {
      console.error('[alive] missing env: WX_APPID, WX_SECRET, WX_USERID, WX_TEMPLATE_ID');
      return;
    }

    try {
      const accessToken = await getStableToken(appid, secret);
      if (!accessToken) {
        console.error('[alive] failed to get access token (test account may be recycled)');
        return;
      }

      const user_list = useridStr.split('|').map(uid => uid.trim()).filter(Boolean);
      const settled = await Promise.allSettled(user_list.map(userid =>
        sendMessage(accessToken, userid, template_id, base_url, '保活测试', '测试账号保活心跳消息')
      ));
      const results = settled.map((st) => (st.status === 'fulfilled' ? (st.value || {}) : { errmsg: String(st.reason?.message || st.reason || 'Unknown') }));

      const failed = results.filter(r => r.errmsg !== 'ok');
      if (failed.length > 0) {
        console.error(`[alive] send failed for ${failed.length}/${results.length} user(s):`, JSON.stringify(failed));
      } else {
        console.log(`[alive] heartbeat sent to ${results.length} user(s)`);
      }
    } catch (error) {
      console.error('[alive] error:', error);
    }
  },
};

async function getStableToken(appid, secret) {
  const tokenUrl = 'https://api.weixin.qq.com/cgi-bin/stable_token';
  const payload = {
    grant_type: 'client_credential',
    appid: appid,
    secret: secret,
    force_refresh: false
  };
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!data.access_token) {
    console.error('getStableToken failed:', response.status, JSON.stringify(data));
    return null;
  }
  return data.access_token;
}

async function sendMessage(accessToken, userid, template_id, base_url, title, content) {
  const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;

  // Create a Date object for Beijing time (UTC+8) by adding 8 hours to the current UTC time
  const beijingTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  // Format the date to 'YYYY-MM-DD HH:MM:SS' string
  const date = beijingTime.toISOString().slice(0, 19).replace('T', ' ');

  const encoded_message = encodeURIComponent(content);
  const encoded_date = encodeURIComponent(date);

  // base_url 未设置时不要拼 url：之前会得到 "undefined?message=..." 的无效链接
  const separator = base_url?.includes('?') ? '&' : '?';
  const payload = {
    touser: userid,
    template_id: template_id,
    ...(base_url ? { url: `${base_url}${separator}message=${encoded_message}&date=${encoded_date}&title=${encodeURIComponent(title)}` } : {}),
    data: {
      title: { value: title },
      content: { value: content }
    }
  };

  const response = await fetch(sendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}
