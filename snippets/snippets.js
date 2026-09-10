import { connect } from 'cloudflare:sockets';

// 默认配置（建议在 CF 后台环境变量中设置 UUID 和 PROXYIP）
let proxyIP = 'ProxyIP.CMLiussss.net';
let yourUUID = '93bf61d9-3796-44c2-9b3a-49210ece2585';

// CDN 优选列表
let cfip = [
    'mfa.gov.ua#SG', 'saas.sin.fan#HK', 'store.ubi.com#JP','www.visakorea.com#KR',
    'ipv4.eee.xx.kg#SG', 'cf.877774.xyz#HK','cdns.doon.eu.org#JP','sub.danfeng.eu.org#TW'
];

function utf8ToBase64(str) {
  return btoa(Array.from(new TextEncoder().encode(str), b => String.fromCharCode(b)).join(''));
}

function getHomePageHTML(currentDomain) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Snippets</title><style>body{font-family:Arial,sans-serif;margin:0;padding:40px 20px;background:linear-gradient(135deg,#667eea 0%,#18800e 100%);min-height:100vh;display:flex;align-items:center;justify-content:center}.container{max-width:600px;background:#fff;padding:40px;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.3);text-align:center}h1{color:#667eea;margin-bottom:20px}.info{font-size:18px;color:#666;margin:20px 0}.footer{margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:14px;color:#999}.footer a{color:#667eea;text-decoration:none;margin:0 10px}</style></head><body><div class="container"><h1>Hello Snippets</h1><div class="info">请访问: <strong>https://${currentDomain}/${yourUUID}</strong><br><br>查看订阅和使用说明</div></div></body></html>`;
}

function getSubPageHTML(currentDomain) {
    const v2raySubLink = `https://${currentDomain}/sub/${yourUUID}`;
    const clashSubLink = `https://sublink.eooce.com/clash?config=https://${currentDomain}/sub/${yourUUID}`;
    const singboxSubLink = `https://sublink.eooce.com/singbox?config=https://${currentDomain}/sub/${yourUUID}`;
    
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>订阅链接</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;background:linear-gradient(135deg,#667eea 0%,#18800e 100%);min-height:100vh;padding:20px}.container{max-width:900px;margin:0 auto;background:#fff;border-radius:15px;padding:30px;box-shadow:0 20px 60px rgba(0,0,0,.3)}h1{color:#667eea;margin-bottom:10px;font-size:2rem;text-align:center}.section{margin-bottom:25px}.section-title{color:#667eea;font-size:16px;font-weight:600;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #667eea}.link-box{background:#f7f9fc;border:1px solid #e1e8ed;border-radius:8px;padding:12px;margin-bottom:10px}.link-label{font-size:16px;color:#666;margin-bottom:6px;font-weight:700}.link-content{display:flex;gap:8px}.link-text{flex:1;background:#fff;padding:8px 12px;border-radius:5px;border:1px solid #ddd;font-size:.8rem;word-break:break-all;font-family:monospace}.copy-btn{background:#667eea;color:#fff;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-size:13px;white-space:nowrap}.copy-btn:hover{background:#5568d3}.copy-btn.copied{background:#48c774}</style></head><body><div class="container"><h1>Snippets 订阅中心</h1><div class="section"><div class="section-title">🔗 通用订阅</div><div class="link-box"><div class="link-label">v2rayN / Shadowrocket / Karing</div><div class="link-content"><div class="link-text" id="v2ray-link">${v2raySubLink}</div><button class="copy-btn" onclick="copyToClipboard('v2ray-link',this)">复制</button></div></div></div><div class="section"><div class="section-title">😺 Clash 系列订阅</div><div class="link-box"><div class="link-label">Mihomo / FlClash</div><div class="link-content"><div class="link-text" id="clash-link">${clashSubLink}</div><button class="copy-btn" onclick="copyToClipboard('clash-link',this)">复制</button></div></div></div><div class="section"><div class="section-title">📦 Sing-box 系列订阅</div><div class="link-box"><div class="link-label">Sing-box / SFA / SFI</div><div class="link-content"><div class="link-text" id="singbox-link">${singboxSubLink}</div><button class="copy-btn" onclick="copyToClipboard('singbox-link',this)">复制</button></div></div></div></div><script>function copyToClipboard(e,t){const n=document.getElementById(e).textContent;navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(n).then(()=>{t.textContent="已复制";t.classList.add("copied");setTimeout(()=>{t.textContent="复制";t.classList.remove("copied")},2e3)}):alert("复制失败")}</script></body></html>`;
}

function formatIdentifier(arr, offset = 0) {
    const hex = [...arr.slice(offset, offset + 16)].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.substring(0,8)}-${hex.substring(8,12)}-${hex.substring(12,16)}-${hex.substring(16,20)}-${hex.substring(20)}`;
}

function base64ToArray(b64Str) {
    if (!b64Str) return { error: null };
    try { 
        const binaryString = atob(b64Str.replace(/-/g, '+').replace(/_/g, '/'));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return { earlyData: bytes.buffer, error: null }; 
    } catch (error) { 
        return { error }; 
    }
}

function closeSocketQuietly(socket) { 
    try { 
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CLOSING)) {
            socket.close(); 
        }
    } catch (error) {} 
}

function parseProxyAddress(proxyStr) {
    if (!proxyStr) return null;
    proxyStr = proxyStr.trim();
    if (proxyStr.startsWith('socks://') || proxyStr.startsWith('socks5://')) {
        const urlStr = proxyStr.replace(/^socks:\/\//, 'socks5://');
        try {
            const url = new URL(urlStr);
            return {
                type: 'socks5',
                host: url.hostname,
                port: parseInt(url.port) || 1080,
                username: url.username ? decodeURIComponent(url.username) : '',
                password: url.password ? decodeURIComponent(url.password) : ''
            };
        } catch (e) { return null; }
    }
    
    if (proxyStr.startsWith('http://') || proxyStr.startsWith('https://')) {
        try {
            const url = new URL(proxyStr);
            return {
                type: 'http',
                host: url.hostname,
                port: parseInt(url.port) || (proxyStr.startsWith('https://') ? 443 : 80),
                username: url.username ? decodeURIComponent(url.username) : '',
                password: url.password ? decodeURIComponent(url.password) : ''
            };
        } catch (e) { return null; }
    }
    
    const lastColonIndex = proxyStr.lastIndexOf(':');
    if (lastColonIndex > 0) {
        const host = proxyStr.substring(0, lastColonIndex);
        const port = parseInt(proxyStr.substring(lastColonIndex + 1), 10);
        if (!isNaN(port) && port > 0 && port <= 65535) {
            return { type: 'direct', host, port };
        }
    }
    return { type: 'direct', host: proxyStr, port: 443 };
}

export default {
    async fetch(request, env, ctx) {
        try {
            if (env && env.UUID) yourUUID = env.UUID;
            if (env && env.PROXYIP) proxyIP = env.PROXYIP;

            const url = new URL(request.url);
            const pathname = url.pathname;

            if (request.headers.get('Upgrade') === 'websocket') {
                let wsPathProxyIP = null;
                if (pathname.startsWith('/proxyip=')) {
                    try { wsPathProxyIP = decodeURIComponent(pathname.substring(9)).trim(); } catch (e) {}
                }
                const customProxyIP = wsPathProxyIP || url.searchParams.get('proxyip') || request.headers.get('proxyip');
                return await handleVlsRequest(request, customProxyIP);
            } else if (request.method === 'GET') {
                if (url.pathname === '/') {
                    return new Response(getHomePageHTML(url.hostname), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
                }
                if (url.pathname === `/${yourUUID}`) {
                    return new Response(getSubPageHTML(url.hostname), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
                }
                if (url.pathname.toLowerCase().includes(`/sub/${yourUUID}`)) {
                    const currentDomain = url.hostname;
                    const header = 'v' + 'l' + 'e' + 's' + 's';
                    const nodeLinks = cfip.map(cdnItem => {
                        let host, port = 443, nodeName = '';
                        if (cdnItem.includes('#')) {
                            const parts = cdnItem.split('#');
                            cdnItem = parts[0]; nodeName = parts[1];
                        }
                        if (cdnItem.includes(':')) {
                            const parts = cdnItem.split(':');
                            host = parts[0]; port = parseInt(parts[1]) || 443;
                        } else { host = cdnItem; }
                        if (!nodeName) nodeName = `Snippets-${header}`;
                        return `${header}://${yourUUID}@${host}:${port}?encryption=none&security=tls&sni=${currentDomain}&fp=firefox&allowInsecure=0&type=ws&host=${currentDomain}&path=%2F%3Fed%3D2560#${nodeName}`;
                    });
                    const base64Content = utf8ToBase64(nodeLinks.join('\n'));
                    return new Response(base64Content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
                }
            }
            return new Response('Not Found', { status: 404 });
        } catch (err) {
            // 捕获顶层错误，绝对不抛出 1101
            return new Response('Service Unavailable', { status: 503 });
        }
    },
};

