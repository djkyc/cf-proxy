import { connect } from 'cloudflare:sockets';

const yourUUID = '4bcd2896-8b29-4e11-b6ec-d038af37e480'; // 你的 UUID
const proxyIP = 'pyip.ygkkk.dpdns.org';               // 备用 ProxyIP

// 优选节点/域名列表（用于生成订阅）
const cfipList = [ 
    'mfa.gov.ua', 'saas.sin.fan', 'store.ubi.com', 'www.visa.cn', 
    'store.ubi.com', 'cf.090227.xyz', 'ipv4.eee.xx.kg', 'cdns.doon.eu.org'
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

// ==================== 订阅生成模块 ====================

// 生成单节点 VLESS XHTTP 链接
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

// 1. 通用 Base64 订阅 (V2Ray / Shadowrocket / PassWall)
function generate_v2ray_sub(uuid, nodes, port, path, currentHost) {
    const links = nodes.map(h => generate_link(uuid, h, port, path, currentHost, currentHost)).join('\n');
    return btoa(links);
}

// 2. Sing-Box 配置文件订阅 (JSON)
function generate_singbox_sub(uuid, nodes, port, path, currentHost) {
    const outbounds = nodes.map(h => ({
        type: "vless",
        tag: `XHTTP-${h}`,
        server: h,
        server_port: port,
        uuid: uuid,
        tls: {
            enabled: true,
            server_name: currentHost,
            utls: { enabled: true, fingerprint: "chrome" }
        },
        transport: {
            type: "xhttp",
            host: currentHost,
            path: path.startsWith('/') ? path : `/${path}`,
            mode: "stream-one"
        }
    }));

    const config = {
        outbounds: [
            {
                type: "selector",
                tag: "节点选择",
                outbounds: outbounds.map(o => o.tag)
            },
            ...outbounds,
            { type: "direct", tag: "direct" }
        ]
    };
    return JSON.stringify(config, null, 2);
}

// 3. Clash Meta / Mihomo 配置文件订阅 (YAML)
function generate_clash_sub(uuid, nodes, port, path, currentHost) {
    const proxies = nodes.map(h => `  - name: "XHTTP-${h}"
    type: vless
    server: ${h}
    port: ${port}
    uuid: ${uuid}
    udp: true
    tls: true
    servername: ${currentHost}
    client-fingerprint: chrome
    network: xhttp
    xhttp-opts:
      path: "${path.startsWith('/') ? path : '/' + path}"
      host: "${currentHost}"
      mode: stream-one`).join('\n');

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
      - DIRECT
rules:
  - MATCH,节点选择`;
}

// ==================== Worker 主入口 ====================

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
            const target = url.searchParams.get('target') || url.searchParams.get('app');

            // 订阅接口判断 (/sub/UUID)
            if (path.toLowerCase() === `/sub/${yourUUID}`) {
                if (target === 'singbox') {
                    return new Response(generate_singbox_sub(cfg.UUID, cfipList, 443, '/', url.hostname), {
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8',
                            'Cache-Control': 'no-cache, no-store, must-revalidate'
                        }
                    });
                } else if (target === 'clash' || target === 'clashmeta') {
                    return new Response(generate_clash_sub(cfg.UUID, cfipList, 443, '/', url.hostname), {
                        headers: {
                            'Content-Type': 'text/yaml; charset=utf-8',
                            'Cache-Control': 'no-cache, no-store, must-revalidate'
                        }
                    });
                } else {
                    // 默认 Base64 (V2Ray/Shadowrocket)
                    return new Response(generate_v2ray_sub(cfg.UUID, cfipList, 443, '/', url.hostname), {
                        headers: {
                            'Content-Type': 'text/plain; charset=utf-8',
                            'Cache-Control': 'no-cache, no-store, must-revalidate'
                        }
                    });
                }
            }

            // UUID 仪表盘页面
            if (path.includes(cfg.UUID)) {
                const baseUrl = `https://${url.hostname}`;
                const subV2ray = `${baseUrl}/sub/${yourUUID}`;
                const subSingbox = `${baseUrl}/sub/${yourUUID}?target=singbox`;
                const subClash = `${baseUrl}/sub/${yourUUID}?target=clash`;

                const vlessLinks = cfipList.map(h => generate_link(cfg.UUID, h, 443, '/', url.hostname, url.hostname));

                return new Response(
                    `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VLESS XHTTP 订阅控制中心</title>
    <!-- 引入前端二维码生成库 -->
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f2f5; margin: 0; padding: 20px; color: #333; }
        .card { max-width: 750px; margin: 20px auto; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        h2 { color: #1890ff; margin-top: 0; border-bottom: 2px solid #e8e8e8; padding-bottom: 10px; }
        .item-group { margin-bottom: 25px; }
        label { font-weight: bold; display: block; margin-bottom: 8px; color: #555; }
        .box { background: #fafafa; border: 1px solid #d9d9d9; padding: 12px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 13px; margin-bottom: 8px; }
        .btn-group { display: flex; gap: 10px; }
        button { background: #1890ff; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.3s; }
        button:hover { background: #40a9ff; }
        button.sec { background: #52c41a; }
        button.sec:hover { background: #73d13d; }
        #qrcode-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; }
        .modal-content { background: #fff; padding: 25px; border-radius: 12px; text-align: center; max-width: 320px; width: 90%; }
        #qrcode { margin: 15px auto; display: flex; justify-content: center; }
        select { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #d9d9d9; margin-bottom: 10px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="card">
        <h2>VLESS XHTTP 订阅与管理中心</h2>

        <div class="item-group">
            <label>1. Universal / V2Ray / Shadowrocket 订阅地址：</label>
            <div class="box" id="sub-v2ray">${subV2ray}</div>
            <div class="btn-group">
                <button onclick="copyText('${subV2ray}')">复制链接</button>
                <button class="sec" onclick="showQR('${subV2ray}', 'V2Ray / Universal 订阅二维码')">显示二维码</button>
            </div>
        </div>

        <div class="item-group">
            <label>2. Sing-Box 订阅地址 (JSON)：</label>
            <div class="box" id="sub-singbox">${subSingbox}</div>
            <div class="btn-group">
                <button onclick="copyText('${subSingbox}')">复制链接</button>
                <button class="sec" onclick="showQR('${subSingbox}', 'Sing-Box 订阅二维码')">显示二维码</button>
            </div>
        </div>

        <div class="item-group">
            <label>3. Clash Meta / Mihomo 订阅地址 (YAML)：</label>
            <div class="box" id="sub-clash">${subClash}</div>
            <div class="btn-group">
                <button onclick="copyText('${subClash}')">复制链接</button>
                <button class="sec" onclick="showQR('${subClash}', 'Clash Meta 订阅二维码')">显示二维码</button>
            </div>
        </div>

        <div class="item-group">
            <label>4. 单节点明文导入与扫码：</label>
            <select id="node-select">
                ${vlessLinks.map((link, idx) => `<option value="${link}">节点 ${idx + 1}: ${cfipList[idx]}</option>`).join('')}
            </select>
            <div class="btn-group">
                <button onclick="copySelectedNode()">复制选中的节点</button>
                <button class="sec" onclick="showSelectedNodeQR()">扫码导入节点</button>
            </div>
        </div>
    </div>

    <!-- 二维码弹窗 -->
    <div id="qrcode-modal" onclick="closeQR(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
            <h3 id="qr-title" style="margin-top:0; font-size: 16px;">二维码扫码</h3>
            <div id="qrcode"></div>
            <button onclick="closeQR()">关闭</button>
        </div>
    </div>

    <script>
        let qrObj = null;

        function copyText(text) {
            navigator.clipboard.writeText(text).then(() => alert('已成功复制到剪贴板'));
        }

        function copySelectedNode() {
            const val = document.getElementById('node-select').value;
            copyText(val);
        }

        function showQR(text, title) {
            document.getElementById('qr-title').innerText = title || '扫码导入';
            const container = document.getElementById('qrcode');
            container.innerHTML = '';
            
            qrObj = new QRCode(container, {
                text: text,
                width: 200,
                height: 200,
                correctLevel: QRCode.CorrectLevel.L
            });

            document.getElementById('qrcode-modal').style.display = 'flex';
        }

        function showSelectedNodeQR() {
            const val = document.getElementById('node-select').value;
            const sel = document.getElementById('node-select');
            const nodeName = sel.options[sel.selectedIndex].text;
            showQR(val, nodeName);
        }

        function closeQR(e) {
            document.getElementById('qrcode-modal').style.display = 'none';
        }
    </script>
</body>
</html>`,
                    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                );
            }

            // 首页提示
            return new Response('VLESS XHTTP Worker is Running.', { status: 200 });
        }

        return new Response('Method Not Allowed', { status: 405 });
    }
};
