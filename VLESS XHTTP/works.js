import { connect } from 'cloudflare:sockets';

const yourUUID = '4bcd2896-8b29-4e11-b6ec-d038af37e400'; // 你的 UUID
const proxyIP = 'ProxyIP.HK.CMLiussss.net';               // 备用 ProxyIP

// 优选节点/域名列表
const cfipList = [ 
    'mfa.gov.ua', 'saas.sin.fan', 'store.ubi.com', 'cf.130519.xyz', 
    'cf.008500.xyz', 'cf.090227.xyz', 'www.visa.cn', 'cdns.doon.eu.org'
]; 

const ADDRESS_TYPE_IPV4 = 1, ADDRESS_TYPE_URL = 2, ADDRESS_TYPE_IPV6 = 3;

function parse_uuid(uuid) {
    uuid = uuid.replaceAll('-', '');
    const r = [];
    for (let i = 0; i < 16; i++) r.push(parseInt(uuid.substr(i * 2, 2), 16));
    return r;
}

function validate_uuid(id, uuid) {
    for (let i = 0; i < 16; i++) if (id[i] !== uuid[i]) return false;
    return true;
}

async function readBytes(reader, existingBuffer, minBytes) {
    let buf = existingBuffer || new Uint8Array(0);
    while (buf.length < minBytes) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value && value.length > 0) {
            const newBuf = new Uint8Array(buf.length + value.length);
            newBuf.set(buf, 0);
            newBuf.set(value, buf.length);
            buf = newBuf;
        }
    }
    return buf;
}

async function read_header(readable, uuid_str) {
    const reader = readable.getReader();
    try {
        let cache = await readBytes(reader, new Uint8Array(0), 18);
        if (cache.length < 18) { reader.releaseLock(); return null; }

        const version = cache[0];
        const id = cache.slice(1, 17);
        const uuid = parse_uuid(uuid_str);
        if (!validate_uuid(id, uuid)) { reader.releaseLock(); return null; }

        const pb_len = cache[17];
        const addr_plus1 = 1 + 16 + 1 + pb_len + 1 + 2 + 1;

        cache = await readBytes(reader, cache, addr_plus1);
        if (cache.length < addr_plus1) { reader.releaseLock(); return null; }

        const cmd = cache[1 + 16 + 1 + pb_len];
        if (cmd !== 1) { reader.releaseLock(); return null; }

        const port = (cache[addr_plus1 - 3] << 8) + cache[addr_plus1 - 2];
        const atype = cache[addr_plus1 - 1];

        let header_len = -1;
        if (atype === ADDRESS_TYPE_IPV4) {
            header_len = addr_plus1 + 4;
        } else if (atype === ADDRESS_TYPE_IPV6) {
            header_len = addr_plus1 + 16;
        } else if (atype === ADDRESS_TYPE_URL) {
            cache = await readBytes(reader, cache, addr_plus1 + 1);
            if (cache.length < addr_plus1 + 1) { reader.releaseLock(); return null; }
            const domainLen = cache[addr_plus1];
            header_len = addr_plus1 + 1 + domainLen;
        }

        if (header_len < 0) { reader.releaseLock(); return null; }

        cache = await readBytes(reader, cache, header_len);
        if (cache.length < header_len) { reader.releaseLock(); return null; }

        let hostname = '';
        const idx = addr_plus1;
        if (atype === ADDRESS_TYPE_IPV4) {
            hostname = cache.slice(idx, idx + 4).join('.');
        } else if (atype === ADDRESS_TYPE_URL) {
            const domainLen = cache[idx];
            hostname = new TextDecoder().decode(cache.slice(idx + 1, idx + 1 + domainLen));
        } else if (atype === ADDRESS_TYPE_IPV6) {
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(((cache[idx + i * 2] << 8) + cache[idx + i * 2 + 1]).toString(16));
            }
            hostname = ipv6.join(':');
        }

        if (!hostname) { reader.releaseLock(); return null; }

        const data = cache.slice(header_len);
        return { hostname, port, data, resp: new Uint8Array([version, 0]), reader };
    } catch (e) {
        try { reader.releaseLock(); } catch (_) { }
        throw e;
    }
}

async function connect_to_remote(httpx, fallbackProxy) {
    try {
        const remote = connect({ hostname: httpx.hostname, port: httpx.port });
        await Promise.race([
            remote.opened,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Direct timeout')), 3000))
        ]);
        return remote;
    } catch (e) {
        if (fallbackProxy && fallbackProxy !== httpx.hostname) {
            try {
                const remote = connect({ hostname: fallbackProxy, port: httpx.port });
                await Promise.race([
                    remote.opened,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Proxy timeout')), 3000))
                ]);
                return remote;
            } catch (_) {}
        }
    }
    return null;
}