async function handleVlsRequest(request, customProxyIP) {
    const wsPair = new WebSocketPair();
    const [clientSock, serverSock] = Object.values(wsPair);
    serverSock.accept();
    
    let remoteConnWrapper = { socket: null };
    let isDnsQuery = false;
    const earlyData = request.headers.get('sec-websocket-protocol') || '';
    const readable = makeReadableStream(serverSock, earlyData);

    readable.pipeTo(new WritableStream({
        async write(chunk) {
            try {
                if (isDnsQuery) return await forwardUDP(chunk, serverSock, null);
                if (remoteConnWrapper.socket) {
                    const writer = remoteConnWrapper.socket.writable.getWriter();
                    await writer.write(chunk);
                    writer.releaseLock();
                    return;
                }
                const { hasError, addressType, port, hostname, rawIndex, version, isUDP } = parseWsPacketHeader(chunk, yourUUID);
                if (hasError) {
                    closeSocketQuietly(serverSock);
                    return;
                }
                
                if (isUDP) {
                    if (port === 53) isDnsQuery = true;
                    else { closeSocketQuietly(serverSock); return; }
                }
                const respHeader = new Uint8Array([version[0], 0]);
                const rawData = chunk.slice(rawIndex);
                if (isDnsQuery) return forwardUDP(rawData, serverSock, respHeader);
                
                await forwardTCP(addressType, hostname, port, rawData, serverSock, respHeader, remoteConnWrapper, customProxyIP);
            } catch (e) {
                closeSocketQuietly(serverSock);
            }
        },
        close() { closeSocketQuietly(serverSock); },
        abort() { closeSocketQuietly(serverSock); }
    })).catch(() => closeSocketQuietly(serverSock));

    return new Response(null, { status: 101, webSocket: clientSock });
}

