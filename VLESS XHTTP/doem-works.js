import { connect } from 'cloudflare:sockets';

const yourUUID = '4bcd2896-8b29-4e11-b6ec-d038af37e480'; // 你的 UUID
const proxyIP = 'pyip.ygkkk.dpdns.org';               // 备用 ProxyIP

// 优选节点/域名列表（用于生成订阅）
const cfipList = [ 
    'mfa.gov.ua', 'saas.sin.fan', 'store.ubi.com', 'cf.130519.xyz', 
    'cf.008500.xyz', 'cf.090227.xyz', 'ipv4.eee.xx.kg', 'cdns.doon.eu.org'
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
        if (cache.length < 18) {
            reader.releaseLock();
            return null;
        }

        const version = cache[0];
        const id = cache.slice(1, 17);
        const uuid = parse_uuid(uuid_str);
        if (!validate_uuid(id, uuid)) {
            reader.releaseLock();
            return null;
        }

        const pb_len = cache[17];
        const addr_plus1 = 1 + 16 + 1 + pb_len + 1 + 2 + 1;

        cache = await readBytes(reader, cache, addr_plus1);
        if (cache.length < addr_plus1) {
            reader.releaseLock();
            return null;
        }

        const cmd = cache[1 + 16 + 1 + pb_len];
        if (cmd !== 1) { 
            reader.releaseLock();
            return null;
        }

        const port = (cache[addr_plus1 - 3] << 8) + cache[addr_plus1 - 2];
        const atype = cache[addr_plus1 - 1];

        let header_len = -1;
        if (atype === ADDRESS_TYPE_IPV4) {
            header_len = addr_plus1 + 4;
        } else if (atype === ADDRESS_TYPE_IPV6) {
            header_len = addr_plus1 + 16;
        } else if (atype === ADDRESS_TYPE_URL) {
            cache = await readBytes(reader, cache, addr_plus1 + 1);
            if (cache.length < addr_plus1 + 1) {
                reader.releaseLock();
                return null;
            }
            const domainLen = cache[addr_plus1];
            header_len = addr_plus1 + 1 + domainLen;
        }

        if (header_len < 0) {
            reader.releaseLock();
            return null;
        }

        cache = await readBytes(reader, cache, header_len);
        if (cache.length < header_len) {
            reader.releaseLock();
            return null;
        }

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

        if (!hostname) {
            reader.releaseLock();
            return null;
        }

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

    // 上行流处理
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

    // 下行流处理
    const transformStream = new TransformStream({
        start(controller) {
            controller.enqueue(httpx.resp);
        },
        transform(chunk, controller) {
            controller.enqueue(chunk);
        }
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

// 生成单个 VLESS XHTTP 节点链接
function generate_link(uuid, hostname, port, path, sni, currentHost) {
    const params = new URLSearchParams({
        encryption: 'none',
        security: 'tls',
        sni: sni || currentHost,
        fp: 'chrome',
        alpn: 'h2',
        type: 'xhttp',
        host: currentHost,
        path: path.startsWith('/') ? path : `/${path}`,
        mode: 'stream-one'
    });
    return `vless://${uuid}@${hostname}:${port}?${params.toString()}#XHTTP-${hostname}`;
}

// 生成 Base64 订阅内容
function generate_subscription(uuid, nodes, port, path, sni, currentHost) {
    const links = nodes.map(h => generate_link(uuid, h, port, path, sni, currentHost)).join('\n');
    return btoa(links);
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

            // Base64 订阅节点列表接口
            if (path.toLowerCase() === `/sub/${yourUUID}`) {
                const subContent = generate_subscription(cfg.UUID, cfipList, 443, '/', url.hostname, url.hostname);
                return new Response(subContent, {
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });
            }

            // UUID 仪表盘页面
            if (path.includes(cfg.UUID)) {
                const subUrl = `https://${url.hostname}/sub/${yourUUID}`;
                return new Response(
                    `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VLESS XHTTP 订阅中心</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f2f5; padding: 20px; }
        .card { max-width: 600px; margin: 40px auto; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        h2 { color: #1890ff; margin-top: 0; }
        .box { background: #fafafa; border: 1px solid #d9d9d9; padding: 12px; border-radius: 6px; word-break: break-all; margin: 15px 0; font-family: monospace; }
        button { background: #1890ff; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
        button:hover { background: #40a9ff; }
    </style>
</head>
<body>
    <div class="card">
        <h2>VLESS XHTTP 节点已就绪</h2>
        <p>通用订阅链接（适用于 v2rayN / Sing-Box / Shadowrocket）：</p>
        <div class="box" id="sub-url">${subUrl}</div>
        <button onclick="copySub()">复制订阅链接</button>
    </div>
    <script>
        function copySub() {
            const url = document.getElementById('sub-url').innerText;
            navigator.clipboard.writeText(url).then(() => alert('订阅地址已复制到剪贴板'));
        }
    </script>
</body>
</html>`,
                    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                );
            }

            // 首页
            return new Response('VLESS XHTTP Worker is Running.', { status: 200 });
        }

        return new Response('Method Not Allowed', { status: 405 });
    }
};