async function handle_post(request, cfg) {
    const httpx = await read_header(request.body, cfg.UUID);
    if (!httpx) return null;

    const remote = await connect_to_remote(httpx, cfg.PROXYIP);
    if (!remote) {
        try { httpx.reader.releaseLock(); } catch (_) {}
        return null;
    }

    (async () => {
        let writer = null;
        try {
            writer = remote.writable.getWriter();
            if (httpx.data && httpx.data.length > 0) {
                await writer.write(httpx.data);
            }
            while (true) {
                const { value, done } = await httpx.reader.read();
                if (done) break;
                await writer.write(value);
            }
        } catch (_) {
        } finally {
            try { httpx.reader.releaseLock(); } catch (_) {}
            if (writer) {
                try { await writer.close(); } catch (_) {}
                try { writer.releaseLock(); } catch (_) {}
            }
        }
    })();

    const transformStream = new TransformStream({
        start(controller) { controller.enqueue(httpx.resp); },
        transform(chunk, controller) { controller.enqueue(chunk); }
    });

    remote.readable.pipeTo(transformStream.writable).catch(() => {
        try { remote.close(); } catch (_) {}
    });

    return new Response(transformStream.readable, {
        status: 200,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Cache-Control': 'no-store, no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        }
    });
}

//生成单个 VLESS XHTTP 链接
function generate_vless_link(uuid, hostname, port, path, currentHost) {
    const params = new URLSearchParams({
        encryption: 'none',
        security: 'tls',
        sni: currentHost,
        fp: 'chrome',
        alpn: 'h2',
        type: 'xhttp',
        host: currentHost,
        path: path.startsWith('/') ? path : `/${path}`,
        mode: 'stream-one'
    });
    return `vless://${uuid}@${hostname}:${port}?${params.toString()}#XHTTP-${hostname}`;
}

// 格式 1: Base64 格式 (通用)
function get_base64_sub(uuid, nodes, port, path, currentHost) {
    const links = nodes.map(h => generate_vless_link(uuid, h, port, path, currentHost)).join('\n');
    return btoa(links);
}

// 格式 2: Clash Meta (Mihomo) 配置格式
function get_clash_sub(uuid, nodes, port, path, currentHost) {
    const proxies = nodes.map((h) => `  - name: "XHTTP-${h}"
    type: vless
    server: ${h}
    port: ${port}
    uuid: ${uuid}
    udp: true
    tls: true
    servername: ${currentHost}
    client-fingerprint: chrome
    alpn:
      - h2
    network: xhttp
    xhttp-opts:
      mode: stream-one
      path: ${path}
      headers:
        Host: ${currentHost}`).join('\n');

    const proxyNames = nodes.map(h => `      - "XHTTP-${h}"`).join('\n');

    return `port: 7890
allow-lan: true
mode: rule
log-level: info
proxies:
${proxies}
proxy-groups:
  - name: 节点选择
    type: select
    proxies:
${proxyNames}
rules:
  - MATCH,节点选择`;
}