async function forwardTCP(addrType, host, portNum, rawData, ws, respHeader, remoteConnWrapper, customProxyIP) {
    async function connectDirect(address, port, data) {
        const remoteSock = connect({ hostname: address, port: port });
        const writer = remoteSock.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        return remoteSock;
    }

    let proxyConfig = parseProxyAddress(customProxyIP || proxyIP) || { type: 'direct', host: proxyIP, port: 443 };
    let shouldUseProxy = (proxyConfig.type === 'socks5' || proxyConfig.type === 'http' || proxyConfig.type === 'https');

    async function connectWithProxy() {
        let newSocket;
        if (proxyConfig.type === 'socks5') {
            newSocket = await connect2Socks5(proxyConfig, host, portNum, rawData);
        } else if (proxyConfig.type === 'http' || proxyConfig.type === 'https') {
            newSocket = await connect2Http(proxyConfig, host, portNum, rawData);
        } else {
            newSocket = await connectDirect(proxyConfig.host, proxyConfig.port, rawData);
        }
        remoteConnWrapper.socket = newSocket;
        newSocket.closed.catch(() => {}).finally(() => closeSocketQuietly(ws));
        connectStreams(newSocket, ws, respHeader, null);
    }

    try {
        if (shouldUseProxy) {
            await connectWithProxy();
        } else {
            try {
                const initialSocket = await connectDirect(host, portNum, rawData);
                remoteConnWrapper.socket = initialSocket;
                connectStreams(initialSocket, ws, respHeader, connectWithProxy);
            } catch (err) {
                await connectWithProxy();
            }
        }
    } catch (finalErr) {
        // 彻底捕获 TCP 连接失败，静默断开 WebSocket，防 1101 报错
        closeSocketQuietly(ws);
    }
}

