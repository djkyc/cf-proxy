// v2 分开版皮肤：清爽 · 白 — WXPush 皮肤
// 部署在阿里云中国站上；主程序（v2-分开/main.js，在 Cloudflare）的 WX_BASE_URL 指向本文件地址。
// 替换原「静谧的夜空」皮肤：浅色、干净、手机微信内打开也舒服
// 部署：新建一个 Worker，把本文件完整粘贴进去，保存部署即可
// 入口参数与原版完全一致：?title=标题&message=内容&date=时间
// 主脚本 WX_BASE_URL 改成这个 Worker 的地址（不要带 ? 参数），
// 模板消息点开就会跳到这个新皮肤；主脚本自带的 /skin 还是旧深色，
// 只有 WX_BASE_URL 指过来才会用新皮肤。

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const title = (url.searchParams.get('title') || '消息推送').trim().slice(0, 120) || '消息推送';
    const message = (url.searchParams.get('message') || '无告警信息').slice(0, 10000) || '无告警信息';
    const date = (url.searchParams.get('date') || '无时间信息').trim().slice(0, 64) || '无时间信息';

    // 服务端先转义：标题/内容/时间里就算带 <script>、<img onerror> 也只会当文字显示，
    // 不会在微信内置浏览器里执行。前端再用 marked + DOMPurify 渲染 Markdown，双重保险。
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(message);
    const safeDate = escapeHtml(date);

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
  },
};