// 格式 3: Sing-Box 配置格式
function get_singbox_sub(uuid, nodes, port, path, currentHost) {
    const outbounds = nodes.map(h => ({
        type: "vless",
        tag: `XHTTP-${h}`,
        server: h,
        server_port: port,
        uuid: uuid,
        flow: "",
        tls: {
            enabled: true,
            server_name: currentHost,
            utls: { enabled: true, fingerprint: "chrome" },
            alpn: ["h2"]
        },
        transport: {
            type: "xhttp",
            host: currentHost,
            path: path,
            mode: "stream-one"
        }
    }));

    const config = {
        outbounds: [
            ...outbounds,
            { type: "direct", tag: "direct" },
            { type: "dns", tag: "dns-out" }
        ]
    };
    return JSON.stringify(config, null, 2);
}

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const cfg = { UUID: yourUUID, PROXYIP: proxyIP };

        // 1. 处理节点数据传输 POST 请求
        if (request.method === 'POST') {
            const res = await handle_post(request, cfg);
            if (res) return res;
            return new Response('Service Unavailable', { status: 503 });
        }

        // 2. 处理订阅/网页 GET 请求
        if (request.method === 'GET') {
            const path = url.pathname;
            const userAgent = (request.headers.get('User-Agent') || '').toLowerCase();
            const targetParam = url.searchParams.get('target')?.toLowerCase();

            // 订阅接口: /sub/UUID
            if (path.toLowerCase() === `/sub/${yourUUID}`) {
                const currentHost = url.hostname;

                // 优先根据 URL 参数判断，其次根据 User-Agent 智能判断
                if (targetParam === 'clash' || userAgent.includes('clash') || userAgent.includes('mihomo')) {
                    return new Response(get_clash_sub(cfg.UUID, cfipList, 443, '/', currentHost), {
                        headers: { 'Content-Type': 'text/yaml; charset=utf-8' }
                    });
                } 
                if (targetParam === 'singbox' || userAgent.includes('sing-box') || userAgent.includes('singbox')) {
                    return new Response(get_singbox_sub(cfg.UUID, cfipList, 443, '/', currentHost), {
                        headers: { 'Content-Type': 'application/json; charset=utf-8' }
                    });
                }

                // 默认返回 Base64 订阅 (v2rayN, Shadowrocket, Passwall 等)
                return new Response(get_base64_sub(cfg.UUID, cfipList, 443, '/', currentHost), {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            }

            // Web 面板页面: /UUID
            if (path.includes(cfg.UUID)) {
                const baseUrl = `https://${url.hostname}`;
                const subUrlBase64 = `${baseUrl}/sub/${yourUUID}`;
                const subUrlClash = `${baseUrl}/sub/${yourUUID}?target=clash`;
                const subUrlSingbox = `${baseUrl}/sub/${yourUUID}?target=singbox`;

                const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VLESS XHTTP 订阅管理</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f6f8; margin: 0; padding: 20px; color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 20px; }
        h2 { margin-top: 0; color: #1677ff; border-bottom: 2px solid #e8e8e8; padding-bottom: 10px; font-size: 20px; }
        .sub-group { margin-bottom: 16px; }
        .sub-title { font-weight: bold; margin-bottom: 6px; font-size: 14px; color: #555; }
        .box { background: #f9f9f9; border: 1px solid #e5e5e5; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 13px; word-break: break-all; margin-bottom: 8px; }
        .btn-group { display: flex; gap: 8px; }
        button { background: #1677ff; color: #fff; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
        button:hover { background: #4096ff; }
        button.btn-qr { background: #52c41a; }
        button.btn-qr:hover { background: #73d13d; }
        
        /* 弹窗样式 */
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background: #fff; padding: 20px; border-radius: 12px; text-align: center; max-width: 300px; width: 100%; }
        .modal-content img { width: 200px; height: 200px; margin: 15px 0; }
        .close-btn { background: #ff4d4f; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h2>各客户端专属订阅链接</h2>
            
            <div class="sub-group">
                <div class="sub-title">1. 通用订阅 (v2rayN / Shadowrocket / Passwall)</div>
                <div class="box">${subUrlBase64}</div>
                <div class="btn-group">
                    <button onclick="copyTxt('${subUrlBase64}')">复制链接</button>
                    <button class="btn-qr" onclick="showModal('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(subUrlBase64)}', '通用订阅二维码')">二维码</button>
                </div>
            </div>

            <div class="sub-group">
                <div class="sub-title">2. Clash Meta (Mihomo) 订阅</div>
                <div class="box">${subUrlClash}</div>
                <div class="btn-group">
                    <button onclick="copyTxt('${subUrlClash}')">复制链接</button>
                    <button class="btn-qr" onclick="showModal('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(subUrlClash)}', 'Clash 订阅二维码')">二维码</button>
                </div>
            </div>

            <div class="sub-group">
                <div class="sub-title">3. Sing-Box 订阅</div>
                <div class="box">${subUrlSingbox}</div>
                <div class="btn-group">
                    <button onclick="copyTxt('${subUrlSingbox}')">复制链接</button>
                    <button class="btn-qr" onclick="showModal('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(subUrlSingbox)}', 'Sing-Box 订阅二维码')">二维码</button>
                </div>
            </div>
        </div>
    </div>

    <!-- 二维码 Modal -->
    <div id="qrModal" class="modal">
        <div class="modal-content">
            <h3 id="modalTitle" style="margin:0;font-size:16px;">订阅二维码</h3>
            <img id="qrImg" src="" alt="QR Code">
            <div>
                <button class="close-btn" onclick="hideModal()">关闭</button>
            </div>
        </div>
    </div>

    <script>
        function copyTxt(text) {
            navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板'));
        }
        function showModal(imgSrc, title) {
            document.getElementById('qrImg').src = imgSrc;
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('qrModal').style.display = 'flex';
        }
        function hideModal() {
            document.getElementById('qrModal').style.display = 'none';
        }
    </script>
</body>
</html>`;
                return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
            }

            return new Response('VLESS XHTTP Worker is Running.', { status: 200 });
        }

        return new Response('Method Not Allowed', { status: 405 });
    }
};