async function connect2Socks5(proxyConfig, targetHost, targetPort, initialData) {
    const { host, port, username, password } = proxyConfig;
    let socket = connect({ hostname: host, port: port });
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    
    try {
        const authMethods = username && password ? new Uint8Array([0x05, 0x02, 0x00, 0x02]) : new Uint8Array([0x05, 0x01, 0x00]);
        await writer.write(authMethods);
        const methodResponse = await reader.read();
        if (methodResponse.done || methodResponse.value.byteLength < 2) throw new Error();

        if (new Uint8Array(methodResponse.value)[1] === 0x02) {
            const userBytes = new TextEncoder().encode(username);
            const passBytes = new TextEncoder().encode(password);
            const authPacket = new Uint8Array(3 + userBytes.length + passBytes.length);
            authPacket[0] = 0x01; authPacket[1] = userBytes.length;
            authPacket.set(userBytes, 2);
            authPacket[2 + userBytes.length] = passBytes.length;
            authPacket.set(passBytes, 3 + userBytes.length);
            await writer.write(authPacket);
            const authResponse = await reader.read();
            if (authResponse.done || new Uint8Array(authResponse.value)[1] !== 0x00) throw new Error();
        }

        const hostBytes = new TextEncoder().encode(targetHost);
        const connectPacket = new Uint8Array(7 + hostBytes.length);
        connectPacket[0] = 0x05; connectPacket[1] = 0x01; connectPacket[2] = 0x00; connectPacket[3] = 0x03;
        connectPacket[4] = hostBytes.length;
        connectPacket.set(hostBytes, 5);
        new DataView(connectPacket.buffer).setUint16(5 + hostBytes.length, targetPort, false);
        await writer.write(connectPacket);
        const connectResponse = await reader.read();
        if (connectResponse.done || new Uint8Array(connectResponse.value)[1] !== 0x00) throw new Error();

        await writer.write(initialData);
        writer.releaseLock(); reader.releaseLock();
        return socket;
    } catch (e) {
        try { writer.releaseLock(); } catch(i){}
        try { reader.releaseLock(); } catch(i){}
        try { socket.close(); } catch(i){}
        throw e;
    }
}

async function connect2Http(proxyConfig, targetHost, targetPort, initialData) {
    const { host, port, username, password } = proxyConfig;
    let socket = connect({ hostname: host, port: port });
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();

    try {
        let connectRequest = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\nHost: ${targetHost}:${targetPort}\r\n`;
        if (username && password) {
            connectRequest += `Proxy-Authorization: Basic ${btoa(`${username}:${password}`)}\r\n`;
        }
        connectRequest += `User-Agent: Mozilla/5.0\r\nConnection: keep-alive\r\n\r\n`;
        await writer.write(new TextEncoder().encode(connectRequest));

        const { done, value } = await reader.read();
        if (done) throw new Error();

        const statusLine = new TextDecoder().decode(value).split('\r\n')[0];
        if (!statusLine.includes(' 200 ')) throw new Error();

        await writer.write(initialData);
        writer.releaseLock(); reader.releaseLock();
        return socket;
    } catch (e) {
        try { writer.releaseLock(); } catch(i){}
        try { reader.releaseLock(); } catch(i){}
        try { socket.close(); } catch(i){}
        throw e;
    }
}

function parseWsPacketHeader(chunk, token) {
    if (chunk.byteLength < 24) return { hasError: true };
    const version = new Uint8Array(chunk.slice(0, 1));
    if (formatIdentifier(new Uint8Array(chunk.slice(1, 17))) !== token) return { hasError: true };
    const optLen = new Uint8Array(chunk.slice(17, 18))[0];
    const cmd = new Uint8Array(chunk.slice(18 + optLen, 19 + optLen))[0];
    let isUDP = (cmd === 2);
    if (cmd !== 1 && cmd !== 2) return { hasError: true };
    const portIdx = 19 + optLen;
    const port = new DataView(chunk.slice(portIdx, portIdx + 2)).getUint16(0);
    let addrIdx = portIdx + 2, addrLen = 0, addrValIdx = addrIdx + 1, hostname = '';
    const addressType = new Uint8Array(chunk.slice(addrIdx, addrValIdx))[0];
    
    if (addressType === 1) {
        addrLen = 4; hostname = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + addrLen)).join('.');
    } else if (addressType === 2) {
        addrLen = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + 1))[0];
        addrValIdx += 1; hostname = new TextDecoder().decode(chunk.slice(addrValIdx, addrValIdx + addrLen));
    } else if (addressType === 3) {
        addrLen = 16; const ipv6 = []; const ipv6View = new DataView(chunk.slice(addrValIdx, addrValIdx + addrLen));
        for (let i = 0; i < 8; i++) ipv6.push(ipv6View.getUint16(i * 2).toString(16));
        hostname = ipv6.join(':');
    } else { return { hasError: true }; }

    return { hasError: false, addressType, port, hostname, isUDP, rawIndex: addrValIdx + addrLen, version };
}

function makeReadableStream(socket, earlyDataHeader) {
    let cancelled = false;
    return new ReadableStream({
        start(controller) {
            socket.addEventListener('message', (event) => { if (!cancelled) controller.enqueue(event.data); });
            socket.addEventListener('close', () => { if (!cancelled) { closeSocketQuietly(socket); controller.close(); } });
            socket.addEventListener('error', (err) => { if (!cancelled) controller.error(err); });
            const { earlyData } = base64ToArray(earlyDataHeader);
            if (earlyData) controller.enqueue(earlyData);
        },
        cancel() { cancelled = true; closeSocketQuietly(socket); }
    });
}

async function connectStreams(remoteSocket, webSocket, headerData, retryFunc) {
    let header = headerData, hasData = false;
    await remoteSocket.readable.pipeTo(
        new WritableStream({
            async write(chunk, controller) {
                hasData = true;
                if (webSocket.readyState !== WebSocket.OPEN) controller.error();
                if (header) { 
                    const response = new Uint8Array(header.length + chunk.byteLength);
                    response.set(header, 0); response.set(chunk, header.length);
                    webSocket.send(response.buffer); header = null; 
                } else { 
                    webSocket.send(chunk); 
                }
            },
            abort() {},
        })
    ).catch(() => closeSocketQuietly(webSocket));

    if (!hasData && retryFunc) {
        try { await retryFunc(); } catch(e) { closeSocketQuietly(webSocket); }
    }
}

async function forwardUDP(udpChunk, webSocket, respHeader) {
    try {
        const tcpSocket = connect({ hostname: '8.8.4.4', port: 53 });
        let vlessHeader = respHeader;
        const writer = tcpSocket.writable.getWriter();
        await writer.write(udpChunk);
        writer.releaseLock();
        await tcpSocket.readable.pipeTo(new WritableStream({
            async write(chunk) {
                if (webSocket.readyState === WebSocket.OPEN) {
                    if (vlessHeader) { 
                        const response = new Uint8Array(vlessHeader.length + chunk.byteLength);
                        response.set(vlessHeader, 0); response.set(chunk, vlessHeader.length);
                        webSocket.send(response.buffer); vlessHeader = null; 
                    } else { webSocket.send(chunk); }
                }
            },
        }));
    } catch (error) {
        closeSocketQuietly(webSocket);
    }
}
