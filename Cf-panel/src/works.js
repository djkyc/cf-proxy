// src/deploy.js
var \u63A5\u53E3\u5730\u5740 = "https://api.cloudflare.com/client/v4";
var \u517C\u5BB9\u65E5\u671F = "2026-01-20";
var \u7ED1\u5B9A\u540D = "KV";
var \u6E90\u7801\u8FDC\u7A0B\u57FA\u7840 = "https://raw.githubusercontent.com/shuma12303/nebula-decode/main/public";
async function handleDeploy(request, env, ctx) {
  const \u8DEF\u5F84 = new URL(request.url).pathname;
  if (!\u8DEF\u5F84.startsWith("/api/")) return new Response("Not Found", { status: 404 });
  const context = {
    request,
    env,
    waitUntil: ctx?.waitUntil?.bind(ctx),
    passThroughOnException: ctx?.passThroughOnException?.bind(ctx)
  };
  return request.method === "POST" ? onRequestPost(context) : onRequest(context);
}
async function onRequestPost(context) {
  try {
    const \u6570\u636E = await context.request.json().catch(() => ({}));
    const \u8DEF\u5F84 = new URL(context.request.url).pathname.replace(/^\/api\/?/, "");
    if (\u8DEF\u5F84 === "accounts") {
      const accounts = await \u8C03\u7528\u63A5\u53E3(\u6570\u636E.credentials, "/accounts?per_page=50");
      return \u8FD4\u56DEJSON(200, { ok: true, accounts: accounts.map((\u8D26\u6237) => ({ id: \u8D26\u6237.id, name: \u8D26\u6237.name })) });
    }
    if (\u8DEF\u5F84 === "zones") {
      const zones = await \u8C03\u7528\u63A5\u53E3(\u6570\u636E.credentials, "/zones?status=active&per_page=100");
      return \u8FD4\u56DEJSON(200, { ok: true, zones: zones.map((\u533A\u57DF) => ({ id: \u533A\u57DF.id, name: \u533A\u57DF.name })) });
    }
    if (\u8DEF\u5F84 === "resources") {
      if (!\u6570\u636E.accountId) throw new Error("\u7F3A\u5C11 Account ID");
      const resources = await \u8BFB\u53D6\u8D44\u6E90\u5217\u8868(\u6570\u636E.credentials, \u6570\u636E.accountId);
      return \u8FD4\u56DEJSON(200, { ok: true, ...resources });
    }
    if (\u8DEF\u5F84 === "deploy") {
      const \u7ED3\u679C = await \u90E8\u7F72(\u6570\u636E, context);
      return \u8FD4\u56DEJSON(200, { ok: true, ...\u7ED3\u679C });
    }
    return \u8FD4\u56DEJSON(404, { ok: false, error: "\u63A5\u53E3\u4E0D\u5B58\u5728" });
  } catch (\u9519\u8BEF) {
    return \u8FD4\u56DEJSON(500, { ok: false, error: \u9519\u8BEF.message || String(\u9519\u8BEF) });
  }
}
function onRequest() {
  return \u8FD4\u56DEJSON(405, { ok: false, error: "\u53EA\u652F\u6301 POST" });
}
async function \u90E8\u7F72(\u6570\u636E, context) {
  \u6570\u636E = await \u8865\u5168\u90E8\u7F72\u9ED8\u8BA4\u503C(\u6570\u636E);
  \u6821\u9A8C\u90E8\u7F72\u53C2\u6570(\u6570\u636E);
  const \u65E5\u5FD7 = [];
  const \u8BB0\u5F55 = (\u6587\u672C) => \u65E5\u5FD7.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] ${\u6587\u672C}`);
  const uuid = \u6570\u636E.uuid || crypto.randomUUID();
  const \u64CD\u4F5C\u6A21\u5F0F = \u6570\u636E.deployMode === "update" ? "update" : "create";
  const \u539F\u59CB\u9879\u76EE\u540D = String(\u6570\u636E.projectName || "").trim();
  const \u9879\u76EE\u540D = \u64CD\u4F5C\u6A21\u5F0F === "update" ? \u539F\u59CB\u9879\u76EE\u540D : \u6E05\u7406\u9879\u76EE\u540D(\u539F\u59CB\u9879\u76EE\u540D || \u751F\u6210\u968F\u673A\u540D\u79F0("edge"));
  const \u6A21\u5F0F = \u6570\u636E.sourceMode === "plain" ? "plain" : "encoded";
  const \u90E8\u7F72\u65B9\u5F0F = \u6570\u636E.deployType === "worker" ? "worker" : "pages";
  const \u4E0A\u4F20\u6587\u4EF6 = \u89E3\u6790\u4E0A\u4F20\u6587\u4EF6(\u6570\u636E.files);
  \u8BB0\u5F55(`\u51C6\u5907${\u64CD\u4F5C\u6A21\u5F0F === "update" ? "\u66F4\u65B0" : "\u90E8\u7F72"} ${\u90E8\u7F72\u65B9\u5F0F === "pages" ? "Pages" : "Worker"}: ${\u9879\u76EE\u540D}`);
  if (\u4E0A\u4F20\u6587\u4EF6) {
    \u8BB0\u5F55(`\u90E8\u7F72\u6E90: \u4E0A\u4F20\u538B\u7F29\u5305\uFF0C\u5171 ${\u4E0A\u4F20\u6587\u4EF6.length} \u4E2A\u6587\u4EF6`);
  } else {
    \u8BB0\u5F55(`\u90E8\u7F72\u6E90: ${\u6A21\u5F0F === "plain" ? "\u660E\u6587\u6E90" : "\u52A0\u5BC6/\u6DF7\u6DC6\u6E90"}\uFF0C\u5B9E\u65F6\u8054\u7F51\u62C9\u53D6`);
  }
  if (\u64CD\u4F5C\u6A21\u5F0F === "update") {
    if (\u90E8\u7F72\u65B9\u5F0F === "worker") {
      await \u540C\u6B65Worker\u4EE3\u7801(\u6570\u636E.credentials, {
        accountId: \u6570\u636E.accountId,
        scriptName: \u9879\u76EE\u540D,
        sourceMode: \u6A21\u5F0F,
        files: \u4E0A\u4F20\u6587\u4EF6
      }, context, \u8BB0\u5F55);
    } else {
      await \u540C\u6B65Pages\u4EE3\u7801(\u6570\u636E.credentials, {
        accountId: \u6570\u636E.accountId,
        projectName: \u9879\u76EE\u540D,
        sourceMode: \u6A21\u5F0F,
        files: \u4E0A\u4F20\u6587\u4EF6
      }, context, \u8BB0\u5F55);
    }
    \u8BB0\u5F55("\u66F4\u65B0\u6A21\u5F0F\u53EA\u540C\u6B65\u4EE3\u7801\uFF0C\u672A\u4FEE\u6539 UUID\u3001KV\u3001\u57DF\u540D\u6216\u9879\u76EE\u914D\u7F6E");
    return { deployType: \u90E8\u7F72\u65B9\u5F0F, projectName: \u9879\u76EE\u540D, sourceMode: \u6A21\u5F0F, logs: \u65E5\u5FD7 };
  }
  const \u547D\u540D\u7A7A\u95F4 = await \u83B7\u53D6\u6216\u521B\u5EFAKV(\u6570\u636E.credentials, \u6570\u636E.accountId, {
    id: \u6570\u636E.kvId,
    title: \u6570\u636E.kvTitle || \u751F\u6210\u968F\u673A\u540D\u79F0("store")
  }, \u8BB0\u5F55);
  if (\u547D\u540D\u7A7A\u95F4.created) {
    await \u521D\u59CB\u5316KV(\u6570\u636E.credentials, \u6570\u636E.accountId, \u547D\u540D\u7A7A\u95F4.id, uuid, \u8BB0\u5F55);
  } else {
    \u8BB0\u5F55("\u590D\u7528\u73B0\u6709 KV\uFF0C\u4FDD\u7559\u539F\u914D\u7F6E");
  }
  if (\u90E8\u7F72\u65B9\u5F0F === "worker") {
    await \u90E8\u7F72Worker(\u6570\u636E.credentials, {
      accountId: \u6570\u636E.accountId,
      scriptName: \u9879\u76EE\u540D,
      sourceMode: \u6A21\u5F0F,
      uuid,
      kvId: \u547D\u540D\u7A7A\u95F4.id,
      enableWorkersDev: !!\u6570\u636E.enableWorkersDev,
      files: \u4E0A\u4F20\u6587\u4EF6
    }, context, \u8BB0\u5F55);
  } else {
    await \u90E8\u7F72Pages(\u6570\u636E.credentials, {
      accountId: \u6570\u636E.accountId,
      projectName: \u9879\u76EE\u540D,
      sourceMode: \u6A21\u5F0F,
      uuid,
      kvId: \u547D\u540D\u7A7A\u95F4.id,
      files: \u4E0A\u4F20\u6587\u4EF6
    }, context, \u8BB0\u5F55);
  }
  let domain = null;
  if (\u6570\u636E.hostname && \u6570\u636E.zoneId) {
    domain = await \u7ED1\u5B9A\u57DF\u540D(\u6570\u636E.credentials, {
      accountId: \u6570\u636E.accountId,
      deployType: \u90E8\u7F72\u65B9\u5F0F,
      projectName: \u9879\u76EE\u540D,
      zoneId: \u6570\u636E.zoneId,
      hostname: \u6570\u636E.hostname
    }, \u8BB0\u5F55);
  }
  const domains = await \u5217\u51FA\u7ED1\u5B9A\u57DF\u540D(\u6570\u636E.credentials, {
    accountId: \u6570\u636E.accountId,
    deployType: \u90E8\u7F72\u65B9\u5F0F,
    projectName: \u9879\u76EE\u540D
  }, \u8BB0\u5F55);
  \u8BB0\u5F55("\u90E8\u7F72\u5B8C\u6210");
  return {
    deployType: \u90E8\u7F72\u65B9\u5F0F,
    projectName: \u9879\u76EE\u540D,
    sourceMode: \u6A21\u5F0F,
    uuid,
    kv: { id: \u547D\u540D\u7A7A\u95F4.id, title: \u547D\u540D\u7A7A\u95F4.title || \u6570\u636E.kvTitle || "" },
    domain,
    domains,
    logs: \u65E5\u5FD7
  };
}
async function \u8865\u5168\u90E8\u7F72\u9ED8\u8BA4\u503C(\u6570\u636E) {
  if (!\u6570\u636E?.credentials?.email || !\u6570\u636E?.credentials?.key) return \u6570\u636E;
  const \u8F93\u51FA = { ...\u6570\u636E };
  let zones = null;
  if (!\u8F93\u51FA.accountId) {
    const accounts = await \u8C03\u7528\u63A5\u53E3(\u8F93\u51FA.credentials, "/accounts?per_page=50");
    if (!accounts.length) throw new Error("\u5F53\u524D\u51ED\u636E\u6CA1\u6709\u53EF\u7528\u8D26\u6237");
    \u8F93\u51FA.accountId = accounts[0].id;
    \u8F93\u51FA.accountName = accounts[0].name;
  }
  if (!\u8F93\u51FA.deployType) \u8F93\u51FA.deployType = "pages";
  if (!\u8F93\u51FA.sourceMode) \u8F93\u51FA.sourceMode = "encoded";
  if (\u8F93\u51FA.deployMode === "update") return \u8F93\u51FA;
  if (\u8F93\u51FA.autoDomain && !\u8F93\u51FA.hostname) {
    zones = await \u8C03\u7528\u63A5\u53E3(\u8F93\u51FA.credentials, "/zones?status=active&per_page=100");
    if (zones.length) {
      \u8F93\u51FA.zoneId = \u8F93\u51FA.zoneId || zones[0].id;
      \u8F93\u51FA.zoneName = zones[0].name;
      \u8F93\u51FA.hostname = `${\u751F\u6210\u968F\u673A\u540D\u79F0("edge")}.${zones[0].name}`;
    }
  }
  if (\u8F93\u51FA.hostname && !\u8F93\u51FA.zoneId) {
    zones = zones || await \u8C03\u7528\u63A5\u53E3(\u8F93\u51FA.credentials, "/zones?status=active&per_page=100");
    const zone = zones.filter((\u533A\u57DF) => \u8F93\u51FA.hostname === \u533A\u57DF.name || \u8F93\u51FA.hostname.endsWith(`.${\u533A\u57DF.name}`)).sort((\u7532, \u4E59) => \u4E59.name.length - \u7532.name.length)[0];
    if (!zone) throw new Error(`\u627E\u4E0D\u5230\u5339\u914D\u57DF\u540D ${\u8F93\u51FA.hostname} \u7684 Cloudflare Zone`);
    \u8F93\u51FA.zoneId = zone.id;
    \u8F93\u51FA.zoneName = zone.name;
  }
  if (\u8F93\u51FA.hostname && \u8F93\u51FA.zoneId) {
    zones = zones || await \u8C03\u7528\u63A5\u53E3(\u8F93\u51FA.credentials, "/zones?status=active&per_page=100");
    const zone = zones.find((\u533A\u57DF) => \u533A\u57DF.id === \u8F93\u51FA.zoneId) || (\u8F93\u51FA.zoneName ? { id: \u8F93\u51FA.zoneId, name: \u8F93\u51FA.zoneName } : null);
    if (zone && \u8F93\u51FA.hostname === zone.name) {
      \u8F93\u51FA.hostname = `${\u751F\u6210\u968F\u673A\u540D\u79F0("edge")}.${zone.name}`;
      \u8F93\u51FA.zoneName = zone.name;
    }
  }
  return \u8F93\u51FA;
}
async function \u8BFB\u53D6\u8D44\u6E90\u5217\u8868(\u51ED\u636E, accountId) {
  const [workerResult, pagesResult, kvResult] = await Promise.allSettled([
    \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/workers/scripts?per_page=100`),
    \u8BFB\u53D6Pages\u9879\u76EE\u5217\u8868(\u51ED\u636E, accountId),
    \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/storage/kv/namespaces?per_page=100`)
  ]);
  const warnings = [];
  const workers = \u63D0\u53D6\u5217\u8868(workerResult, warnings, "Worker").map((\u9879\u76EE) => ({ name: \u9879\u76EE.id || \u9879\u76EE.script_name || \u9879\u76EE.name, title: \u9879\u76EE.id || \u9879\u76EE.script_name || \u9879\u76EE.name })).filter((\u9879\u76EE) => \u9879\u76EE.name);
  const pages = \u63D0\u53D6\u5217\u8868(pagesResult, warnings, "Pages").map((\u9879\u76EE) => ({
    name: \u9879\u76EE.name,
    title: \u9879\u76EE.name,
    kvId: \u63D0\u53D6PagesKV(\u9879\u76EE),
    domains: \u9879\u76EE.domains || []
  })).filter((\u9879\u76EE) => \u9879\u76EE.name);
  const kvs = \u63D0\u53D6\u5217\u8868(kvResult, warnings, "KV").map((\u7A7A\u95F4) => ({ id: \u7A7A\u95F4.id, title: \u7A7A\u95F4.title })).filter((\u7A7A\u95F4) => \u7A7A\u95F4.id);
  return { workers, pages, kvs, warnings };
}
function \u63D0\u53D6PagesKV(\u9879\u76EE) {
  const \u914D\u7F6E = \u9879\u76EE?.deployment_configs || {};
  for (const \u73AF\u5883 of ["production", "preview"]) {
    const \u547D\u540D\u7A7A\u95F4 = \u914D\u7F6E[\u73AF\u5883]?.kv_namespaces || {};
    const \u7ED1\u5B9A = \u547D\u540D\u7A7A\u95F4[\u7ED1\u5B9A\u540D] || Object.values(\u547D\u540D\u7A7A\u95F4)[0];
    if (\u7ED1\u5B9A?.namespace_id) return \u7ED1\u5B9A.namespace_id;
    if (typeof \u7ED1\u5B9A === "string") return \u7ED1\u5B9A;
  }
  return "";
}
async function \u8BFB\u53D6Pages\u9879\u76EE\u5217\u8868(\u51ED\u636E, accountId) {
  try {
    return await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/pages/projects`);
  } catch (\u9519\u8BEF) {
    if (!String(\u9519\u8BEF.message || "").includes("Invalid list options")) throw \u9519\u8BEF;
    return await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/pages/projects?page=1`);
  }
}
function \u63D0\u53D6\u5217\u8868(result, warnings, label) {
  if (result.status === "fulfilled") return Array.isArray(result.value) ? result.value : [];
  warnings.push(`${label} \u5217\u8868\u8BFB\u53D6\u5931\u8D25: ${result.reason?.message || result.reason}`);
  return [];
}
function \u6821\u9A8C\u90E8\u7F72\u53C2\u6570(\u6570\u636E) {
  if (!\u6570\u636E?.credentials?.email || !\u6570\u636E?.credentials?.key) throw new Error("\u7F3A\u5C11 Cloudflare \u90AE\u7BB1\u6216 Global API Key");
  if (!\u6570\u636E.accountId) throw new Error("\u7F3A\u5C11 Account ID");
  if (\u6570\u636E.deployMode === "update" && !String(\u6570\u636E.projectName || "").trim()) throw new Error("\u66F4\u65B0\u73B0\u6709\u9879\u76EE\u65F6\u5FC5\u987B\u9009\u62E9\u9879\u76EE\u540D\u79F0");
  if (\u6570\u636E.deployMode === "update") return;
  if (\u6570\u636E.hostname && !\u6570\u636E.zoneId) throw new Error("\u7ED1\u5B9A\u57DF\u540D\u65F6\u5FC5\u987B\u9009\u62E9 Zone");
}
async function \u90E8\u7F72Worker(\u51ED\u636E, \u9009\u9879, context, \u8BB0\u5F55) {
  const \u4EE3\u7801 = await \u8BFB\u53D6\u6E90\u4EE3\u7801(\u9009\u9879.sourceMode, context, \u9009\u9879.files);
  const \u8868\u5355 = new FormData();
  const \u5143\u6570\u636E = {
    main_module: "worker.js",
    compatibility_date: \u517C\u5BB9\u65E5\u671F,
    bindings: [
      { type: "plain_text", name: "UUID", text: \u9009\u9879.uuid },
      { type: "kv_namespace", name: \u7ED1\u5B9A\u540D, namespace_id: \u9009\u9879.kvId }
    ]
  };
  \u8868\u5355.append("metadata", new Blob([JSON.stringify(\u5143\u6570\u636E)], { type: "application/json" }), "metadata.json");
  \u8868\u5355.append("worker.js", new Blob([\u4EE3\u7801], { type: "application/javascript+module" }), "worker.js");
  await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${\u9009\u9879.accountId}/workers/scripts/${encodeURIComponent(\u9009\u9879.scriptName)}`, {
    method: "PUT",
    body: \u8868\u5355
  });
  \u8BB0\u5F55("Worker \u811A\u672C\u4E0A\u4F20\u5B8C\u6210");
  if (\u9009\u9879.enableWorkersDev) {
    await \u542F\u7528WorkersDev(\u51ED\u636E, \u9009\u9879.accountId, \u9009\u9879.scriptName);
    \u8BB0\u5F55("workers.dev \u9ED8\u8BA4\u57DF\u540D\u5DF2\u542F\u7528");
  }
}
async function \u540C\u6B65Worker\u4EE3\u7801(\u51ED\u636E, \u9009\u9879, context, \u8BB0\u5F55) {
  const \u4EE3\u7801 = await \u8BFB\u53D6\u6E90\u4EE3\u7801(\u9009\u9879.sourceMode, context, \u9009\u9879.files);
  const \u8BBE\u7F6E = await \u8BFB\u53D6Worker\u8BBE\u7F6E(\u51ED\u636E, \u9009\u9879.accountId, \u9009\u9879.scriptName);
  const \u5143\u6570\u636E = \u751F\u6210\u4FDD\u7559Worker\u5143\u6570\u636E(\u8BBE\u7F6E);
  const \u8868\u5355 = new FormData();
  \u8868\u5355.append("metadata", new Blob([JSON.stringify(\u5143\u6570\u636E)], { type: "application/json" }), "metadata.json");
  \u8868\u5355.append("worker.js", new Blob([\u4EE3\u7801], { type: "application/javascript+module" }), "worker.js");
  await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${\u9009\u9879.accountId}/workers/scripts/${encodeURIComponent(\u9009\u9879.scriptName)}`, {
    method: "PUT",
    body: \u8868\u5355
  });
  \u8BB0\u5F55("Worker \u4EE3\u7801\u5DF2\u540C\u6B65\uFF0C\u73B0\u6709\u7ED1\u5B9A\u548C\u8BBE\u7F6E\u6309\u539F\u503C\u63D0\u4EA4");
}
async function \u8BFB\u53D6Worker\u8BBE\u7F6E(\u51ED\u636E, accountId, scriptName) {
  try {
    return await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/workers/scripts/${encodeURIComponent(scriptName)}/settings`);
  } catch (\u9519\u8BEF) {
    throw new Error(`\u8BFB\u53D6\u73B0\u6709 Worker \u8BBE\u7F6E\u5931\u8D25\uFF0C\u5DF2\u505C\u6B62\u66F4\u65B0\u4EE5\u907F\u514D\u8986\u76D6 KV/UUID \u914D\u7F6E: ${\u9519\u8BEF.message}`);
  }
}
function \u751F\u6210\u4FDD\u7559Worker\u5143\u6570\u636E(\u8BBE\u7F6E) {
  const \u5143\u6570\u636E = {};
  for (const \u5B57\u6BB5 of [
    "main_module",
    "compatibility_date",
    "compatibility_flags",
    "bindings",
    "migrations",
    "usage_model",
    "limits",
    "placement",
    "tail_consumers",
    "logpush"
  ]) {
    if (\u8BBE\u7F6E?.[\u5B57\u6BB5] !== void 0 && \u8BBE\u7F6E?.[\u5B57\u6BB5] !== null) \u5143\u6570\u636E[\u5B57\u6BB5] = \u8BBE\u7F6E[\u5B57\u6BB5];
  }
  if (!\u5143\u6570\u636E.main_module) \u5143\u6570\u636E.main_module = "worker.js";
  if (!\u5143\u6570\u636E.compatibility_date) throw new Error("\u65E0\u6CD5\u8BFB\u53D6\u73B0\u6709 Worker compatibility_date\uFF0C\u5DF2\u505C\u6B62\u66F4\u65B0\u4EE5\u907F\u514D\u4FEE\u6539\u914D\u7F6E");
  if (!Array.isArray(\u5143\u6570\u636E.bindings)) throw new Error("\u65E0\u6CD5\u8BFB\u53D6\u73B0\u6709 Worker \u7ED1\u5B9A\uFF0C\u5DF2\u505C\u6B62\u66F4\u65B0\u4EE5\u907F\u514D\u8986\u76D6 KV/UUID \u914D\u7F6E");
  return \u5143\u6570\u636E;
}
async function \u90E8\u7F72Pages(\u51ED\u636E, \u9009\u9879, context, \u8BB0\u5F55) {
  const \u9879\u76EE = await \u521B\u5EFA\u6216\u66F4\u65B0Pages\u9879\u76EE(\u51ED\u636E, \u9009\u9879, \u8BB0\u5F55);
  const \u4EE3\u7801 = await \u8BFB\u53D6\u6E90\u4EE3\u7801(\u9009\u9879.sourceMode, context, \u9009\u9879.files);
  await \u4E0A\u4F20Pages\u90E8\u7F72(\u51ED\u636E, \u9009\u9879.accountId, \u9009\u9879.projectName, \u4EE3\u7801, \u9009\u9879.files, \u8BB0\u5F55);
  \u8BB0\u5F55(`Pages \u9879\u76EE\u5DF2\u914D\u7F6E: ${\u9879\u76EE.name}`);
  \u8BB0\u5F55("Pages \u90E8\u7F72\u4E0A\u4F20\u5B8C\u6210");
}
async function \u540C\u6B65Pages\u4EE3\u7801(\u51ED\u636E, \u9009\u9879, context, \u8BB0\u5F55) {
  try {
    await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${\u9009\u9879.accountId}/pages/projects/${encodeURIComponent(\u9009\u9879.projectName)}`);
  } catch (\u9519\u8BEF) {
    if (String(\u9519\u8BEF.message).includes("404")) throw new Error(`\u627E\u4E0D\u5230\u73B0\u6709 Pages \u9879\u76EE: ${\u9009\u9879.projectName}`);
    throw \u9519\u8BEF;
  }
  const \u4EE3\u7801 = await \u8BFB\u53D6\u6E90\u4EE3\u7801(\u9009\u9879.sourceMode, context, \u9009\u9879.files);
  \u8BB0\u5F55("Pages \u66F4\u65B0\u6A21\u5F0F\u4E0D\u4FEE\u6539 KV/\u53D8\u91CF/\u57DF\u540D\u914D\u7F6E");
  await \u4E0A\u4F20Pages\u90E8\u7F72(\u51ED\u636E, \u9009\u9879.accountId, \u9009\u9879.projectName, \u4EE3\u7801, \u9009\u9879.files, \u8BB0\u5F55);
  \u8BB0\u5F55("Pages \u4EE3\u7801\u540C\u6B65\u5B8C\u6210");
}
async function \u4E0A\u4F20Pages\u90E8\u7F72(\u51ED\u636E, accountId, projectName, workerCode, files, \u8BB0\u5F55) {
  const manifest = await \u4E0A\u4F20Pages\u9759\u6001\u8D44\u6E90(\u51ED\u636E, accountId, projectName, files, \u8BB0\u5F55);
  const \u8868\u5355 = new FormData();
  \u8868\u5355.append("manifest", JSON.stringify(manifest));
  \u8868\u5355.append("branch", "main");
  \u8868\u5355.append("commit_dirty", "true");
  \u8868\u5355.append("commit_message", "deploy from hosted deployer");
  const workerBundle = await \u751F\u6210WorkerBundle(workerCode);
  \u8868\u5355.append("_worker.bundle", workerBundle, "_worker.bundle");
  const deployment = await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/pages/projects/${encodeURIComponent(projectName)}/deployments`, {
    method: "POST",
    body: \u8868\u5355
  });
  if (deployment?.url) \u8BB0\u5F55(`Pages \u5730\u5740: ${deployment.url}`);
}
async function \u4E0A\u4F20Pages\u9759\u6001\u8D44\u6E90(\u51ED\u636E, accountId, projectName, files, \u8BB0\u5F55) {
  const { jwt } = await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/pages/projects/${encodeURIComponent(projectName)}/upload-token`);
  const \u8D44\u6E90\u5217\u8868 = [];
  if (files) {
    \u8BB0\u5F55(`\u51C6\u5907\u4E0A\u4F20 ${files.length} \u4E2A\u9759\u6001\u8D44\u6E90`);
    for (const \u9879 of files) {
      const \u6269\u5C55 = \u63D0\u53D6\u6269\u5C55\u540D(\u9879.path);
      const hash = await \u8BA1\u7B97\u8D44\u6E90Hash(\u9879.bytes, \u6269\u5C55);
      \u8D44\u6E90\u5217\u8868.push({ path: \u9879.path, hash, bytes: \u9879.bytes, ext: \u6269\u5C55 });
    }
  } else {
    const \u5185\u5BB9 = '<!doctype html><meta charset="utf-8"><title>Deploy</title>';
    const \u5B57\u8282 = new TextEncoder().encode(\u5185\u5BB9);
    const hash = await \u8BA1\u7B97\u8D44\u6E90Hash(\u5B57\u8282, "html");
    \u8D44\u6E90\u5217\u8868.push({ path: "/index.html", hash, bytes: \u5B57\u8282, ext: "html" });
  }
  const hashes = \u8D44\u6E90\u5217\u8868.map((\u9879) => \u9879.hash);
  const missing = await \u8C03\u7528JWT\u63A5\u53E3(jwt, "/pages/assets/check-missing", {
    method: "POST",
    body: { hashes }
  });
  const \u9700\u8981\u4E0A\u4F20 = new Set(Array.isArray(missing) ? missing : hashes);
  const \u4E0A\u4F20\u8D1F\u8F7D = [];
  for (const \u9879 of \u8D44\u6E90\u5217\u8868) {
    if (!\u9700\u8981\u4E0A\u4F20.has(\u9879.hash)) continue;
    \u4E0A\u4F20\u8D1F\u8F7D.push({
      key: \u9879.hash,
      value: \u5B57\u8282\u8F6CBase64(\u9879.bytes),
      metadata: { contentType: \u5185\u5BB9\u7C7B\u578B(\u9879.ext) },
      base64: true
    });
  }
  for (let index = 0; index < \u4E0A\u4F20\u8D1F\u8F7D.length; index += 50) {
    await \u8C03\u7528JWT\u63A5\u53E3(jwt, "/pages/assets/upload", {
      method: "POST",
      body: \u4E0A\u4F20\u8D1F\u8F7D.slice(index, index + 50)
    });
  }
  if (\u4E0A\u4F20\u8D1F\u8F7D.length) \u8BB0\u5F55(`\u5DF2\u4E0A\u4F20 ${\u4E0A\u4F20\u8D1F\u8F7D.length} \u4E2A\u8D44\u6E90\uFF08\u8DF3\u8FC7 ${\u8D44\u6E90\u5217\u8868.length - \u4E0A\u4F20\u8D1F\u8F7D.length} \u4E2A\u5DF2\u5B58\u5728\uFF09`);
  await \u8C03\u7528JWT\u63A5\u53E3(jwt, "/pages/assets/upsert-hashes", {
    method: "POST",
    body: { hashes }
  }).catch(() => null);
  const manifest = {};
  for (const \u9879 of \u8D44\u6E90\u5217\u8868) manifest[\u9879.path] = \u9879.hash;
  return manifest;
}
function \u63D0\u53D6\u6269\u5C55\u540D(path) {
  const \u5339\u914D = /\.([a-z0-9]+)$/i.exec(String(path || ""));
  return \u5339\u914D ? \u5339\u914D[1].toLowerCase() : "txt";
}
function \u5185\u5BB9\u7C7B\u578B(ext) {
  const \u6620\u5C04 = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    mjs: "application/javascript; charset=utf-8",
    css: "text/css; charset=utf-8",
    json: "application/json; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    wasm: "application/wasm",
    pdf: "application/pdf",
    xml: "application/xml"
  };
  return \u6620\u5C04[ext] || "application/octet-stream";
}
async function \u751F\u6210WorkerBundle(workerCode) {
  const \u5185\u5C42 = new FormData();
  const \u5143\u6570\u636E = {
    main_module: "worker.js",
    compatibility_date: \u517C\u5BB9\u65E5\u671F
  };
  \u5185\u5C42.set("metadata", JSON.stringify(\u5143\u6570\u636E));
  \u5185\u5C42.set("worker.js", new Blob([workerCode], { type: "application/javascript+module" }), "worker.js");
  return await new Response(\u5185\u5C42).blob();
}
async function \u521B\u5EFA\u6216\u66F4\u65B0Pages\u9879\u76EE(\u51ED\u636E, \u9009\u9879, \u8BB0\u5F55) {
  let \u9879\u76EE = null;
  try {
    \u9879\u76EE = await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${\u9009\u9879.accountId}/pages/projects/${encodeURIComponent(\u9009\u9879.projectName)}`);
  } catch (\u9519\u8BEF) {
    if (!String(\u9519\u8BEF.message).includes("404")) throw \u9519\u8BEF;
  }
  if (!\u9879\u76EE) {
    \u9879\u76EE = await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${\u9009\u9879.accountId}/pages/projects`, {
      method: "POST",
      body: {
        name: \u9009\u9879.projectName,
        production_branch: "main",
        deployment_configs: \u751F\u6210Pages\u914D\u7F6E(\u9009\u9879)
      }
    });
    \u8BB0\u5F55("Pages \u9879\u76EE\u5DF2\u521B\u5EFA");
    return \u9879\u76EE;
  }
  await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${\u9009\u9879.accountId}/pages/projects/${encodeURIComponent(\u9009\u9879.projectName)}`, {
    method: "PATCH",
    body: { deployment_configs: \u5408\u5E76Pages\u914D\u7F6E(\u9879\u76EE.deployment_configs || {}, \u9009\u9879) }
  });
  \u8BB0\u5F55("Pages \u9879\u76EE\u914D\u7F6E\u5DF2\u66F4\u65B0");
  return \u9879\u76EE;
}
function \u751F\u6210Pages\u914D\u7F6E(\u9009\u9879) {
  const \u5355\u9879 = {
    compatibility_date: \u517C\u5BB9\u65E5\u671F,
    env_vars: { UUID: { type: "plain_text", value: \u9009\u9879.uuid } },
    kv_namespaces: { [\u7ED1\u5B9A\u540D]: { namespace_id: \u9009\u9879.kvId } }
  };
  return { production: \u5355\u9879, preview: \u5355\u9879 };
}
function \u5408\u5E76Pages\u914D\u7F6E(\u5DF2\u6709, \u9009\u9879) {
  const \u8F93\u51FA = structuredClone(\u5DF2\u6709 || {});
  for (const \u540D\u79F0 of ["production", "preview"]) {
    \u8F93\u51FA[\u540D\u79F0] = \u8F93\u51FA[\u540D\u79F0] || {};
    \u8F93\u51FA[\u540D\u79F0].compatibility_date = \u517C\u5BB9\u65E5\u671F;
    \u8F93\u51FA[\u540D\u79F0].env_vars = \u8F93\u51FA[\u540D\u79F0].env_vars || {};
    \u8F93\u51FA[\u540D\u79F0].env_vars.UUID = { type: "plain_text", value: \u9009\u9879.uuid };
    \u8F93\u51FA[\u540D\u79F0].kv_namespaces = \u8F93\u51FA[\u540D\u79F0].kv_namespaces || {};
    \u8F93\u51FA[\u540D\u79F0].kv_namespaces[\u7ED1\u5B9A\u540D] = { namespace_id: \u9009\u9879.kvId };
  }
  return \u8F93\u51FA;
}
async function \u83B7\u53D6\u6216\u521B\u5EFAKV(\u51ED\u636E, accountId, \u9009\u9879, \u8BB0\u5F55) {
  const \u5217\u8868 = await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/storage/kv/namespaces?per_page=100`);
  if (\u9009\u9879.id) {
    const \u5DF2\u9009 = \u5217\u8868.find((\u9879) => \u9879.id === \u9009\u9879.id);
    if (\u5DF2\u9009) {
      \u8BB0\u5F55(`\u590D\u7528 KV: ${\u5DF2\u9009.title}`);
      return { ...\u5DF2\u9009, created: false };
    }
    \u8BB0\u5F55(`\u4F7F\u7528\u6307\u5B9A KV: ${\u9009\u9879.id}`);
    return { id: \u9009\u9879.id, title: \u9009\u9879.title || \u9009\u9879.id, created: false };
  }
  const \u6807\u9898 = \u9009\u9879.title;
  const \u5DF2\u6709 = \u5217\u8868.find((\u9879) => \u9879.title === \u6807\u9898);
  if (\u5DF2\u6709) {
    \u8BB0\u5F55(`\u590D\u7528 KV: ${\u6807\u9898}`);
    return { ...\u5DF2\u6709, created: false };
  }
  const \u521B\u5EFA\u7ED3\u679C = await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/storage/kv/namespaces`, {
    method: "POST",
    body: { title: \u6807\u9898 }
  });
  \u8BB0\u5F55(`\u521B\u5EFA KV: ${\u6807\u9898}`);
  return { ...\u521B\u5EFA\u7ED3\u679C, title: \u6807\u9898, created: true };
}
async function \u521D\u59CB\u5316KV(\u51ED\u636E, accountId, namespaceId, uuid, \u8BB0\u5F55) {
  const \u521D\u59CB\u914D\u7F6E = JSON.stringify({ uuid: String(uuid || "").trim().toLowerCase() });
  await \u8C03\u7528\u539F\u59CB\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/cf_terminal_cfg`, {
    method: "PUT",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: \u521D\u59CB\u914D\u7F6E
  });
  await \u8C03\u7528\u539F\u59CB\u63A5\u53E3(\u51ED\u636E, `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/cf_terminal_ips`, {
    method: "PUT",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: "[]"
  });
  \u8BB0\u5F55("KV \u5DF2\u5199\u5165\u661F\u4E91\u89E3\u7801\u521D\u59CB\u914D\u7F6E\uFF08UUID \u5DF2\u56FA\u5316\uFF09");
}
async function \u542F\u7528WorkersDev(\u51ED\u636E, accountId, scriptName) {
  const \u8DEF\u5F84 = `/accounts/${accountId}/workers/scripts/${encodeURIComponent(scriptName)}/subdomain`;
  try {
    await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, \u8DEF\u5F84, { method: "POST", body: { enabled: true } });
  } catch {
    await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, \u8DEF\u5F84, { method: "PUT", body: { enabled: true } });
  }
}
async function \u7ED1\u5B9A\u57DF\u540D(\u51ED\u636E, \u9009\u9879, \u8BB0\u5F55) {
  if (\u9009\u9879.deployType === "pages") {
    const \u7ED3\u679C = await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${\u9009\u9879.accountId}/pages/projects/${encodeURIComponent(\u9009\u9879.projectName)}/domains`, {
      method: "POST",
      body: { name: \u9009\u9879.hostname }
    });
    \u8BB0\u5F55(`Pages \u57DF\u540D\u5DF2\u7ED1\u5B9A: ${\u9009\u9879.hostname}`);
    try {
      await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/zones/${\u9009\u9879.zoneId}/dns_records`, {
        method: "POST",
        body: { type: "CNAME", name: \u9009\u9879.hostname, content: `${\u9009\u9879.projectName}.pages.dev`, proxied: true }
      });
      \u8BB0\u5F55(`CNAME \u8BB0\u5F55\u5DF2\u521B\u5EFA: ${\u9009\u9879.hostname} \u2192 ${\u9009\u9879.projectName}.pages.dev`);
    } catch (dns\u9519\u8BEF) {
      \u8BB0\u5F55(`CNAME \u8BB0\u5F55\u521B\u5EFA\u8DF3\u8FC7(\u53EF\u80FD\u5DF2\u5B58\u5728): ${dns\u9519\u8BEF.message}`);
    }
    return { hostname: \u7ED3\u679C.name || \u9009\u9879.hostname, type: "pages" };
  }
  const \u8BF7\u6C42\u4F53 = {
    environment: "production",
    hostname: \u9009\u9879.hostname,
    service: \u9009\u9879.projectName,
    zone_id: \u9009\u9879.zoneId
  };
  try {
    const \u7ED3\u679C = await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${\u9009\u9879.accountId}/workers/domains`, {
      method: "PUT",
      body: \u8BF7\u6C42\u4F53
    });
    \u8BB0\u5F55(`Worker \u81EA\u5B9A\u4E49\u57DF\u540D\u5DF2\u7ED1\u5B9A: ${\u9009\u9879.hostname}`);
    return { hostname: \u7ED3\u679C.hostname || \u9009\u9879.hostname, type: "worker" };
  } catch (\u9519\u8BEF) {
    await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/zones/${\u9009\u9879.zoneId}/workers/routes`, {
      method: "POST",
      body: { pattern: `${\u9009\u9879.hostname}/*`, script: \u9009\u9879.projectName }
    });
    \u8BB0\u5F55(`Worker Route \u5DF2\u7ED1\u5B9A: ${\u9009\u9879.hostname}/*`);
    return { hostname: \u9009\u9879.hostname, type: "route", warning: \u9519\u8BEF.message };
  }
}
async function \u5217\u51FA\u7ED1\u5B9A\u57DF\u540D(\u51ED\u636E, \u9009\u9879, \u8BB0\u5F55) {
  try {
    if (\u9009\u9879.deployType === "pages") {
      const \u5217\u88682 = await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${\u9009\u9879.accountId}/pages/projects/${encodeURIComponent(\u9009\u9879.projectName)}/domains`);
      return \u5217\u88682.map((\u9879) => ({ hostname: \u9879.name || \u9879.hostname, status: \u9879.status || "" }));
    }
    const \u5217\u8868 = await \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, `/accounts/${\u9009\u9879.accountId}/workers/domains?per_page=100`);
    return \u5217\u8868.filter((\u9879) => \u9879.service === \u9009\u9879.projectName || \u9879.script === \u9009\u9879.projectName).map((\u9879) => ({ hostname: \u9879.hostname || \u9879.domain, status: \u9879.status || "" }));
  } catch (\u9519\u8BEF) {
    \u8BB0\u5F55(`\u57DF\u540D\u5217\u8868\u8BFB\u53D6\u5931\u8D25: ${\u9519\u8BEF.message}`);
    return [];
  }
}
function \u89E3\u6790\u4E0A\u4F20\u6587\u4EF6(files) {
  if (!Array.isArray(files) || !files.length) return null;
  const \u8F93\u51FA = [];
  for (const \u9879 of files) {
    const \u8DEF\u5F84 = \u89C4\u8303\u5316\u8D44\u6E90\u8DEF\u5F84(\u9879?.path);
    if (!\u8DEF\u5F84 || typeof \u9879?.base64 !== "string") continue;
    \u8F93\u51FA.push({ path: \u8DEF\u5F84, bytes: Base64\u8F6C\u5B57\u8282(\u9879.base64) });
  }
  return \u8F93\u51FA.length ? \u8F93\u51FA : null;
}
function \u89C4\u8303\u5316\u8D44\u6E90\u8DEF\u5F84(path) {
  if (!path) return "";
  const \u6E05\u7406 = String(path).replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, "");
  if (!\u6E05\u7406 || \u6E05\u7406.includes("..") || \u6E05\u7406.endsWith("/")) return "";
  return `/${\u6E05\u7406}`;
}
function Base64\u8F6C\u5B57\u8282(base64) {
  const \u4E8C\u8FDB\u5236 = atob(base64);
  const \u5B57\u8282 = new Uint8Array(\u4E8C\u8FDB\u5236.length);
  for (let index = 0; index < \u4E8C\u8FDB\u5236.length; index++) \u5B57\u8282[index] = \u4E8C\u8FDB\u5236.charCodeAt(index);
  return \u5B57\u8282;
}
function \u67E5\u627E\u5165\u53E3\u6587\u4EF6(files) {
  if (!files) return null;
  const \u5019\u9009 = files.find((\u9879) => \u9879.path.toLowerCase() === "/_worker.js") || files.find((\u9879) => \u9879.path.toLowerCase().endsWith("/_worker.js")) || files.find((\u9879) => \u9879.path.toLowerCase().endsWith(".js") && /worker/i.test(\u9879.path));
  return \u5019\u9009 ? new TextDecoder().decode(\u5019\u9009.bytes) : null;
}
async function \u8BFB\u53D6\u6E90\u4EE3\u7801(mode, context, files) {
  if (files) {
    const \u5165\u53E3 = \u67E5\u627E\u5165\u53E3\u6587\u4EF6(files);
    if (!\u5165\u53E3) throw new Error("\u4E0A\u4F20\u7684\u538B\u7F29\u5305\u4E2D\u672A\u627E\u5230 _worker.js\uFF0C\u65E0\u6CD5\u4F5C\u4E3A Pages \u9AD8\u7EA7\u6A21\u5F0F\u811A\u672C\u90E8\u7F72");
    return \u5165\u53E3;
  }
  const \u6587\u4EF6\u540D = "_worker.js";
  const \u8FDC\u7A0B\u5730\u5740 = `${\u6E90\u7801\u8FDC\u7A0B\u57FA\u7840}/${encodeURIComponent(\u6587\u4EF6\u540D)}?t=${Date.now()}`;
  const \u54CD\u5E94 = await fetch(\u8FDC\u7A0B\u5730\u5740, {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache"
    }
  });
  if (!\u54CD\u5E94.ok) throw new Error(`\u5B9E\u65F6\u62C9\u53D6\u6E90\u6587\u4EF6\u5931\u8D25: ${\u54CD\u5E94.status} ${\u54CD\u5E94.statusText}`);
  const \u5185\u5BB9 = await \u54CD\u5E94.text();
  if (!\u5185\u5BB9.trim()) throw new Error("\u5B9E\u65F6\u62C9\u53D6\u6E90\u6587\u4EF6\u5931\u8D25: \u8FDC\u7A0B\u6E90\u6587\u4EF6\u4E3A\u7A7A");
  return \u5185\u5BB9;
}
async function \u8C03\u7528\u63A5\u53E3(\u51ED\u636E, \u8DEF\u5F84, \u9009\u9879 = {}) {
  const \u54CD\u5E94\u4F53 = await \u8C03\u7528\u539F\u59CB\u63A5\u53E3(\u51ED\u636E, \u8DEF\u5F84, \u9009\u9879);
  if (\u54CD\u5E94\u4F53 && typeof \u54CD\u5E94\u4F53 === "object" && "success" in \u54CD\u5E94\u4F53) {
    if (!\u54CD\u5E94\u4F53.success) {
      const \u6D88\u606F = (\u54CD\u5E94\u4F53.errors || []).map((\u9519\u8BEF) => \u9519\u8BEF.message || JSON.stringify(\u9519\u8BEF)).join("; ") || "Cloudflare API \u8BF7\u6C42\u5931\u8D25";
      const \u5F02\u5E38 = new Error(\u6D88\u606F);
      \u5F02\u5E38.response = \u54CD\u5E94\u4F53;
      throw \u5F02\u5E38;
    }
    return \u54CD\u5E94\u4F53.result;
  }
  return \u54CD\u5E94\u4F53;
}
async function \u8C03\u7528\u539F\u59CB\u63A5\u53E3(\u51ED\u636E, \u8DEF\u5F84, \u9009\u9879 = {}) {
  const headers = {
    "X-Auth-Email": \u51ED\u636E.email,
    "X-Auth-Key": \u51ED\u636E.key,
    ...\u9009\u9879.headers || {}
  };
  return await \u8BF7\u6C42JSON(`${\u63A5\u53E3\u5730\u5740}${\u8DEF\u5F84}`, headers, \u9009\u9879);
}
async function \u8C03\u7528JWT\u63A5\u53E3(jwt, \u8DEF\u5F84, \u9009\u9879 = {}) {
  const headers = {
    Authorization: `Bearer ${jwt}`,
    ...\u9009\u9879.headers || {}
  };
  return await \u8BF7\u6C42JSON(`${\u63A5\u53E3\u5730\u5740}${\u8DEF\u5F84}`, headers, \u9009\u9879);
}
async function \u8BF7\u6C42JSON(\u5730\u5740, headers, \u9009\u9879 = {}) {
  let body = \u9009\u9879.body;
  if (body && !(body instanceof FormData) && typeof body !== "string") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    body = JSON.stringify(body);
  }
  const \u54CD\u5E94 = await fetch(\u5730\u5740, {
    method: \u9009\u9879.method || "GET",
    headers,
    body
  });
  const contentType = \u54CD\u5E94.headers.get("content-type") || "";
  const \u54CD\u5E94\u4F53 = contentType.includes("application/json") ? await \u54CD\u5E94.json() : await \u54CD\u5E94.text();
  if (!\u54CD\u5E94.ok) {
    const \u6D88\u606F = typeof \u54CD\u5E94\u4F53 === "string" ? \u54CD\u5E94\u4F53 : (\u54CD\u5E94\u4F53.errors || []).map((\u9519\u8BEF) => \u9519\u8BEF.message || JSON.stringify(\u9519\u8BEF)).join("; ");
    throw new Error(`${\u54CD\u5E94.status} ${\u54CD\u5E94.statusText}${\u6D88\u606F ? ` - ${\u6D88\u606F}` : ""}`);
  }
  if (\u54CD\u5E94\u4F53 && typeof \u54CD\u5E94\u4F53 === "object" && "success" in \u54CD\u5E94\u4F53) {
    if (!\u54CD\u5E94\u4F53.success) {
      const \u6D88\u606F = (\u54CD\u5E94\u4F53.errors || []).map((\u9519\u8BEF) => \u9519\u8BEF.message || JSON.stringify(\u9519\u8BEF)).join("; ") || "Cloudflare API \u8BF7\u6C42\u5931\u8D25";
      throw new Error(\u6D88\u606F);
    }
    return \u54CD\u5E94\u4F53.result;
  }
  return \u54CD\u5E94\u4F53;
}
async function \u8BA1\u7B97\u8D44\u6E90Hash(bytes, extension) {
  const \u6458\u8981 = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${\u5B57\u8282\u8F6CBase64(bytes)}${extension}`));
  return [...new Uint8Array(\u6458\u8981)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
function \u5B57\u8282\u8F6CBase64(bytes) {
  let \u4E8C\u8FDB\u5236 = "";
  const \u6B65\u957F = 32768;
  for (let index = 0; index < bytes.length; index += \u6B65\u957F) {
    \u4E8C\u8FDB\u5236 += String.fromCharCode(...bytes.slice(index, index + \u6B65\u957F));
  }
  return btoa(\u4E8C\u8FDB\u5236);
}
function \u8FD4\u56DEJSON(\u72B6\u6001\u7801, \u6570\u636E) {
  return new Response(JSON.stringify(\u6570\u636E), {
    status: \u72B6\u6001\u7801,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
function \u6E05\u7406\u9879\u76EE\u540D(\u540D\u79F0) {
  return String(\u540D\u79F0 || \u751F\u6210\u968F\u673A\u540D\u79F0("edge")).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || \u751F\u6210\u968F\u673A\u540D\u79F0("edge");
}
function \u751F\u6210\u968F\u673A\u540D\u79F0(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

// src/tunnel.js
var CONFIG_DEFAULTS = {
  CF_API_TOKEN: "",
  // [必填] API 令牌, 权限参考上述说明
  CF_ACCOUNT_ID: "",
  // [必填] Cloudflare 账户 ID,创建token时会提示
  PASSWORD: "",
  // [必填] 面板登录密码, 至少 6 位
  SESSION_SECRET: "",
  // [可选] 会话签名密钥, 填一串随机字符; 留空则自动由 PASSWORD 派生
  DEFAULT_SERVICE: "http://localhost:8001",
  // [可选] 新建/编辑隧道的默认本地服务地址, 默认 http://localhost:8001
  TG_BOT_TOKEN: "",
  // [可选] Telegram 机器人 Token; 也可在面板"Telegram 配置"里保存到 KV
  TG_CHAT_ID: ""
  // [可选] Telegram 接收者 chat_id: 私聊填自己的正数 ID, 群组填负数
};
function applyConfig(env) {
  const out = Object.assign({}, env);
  for (const k of Object.keys(CONFIG_DEFAULTS)) {
    const v = String(CONFIG_DEFAULTS[k] || "").trim();
    if (v) out[k] = v;
  }
  return out;
}
var API = "https://api.cloudflare.com/client/v4";
var ZH_ERRORS = [
  [/already have a tunnel with this name/i, "\u5DF2\u5B58\u5728\u540C\u540D\u96A7\u9053,\u8BF7\u5220\u9664\u539F\u96A7\u9053\u6216\u6362\u4E00\u4E2A\u540D\u79F0"],
  [
    /authentication error|valid user-level authentication|invalid api token|unauthorized/i,
    "API \u4EE4\u724C\u65E0\u6548\u6216\u6743\u9650\u4E0D\u8DB3,\u8BF7\u786E\u8BA4\u5DF2\u6388\u4E88:\u5E10\u6237 Cloudflare Tunnel \u7F16\u8F91\u3001\u533A\u57DF DNS \u7F16\u8F91\u3001\u533A\u57DF \u533A\u57DF \u8BFB\u53D6"
  ],
  [
    /invalid format for authorization header|invalid request headers/i,
    "API \u4EE4\u724C\u683C\u5F0F\u4E0D\u6B63\u786E,\u8BF7\u68C0\u67E5 CF_API_TOKEN \u662F\u5426\u590D\u5236\u5B8C\u6574"
  ],
  [/could not route|object identifier is invalid/i, "\u8D26\u6237 ID \u6216\u533A\u57DF ID \u4E0D\u6B63\u786E,\u8BF7\u68C0\u67E5 CF_ACCOUNT_ID"],
  [/record with that host already exists/i, "\u8BE5\u57DF\u540D\u5DF2\u5B58\u5728\u5176\u4ED6 DNS \u8BB0\u5F55,\u8BF7\u5148\u5230 DNS \u9875\u9762\u5220\u9664\u540E\u518D\u8BD5"],
  [/rate limit|too many requests/i, "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41,\u8BF7\u7A0D\u540E\u518D\u8BD5"],
  [/active connections|cannot delete tunnel/i, "\u96A7\u9053\u4ECD\u6709\u6D3B\u8DC3\u8FDE\u63A5,\u8BF7\u5148\u505C\u6B62 cloudflared \u518D\u5220\u9664"],
  [/tunnel.*not found/i, "\u96A7\u9053\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664"]
];
function zhError(errors) {
  if (!Array.isArray(errors) || !errors.length) return "Cloudflare \u8FD4\u56DE\u4E86\u672A\u77E5\u9519\u8BEF";
  return errors.map((e) => {
    const msg = String(e && e.message || "");
    for (const [re, zh] of ZH_ERRORS) if (re.test(msg)) return zh;
    return "Cloudflare \u8FD4\u56DE\u9519\u8BEF" + (e && e.code ? " (" + e.code + ")" : "") + ": " + msg;
  }).join(";");
}
async function cf(env, path, method = "GET", body) {
  const token = env.cfToken || env.CF_API_TOKEN;
  const r = await fetch(API + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : void 0
  });
  let j;
  try {
    j = await r.json();
  } catch (e) {
    throw new Error("Cloudflare \u8FD4\u56DE\u4E86\u65E0\u6CD5\u89E3\u6790\u7684\u54CD\u5E94 (HTTP " + r.status + ")");
  }
  if (!j.success) throw new Error(zhError(j.errors));
  return j.result;
}
async function resolveAccountName(token, accId) {
  try {
    const a = await cf({ cfToken: token }, `/accounts/${accId}`);
    if (a && a.name) return String(a.name);
  } catch (e) {
  }
  try {
    const zones = await cf({ cfToken: token }, `/zones?per_page=50`);
    if (Array.isArray(zones)) {
      const z = zones.find(
        (zone) => zone && zone.account && String(zone.account.id).toLowerCase() === String(accId).toLowerCase()
      );
      if (z && z.account.name) return String(z.account.name);
    }
  } catch (e) {
  }
  return null;
}
function b64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
async function listZones(env) {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const r = await cf(env, `/zones?per_page=50&page=${page}&status=active`);
    all.push(...r.map((z) => ({ id: z.id, name: z.name })));
    if (r.length < 50) break;
  }
  return all;
}
async function cleanDns(env, tunnelId, hosts) {
  let dns = 0;
  let dnsFailed = false;
  let dnsErr = "";
  if (!hosts.length) return { dns, dnsFailed, dnsErr };
  try {
    const zones = await listZones(env);
    const target = tunnelId + ".cfargotunnel.com";
    for (const h of new Set(hosts)) {
      const zone = zoneForHost(zones, h);
      if (!zone) continue;
      const recs = await cf(env, `/zones/${zone.id}/dns_records?type=CNAME&name=${encodeURIComponent(h)}`);
      for (const r of recs) {
        if (r.content === target) {
          await cf(env, `/zones/${zone.id}/dns_records/${r.id}`, "DELETE");
          dns++;
        }
      }
    }
  } catch (e) {
    dnsFailed = true;
    dnsErr = String(e && e.message || e);
  }
  return { dns, dnsFailed, dnsErr };
}
async function checkHost(env, zoneId, hostname, tunnelId) {
  const exist = await cf(env, `/zones/${zoneId}/dns_records?name=${encodeURIComponent(hostname)}`);
  const target = tunnelId ? tunnelId + ".cfargotunnel.com" : "";
  const others = exist.filter((r) => !(target && r.type === "CNAME" && r.content === target));
  if (others.length) {
    const desc = others.map((r) => r.type + (/\.cfargotunnel\.com$/.test(r.content) ? " (\u5176\u4ED6\u96A7\u9053)" : " \u2192 " + r.content)).join(", ");
    throw new Error(`\u57DF\u540D ${hostname} \u5DF2\u6709 DNS \u8BB0\u5F55: ${desc}\u3002\u4E3A\u907F\u514D\u8986\u76D6\u5DF2\u505C\u6B62,\u8BF7\u5148\u5230 DNS \u9875\u9762\u5220\u9664\u6216\u6362\u4E00\u4E2A\u5B50\u57DF\u540D`);
  }
  return exist.length > 0;
}
async function upsertCname(env, zoneId, hostname, tunnelId) {
  if (await checkHost(env, zoneId, hostname, tunnelId)) return;
  await cf(env, `/zones/${zoneId}/dns_records`, "POST", {
    type: "CNAME",
    name: hostname,
    content: tunnelId + ".cfargotunnel.com",
    proxied: true
  });
}
function zoneForHost(zones, host) {
  return zones.filter((z) => host === z.name || host.endsWith("." + z.name)).sort((a, b) => b.name.length - a.name.length)[0];
}
async function getRules(env, base, id) {
  const c = await cf(env, `${base}/${id}/configurations`);
  const config = c && c.config || {};
  return { config, ingress: (config.ingress || []).slice() };
}
async function createTunnel(env, { name, zoneId, sub, path, service }) {
  const acc = env.cfAcc || env.CF_ACCOUNT_ID;
  const zone = await cf(env, `/zones/${zoneId}`);
  const hostname = sub ? `${sub}.${zone.name}` : zone.name;
  await checkHost(env, zoneId, hostname, "");
  const secret = b64(crypto.getRandomValues(new Uint8Array(32)));
  const tunnel = await cf(env, `/accounts/${acc}/cfd_tunnel`, "POST", {
    name,
    tunnel_secret: secret,
    config_src: "cloudflare"
  });
  const rule = { hostname, service };
  if (path) rule.path = path;
  try {
    await cf(env, `/accounts/${acc}/cfd_tunnel/${tunnel.id}/configurations`, "PUT", {
      config: { ingress: [rule, { service: "http_status:404" }] }
    });
    await upsertCname(env, zoneId, hostname, tunnel.id);
  } catch (e) {
    await cf(env, `/accounts/${acc}/cfd_tunnel/${tunnel.id}`, "DELETE").catch(() => {
    });
    throw e;
  }
  return {
    id: tunnel.id,
    name,
    hostname,
    path: path || "",
    service,
    token: btoa(JSON.stringify({ a: acc, t: tunnel.id, s: secret }))
  };
}
var ICON192 = "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";
var ICON512 = "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";
var bin = (b642) => Uint8Array.from(atob(b642), (c) => c.charCodeAt(0));
function pwaResponse(path) {
  if (path === "/icon-192.png" || path === "/icon-512.png")
    return new Response(bin(path === "/icon-192.png" ? ICON192 : ICON512), {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" }
    });
  if (path === "/manifest.json")
    return new Response(
      JSON.stringify({
        name: "Cloudflare domain-Tunnel \u7BA1\u7406\u9762\u677F",
        short_name: "CF\u96A7\u9053",
        start_url: "/tunnel/",
        scope: "/tunnel/",
        display: "standalone",
        background_color: "#f6821f",
        theme_color: "#f6821f",
        icons: [
          { src: "/tunnel/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/tunnel/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      }),
      { headers: { "Content-Type": "application/manifest+json" } }
    );
  if (path === "/sw.js")
    return new Response("self.addEventListener('fetch',function(){});", {
      headers: { "Content-Type": "text/javascript", "Cache-Control": "no-store" }
    });
  return null;
}
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var SERVICE_RE = /^(https?|tcp|udp|ssh|rdp|smb|unix|unix\+tls):\/\/\S+$|^http_status:\d{3}$|^hello_world$/i;
var str = (v) => String(v == null ? "" : v).trim();
async function listTunnels(env, base) {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const r = await cf(env, `${base}?is_deleted=false&per_page=100&page=${page}`);
    all.push(...r);
    if (r.length < 100) break;
  }
  return all;
}
var json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});
var htmlRes = (body) => new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
var SESSION_TTL = 7 * 24 * 3600;
var MIN_GAP_MS = 20 * 1e3;
var keyCache = { src: "", key: null };
async function sessionKey(env) {
  const src = "cf-hub-session:" + (str(env.SESSION_SECRET) || str(env.PASSWORD));
  if (keyCache.src !== src || !keyCache.key) {
    keyCache = {
      src,
      key: await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(src),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      )
    };
  }
  return keyCache.key;
}
var b64u = (s) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
var unb64u = (s) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));
async function hmac(env, text) {
  const sig = await crypto.subtle.sign("HMAC", await sessionKey(env), new TextEncoder().encode(text));
  let s = "";
  for (const b of new Uint8Array(sig)) s += String.fromCharCode(b);
  return b64u(s);
}
async function makeSession(env) {
  const raw = b64u(JSON.stringify({ exp: Math.floor(Date.now() / 1e3) + SESSION_TTL }));
  return raw + "." + await hmac(env, "sid:" + raw);
}
async function checkSession(env, value) {
  const i = String(value || "").indexOf(".");
  if (i < 0) return false;
  const raw = value.slice(0, i);
  const sig = value.slice(i + 1);
  let exp = 0;
  try {
    exp = Number(JSON.parse(unb64u(raw)).exp) || 0;
  } catch (e) {
    return false;
  }
  if (!exp || exp * 1e3 < Date.now()) return false;
  const want = await hmac(env, "sid:" + raw);
  let diff = want.length ^ sig.length;
  for (let k = 0; k < sig.length; k++) diff |= (sig.charCodeAt(k) || 0) ^ (want.charCodeAt(k) || 0);
  return diff === 0;
}
function cookieValue(request, name) {
  for (const part of (request.headers.get("Cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}
function sameSecret(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
async function rawAt(url, init) {
  try {
    const r = await fetch(url, { ...init || {}, signal: AbortSignal.timeout(12e3) });
    return { status: r.status, text: await r.text() };
  } catch (e) {
    return { status: 0, text: String(e && e.message || e) };
  }
}
var tgErr = (t) => /chat not found/i.test(t) ? "\u627E\u4E0D\u5230\u8BE5 chat_id: \u63A5\u6536\u8005\u662F\u201C\u8C01\u6536\u6D88\u606F\u201D\u800C\u4E0D\u662F\u673A\u5668\u4EBA\u672C\u8EAB; \u79C1\u804A\u8BF7\u5148\u628A\u673A\u5668\u4EBA\u6253\u5F00\u5E76\u53D1\u9001 /start, \u518D\u586B\u4F60\u81EA\u5DF1\u7684\u6B63\u6570 ID; \u7FA4\u7EC4\u8BF7\u586B\u8D1F\u6570\u7FA4 ID (\u901A\u5E38 -100 \u5F00\u5934) \u5E76\u628A\u673A\u5668\u4EBA\u62C9\u8FDB\u7FA4" : /unauthorized/i.test(t) || /not found/i.test(t) ? "\u673A\u5668\u4EBA Token \u65E0\u6548, \u8BF7\u68C0\u67E5 TG_BOT_TOKEN" : /chat_id is empty|chat member/i.test(t) ? "chat_id \u65E0\u6548" : str(t).slice(0, 160) || "\u672A\u77E5\u9519\u8BEF";
async function tgSend(env, chat, text, kvToken) {
  const token = env.TG_BOT_TOKEN || kvToken;
  if (!token) return { ok: false, error: "\u672A\u914D\u7F6E\u673A\u5668\u4EBA Token (\u73AF\u5883\u53D8\u91CF TG_BOT_TOKEN \u6216\u5728 Telegram \u914D\u7F6E\u91CC\u4FDD\u5B58)" };
  if (!chat) return { ok: false, error: "\u672A\u914D\u7F6E\u63A5\u6536\u63D0\u9192\u7684 chat_id" };
  const r = await rawAt("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true })
  });
  let j = null;
  try {
    j = JSON.parse(r.text);
  } catch (e) {
  }
  if (j && j.ok) return { ok: true };
  return { ok: false, error: "Telegram: " + tgErr(String(j && j.description || r.text)) };
}
var stripAt = (c) => str(c).replace(/^@/, "");
var isChatId = (s) => /^-?\d+$/.test(str(s));
var cleanChat = (c) => str(c).replace(/[\s,;]+/g, "");
async function tgResolve(env, name, kvToken) {
  const token = env.TG_BOT_TOKEN || kvToken;
  if (!token) return { ok: false, error: "\u672A\u914D\u7F6E\u673A\u5668\u4EBA Token" };
  const r = await rawAt(
    "https://api.telegram.org/bot" + token + "/getChat?chat_id=@" + encodeURIComponent(stripAt(name))
  );
  let j = null;
  try {
    j = JSON.parse(r.text);
  } catch (e) {
  }
  if (!j || !j.ok) return { ok: false, error: tgErr(String(j && j.description || r.text)) };
  return { ok: true, id: String(j.result.id) };
}
async function botSelfErr(env, token, id) {
  if (!token || !/^\d+$/.test(String(id || ""))) return "";
  const r = await rawAt("https://api.telegram.org/bot" + token + "/getMe");
  let j = null;
  try {
    j = JSON.parse(r.text);
  } catch (e) {
  }
  return j && j.ok && String(j.result.id) === String(id) ? "\u8FD9\u662F\u673A\u5668\u4EBA\u81EA\u5DF1\u7684 ID, \u673A\u5668\u4EBA\u4E0D\u80FD\u7ED9\u81EA\u5DF1\u53D1\u6D88\u606F\u3002\u79C1\u804A\u6536\u63D0\u9192\u8BF7\u586B\u4F60\u81EA\u5DF1\u7684\u6B63\u6570\u7528\u6237 ID (\u95EE @userinfobot \u53EF\u5F97), Bot Token \u624D\u586B\u673A\u5668\u4EBA\u7684" : "";
}
var chatKey = async (env, name) => "chat:" + (await hmac(env, "chat:" + name)).slice(0, 20);
var META_KEY = "meta:settings";
var store = (env) => env.TUNNEL_DB || env.TUNNEL_STATE || null;
var isD1 = (b) => !!b && typeof b.prepare === "function" && typeof b.batch === "function";
async function storeGet(env, key) {
  const b = store(env);
  if (!b) return null;
  if (isD1(b)) {
    try {
      const r = await b.prepare("SELECT v FROM state WHERE k = ?1").bind(key).first();
      if (!r) return null;
      return JSON.parse(r.v);
    } catch (e) {
      return null;
    }
  }
  return await b.get(key, "json");
}
async function storePut(env, key, val) {
  const b = store(env);
  if (!b) return;
  const v = JSON.stringify(val);
  if (isD1(b)) {
    await b.prepare("INSERT INTO state (k, v) VALUES (?1, ?2) ON CONFLICT(k) DO UPDATE SET v = ?2").bind(key, v).run();
    return;
  }
  return await b.put(key, v);
}
async function storeDel(env, key) {
  const b = store(env);
  if (!b) return;
  if (isD1(b)) {
    await b.prepare("DELETE FROM state WHERE k = ?1").bind(key).run();
    return;
  }
  return await b.delete(key);
}
async function getMeta(env) {
  const meta = { chats: [], alerts: {}, botToken: "", paused: null, accounts: [], curAcc: "" };
  if (!store(env)) return meta;
  const saved = await storeGet(env, META_KEY) || {};
  meta.alerts = saved && saved.alerts || {};
  if (saved && !saved.alertsV2 && Object.keys(meta.alerts).length) {
    meta.alerts = {};
    await storePut(env, META_KEY, { ...saved, alerts: {}, alertsV2: true });
  }
  meta.botToken = str(saved && saved.botToken);
  meta.paused = saved && saved.paused || null;
  meta.accounts = Array.isArray(saved && saved.accounts) ? saved.accounts : [];
  meta.curAcc = str(saved && saved.curAcc);
  for (const raw of saved && saved.chats || []) {
    const name = str(raw);
    const resolved = isChatId(name) ? "" : str(await storeGet(env, await chatKey(env, name)) || "");
    meta.chats.push({ name, id: isChatId(name) ? name : resolved, ok: isChatId(name) || isChatId(resolved) });
  }
  return meta;
}
async function saveMeta(env, meta) {
  if (!store(env)) return;
  await storePut(env, META_KEY, {
    chats: meta.chats.map((c) => c.name),
    alerts: meta.alerts,
    alertsV2: true,
    // 已完成"提醒默认关"迁移的标记 (见 getMeta)
    botToken: meta.botToken || "",
    paused: meta.paused || null,
    accounts: meta.accounts || [],
    curAcc: meta.curAcc || ""
  });
}
function accountList(meta, env) {
  const list = [];
  if (env.CF_API_TOKEN && env.CF_ACCOUNT_ID) list.push({ name: "\u9ED8\u8BA4\u8D26\u53F7", token: "", acc: env.CF_ACCOUNT_ID, builtin: true });
  for (const a of meta && meta.accounts || [])
    if (a && str(a.acc)) list.push({ name: str(a.name) || str(a.acc), token: str(a.token), acc: str(a.acc) });
  return list;
}
function pickAccount(meta, env, sel) {
  const list = accountList(meta, env);
  return list.find((a) => a.acc === str(sel)) || list[0] || null;
}
var chatTargets = (env, meta) => {
  const out = meta.chats.filter((c) => isChatId(c.id)).map((c) => c.id);
  if (out.length) return out;
  const fallback = cleanChat(env.TG_CHAT_ID);
  return isChatId(fallback) ? [fallback] : [];
};
var alertsPayload = (env, meta, now = Date.now()) => ({
  kv: !!store(env),
  bot: !!env.TG_BOT_TOKEN || !!meta.botToken,
  chats: meta.chats.map((c) => ({ name: c.name, id: c.id, ok: c.ok })),
  targets: chatTargets(env, meta).length,
  alerts: meta.alerts,
  // until:0 表示手动暂停 (无期限), until>now 表示限时暂停
  paused: !!meta.paused,
  pausedUntil: (meta.paused && meta.paused.until > now ? meta.paused.until : 0) || 0,
  hasToken: !!(meta.botToken || env.TG_BOT_TOKEN),
  tokenMask: meta.botToken ? meta.botToken.slice(0, 6) + "\u2026****" : env.TG_BOT_TOKEN ? "env:TG_BOT_TOKEN" : ""
});
function requireKv(env) {
  if (!store(env))
    throw new Error("\u672A\u7ED1\u5B9A\u5B58\u50A8: \u8BF7\u7ED1\u5B9A D1 \u6570\u636E\u5E93 TUNNEL_DB \u6216 KV \u547D\u540D\u7A7A\u95F4 TUNNEL_STATE (Settings \u2192 Bindings)");
}
var isUp = (t) => t.status === "healthy";
var fmtT = (ms, tz = 8) => {
  const d = new Date(ms + tz * 3600 * 1e3);
  const z = (n) => String(n).padStart(2, "0");
  return z(d.getUTCMonth() + 1) + "-" + z(d.getUTCDate()) + " " + z(d.getUTCHours()) + ":" + z(d.getUTCMinutes());
};
async function readState(env, key) {
  if (!store(env)) return null;
  try {
    return await storeGet(env, key);
  } catch (e) {
    return null;
  }
}
async function runChecks(env, list) {
  const kv = store(env);
  const now = Date.now();
  const accScope = env.cfAcc || env.CF_ACCOUNT_ID || "";
  const tunnels = list.map((t) => ({ id: t.id, name: t.name, status: t.status, up: isUp(t), since: Date.parse(t.conns_active_at || "") || 0 }));
  const result = {
    tunnels,
    total: tunnels.length,
    online: tunnels.filter((t) => t.up).length,
    offline: tunnels.filter((t) => !t.up).length,
    kv: !!kv,
    alertOn: {},
    alert: { sent: 0, error: "", last: 0, paused: false }
  };
  if (!kv) return result;
  const meta = await getMeta(env);
  for (const t of tunnels) result.alertOn[t.id] = !!(meta.alerts[t.id] && meta.alerts[t.id].on === true);
  result.alert.paused = !!meta.paused;
  result.alert.pausedUntil = (meta.paused && meta.paused.until > now ? meta.paused.until : 0) || 0;
  const watchKey = "watch:" + await hmac(env, "watch:" + accScope);
  const watch = await readState(env, watchKey);
  result.alert.last = watch && watch.at || 0;
  if (watch && now - watch.at < MIN_GAP_MS) return result;
  const prev = await Promise.all(tunnels.map((t) => readState(env, "tunnel:state:" + accScope + ":" + t.id)));
  const changed = tunnels.filter((t, i) => prev[i] && !!prev[i].on !== t.up && result.alertOn[t.id]);
  await Promise.all(
    tunnels.map((t) => storePut(env, "tunnel:state:" + accScope + ":" + t.id, { on: t.up, at: now }))
  );
  await storePut(env, watchKey, { at: now });
  if (!changed.length) return result;
  if (result.alert.paused) {
    result.alert.error = "\u63A8\u9001\u5DF2\u6682\u505C" + (meta.paused.until ? ", \u81F3 " + fmtT(meta.paused.until) : "");
    return result;
  }
  const targets = chatTargets(env, meta);
  if (!targets.length) {
    result.alert.error = "\u6CA1\u6709\u53EF\u7528\u7684 Telegram \u63A5\u6536\u8005";
    return result;
  }
  const text = changed.map((t) => (t.up ? "\u{1F7E2} \u6062\u590D\u5728\u7EBF: " : "\u{1F534} \u5DF2\u79BB\u7EBF: ") + t.name).join("\n") + "\n\u{1F552} " + fmtT(now);
  for (const id of targets) {
    const r = await tgSend(env, id, text, meta.botToken);
    if (r.ok) result.alert.sent++;
    else result.alert.error = r.error;
  }
  return result;
}
async function probeWorkerHosts(hostsIn) {
  const hosts = [...new Set((Array.isArray(hostsIn) ? hostsIn : []).map(str).filter((h) => /^[a-z0-9.-]+$/i.test(h) && h.includes(".")))].slice(0, 50);
  const checkOne = async (hostname) => {
    const t0 = Date.now();
    try {
      const r = await fetch("https://" + hostname + "/", {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "tunnelpanel-healthcheck/1.0" },
        signal: AbortSignal.timeout(8e3)
      });
      try {
        await r.body.cancel();
      } catch (e) {
      }
      const status = r.status;
      return { hostname, ok: status < 500, status, ms: Date.now() - t0, error: status < 500 ? "" : "HTTP " + status };
    } catch (e) {
      return { hostname, ok: false, status: 0, ms: Date.now() - t0, error: String(e && e.message || e).slice(0, 120) };
    }
  };
  const results = [];
  for (let i = 0; i < hosts.length; i += 6) results.push(...await Promise.all(hosts.slice(i, i + 6).map(checkOne)));
  return results;
}
var WEEK_MS = 7 * 24 * 3600 * 1e3;
async function runWorkerInspection(env, accEnv, meta, accName, opts) {
  opts = opts || {};
  const now = Date.now();
  const acc = accEnv.cfAcc || accEnv.CF_ACCOUNT_ID || "";
  const out = { skipped: false, total: 0, online: 0, offline: [], results: [], tgSent: 0, tgError: "" };
  const gateKey = "worker:inspect:last:" + acc;
  if (!opts.force && store(env)) {
    let last = null;
    try {
      last = await storeGet(env, gateKey);
    } catch (e) {
    }
    if (last && last.at && now - last.at < WEEK_MS - 3600 * 1e3) {
      out.skipped = true;
      return out;
    }
  }
  let workers = [];
  try {
    const wd = await cf(accEnv, `/accounts/${acc}/workers/domains`);
    if (Array.isArray(wd)) workers = wd;
  } catch (e) {
    out.tgError = "\u8BFB\u53D6 Worker \u7ED1\u5B9A\u5931\u8D25: " + String(e && e.message || e);
    return out;
  }
  const svcOf = {};
  workers.forEach((w) => {
    svcOf[str(w.hostname)] = str(w.service);
  });
  out.results = await probeWorkerHosts(workers.map((w) => w.hostname));
  out.total = out.results.length;
  out.offline = out.results.filter((r) => !r.ok);
  out.online = out.total - out.offline.length;
  if (store(env)) {
    try {
      await storePut(env, gateKey, { at: now, total: out.total, offline: out.offline.length });
    } catch (e) {
    }
  }
  if (!out.offline.length) return out;
  if (meta.paused) {
    out.tgError = "\u63A8\u9001\u5DF2\u6682\u505C";
    return out;
  }
  const targets = chatTargets(env, meta);
  if (!targets.length) {
    out.tgError = "\u6CA1\u6709\u53EF\u7528\u7684 Telegram \u63A5\u6536\u8005";
    return out;
  }
  const lines = out.offline.slice(0, 20).map((r) => "\u2022 " + r.hostname + " \u2192 " + (svcOf[r.hostname] || "-") + ": " + (r.status ? "HTTP " + r.status : r.error || "\u65E0\u54CD\u5E94"));
  const text = "\u26A0\uFE0F Worker \u57DF\u540D\u5468\u5DE1\u68C0: " + out.offline.length + " \u6761\u7ED1\u5B9A\u79BB\u7EBF\n\u8D26\u53F7: " + (accName || acc) + "\n\u5171 " + out.total + " \u6761 \xB7 \u5728\u7EBF " + out.online + " \xB7 \u79BB\u7EBF " + out.offline.length + "\n" + lines.join("\n") + (out.offline.length > 20 ? "\n\u2026\u7B49\u5171 " + out.offline.length + " \u6761" : "") + "\n\u{1F552} " + fmtT(now);
  for (const id of targets) {
    const r = await tgSend(env, id, text, meta.botToken);
    if (r.ok) out.tgSent++;
    else out.tgError = r.error;
  }
  return out;
}
var COOKIE = "cf_hub_sid";
var setCookie = (value, maxAge) => `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax${value ? "; Secure" : ""}; Max-Age=${maxAge}`;
async function handleApi(request, env, path) {
  const d = await request.json().catch(() => ({}));
  const uuid = (v) => UUID_RE.test(str(v));
  if (/^[0-9a-f]{32}$/i.test(str(d.acc))) env.cfAcc = str(d.acc).toLowerCase();
  if (path === "/api/login") {
    if (!sameSecret(str(d.password), String(env.PASSWORD))) {
      await new Promise((r) => setTimeout(r, 500));
      return json({ error: "\u5BC6\u7801\u9519\u8BEF" }, 401);
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", "Set-Cookie": setCookie(await makeSession(env), SESSION_TTL) }
    });
  }
  if (path === "/api/logout")
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", "Set-Cookie": setCookie("", 0) }
    });
  if (!await checkSession(env, cookieValue(request, COOKIE))) return json({ error: "\u8BF7\u5148\u767B\u5F55" }, 401);
  if (path === "/api/tg") {
    const meta = await getMeta(env);
    if (str(d.action) === "save") {
      requireKv(env);
      const token = str(d.token);
      if (token && !/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(token))
        return json({ error: "Bot Token \u683C\u5F0F\u4E0D\u6B63\u786E, \u5E94\u4E3A 123456789:AbC... \u5F62\u5F0F" }, 400);
      const raw = str(d.chat);
      let id = "";
      let name = "";
      if (raw) {
        const isName = /^@?[A-Za-z][A-Za-z0-9_]{4,}$/.test(raw) && !/^-/.test(raw);
        if (isName) {
          const r = await tgResolve(env, raw, token || meta.botToken);
          if (!r.ok) return json({ error: r.error }, 400);
          id = r.id;
          name = "@" + stripAt(raw);
        } else {
          id = cleanChat(raw);
          if (!isChatId(id)) return json({ error: "\u8BF7\u8F93\u5165\u6570\u5B57 chat_id \u6216 @\u9891\u9053\u7528\u6237\u540D" }, 400);
          name = id;
        }
      }
      if (id) {
        const bad = await botSelfErr(env, token || meta.botToken, id);
        if (bad) return json({ error: bad }, 400);
      }
      if (token) meta.botToken = token;
      if (name) {
        if (!isChatId(name) && id) await storePut(env, await chatKey(env, name), id);
        if (!meta.chats.some((c) => c.name === name)) meta.chats.push({ name, id, ok: true });
      }
      if (!meta.botToken) return json({ error: "\u8BF7\u586B\u5199 Bot Token (\u6216\u914D\u7F6E\u73AF\u5883\u53D8\u91CF TG_BOT_TOKEN)" }, 400);
      if (!meta.chats.length) return json({ error: "\u8BF7\u586B\u5199\u63A5\u6536\u63D0\u9192\u7684 chat_id" }, 400);
      await saveMeta(env, meta);
      return json(alertsPayload(env, meta));
    }
    if (str(d.action) === "pause") {
      requireKv(env);
      const mins = Number(d.minutes) || 0;
      meta.paused = mins > 0 ? { until: Date.now() + mins * 6e4 } : { until: 0 };
      await saveMeta(env, meta);
      return json(alertsPayload(env, meta));
    }
    if (str(d.action) === "resume") {
      requireKv(env);
      meta.paused = null;
      await saveMeta(env, meta);
      return json(alertsPayload(env, meta));
    }
    if (str(d.action) === "add" || str(d.action) === "test") {
      const token = str(d.token) || env.TG_BOT_TOKEN || meta.botToken;
      if (!token) return json({ error: "\u672A\u914D\u7F6E\u673A\u5668\u4EBA Token (\u73AF\u5883\u53D8\u91CF TG_BOT_TOKEN \u6216 Telegram \u914D\u7F6E)" }, 400);
      const raw = str(d.chat);
      const isName = /^@?[A-Za-z][A-Za-z0-9_]{4,}$/.test(raw) && !/^-/.test(raw);
      let id = "";
      let name = raw;
      if (isName) {
        const r = await tgResolve(env, raw, token);
        if (!r.ok) return json({ error: r.error }, 400);
        id = r.id;
        name = "@" + stripAt(raw);
      } else {
        id = cleanChat(raw);
        if (!isChatId(id)) return json({ error: "\u8BF7\u8F93\u5165\u6570\u5B57 chat_id \u6216 @\u9891\u9053\u7528\u6237\u540D" }, 400);
        name = id;
      }
      const bad = await botSelfErr(env, token, id);
      if (bad) return json({ error: bad }, 400);
      const sent = await tgSend(env, id, "\u2705 Cloudflare domain-Tunnel \u7BA1\u7406\u9762\u677F: \u63D0\u9192\u5DF2\u8FDE\u901A", str(d.token) || meta.botToken);
      if (!sent.ok) return json({ error: sent.error }, 400);
      if (!store(env)) return json(alertsPayload(env, meta));
      if (!isChatId(name)) await storePut(env, await chatKey(env, name), id);
      if (!meta.chats.some((c) => c.name === name)) meta.chats.push({ name, id, ok: true });
      await saveMeta(env, meta);
      return json({ ...alertsPayload(env, meta), added: name });
    }
    if (str(d.action) === "remove") {
      const name = str(d.chat);
      meta.chats = meta.chats.filter((c) => c.name !== name);
      if (store(env)) {
        await storeDel(env, await chatKey(env, name));
        await saveMeta(env, meta);
      }
      return json(alertsPayload(env, meta));
    }
    return json(alertsPayload(env, meta));
  }
  const meta0 = store(env) ? await getMeta(env) : { accounts: [] };
  const actx = pickAccount(meta0, env, env.cfAcc);
  if (!actx) {
    if (path === "/api/acc" && str(d.action) === "list") {
      return json({ accounts: [], cur: "", persistent: !!store(env) });
    }
    if (path === "/api/acc" && str(d.action) === "add") {
      env.cfToken = "";
      env.cfAcc = "";
    } else {
      return json({ error: "\u672A\u914D\u7F6E\u4EFB\u4F55 Cloudflare \u8D26\u53F7 (\u73AF\u5883\u53D8\u91CF\u6216\u9762\u677F\u591A\u8D26\u53F7\u7BA1\u7406)" }, 500);
    }
  } else {
    env.cfToken = actx.token || env.CF_API_TOKEN;
    env.cfAcc = actx.acc;
  }
  const acc = env.cfAcc;
  const base = `/accounts/${acc}/cfd_tunnel`;
  if (["/api/token", "/api/detail", "/api/update", "/api/delete", "/api/alert", "/api/route", "/api/uptime"].includes(path) && !uuid(d.id))
    return json({ error: "\u96A7\u9053 ID \u65E0\u6548" }, 400);
  const svcErr = (s) => SERVICE_RE.test(s) ? "" : "\u672C\u5730\u670D\u52A1\u5730\u5740\u683C\u5F0F\u4E0D\u6B63\u786E, \u4F8B\u5982 http://localhost:8001\u3001tcp://localhost:22";
  if (path === "/api/acc") {
    const meta = await getMeta(env);
    const action = str(d.action);
    if (action === "list") {
      return json({
        accounts: accountList(meta, env).map((a) => ({ name: a.name, acc: a.acc, builtin: !!a.builtin })),
        cur: acc,
        persistent: !!store(env)
      });
    }
    if (action === "add") {
      requireKv(env);
      let name = str(d.name).trim().slice(0, 64);
      const token = str(d.token);
      const accId = str(d.acc);
      if (name && !/[\p{L}\p{N}]/u.test(name))
        return json({ error: "\u8D26\u53F7\u540D\u79F0\u9700\u81F3\u5C11\u5305\u542B\u4E00\u4E2A\u6587\u5B57\u6216\u6570\u5B57 (\u4E0D\u80FD\u5168\u662F\u6807\u70B9\u7B26\u53F7)" }, 400);
      if (!/^[0-9a-f]{32}$/i.test(accId) || !token)
        return json({ error: "\u8BF7\u586B\u5199 32 \u4F4D\u8D26\u6237 ID \u548C\u8BE5\u8D26\u6237\u7684 API Token" }, 400);
      if (accountList(meta, env).some((a) => a.acc === accId)) return json({ error: "\u8BE5\u8D26\u6237 ID \u5DF2\u5B58\u5728" }, 400);
      try {
        await cf({ cfToken: token, CF_API_TOKEN: token }, `/accounts/${accId}/cfd_tunnel?per_page=1`);
      } catch (e) {
        return json({ error: "\u8D26\u53F7\u9A8C\u8BC1\u5931\u8D25: " + (e && e.message) }, 400);
      }
      let nameResolved = false;
      if (!name) {
        const resolved = await resolveAccountName(token, accId);
        if (resolved) {
          name = resolved.slice(0, 64);
          nameResolved = true;
        } else {
          name = `\u8D26\u53F7-${accId.slice(0, 8)}`;
        }
      }
      meta.accounts.push({ name, token, acc: accId });
      await saveMeta(env, meta);
      return json({
        ok: true,
        name,
        nameResolved,
        accounts: accountList(meta, env).map((a) => ({ name: a.name, acc: a.acc, builtin: !!a.builtin }))
      });
    }
    if (action === "edit") {
      requireKv(env);
      const accId = str(d.acc);
      const row = meta.accounts.find((a) => str(a.acc) === accId);
      if (!row) return json({ error: "\u8D26\u53F7\u4E0D\u5B58\u5728\u6216\u4E3A\u73AF\u5883\u53D8\u91CF\u9ED8\u8BA4\u8D26\u53F7 (\u4E0D\u53EF\u7F16\u8F91)" }, 400);
      const newName = str(d.name).trim().slice(0, 64);
      const newAcc = str(d.newAcc);
      const newToken = str(d.token);
      if (newName) {
        if (!/[\p{L}\p{N}]/u.test(newName))
          return json({ error: "\u8D26\u53F7\u540D\u79F0\u9700\u81F3\u5C11\u5305\u542B\u4E00\u4E2A\u6587\u5B57\u6216\u6570\u5B57 (\u4E0D\u80FD\u5168\u662F\u6807\u70B9\u7B26\u53F7)" }, 400);
        row.name = newName;
      }
      if (newAcc) {
        if (!/^[0-9a-f]{32}$/i.test(newAcc)) return json({ error: "\u8D26\u6237 ID \u9700\u4E3A 32 \u4F4D\u5341\u516D\u8FDB\u5236" }, 400);
        if (accountList(meta, env).some((a) => a.acc === newAcc && a.acc !== accId))
          return json({ error: "\u8BE5\u8D26\u6237 ID \u5DF2\u5B58\u5728" }, 400);
      }
      if (newAcc || newToken) {
        const testAcc = newAcc || accId;
        const testToken = newToken || row.token;
        try {
          await cf({ cfToken: testToken, CF_API_TOKEN: testToken }, `/accounts/${testAcc}/cfd_tunnel?per_page=1`);
        } catch (e) {
          return json({ error: "\u8D26\u53F7\u9A8C\u8BC1\u5931\u8D25: " + (e && e.message) }, 400);
        }
        if (newToken) row.token = newToken;
        if (newAcc) {
          row.acc = newAcc;
          if (meta.curAcc === accId) meta.curAcc = newAcc;
        }
      }
      await saveMeta(env, meta);
      return json({ ok: true, accounts: accountList(meta, env).map((a) => ({ name: a.name, acc: a.acc, builtin: !!a.builtin })) });
    }
    if (action === "del") {
      requireKv(env);
      const accId = str(d.acc);
      const builtin = accountList(meta, env).find((a) => a.acc === accId && a.builtin);
      if (builtin) return json({ error: "\u73AF\u5883\u53D8\u91CF\u914D\u7F6E\u7684\u9ED8\u8BA4\u8D26\u53F7\u4E0D\u80FD\u5220\u9664" }, 400);
      meta.accounts = meta.accounts.filter((a) => str(a.acc) !== accId);
      if (meta.curAcc === accId) meta.curAcc = "";
      await saveMeta(env, meta);
      return json({ ok: true, accounts: accountList(meta, env).map((a) => ({ name: a.name, acc: a.acc, builtin: !!a.builtin })) });
    }
    if (action === "switch") {
      const accId = str(d.acc);
      if (!accountList(meta, env).some((a) => a.acc === accId)) return json({ error: "\u8D26\u53F7\u4E0D\u5B58\u5728" }, 400);
      if (store(env)) {
        meta.curAcc = accId;
        await saveMeta(env, meta);
      }
      return json({ ok: true, cur: accId });
    }
    return json({ error: "\u672A\u77E5\u64CD\u4F5C" }, 400);
  }
  if (path === "/api/init")
    return json({ zones: await listZones(env), service: env.DEFAULT_SERVICE || "", cur: acc, envAcc: env.CF_ACCOUNT_ID || "" });
  if (path === "/api/create") {
    const name = str(d.name), service = str(d.service);
    if (!name || !d.zoneId || !service) return json({ error: "\u8BF7\u586B\u5199\u96A7\u9053\u540D\u79F0\u548C\u672C\u5730\u670D\u52A1\u5730\u5740" }, 400);
    if (svcErr(service)) return json({ error: svcErr(service) }, 400);
    return json(
      await createTunnel(env, {
        name,
        zoneId: str(d.zoneId),
        sub: str(d.sub).replace(/\.$/, ""),
        path: str(d.path),
        service
      })
    );
  }
  if (path === "/api/list") return json(await runChecks(env, await listTunnels(env, base)));
  if (path === "/api/alert") {
    requireKv(env);
    const meta = await getMeta(env);
    const id = str(d.id);
    if (d.action === "toggle") {
      if (d.on === true || d.on === "1") meta.alerts[id] = { on: true };
      else delete meta.alerts[id];
      await saveMeta(env, meta);
    } else if (d.action === "skip") {
      await storePut(env, "tunnel:state:" + acc + ":" + id, { on: !!d.up, at: Date.now() });
    } else if (d.action !== "get") return json({ error: "\u672A\u77E5\u64CD\u4F5C" }, 400);
    return json({ ...alertsPayload(env, meta), id, on: !!(meta.alerts[id] && meta.alerts[id].on === true) });
  }
  if (path === "/api/token") return json({ token: await cf(env, `${base}/${d.id}/token`) });
  if (path === "/api/uptime") {
    const conns = await cf(env, `${base}/${d.id}/connections`).catch(() => []);
    let since = 0;
    for (const c of Array.isArray(conns) ? conns : []) {
      const ts = Date.parse(c.run_at || c.create_time || c.CreateTime || "");
      if (ts && (!since || ts < since)) since = ts;
    }
    return json({ since, ms: since ? Date.now() - since : 0 });
  }
  if (path === "/api/route") {
    const action = str(d.action) || "add";
    const { config, ingress } = await getRules(env, base, d.id);
    const hostRules = () => ingress.filter((r) => r.hostname).map((r) => ({ hostname: r.hostname, path: r.path || "", service: r.service || "" }));
    if (action === "add") {
      const service = str(d.service);
      if (!d.zoneId || !service) return json({ error: "\u8BF7\u9009\u62E9\u57DF\u540D\u5E76\u586B\u5199\u672C\u5730\u670D\u52A1\u5730\u5740" }, 400);
      if (svcErr(service)) return json({ error: svcErr(service) }, 400);
      const sub = str(d.sub).replace(/\.$/, "");
      const p = str(d.path);
      const zone = await cf(env, `/zones/${d.zoneId}`);
      const hostname = sub ? `${sub}.${zone.name}` : zone.name;
      if (ingress.some((r) => r.hostname === hostname && (r.path || "") === p))
        return json({ error: "\u8BE5\u57DF\u540D+\u8DEF\u5F84\u5DF2\u5B58\u5728\u4E8E\u5F53\u524D\u96A7\u9053" }, 400);
      if (ingress.length >= 60) return json({ error: "\u8BE5\u96A7\u9053\u8DEF\u7531\u6570\u91CF\u5DF2\u8FBE\u4E0A\u9650 (60)" }, 400);
      await checkHost(env, d.zoneId, hostname, d.id);
      const rule = { hostname, service };
      if (p) rule.path = p;
      const tail = ingress.findIndex((r) => !r.hostname && !r.path);
      if (tail >= 0) ingress.splice(tail, 0, rule);
      else ingress.push(rule);
      await upsertCname(env, d.zoneId, hostname, d.id);
      try {
        await cf(env, `${base}/${d.id}/configurations`, "PUT", { config: { ...config, ingress } });
      } catch (e) {
        await cleanDns(env, d.id, [hostname]);
        throw e;
      }
      return json({ ok: true, rules: hostRules() });
    }
    if (action === "del") {
      const hostname = str(d.hostname);
      const p = str(d.path);
      const idx = ingress.findIndex((r) => r.hostname === hostname && (r.path || "") === p);
      if (idx < 0) return json({ error: "\u8DEF\u7531\u4E0D\u5B58\u5728" }, 404);
      ingress.splice(idx, 1);
      if (ingress.some((r) => r.hostname) && !ingress.some((r) => !r.hostname && !r.path))
        ingress.push({ service: "http_status:404" });
      await cf(env, `${base}/${d.id}/configurations`, "PUT", { config: { ...config, ingress } });
      const clean = ingress.some((r) => r.hostname === hostname) ? { dns: 0, dnsFailed: false } : await cleanDns(env, d.id, [hostname]);
      return json({ ok: true, rules: hostRules(), ...clean });
    }
    return json({ rules: hostRules() });
  }
  if (path === "/api/worker_check") {
    const results = await probeWorkerHosts(d.hostnames);
    if (d.inspect) {
      const meta = await getMeta(env);
      const accName = (accountList(meta, env).find((a) => a.acc === acc) || {}).name || acc;
      const ins = await runWorkerInspection(env, env, meta, accName, { force: true });
      return json({
        results: ins.results.length ? ins.results : results,
        at: Date.now(),
        inspect: { total: ins.total, online: ins.online, offline: ins.offline.length, tgSent: ins.tgSent, tgError: ins.tgError }
      });
    }
    return json({ results, at: Date.now() });
  }
  if (path === "/api/domains_detail") {
    const zones = await listZones(env);
    let workers = [];
    try {
      const wd = await cf(env, `/accounts/${acc}/workers/domains`);
      if (Array.isArray(wd)) workers = wd;
    } catch (e) {
    }
    let dns = [];
    try {
      const tasks = zones.slice(0, 10).map((z) => cf(env, `/zones/${z.id}/dns_records?per_page=100`).catch(() => []));
      const res = await Promise.all(tasks);
      res.forEach((r) => {
        if (Array.isArray(r)) dns.push(...r);
      });
    } catch (e) {
    }
    return json({ zones, workers, dns });
  }
  if (path === "/api/detail") {
    const [{ ingress }, zones] = await Promise.all([getRules(env, base, d.id), listZones(env)]);
    const rule = ingress.find((r) => r.hostname) || {};
    let zoneId = "";
    let sub = "";
    if (rule.hostname) {
      const z = zoneForHost(zones, rule.hostname);
      if (z) {
        zoneId = z.id;
        sub = rule.hostname === z.name ? "" : rule.hostname.slice(0, -(z.name.length + 1));
      }
    }
    return json({
      hostname: rule.hostname || "",
      zoneId,
      sub,
      path: rule.path || "",
      service: rule.service || "",
      others: ingress.filter((r) => r.hostname && r !== rule).length,
      // zoneId/sub 逐条给出, 供前端编辑弹窗按所选路由回填域名下拉与子域名
      rules: ingress.filter((r) => r.hostname).map((rule2) => {
        const z = zoneForHost(zones, rule2.hostname);
        return {
          hostname: rule2.hostname,
          path: rule2.path || "",
          service: rule2.service || "",
          zoneId: z ? z.id : "",
          sub: z && rule2.hostname !== z.name ? rule2.hostname.slice(0, -(z.name.length + 1)) : ""
        };
      })
    });
  }
  if (path === "/api/update") {
    const service = str(d.service);
    if (!d.zoneId || !service) return json({ error: "\u8BF7\u586B\u5199\u672C\u5730\u670D\u52A1\u5730\u5740" }, 400);
    if (svcErr(service)) return json({ error: svcErr(service) }, 400);
    const sub = str(d.sub).replace(/\.$/, "");
    const p = str(d.path);
    const zone = await cf(env, `/zones/${d.zoneId}`);
    const hostname = sub ? `${sub}.${zone.name}` : zone.name;
    const { config, ingress } = await getRules(env, base, d.id);
    const oldHost = str(d.host);
    const oldPath = str(d.oldPath);
    let idx;
    if (oldHost) {
      idx = ingress.findIndex((r) => r.hostname === oldHost && (r.path || "") === oldPath);
      if (idx < 0) return json({ error: "\u8981\u7F16\u8F91\u7684\u8DEF\u7531\u5DF2\u4E0D\u5B58\u5728, \u8BF7\u5237\u65B0\u5217\u8868\u540E\u91CD\u8BD5" }, 400);
    } else {
      idx = ingress.findIndex((r) => r.hostname);
    }
    const rule = idx >= 0 ? { ...ingress[idx] } : {};
    rule.hostname = hostname;
    rule.service = service;
    if (p) rule.path = p;
    else delete rule.path;
    if (idx >= 0) ingress[idx] = rule;
    else ingress.unshift(rule);
    if (!ingress.some((r) => !r.hostname && !r.path)) ingress.push({ service: "http_status:404" });
    if (hostname !== oldHost) await checkHost(env, d.zoneId, hostname, d.id);
    if (str(d.name)) await cf(env, `${base}/${d.id}`, "PATCH", { name: str(d.name) });
    const newDns = hostname !== oldHost;
    if (newDns) await upsertCname(env, d.zoneId, hostname, d.id);
    try {
      await cf(env, `${base}/${d.id}/configurations`, "PUT", { config: { ...config, ingress } });
    } catch (e) {
      if (newDns) await cleanDns(env, d.id, [hostname]);
      throw e;
    }
    let clean = { dns: 0, dnsFailed: false };
    if (oldHost && hostname !== oldHost && !ingress.some((r) => r.hostname === oldHost))
      clean = await cleanDns(env, d.id, [oldHost]);
    return json({ ok: true, hostname, ...clean });
  }
  if (path === "/api/delete") {
    let hosts = [];
    try {
      const c = await cf(env, `${base}/${d.id}/configurations`);
      hosts = (c && c.config && c.config.ingress || []).map((r) => r.hostname).filter(Boolean);
    } catch (e) {
    }
    try {
      await cf(env, `${base}/${d.id}/connections`, "DELETE");
    } catch (e) {
    }
    await cf(env, `${base}/${d.id}`, "DELETE");
    const clean = await cleanDns(env, d.id, hosts);
    if (store(env)) {
      await storeDel(env, "tunnel:state:" + acc + ":" + d.id).catch(() => {
      });
      const meta = await getMeta(env);
      if (meta.alerts[d.id]) {
        delete meta.alerts[d.id];
        await saveMeta(env, meta);
      }
    }
    return json({ ok: true, ...clean });
  }
  return json({ error: "\u672A\u77E5\u63A5\u53E3" }, 404);
}
async function handleTunnel(request, env) {
  env = applyConfig(env);
  if (!env.PASSWORD) return new Response("\u8BF7\u5148\u914D\u7F6E\u73AF\u5883\u53D8\u91CF PASSWORD", { status: 500 });
  if (String(env.PASSWORD).length < 6) return new Response("PASSWORD \u81F3\u5C11 6 \u4F4D", { status: 500 });
  const url = new URL(request.url);
  const path = url.pathname;
  const isApi = path.startsWith("/api/");
  if (request.method === "POST" && isApi) {
    try {
      return await handleApi(request, env, path);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  }
  if (request.method !== "GET" && request.method !== "HEAD")
    return new Response("Method Not Allowed", { status: 405 });
  const loggedIn = await checkSession(env, cookieValue(request, COOKIE));
  const pwa = pwaResponse(path);
  if (pwa) return pwa;
  if (!loggedIn) return htmlRes(LOGIN_HTML);
  if (path === "/" || path === "/index.html") return htmlRes(HTML);
  return new Response("Not Found", { status: 404 });
}
var CF_LOGO = '<svg width="100%" height="100%" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><circle cx="512" cy="512" r="512" style="fill:#f38020"/><path d="M608.2 592.4c3.1-10.8 1.9-20.7-3.3-28.1-4.8-6.7-12.9-10.6-22.6-11.1l-184.7-2.4c-1.1 0-2.2-.6-2.8-1.5-.6-.9-.7-2.1-.4-3.3.6-1.8 2.4-3.2 4.3-3.3l186.4-2.4c22.1-1 46.1-18.9 54.5-40.8l10.6-27.8c.5-1.2.6-2.4.3-3.6-12-54.3-60.5-94.8-118.4-94.8-53.4 0-98.7 34.5-114.9 82.4-10.5-7.8-23.9-12-38.3-10.6-25.7 2.5-46.2 23.1-48.8 48.8-.6 6.6-.1 13.1 1.4 19.1-41.9 1.2-75.3 35.4-75.3 77.6 0 3.7.3 7.5.8 11.2.3 1.8 1.8 3.1 3.6 3.1h340.9c1.9 0 3.8-1.4 4.3-3.3l2.4-9.2zM667 473.7c-1.6 0-3.4 0-5.1.2-1.2 0-2.2.9-2.7 2.1l-7.2 25c-3.1 10.8-2 20.7 3.3 28.1 4.8 6.7 12.9 10.6 22.7 11.1l39.3 2.4c1.2 0 2.3.6 2.8 1.5.6.9.7 2.3.5 3.3-.6 1.8-2.4 3.2-4.4 3.3l-41 2.4c-22.2 1-46 18.9-54.5 40.8l-3 7.6c-.6 1.5.5 3 2.1 3h140.8c1.6 0 3.1-1 3.6-2.7 2.4-8.7 3.7-17.9 3.7-27.3 0-55.5-45.3-100.8-101-100.8" style="fill:#fff"/></svg>';
var LOGIN_HTML = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f6821f">
<title>\u767B\u5F55 \xB7 Cloudflare domain-Tunnel \u7BA1\u7406\u9762\u677F</title>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}
body{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:#e8eaee;
background:#0c0e13;
background-image:
  radial-gradient(900px 480px at 18% -8%,rgba(246,130,31,.16),transparent 60%),
  radial-gradient(760px 420px at 88% 108%,rgba(246,130,31,.10),transparent 60%),
  linear-gradient(180deg,#12151c 0%,#0c0e13 100%);
background-attachment:fixed}
.wrap{width:100%;max-width:380px}
.card{background:rgba(26,29,35,.88);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:36px 30px 30px;text-align:center;
box-shadow:0 24px 70px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.05)}
.logo{width:76px;height:76px;margin:0 auto 18px;filter:drop-shadow(0 8px 22px rgba(243,128,32,.35))}
.logo svg{display:block;width:100%;height:100%}
h1{font-size:20px;font-weight:700;letter-spacing:.3px}
p.sub{margin:7px 0 26px;font-size:13px;color:#8b93a0}
.field{position:relative;text-align:left}
.field .li{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:15px;color:#8b93a0;pointer-events:none}
input{width:100%;padding:14px 14px 14px 42px;font-size:15px;color:#e8eaee;background:#12151a;
border:1px solid #2a2e36;border-radius:13px;outline:none;transition:border-color .15s,box-shadow .15s;font-family:inherit}
input::placeholder{color:#5b6270}
input:focus{border-color:#f6821f;box-shadow:0 0 0 3px rgba(246,130,31,.18)}
button{width:100%;margin-top:18px;padding:14px;border:0;border-radius:13px;font-size:15px;font-weight:700;color:#fff;letter-spacing:2px;
background:linear-gradient(135deg,#f6821f,#ff9d4a);cursor:pointer;
box-shadow:0 8px 24px rgba(246,130,31,.32);transition:transform .12s,box-shadow .15s,opacity .15s;font-family:inherit}
button:hover{box-shadow:0 10px 30px rgba(246,130,31,.45)}
button:active{transform:scale(.98)}
button:disabled{opacity:.6;pointer-events:none}
button.oks{opacity:1;background:linear-gradient(135deg,#17a35f,#2ecc7d);box-shadow:0 8px 24px rgba(34,160,107,.35)}
.err{display:flex;align-items:center;justify-content:center;gap:6px;min-height:20px;margin-top:14px;color:#e05252;font-size:13px}
.foot{margin-top:22px;font-size:11.5px;display:flex;align-items:center;justify-content:center}
.foot a{color:#5b6270;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:color .15s}
.foot a:hover{color:#8b93a0}
.foot svg{width:14px;height:14px;opacity:.55}
@media(prefers-color-scheme:light){
  body{background-image:radial-gradient(900px 480px at 18% -8%,rgba(246,130,31,.14),transparent 60%),radial-gradient(760px 420px at 88% 108%,rgba(246,130,31,.08),transparent 60%),linear-gradient(180deg,#f7f4ef 0%,#eef0f4 100%)}
  .card{background:rgba(255,255,255,.9);border-color:rgba(0,0,0,.06);box-shadow:0 24px 70px rgba(30,34,40,.14)}
  h1{color:#1d2129}
  input{background:#f4f5f7;color:#1d2129;border-color:#e3e6ea}
}
</style></head><body>
<div class="wrap">
  <form class="card" id="f" novalidate>
    <div class="logo">${CF_LOGO}</div>
    <h1>Cloudflare domain-Tunnel \u7BA1\u7406\u9762\u677F</h1>
    <p class="sub">Tunnel \u7BA1\u7406\u4E0E Telegram \u4E0A\u4E0B\u7EBF\u63D0\u9192</p>
    <div class="field">
      <span class="li">\u{1F512}</span>
      <input id="pw" type="password" name="password" placeholder="\u8BF7\u8F93\u5165\u8BBF\u95EE\u5BC6\u7801" autocomplete="current-password" autofocus>
    </div>
    <button id="go" type="submit">\u767B \u5F55</button>
    <div class="err" id="err"></div>
    <div class="foot"><a href="https://github.com/eooce/cloudflare-tunnel-panel" target="_blank" rel="noopener noreferrer">${CF_LOGO} Cloudflare Tunnel Panel</a></div>
  </form>
</div>
<script>
var f=document.getElementById('f'),pw=document.getElementById('pw'),go=document.getElementById('go'),err=document.getElementById('err');
f.addEventListener('submit',async function(e){
  e.preventDefault();
  if(!pw.value){err.textContent='\u26A0 \u8BF7\u8F93\u5165\u5BC6\u7801';pw.focus();return}
  go.disabled=true;go.textContent='\u767B\u5F55\u4E2D...';err.textContent='';
  try{
    var r=await fetch('/tunnel/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw.value})});
    var d=await r.json().catch(function(){return {}});
    if(!r.ok)throw new Error(d.error||'\u767B\u5F55\u5931\u8D25');
    go.textContent='\u2713 \u767B\u5F55\u6210\u529F';go.classList.add('oks');
    location.replace('/tunnel/');
  }catch(ex){
    err.textContent='\u26A0 '+(ex.message||'\u767B\u5F55\u5931\u8D25');go.disabled=false;go.textContent='\u767B \u5F55';pw.select();
  }
});
<\/script></body></html>`;
var HTML = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f6821f">
<link rel="manifest" href="/tunnel/manifest.json">
<link rel="icon" type="image/png" href="/icon-192.png">
<link rel="apple-touch-icon" href="/icon-192.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Cloudflare domain-Tunnel \u7BA1\u7406\u9762\u677F</title>
<script>
// \u9632\u95EA\u767D: \u9875\u9762\u6E32\u67D3\u524D\u5148\u628A\u5DF2\u4FDD\u5B58\u7684\u4E3B\u9898\u5199\u5230 html \u6839\u5143\u7D20 (\u8DDF\u968F\u7CFB\u7EDF = \u4E0D\u8BBE\u7F6E data-theme)
(function(){try{
  var t=localStorage.getItem('theme');
  if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);
}catch(e){}})();
<\/script>
<style>
:root{--bg:#f4f5f7;--card:#fff;--text:#1d2129;--sub:#7a828e;--line:#e3e6ea;--brand:#f6821f;--brand2:#ff9d4a;--ok:#22a06b;--bad:#d93f3f;--warn:#e8a317;--code:#16181d;--codet:#d7dae0;--side:#1b1e24;--side2:#2a2f38;--sideText:#c9cfd8;--in:#f4f5f7}
@media(prefers-color-scheme:dark){:root{--bg:#0f1115;--card:#1a1d23;--text:#e8eaee;--sub:#8b93a0;--line:#2a2e36;--code:#0a0b0e;--codet:#c9ccd3;--side:#15181d;--side2:#262b33;--in:#12151a}}
/* \u624B\u52A8\u4E3B\u9898: html[data-theme=light] \u6052\u4E3A\u4EAE\u8272, [data-theme=dark] \u6052\u4E3A\u6697\u8272; \u672A\u8BBE\u7F6E\u65F6\u8DDF\u968F\u7CFB\u7EDF */
/* \u4FA7\u680F\u4E0D\u518D\u6052\u4E3A\u6DF1\u8272: \u4EAE\u8272=\u6D45\u4FA7\u680F, \u6697\u8272=\u6DF1\u4FA7\u680F, \u5207\u6362\u65F6\u8089\u773C\u53EF\u89C1 */
html[data-theme="light"]{--bg:#f4f5f7;--card:#fff;--text:#1d2129;--sub:#7a828e;--line:#e3e6ea;--code:#0f5849;--codet:#d7dae0;--side:#eef0f4;--side2:#dfe3e9;--sideText:#3d4450;--in:#f4f5f7}
html[data-theme="dark"]{--bg:#0f1115;--card:#1a1d23;--text:#e8eaee;--sub:#8b93a0;--line:#2a2e36;--code:#0a0b0e;--codet:#c9ccd3;--side:#15181d;--side2:#262b33;--sideText:#c9cfd8;--in:#12151a}
html[data-theme="light"] body{background-image:radial-gradient(900px 480px at 18% -8%,rgba(246,130,31,.14),transparent 60%),radial-gradient(760px 420px at 88% 108%,rgba(246,130,31,.08),transparent 60%),linear-gradient(180deg,#f7f4ef 0%,#eef0f4 100%)}
html[data-theme="dark"] body{background-image:none}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text);font-size:14px}
.app{display:flex;height:100vh;height:100dvh;overflow:hidden}
.sidenav{width:180px;flex:none;background:var(--side);color:var(--sideText);display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 18px) 12px calc(env(safe-area-inset-bottom,0px) + 14px)}
.sidenav .brand{display:flex;align-items:center;gap:9px;padding:2px 8px 18px;color:var(--text);font-weight:700;font-size:15px}
.sidenav .brand .ic{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--brand),var(--brand2));display:flex;align-items:center;justify-content:center;font-size:16px}
.nav{display:flex;flex-direction:column;gap:4px}
.nav a{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;color:var(--sideText);text-decoration:none;font-size:14px;cursor:pointer;transition:background .15s}
.nav a:hover{background:var(--side2)}
.nav a.on{background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff;font-weight:600}
.nav a .i{width:18px;text-align:center;font-size:15px}
.sidenav .foot{margin-top:auto;font-size:12.5px;color:var(--sub)}
.sidenav .foot a{color:var(--sub);text-decoration:none;padding:8px;border-radius:8px;display:flex;align-items:center;gap:7px;transition:color .15s,background .15s}
.sidenav .foot a .i{display:inline-block;font-size:14px}
.sidenav .foot a .lo{margin-left:auto;font-size:14px;opacity:0;transform:translateX(-6px);transition:opacity .18s,transform .18s}
.sidenav .foot a:hover{background:var(--side2);color:#e05252}
.sidenav .foot a:hover .i{color:#e05252}
.sidenav .foot a:hover .lo{opacity:1;transform:none}
.am-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border:1px solid var(--line);border-radius:10px;margin-bottom:8px;background:var(--in)}
.am-edit{border:1px dashed var(--line);border-radius:10px;padding:10px 11px;margin:-4px 0 10px;background:var(--in)}
.main{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.topbar{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 20px 12px;background:var(--card);border-bottom:1px solid var(--line);flex:none;position:relative}
/* \u6807\u9898\u7EDD\u5BF9\u5B9A\u4F4D\u5C45\u4E2D\u4E8E\u6574\u6761\u9876\u680F(\u4E0D\u53C2\u4E0E flex \u5E03\u5C40); \u8D26\u53F7\u7EC4 margin-right:auto \u8D34\u5DE6 */
.topbar h2{margin:0;font-size:16px;position:absolute;left:50%;transform:translateX(-50%);max-width:40%;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.accwrap{display:flex;align-items:center;gap:9px;flex:none;margin-right:auto}
.aclabel{font-size:13.5px;color:#f0932f;font-weight:700;white-space:nowrap}
.amhint{color:var(--sub);font-weight:400}
.accwrap select{width:auto;min-width:150px;max-width:280px;padding:6px 9px;font-size:13.5px;text-align:left;font-weight:600}
.content{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:18px 20px calc(env(safe-area-inset-bottom,0px) + 40px)}
.wrap{max-width:1400px;margin:0 auto}.view{display:none}.view.on{display:block}
.card{background:var(--card);border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);border:1px solid var(--line)}
.card h3{margin:0 0 12px;font-size:15px;display:flex;justify-content:space-between;align-items:center;gap:10px}
label{display:block;font-size:12px;color:var(--sub);margin:12px 0 5px}
input,select{width:100%;padding:11px;font-size:15px;color:var(--text);background:var(--in);border:1px solid var(--line);border-radius:8px;outline:none;transition:border .15s;font-family:inherit}
input:focus,select:focus{border-color:var(--brand)}
.row{display:flex;gap:8px}.row .sub{flex:1;min-width:0}.row .zone{flex:1.3;min-width:0}
.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:14px}
.search{flex:1;min-width:0;position:relative}
.search input{padding-left:36px;padding-right:40px}
.search .si{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--sub);font-size:14px;pointer-events:none}
.search .qx{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:22px;height:22px;border:0;border-radius:50%;
background:var(--side2);color:var(--sub);font-size:12px;line-height:1;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0}
.search .qx:hover{background:var(--bad);color:#fff}
.search.has .qx{display:flex}
.preview{margin-top:14px;padding:10px 12px;border-radius:10px;background:var(--in);font-size:13px;color:var(--sub);white-space:nowrap;overflow-x:auto;line-height:1.6}
.preview b{color: #f8892b}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:10px;padding:11px 16px;font-size:14px;font-weight:600;cursor:pointer;color:#fff;background:linear-gradient(135deg,var(--brand),var(--brand2));white-space:nowrap}
.btn.sm{padding:6px 11px;font-size:12.5px;font-weight:500;background:var(--in);background-image:none;color:var(--text);border:1px solid var(--line)}
#theme{font-size:15px;line-height:1;padding:6px 10px}
.btn.sm.red{color:var(--bad)}
.btn.red-solid{background:#d93f3f;background-image:none}
.btn.red-solid:hover{background:#e05252}
.btn:active{transform:scale(.98)}.btn:disabled{opacity:.55;pointer-events:none}
.spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:r .7s linear infinite;display:inline-block}
@keyframes r{to{transform:rotate(360deg)}}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:14px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.stat .k{font-size:12.5px;color:var(--sub);display:flex;align-items:center;gap:6px}
.stat .v{font-size:30px;font-weight:700;margin-top:8px;line-height:1}
.stat.on .v{color:var(--ok)}.stat.off .v{color:var(--bad)}
/* \u2605 \u4EEA\u8868\u677F\u5C55\u793A\u6846\u5207\u6362: \u56DB\u5F20\u7EDF\u8BA1\u5361\u90FD\u53EF\u70B9\u51FB, .sel \u4E3A\u5F53\u524D\u9009\u4E2D\u6001 */
.stat{cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.stat:hover{border-color:var(--brand2)}
.stat.sel{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand),0 2px 12px rgba(0,0,0,.06)}
.stat.sel .k{color:var(--brand);font-weight:700}
.code{margin-top:0;position:relative}
.code pre{margin:0;padding:12px;background:var(--code);color:var(--codet);border-radius:10px;font-size:12.5px;line-height:1.5;white-space:pre-wrap;word-break:break-all;max-height:150px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;cursor:pointer;transition:box-shadow .15s}
.code pre:hover{box-shadow:0 0 0 1px var(--brand)}
.code .hintcp{position:absolute;bottom:8px;right:10px;display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:7px;background:rgba(8,12,10,.92);color:#2ecc7d;border:1px solid rgba(255,255,255,.18);font-size:12px;opacity:0;pointer-events:none;transition:opacity .15s;z-index:2}
.code:hover .hintcp{opacity:1}
.tit{font-size:12px;color:var(--sub);margin:14px 0 6px;display:flex;justify-content:space-between;align-items:center}
.banner{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:12px;margin-bottom:14px;font-size:14px;line-height:1.5;background:rgba(34,160,107,.12);color:var(--ok)}
.banner .ck{width:26px;height:26px;flex:none;border-radius:50%;background:var(--ok);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px}
.banner .bd{flex:1;min-width:0}
.item{border-top:1px solid var(--line);padding:8px 0;position:relative}
.item:first-child{border-top:0}
.item .top{display:flex;align-items:center;gap:8px}
.item .nm{font-weight:600;flex:1;min-width:0;word-break:break-all}
.dot{width:9px;height:9px;border-radius:50%;background:var(--sub);flex:none}
.dot.healthy{background:var(--ok)}.dot.down{background:var(--bad)}.dot.degraded{background:var(--warn)}
.badge{font-size:12px;padding:2px 9px;border-radius:10px;background:var(--in);color:var(--sub);flex:none}
.badge.healthy{background:rgba(34,160,107,.14);color:var(--ok)}
.badge.degraded{background:rgba(232,163,23,.16);color:var(--warn)}
.badge.down{background:rgba(217,63,63,.13);color:var(--bad)}
.id{font-size:11px;color:var(--sub);margin:2px 0 0;word-break:break-all}
/* \u7D27\u51D1\u884C: \u7B2C\u4E00\u884C \u540D\u79F0+\u57DF\u540D+\u72B6\u6001\u5FBD\u6807, \u7B2C\u4E8C\u884C \u8DEF\u7531+\u64CD\u4F5C\u6309\u94AE\u5168\u90E8\u4E00\u6392 */
/* trow \u4E0D\u518D\u662F\u5B9A\u4F4D\u4E0A\u4E0B\u6587: \u6309\u94AE\u7EC4/\u72B6\u6001\u5FBD\u7AE0\u6539\u4EE5 .item(\u6574\u884C) \u4E3A\u57FA\u51C6\u5782\u76F4\u5C45\u4E2D */
.trow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.trow .nm{font-weight:600;flex:none;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.trow .id{margin:0;flex:none;font-size:11px;color:var(--sub);word-break:break-all}
.trow .host{flex:1;min-width:120px;font-size:12.5px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.trow .host b{color:var(--text);font-weight:600}
.trow .host .rp{color:var(--warn)}
.routes{margin:2px 18px 0;font-size:12.5px;color:var(--sub);line-height:1.6}
.routes b{color:var(--text);font-weight:600}
.routes .rp{color:var(--warn)}
.acts{display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:flex-end;flex:1;min-width:280px;margin-right:106px}
.acts .btn.sm{padding:4px 10px;font-size:12px;border-radius:8px}
.acts .btn.sm .btxt{display:none}
/* \u5BBD\u5C4F: \u6309\u94AE\u7EC4\u8131\u79BB\u6587\u672C\u6D41, \u76F8\u5BF9\u6574\u6761 item(\u540D\u79F0\u884C+\u8DEF\u7531\u884C)\u5782\u76F4\u5C45\u4E2D; \u53F3\u4FA7\u7559\u51FA\u5FBD\u7AE0\u4F4D\u7F6E */
@media(min-width:900px){.acts .btn.sm .btxt{display:inline}.acts .btn.sm .bico{margin-right:2px}
  .trow .acts{position:absolute;top:50%;transform:translateY(-50%);right:106px;margin:0;flex:none}}
/* \u8DEF\u7531\u8868\u683C (\u7F16\u8F91/\u8DEF\u7531\u5F39\u7A97) */
.rtable{margin-top:8px}
.rtable .rt{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;background:var(--in);margin-bottom:6px;font-size:13px}
.rtable .rt .rh{flex:1;min-width:0;word-break:break-all}
.rtable .rt .rh b{color:var(--text)}
.rtable .rt .rs{color:var(--sub);flex:none;max-width:38%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pill{font-size:11.5px;padding:3px 9px;border-radius:20px;background:var(--in);color:var(--sub);border:1px solid var(--line);white-space:nowrap}
.pill.on{color:var(--ok);border-color:rgba(34,160,107,.4)}
.pill.off{color:var(--bad);border-color:rgba(217,63,63,.35)}
.pill.warn{color:var(--warn);border-color:rgba(232,163,23,.4)}
.empty{color:var(--sub);font-size:14px;text-align:center;padding:18px 0}
.hint{font-size:13px;color:var(--sub);margin:2px 0 6px;line-height:1.65}
.mask{position:fixed;inset:0;background:rgba(0,0,0,.5);display:none;z-index:8}
.mask.show{display:block}
.modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9;width:min(560px,calc(100% - 24px));max-height:calc(100vh - 40px);overflow-y:auto;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.28);display:none}
.modal.confirm{top:120px;transform:translate(-50%,0);width:min(400px,calc(100% - 24px));padding:22px 22px 18px;overflow:visible}
.modal.confirm h3{margin:0 0 8px;font-size:16px;display:flex;align-items:center;gap:9px}
.modal.confirm .wi{width:34px;height:34px;flex:none;border-radius:50%;background:rgba(232,163,23,.15);color:var(--warn);display:flex;align-items:center;justify-content:center;font-size:16px}
.modal.confirm p{margin:0 0 18px;font-size:13.5px;color:var(--sub);line-height:1.7;word-break:break-all}
.modal.confirm .btns .btn{flex:none;padding:9px 22px}
.modal.confirm .btns .btn.danger{margin-left:auto}
.modal.show{display:block}
.modal h3{margin:0 0 4px;font-size:17px;display:flex;justify-content:space-between;align-items:center;gap:10px}
.modal .x{border:0;background:none;color:var(--sub);font-size:19px;cursor:pointer;padding:0 4px;line-height:1}
.btns{display:flex;gap:10px;margin-top:18px}.btns .btn{flex:1}
.btn.gray{background:var(--in);background-image:none;color:var(--text);border:1px solid var(--line)}
.busy{position:fixed;inset:0;z-index:10;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.28);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}
.busy.show{display:flex}
.busy .box{background:var(--card);color:var(--text);padding:18px 26px;border-radius:14px;display:flex;align-items:center;gap:12px;font-size:15px}
.busy .spin{width:20px;height:20px;border:3px solid var(--line);border-top-color:var(--brand)}
#toast{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 14px);transform:translate(-50%,-160%);z-index:30;max-width:min(680px,92vw);display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:10px;font-size:14px;font-weight:600;line-height:1.45;opacity:0;pointer-events:none;transition:transform .24s ease,opacity .24s ease}
#toast.ok{color:#22a06b;background:var(--card);background:color-mix(in srgb,#22a06b 16%,var(--card));border:1px solid rgba(34,160,107,.45);box-shadow:0 10px 28px rgba(0,0,0,.16)}
#toast.err{color:#e05252;background:var(--card);background:color-mix(in srgb,#e05252 16%,var(--card));border:1px solid rgba(224,82,82,.45);box-shadow:0 10px 28px rgba(0,0,0,.16)}
#toast.show{opacity:1;transform:translate(-50%,0)}
#toast .ti{font-size:15px;font-weight:700;flex:none;line-height:1}
.chat{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--line)}
.chat:first-child{border-top:0}
.chat .ci{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#2aabee,#229ed9);color:#fff;display:flex;align-items:center;justify-content:center;flex:none;font-size:16px}
.chat .cn{flex:1;min-width:0}
.chat .cn b{display:block;font-size:14px}
.chat .cn span{font-size:12px;color:var(--sub);word-break:break-all}
.side-toggle{display:none;background:none;border:1px solid var(--line);border-radius:9px;padding:5px 10px;font-size:16px;color:var(--text);cursor:pointer}
@media(max-width:760px){
  .stats{grid-template-columns:repeat(2,1fr)}
  .side-toggle{display:inline-block}
  .sidenav{position:fixed;left:0;top:0;bottom:0;z-index:20;transform:translateX(-100%);transition:transform .2s}
  .sidenav.open{transform:none;box-shadow:0 0 40px rgba(0,0,0,.4)}
  .content{padding:14px 12px calc(env(safe-area-inset-bottom,0px) + 40px)}
  .topbar{padding:calc(env(safe-area-inset-top,0px) + 10px) 10px 10px;gap:7px;flex-wrap:nowrap}
  /* \u624B\u673A: \u7F29\u5C0F\u5B57\u53F7, \u4E0B\u62C9\u53D8\u7A84, \u6807\u9898\u4E0D\u4E0E\u8D26\u53F7\u7EC4\u91CD\u53E0, \u4E3B\u9898\u6309\u94AE\u53EF\u89C1 */
  .topbar h2{position:static;transform:none;left:auto;max-width:none;font-size:13px;flex:1;min-width:0;order:2;text-align:right;padding-right:2px}
  .accwrap{order:1;flex:none;min-width:0;gap:5px}
  .aclabel{font-size:11.5px}
  .accwrap select{min-width:0;max-width:96px;width:auto;padding:5px 6px;font-size:12px}
  .btn.sm{padding:5px 8px;font-size:11.5px}
  .btn.sm#theme{padding:5px 7px;font-size:14px;flex:none}
  .btn.sm#acc_mgr{flex:none;font-size:13px;padding:4px 7px}
  .stat .v{font-size:26px}
  .modal{left:0;top:auto;bottom:0;transform:none;width:100%;max-height:92vh;border-radius:18px 18px 0 0;border-bottom:0;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 20px)}
  /* \u624B\u673A: \u786E\u8BA4\u5F39\u7A97 (.modal.confirm \u7684 top/transform \u4F18\u5148\u7EA7\u66F4\u9AD8, \u9700\u5355\u72EC\u8986\u76D6), \u5426\u5219\u4F1A\u5DE6\u504F\u51FA\u5C4F */
  /* bottom:0 \u2192 \u60AC\u6D6E\u5728\u5E95\u90E8\u4E0A\u65B9 (\u907F\u5F00\u624B\u673A\u6D4F\u89C8\u5668\u5E95\u90E8\u5DE5\u5177\u680F), \u4E0D\u518D\u8D34\u6B7B\u5C4F\u5E55\u5E95\u7F18 */
  .modal.confirm{top:auto;transform:none;width:100%;bottom:calc(env(safe-area-inset-bottom,0px) + 56px);border-radius:16px 16px 0 0}
  /* \u624B\u673A: \u8D26\u53F7\u7BA1\u7406\u5F39\u7A97\u7684\u4E24\u4E2A\u8F93\u5165\u6846\u4E0A\u4E0B\u5806\u53E0, \u4E0D\u518D\u5E76\u6392\u9519\u4F4D */
  .amrow{flex-direction:column;gap:0}
  .amrow > div{flex:none !important;width:100%}
  .amhint{display:block;margin-top:2px}
  .toolbar{gap:8px}
}
</style></head><body>
<div class="app">
  <aside class="sidenav" id="sidenav">
    <div class="brand"><span class="ic">\u2601\uFE0F</span><span>Cloudflare domain-Tunnel \u7BA1\u7406\u9762\u677F</span></div>
    <nav class="nav">
      <a data-v="dash" class="on"><span class="i">\u{1F4CA}</span>\u4EEA\u8868\u677F</a>
      <a data-v="workers"><span class="i">\u{1F9E9}</span>Worker \u7BA1\u7406</a>
      <a data-v="tunnels"><span class="i">\u2699\uFE0F</span>Tunnel \u7BA1\u7406</a>
      <a data-v="tg"><span class="i">\u2708\uFE0F</span>Telegram \u914D\u7F6E</a>
    </nav>
    <div class="foot"><a href="#" id="logout"><span class="i">\u{1F464}</span><span class="lt">\u9000\u51FA\u767B\u5F55</span><span class="lo">\u21E5</span></a></div>
  </aside>

  <div class="main">
    <div class="topbar">
      <button class="side-toggle" id="menu">\u2630</button>
      <h2 id="ttl">\u4EEA\u8868\u677F</h2>
      <div class="accwrap">
        <span class="aclabel">\u5F53\u524D\u8D26\u6237</span>
        <!-- \u2605 \u8D26\u53F7\u7BA1\u7406\u6309\u94AE: \u5DF2\u4ECE\u9876\u680F\u53F3\u4FA7\u79FB\u5230\u9ED8\u8BA4\u8D26\u53F7\u4E0B\u62C9\u680F\u5DE6\u8FB9 -->
        <button class="btn sm" id="acc_mgr" title="\u7BA1\u7406\u8D26\u53F7"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" style="font-size:15px;vertical-align:-2px"><path d="M0 0h16v16H0z" fill="none"/><path fill="#d86d16" d="M6 5a2 2 0 1 1 4 0a2 2 0 0 1-4 0m-.5 3h5A1.5 1.5 0 0 1 12 9.5c0 1.116-.459 2.01-1.212 2.615C10.047 12.71 9.053 13 8 13s-2.047-.29-2.788-.885C4.46 11.51 4 10.616 4 9.5A1.5 1.5 0 0 1 5.5 8M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8"/></svg></button>
        <select id="acc_sel" title="\u5207\u6362 Cloudflare \u8D26\u53F7"></select>
      </div>
      <button class="btn sm" id="refresh">\u5237\u65B0</button>
      <button class="btn sm" id="theme" title="\u5207\u6362\u767D\u5929/\u9ED1\u591C\u4E3B\u9898">\u{1F319}</button>
    </div>
    <div class="content"><div class="wrap">

      <section class="view on" id="v-dash">
        <div class="stats">
          <div class="stat sel" id="btn_show_domains" data-view="domains" title="\u5728\u4E0B\u65B9\u5C55\u793A\u6846\u67E5\u770B\u6240\u6709\u57DF\u540D\u53CA\u7ED1\u5B9A\u8BE6\u60C5">
            <div class="k">\u{1F310} \u603B\u57DF\u540D</div><div class="v" id="s_dom">-</div>
          </div>
          <div class="stat" id="btn_show_all" data-view="all" title="\u5728\u4E0B\u65B9\u5C55\u793A\u6846\u67E5\u770B\u5168\u90E8 Tunnel">
            <div class="k">\u{1F4CA} \u603B Tunnel</div><div class="v" id="s_all">-</div>
          </div>
          <div class="stat on" id="btn_show_online" data-view="online" title="\u5728\u4E0B\u65B9\u5C55\u793A\u6846\u67E5\u770B\u5728\u7EBF Tunnel">
            <div class="k">\u{1F7E2} \u5728\u7EBF Tunnel</div><div class="v" id="s_on">-</div>
          </div>
          <div class="stat off" id="btn_show_offline" data-view="offline" title="\u5728\u4E0B\u65B9\u5C55\u793A\u6846\u67E5\u770B\u79BB\u7EBF Tunnel">
            <div class="k">\u{1F534} \u79BB\u7EBF Tunnel</div><div class="v" id="s_off">-</div>
          </div>
          <div class="stat" id="btn_show_workers" data-view="workers" title="\u5728\u4E0B\u65B9\u5C55\u793A\u6846\u67E5\u770B\u5168\u90E8 Worker \u7ED1\u5B9A\u57DF\u540D">
            <div class="k">\u{1F9E9} \u603B Worker</div><div class="v" id="s_wk">-</div>
          </div>
          <div class="stat on" id="btn_show_workers_on" data-view="workers_online" title="\u5728\u4E0B\u65B9\u5C55\u793A\u6846\u67E5\u770B\u68C0\u6D4B\u6709\u6548\u7684 Worker \u57DF\u540D">
            <div class="k">\u{1F7E2} \u5728\u7EBF Worker</div><div class="v" id="s_wk_on">-</div>
          </div>
          <div class="stat off" id="btn_show_workers_off" data-view="workers_offline" title="\u5728\u4E0B\u65B9\u5C55\u793A\u6846\u67E5\u770B\u68C0\u6D4B\u5931\u6548\u7684 Worker \u57DF\u540D">
            <div class="k">\u{1F534} \u79BB\u7EBF Worker</div><div class="v" id="s_wk_off">-</div>
          </div>
        </div>
        <!-- \u2605 \u7EDF\u4E00\u5C55\u793A\u6846: \u9ED8\u8BA4\u5C55\u793A\u603B\u57DF\u540D; \u70B9\u4E0A\u65B9\u56DB\u5F20\u5361\u5C31\u5728\u8FD9\u91CC\u5207\u6362, \u4E0D\u518D\u5F39\u7A97 -->
        <div class="card">
          <h3><span id="panel_title">\u57DF\u540D\u7BA1\u7406\u4E0E\u7ED1\u5B9A\u72B6\u6001</span><span class="pill" id="alert_state">-</span></h3>
          <div class="hint" id="panel_hint">\u5F53\u524D\u8D26\u53F7\u4E0B\u6258\u7BA1\u7684\u57DF\u540D\u4EE5\u53CA\u5173\u8054\u7684 Tunnel \u9879\u76EE\u3001\u5B50\u57DF\u540D\u548C\u672C\u5730\u670D\u52A1\u3002</div>
          <div id="panel_domains"><div class="empty">\u52A0\u8F7D\u4E2D...</div></div>
          <div id="dash" style="display:none"><div class="empty">\u52A0\u8F7D\u4E2D...</div></div>
          <div id="panel_workers" style="display:none"><div class="empty">\u52A0\u8F7D\u4E2D...</div></div>
        </div>
      </section>

      <section class="view" id="v-tunnels">
        <div class="toolbar">
          <div class="search">
            <span class="si">\u{1F50D}</span>
            <input id="q" placeholder="\u641C\u7D22\u96A7\u9053\u540D\u79F0 / ID / \u57DF\u540D" autocomplete="off">
            <button class="qx" id="qclear" type="button" title="\u6E05\u7A7A\u641C\u7D22">\u2715</button>
          </div>
          <button class="btn" id="newbtn">\uFF0B \u65B0\u5EFA\u96A7\u9053</button>
        </div>
        <div class="card">
          <h3><span>\u96A7\u9053\u5217\u8868</span><span class="hint" id="sum" style="margin:0"></span></h3>
          <div id="list"><div class="empty">\u52A0\u8F7D\u4E2D...</div></div>
        </div>
      </section>

      <section class="view" id="v-workers">
        <div class="card">
          <h3><span>Worker \u7BA1\u7406</span><span class="pill" id="wk_pill">-</span></h3>
          <div class="hint">\u6309\u57DF\u540D\u5206\u7EC4: \u6BCF\u4E2A\u57DF\u540D\u7ED1\u5B9A\u4E86\u54EA\u4E9B Cloudflare \u9879\u76EE (Worker / Pages)\u3001\u5404\u81EA\u7ED1\u5B9A\u7684\u57DF\u540D; \u70B9\u9879\u76EE\u53F3\u4FA7\u300C\u7BA1\u7406\u300D\u76F4\u63A5\u8DF3\u5230 Cloudflare \u540E\u53F0\u5BF9\u5E94\u7684\u9879\u76EE\u9875\u3002Tunnel \u5728\u300CTunnel \u7BA1\u7406\u300D\u91CC\u7EF4\u62A4, \u8FD9\u91CC\u4E0D\u91CD\u590D\u5217\u3002</div>
          <div style="display:flex;justify-content:flex-end;margin-bottom:6px"><button class="btn sm" id="wk_reload">\u21BB \u91CD\u65B0\u52A0\u8F7D</button></div>
          <div id="wk_list"><div class="empty">\u52A0\u8F7D\u4E2D...</div></div>
        </div>
      </section>

      <section class="view" id="v-tg">
        <div class="card">
          <h3><span>Telegram \u63D0\u9192</span><span class="pill" id="tg_state">-</span></h3>
          <div class="row" style="align-items:flex-end">
            <div style="flex:1;min-width:0">
              <label for="tg_chat">\u63A5\u6536\u8005 chat_id</label>
              <input id="tg_chat" placeholder="\u6B63\u6570 ID \u6216 -100xxx" autocapitalize="off" autocomplete="off">
            </div>
            <div style="flex:2;min-width:0">
              <label for="tg_token">Bot Token</label>
              <input id="tg_token" placeholder="\u4F8B\u5982 123456789:AbCdefGhIJKlmNoPQRsTUVwxyZ" autocapitalize="off" autocomplete="off" spellcheck="false">
            </div>
            <button class="btn" id="tg_save" style="flex:none;padding:11px 18px;white-space:nowrap">\u4FDD\u5B58\u63A8\u9001\u914D\u7F6E</button>
          </div>
          <div class="row" style="margin-top:12px">
            <button class="btn gray" id="tg_test" style="flex:none;width:76px">\u6D4B\u8BD5\u53D1\u9001</button>
            <button class="btn gray" id="tg_pause" style="flex:none;width:96px">\u23F8 \u6682\u505C\u63A8\u9001</button>
          </div>
          <div class="hint" style="margin-top:10px">chat_id \u662F<strong>\u63A5\u6536\u8005</strong>\u7684 ID, \u4E0D\u662F\u673A\u5668\u4EBA\u7684: \u60F3\u79C1\u804A\u6536\u63D0\u9192, \u5148\u5728 Telegram \u91CC\u7ED9\u673A\u5668\u4EBA\u53D1\u4E00\u53E5 /start, \u518D\u586B<strong>\u4F60\u81EA\u5DF1\u7684\u6B63\u6570\u6570\u5B57 ID</strong> (\u4E0D\u77E5\u9053\u81EA\u5DF1\u7684 ID \u53EF\u95EE @userinfobot); \u60F3\u53D1\u5230\u7FA4\u7EC4/\u9891\u9053, \u586B\u8D1F\u6570 ID (\u7FA4\u7EC4\u9700\u5148\u628A\u673A\u5668\u4EBA\u62C9\u8FDB\u7FA4) \u6216 @\u516C\u5F00\u7528\u6237\u540D\u3002\u586B\u5199\u540E\u70B9"\u4FDD\u5B58\u63A8\u9001\u914D\u7F6E"\u5199\u5165\u5B58\u50A8; "\u6D4B\u8BD5\u53D1\u9001"\u7528\u5F53\u524D\u586B\u5199\u7684\u914D\u7F6E\u53D1\u4E00\u6761\u6D4B\u8BD5\u6D88\u606F\u3002\u6682\u505C\u63A8\u9001\u671F\u95F4\u72B6\u6001\u4ECD\u4F1A\u68C0\u67E5, \u53EA\u662F\u4E0D\u53D1\u9001\u6D88\u606F\u3002</div>
          <div id="tg_list" style="margin-top:10px"></div>
        </div>

        <div class="card">
          <h3>\u63D0\u9192\u89C4\u5219</h3>
          <div class="hint">
            1. \u6BCF\u4E2A\u96A7\u9053\u53EF\u5728"Tunnel \u7BA1\u7406"\u91CC\u5355\u72EC\u5F00\u5173\u4E0A\u7EBF/\u79BB\u7EBF\u63D0\u9192, <strong>\u9ED8\u8BA4\u5173\u95ED</strong>, \u9700\u624B\u52A8\u5F00\u542F\u3002<br>
            2. \u53EA\u5728\u96A7\u9053\u72B6\u6001<strong>\u53D1\u751F\u53D8\u5316</strong>\u65F6\u63D0\u9192 (\u4E0A\u7EBF\u4E00\u6B21\u3001\u79BB\u7EBF\u4E00\u6B21), \u540C\u4E00\u72B6\u6001\u4E0D\u4F1A\u91CD\u590D\u63D0\u9192\u3002<br>
            3. \u9996\u6B21\u8BB0\u5F55\u5230\u7684\u96A7\u9053\u53EA\u4FDD\u5B58\u72B6\u6001\u4E0D\u53D1\u9001\u63D0\u9192, \u90E8\u7F72\u540E\u4E0D\u4F1A\u5237\u5C4F\u3002<br>
            4. \u6253\u5F00\u9762\u677F\u6216\u70B9\u5237\u65B0\u65F6\u4F1A\u68C0\u67E5\u4E00\u6B21; \u82E5\u8981\u65E0\u4EBA\u503C\u5B88\u4E5F\u6301\u7EED\u68C0\u67E5, \u7ED9 Worker \u52A0\u4E00\u4E2A Cron \u89E6\u53D1\u5668
            (\u4F8B\u5982 <code>*/5 * * * *</code>), \u4EE3\u7801\u91CC\u7684 <code>scheduled</code> \u5904\u7406\u4F1A\u81EA\u52A8\u6267\u884C\u540C\u6837\u7684\u68C0\u67E5\u3002<br>
            5. Bot Token / \u63A5\u6536\u8005 / \u6682\u505C\u72B6\u6001\u90FD\u4FDD\u5B58\u5728 D1 (TUNNEL_DB) \u6216 KV (TUNNEL_STATE);
            \u4E5F\u53EF\u7528\u73AF\u5883\u53D8\u91CF <code>TG_BOT_TOKEN</code> \u4F5C\u4E3A\u515C\u5E95 Token\u3002<br>
            6. \u6682\u505C\u63A8\u9001\u671F\u95F4\u72B6\u6001\u4ECD\u7167\u5E38\u68C0\u67E5\u548C\u8BB0\u5F55, \u53EA\u662F\u6682\u65F6\u4E0D\u53D1\u9001 Telegram \u6D88\u606F\u3002
          </div>
        </div>
      </section>

    </div></div>
  </div>
</div>

<div id="toast"><span class="ti" id="toast_i">\u2714</span><span id="toast_m"></span></div>
<div class="busy" id="busy"><div class="box"><span class="spin"></span><span id="busyt">\u5904\u7406\u4E2D...</span></div></div>
<div class="mask" id="e_mask"></div>

<div class="modal" id="mCreate">
  <h3><span>\u65B0\u5EFA\u96A7\u9053</span><button class="x" id="m_x">\u2715</button></h3>
  <div class="hint">\u586B\u5199\u540E\u70B9"\u521B\u5EFA\u96A7\u9053", \u521B\u5EFA\u5B8C\u6210\u4F1A\u7ACB\u5373\u663E\u793A Token</div>
  <label>\u96A7\u9053\u540D\u79F0</label>
  <input id="name" placeholder="\u5EFA\u8BAE\u586B\u5199\u5E73\u53F0\u7684\u540D\u79F0, \u4F8B\u5982\uFF1Aaws-jp" autocomplete="off">
  <label>\u516C\u5F00\u57DF\u540D</label>
  <div class="row">
    <input id="sub" class="sub" placeholder="\u5B50\u57DF\u540D(\u7559\u7A7A\u5C06\u4F7F\u7528\u4E3B\u57DF\u540D)" autocapitalize="off" autocomplete="off">
    <select id="zone" class="zone"><option>\u52A0\u8F7D\u4E2D...</option></select>
  </div>
  <label>\u8DEF\u5F84(\u53EF\u9009)</label>
  <input id="path" placeholder="\u4F8B\u5982 /api \u6216 ^/ws,\u7559\u7A7A\u5339\u914D\u5168\u90E8" autocapitalize="off" autocomplete="off">
  <label>\u672C\u5730\u670D\u52A1\u5730\u5740( tcp://localhost:3389  http://localhost:8080 )</label>
  <input id="svc" placeholder="http://localhost:8001" autocapitalize="off" autocomplete="off">
  <div class="preview" id="pv"></div>
  <div class="btns"><button class="btn gray" id="m_cancel">\u53D6\u6D88</button><button class="btn" id="go">\u521B\u5EFA\u96A7\u9053</button></div>
</div>

<div class="modal" id="mToken">
  <h3><span>Token</span><button class="x" id="t_x">\u2715</button></h3>
  <div id="t_banner"></div>
  <div id="t_body"><div class="empty">\u52A0\u8F7D\u4E2D...</div></div>
</div>

<div class="modal" id="mEdit">
  <h3><span>\u7F16\u8F91\u96A7\u9053</span><button class="x" id="e_x">\u2715</button></h3>
  <div id="e_note" class="hint"></div>
  <label>\u96A7\u9053\u540D\u79F0</label>
  <input id="e_name" autocomplete="off">
  <div id="e_pick_wrap" style="display:none">
    <label>\u6B63\u5728\u7F16\u8F91\u7684\u8DEF\u7531</label>
    <select id="e_pick"></select>
  </div>
  <label>\u516C\u5F00\u57DF\u540D</label>
  <div class="row">
    <input id="e_sub" class="sub" placeholder="\u5B50\u57DF\u540D(\u53EF\u7A7A)" autocapitalize="off" autocomplete="off">
    <select id="e_zone" class="zone"></select>
  </div>
  <label>\u8DEF\u5F84(\u53EF\u9009)</label>
  <input id="e_path" placeholder="\u4F8B\u5982 /api \u6216 ^/ws,\u7559\u7A7A\u5339\u914D\u5168\u90E8" autocapitalize="off" autocomplete="off">
  <label>\u672C\u5730\u670D\u52A1\u5730\u5740( tcp://localhost:3389  http://localhost:8080 )</label>
  <input id="e_svc" placeholder="http://localhost:8001" autocapitalize="off" autocomplete="off">
  <div class="preview" id="e_pv"></div>
  <div class="btns"><button class="btn gray" id="e_cancel">\u53D6\u6D88</button><button class="btn" id="e_save">\u4FDD\u5B58</button></div>
</div>

<div class="modal" id="mAccMgr">
  <h3><span>\u8D26\u53F7\u7BA1\u7406</span><button class="x" id="am_x">\u2715</button></h3>
  <div id="am_body"></div>
  <div style="border-top:1px solid var(--line);margin-top:14px;padding-top:14px">
    <div class="row amrow">
      <div style="flex:1;min-width:0"><label>\u8D26\u53F7\u540D\u79F0 <span class="amhint">(\u53EF\u9009\uFF0C\u7559\u7A7A\u81EA\u52A8\u8BC6\u522B)</span></label><input id="am_name" placeholder="\u7559\u7A7A\u81EA\u52A8\u8BC6\u522B\uFF0C\u4E5F\u53EF\u586B\u90AE\u7BB1/\u4E2D\u6587/\u6570\u5B57" autocomplete="off"></div>
      <div style="flex:1.2;min-width:0"><label>\u8D26\u6237 ID (32 \u4F4D)</label><input id="am_acc" placeholder="Cloudflare \u8D26\u6237 ID" autocapitalize="off" autocomplete="off" spellcheck="false"></div>
    </div>
    <label>\u8BE5\u8D26\u6237\u7684 API Token (\u6743\u9650\u540C\u73AF\u5883\u53D8\u91CF\u8981\u6C42)</label>
    <input id="am_token" placeholder="\u7C98\u8D34\u540E\u70B9\u6DFB\u52A0, \u4F1A\u5148\u9A8C\u8BC1\u518D\u4FDD\u5B58" autocapitalize="off" autocomplete="off" spellcheck="false">
    <div class="btns" style="margin-top:12px"><button class="btn" id="am_add">\u6DFB\u52A0\u8D26\u53F7</button></div>
    <div class="hint" style="margin-top:8px">\u9A8C\u8BC1\u901A\u8FC7\u624D\u4FDD\u5B58; Token \u53EA\u5B58\u5728D1, \u4E0D\u4F1A\u4E0B\u53D1\u5230\u9875\u9762\u3002\u540D\u79F0\u7559\u7A7A\u65F6\u81EA\u52A8\u8BC6\u522B\uFF08\u5148\u67E5\u8D26\u6237\u8BE6\u60C5\uFF0C\u6CA1\u6709 Account Settings Read \u6743\u9650\u65F6\u6539\u67E5\u57DF\u540D\u5217\u8868\uFF09\uFF0C\u8BC6\u522B\u4E0D\u5230\u6682\u7528 ID \u524D 8 \u4F4D\uFF0C\u4E4B\u540E\u53EF\u7F16\u8F91\u6539\u540D\u3002\u73AF\u5883\u53D8\u91CF\u914D\u7F6E\u7684"\u9ED8\u8BA4\u8D26\u53F7"\u4E0D\u53EF\u5220\u9664\u3002\u5207\u6362\u8D26\u53F7\u540E\u96A7\u9053\u5217\u8868/\u63D0\u9192\u89C4\u5219/\u57DF\u540D\u968F\u8D26\u53F7\u5207\u6362\u3002</div>
  </div>
</div>

<div class="mask" id="c_mask"></div>
<div class="modal confirm" id="mConfirm" data-confirm="1">
  <h3><span class="wi">\u26A0</span><span id="c_ttl">\u786E\u8BA4\u64CD\u4F5C</span></h3>
  <p id="c_msg"></p>
  <div class="btns"><button class="btn gray" id="c_no">\u53D6\u6D88</button><button class="btn red-solid danger" id="c_yes">\u786E\u5B9A</button></div>
</div>

<div class="modal" id="mRoutes">
  <h3><span>\u8DEF\u7531\u7BA1\u7406 \xB7 <span id="r_name"></span></span><button class="x" id="r_x">\u2715</button></h3>
  <div class="hint">\u540C\u4E00\u6761\u96A7\u9053\u53EF\u4EE5\u7ED1\u5B9A\u591A\u4E2A\u57DF\u540D/\u8DEF\u5F84, \u6BCF\u4E2A\u8DEF\u7531\u6307\u5411\u4E00\u4E2A\u672C\u5730\u670D\u52A1\u3002\u65B0\u589E\u8DEF\u7531\u4F1A\u81EA\u52A8\u521B\u5EFA\u5BF9\u5E94\u7684 DNS CNAME\u3002</div>
  <div id="r_list" class="rtable"><div class="empty">\u52A0\u8F7D\u4E2D...</div></div>
  <div style="border-top:1px solid var(--line);margin-top:12px;padding-top:4px">
    <div class="hint" style="margin-top:8px;font-weight:600;color:var(--text)">\u65B0\u589E\u8DEF\u7531</div>
    <label>\u516C\u5F00\u57DF\u540D</label>
    <div class="row">
      <input id="r_sub" class="sub" placeholder="\u5B50\u57DF\u540D(\u53EF\u7A7A)" autocapitalize="off" autocomplete="off">
      <select id="r_zone" class="zone"></select>
    </div>
    <label>\u8DEF\u5F84(\u53EF\u9009)</label>
    <input id="r_path" placeholder="\u7559\u7A7A\u5339\u914D\u5168\u90E8" autocapitalize="off" autocomplete="off">
    <label>\u672C\u5730\u670D\u52A1\u5730\u5740( tcp://localhost:3389  http://localhost:8080 )</label>
    <input id="r_svc" placeholder="http://localhost:8001" autocapitalize="off" autocomplete="off">
    <div class="preview" id="r_pv"></div>
    <div class="btns"><button class="btn gray" id="r_cancel">\u5173\u95ED</button><button class="btn" id="r_add">\uFF0B \u6DFB\u52A0\u8DEF\u7531</button></div>
  </div>
</div>

<!-- \u2605 \u57DF\u540D\u5DF2\u6539\u4E3A\u4EEA\u8868\u677F\u5185\u5D4C\u5C55\u793A\u6846 (#panel_domains), \u539F mDomains \u5F39\u7A97\u5DF2\u5220\u9664 -->

<script>
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var ttm;
function toast(msg,type){
  var t=$('toast'),ok=type!=='err',cls=ok?'ok':'err';
  $('toast_i').textContent=ok?'\u2714':'\u2718';
  $('toast_m').textContent=msg;
  clearTimeout(ttm);
  t.className=cls;
  void t.offsetWidth;
  t.className=cls+' show';
  ttm=setTimeout(function(){t.className=cls},2600);
}
function fail(e){toast((e&&e.message)||'\u64CD\u4F5C\u5931\u8D25','err')}
function setBusy(on,msg){
  if(on&&document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  $('busyt').textContent=msg||'\u5904\u7406\u4E2D...';
  $('busy').className=on?'busy show':'busy';
}
async function api(path,extra){
  var r,d;
  // \u81EA\u52A8\u643A\u5E26\u5F53\u524D\u6240\u9009\u8D26\u53F7 (/api/acc \u81EA\u8EAB\u9664\u5916, \u907F\u514D\u5FAA\u73AF\u4F9D\u8D56)
  var body=extra||{};
  if(path!=='/tunnel/api/acc'&&curAcc)body.acc=curAcc;
  try{r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
  catch(e){throw new Error('\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25, \u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5')}
  try{d=await r.json()}catch(e){throw new Error('\u670D\u52A1\u8FD4\u56DE\u5F02\u5E38 (HTTP '+r.status+')')}
  if(r.status===401){location.replace('/login');throw new Error('\u767B\u5F55\u5DF2\u8FC7\u671F')}
  if(!r.ok)throw new Error(d.error||'\u8BF7\u6C42\u5931\u8D25');
  return d;
}
function copy(text){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){toast('\u5DF2\u590D\u5236')},function(){fb(text)});
  }else fb(text);
}
function fb(text){
  var a=document.createElement('textarea');a.value=text;document.body.appendChild(a);a.select();
  try{document.execCommand('copy');toast('\u5DF2\u590D\u5236')}catch(e){toast('\u590D\u5236\u5931\u8D25, \u8BF7\u624B\u52A8\u957F\u6309\u590D\u5236','err')}
  document.body.removeChild(a);
}
function codeBox(title,text){
  return '<div class="tit"><span>'+esc(title)+'</span></div>'+
    '<div class="code"><span class="hintcp">\u29C9 \u70B9\u51FB\u590D\u5236</span><pre data-copy="'+esc(text)+'">'+esc(text)+'</pre></div>';
}
function cmds(t){
  return codeBox('Token',t)+
         codeBox('Linux \u8FD0\u884C','cloudflared tunnel run --token '+t)+
         codeBox('Docker \u8FD0\u884C','docker run -d --restart always --network host cloudflare/cloudflared:latest tunnel --no-autoupdate run --token '+t);
}
// \u57DF\u540D\u680F\u53EA\u663E\u793A\u4E3B\u673A\u540D, \u4E0D\u5E26 https://
function hostLine(r){
  if(!r){
    return esc('(\u672A\u914D\u7F6E\u516C\u5F00\u57DF\u540D)');
  }
  return '<b>'+esc(r.hostname)+'</b>'+(r.path?' \xB7 \u8DEF\u5F84 '+esc(r.path):'')+' \u2192 '+esc(r.service||'(\u672A\u586B\u5199\u672C\u5730\u670D\u52A1)');
}

/* ---- \u5F39\u7A97 ---- */
function openModal(id){
  $('e_mask').className='mask show';
  document.querySelectorAll('.modal').forEach(function(m){m.className=m.dataset.confirm?'modal confirm':'modal'});
  $(id).className=$(id).dataset.confirm?'modal confirm show':'modal show';
}
function closeModal(){
  $('e_mask').className='mask';
  document.querySelectorAll('.modal').forEach(function(m){m.className='modal'});
}
$('e_mask').onclick=closeModal;

/* ---- \u81EA\u5B9A\u4E49\u786E\u8BA4\u6846 (\u5C45\u4E2D\u504F\u4E0A, Promise \u98CE\u683C) ---- */
var cResolve=null;
function askConfirm(msg,title,yesText){
  $('c_ttl').textContent=title||'\u786E\u8BA4\u64CD\u4F5C';
  $('c_msg').innerHTML=esc(msg).replace(/\\n/g,'<br>');
  $('c_yes').textContent=yesText||'\u786E\u5B9A';
  openModal('mConfirm');
  $('c_yes').className='btn red-solid danger';
  return new Promise(function(res){cResolve=res});
}
function settleConfirm(v){
  if(cResolve){var r=cResolve;cResolve=null;r(v)}
  closeModal();
}
$('c_yes').onclick=function(){settleConfirm(true)};
$('c_no').onclick=function(){settleConfirm(false)};
$('c_mask').onclick=function(){settleConfirm(false)};
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&cResolve)settleConfirm(false);
  if(e.key==='Enter'&&cResolve){e.preventDefault();settleConfirm(true)}
});

/* ---- \u83DC\u5355 ---- */
/* ---- \u591A\u8D26\u53F7 ---- */
var curAcc='',accNames={},envAccId='';
var allZones = []; // \u2605\u2605\u2605 \u65B0\u589E\uFF1A\u7528\u4E8E\u5168\u5C40\u4FDD\u5B58\u57DF\u540D\u5217\u8868 \u2605\u2605\u2605
function renderAccSel(d){
  // d: /api/acc list \u7684\u8FD4\u56DE {accounts:[{name,acc,builtin}], cur}
  if(d&&d.cur)curAcc=d.cur;
  var list=(d&&d.accounts)||[];
  list.forEach(function(a){accNames[a.acc]=a.name});
  $('acc_sel').innerHTML=list.map(function(a){
    return '<option value="'+esc(a.acc)+'"'+(a.acc===curAcc?' selected':'')+'>'+esc(a.name)+'</option>';
  }).join('');
}
async function loadAccs(){
  try{
    renderAccSel(await api('/tunnel/api/acc',{action:'list'}));
  }catch(e){
    // \u515C\u5E95: \u63A5\u53E3\u5931\u8D25 (\u65E7\u7248\u672C\u540E\u7AEF/\u4E34\u65F6\u6545\u969C) \u65F6\u81F3\u5C11\u663E\u793A\u73AF\u5883\u53D8\u91CF\u9ED8\u8BA4\u8D26\u53F7, \u4E0D\u663E\u793A"\u52A0\u8F7D\u5931\u8D25"
    if(envAccId){
      curAcc=envAccId;accNames[envAccId]='\u9ED8\u8BA4\u8D26\u53F7';
      $('acc_sel').innerHTML='<option value="'+esc(envAccId)+'" selected>\u9ED8\u8BA4\u8D26\u53F7</option>';
    }else $('acc_sel').innerHTML='<option value="">\u9ED8\u8BA4\u8D26\u53F7</option>';
  }
}
async function initZones(){
  try{
    var d=await api('/tunnel/api/init');
    if(d.envAcc)envAccId=d.envAcc;
    
    // \u2605\u2605\u2605 \u65B0\u589E\uFF1A\u5168\u5C40\u4FDD\u5B58\u57DF\u540D\u5E76\u66F4\u65B0\u7EDF\u8BA1\u5361\u7247\u7684\u6570\u5B57 \u2605\u2605\u2605
    allZones = d.zones || [];
    if($('s_dom')) $('s_dom').textContent = allZones.length; 
    
    $('zone').innerHTML=d.zones.length?d.zones.map(function(z){return '<option value="'+esc(z.id)+'">.'+esc(z.name)+'</option>'}).join(''):'<option value="">\u65E0\u53EF\u7528\u57DF\u540D</option>';
    if(d.service)$('svc').value=d.service;
    preview();
  }catch(e){
    $('zone').innerHTML='<option value="">\u52A0\u8F7D\u5931\u8D25</option>';
    fail(e);
  }
}
$('acc_sel').addEventListener('change',async function(){
  var v=this.value;
  // \u906E\u7F69\u53EA\u76D6\u4F4F\u5207\u6362+\u5217\u8868\u9996\u5C4F; \u8DEF\u7531\u8BE6\u60C5\u7167\u65E7\u540E\u53F0\u6E10\u8FDB\u52A0\u8F7D, \u4E0D\u62D6\u4F4F\u906E\u7F69
  setBusy(true,'\u8D26\u53F7\u5207\u6362\u4E2D...');
  try{
    try{await api('/tunnel/api/acc',{action:'switch',acc:v})}catch(e){}
    curAcc=v;renderAccSel({accounts:Object.keys(accNames).map(function(k){return {name:accNames[k],acc:k}}),cur:v});
    metaCache={}; // \u65B0\u8D26\u53F7\u8DEF\u7531\u7F13\u5B58\u6E05\u7A7A
    domainsCache=null; // \u2605 \u57DF\u540D\u968F\u8D26\u53F7\u5207\u6362, \u7F13\u5B58\u4F5C\u5E9F
    workerCheck={};workerCheckAt=0;
    await Promise.all([loadList(),initZones()]); // \u5217\u8868 + \u57DF\u540D\u4E0B\u62C9\u90FD\u968F\u8D26\u53F7\u5237\u65B0
    if(dashView==='domains'||dashView.indexOf('workers')===0)loadDomains(true);
    if(curView==='workers')loadWorkerMgr(true);
  }finally{setBusy(false)}
  loadTg();
  loadMeta();
});
$('acc_mgr').onclick=function(){openAccMgr()};
// \u8D26\u53F7\u7BA1\u7406\u5F39\u7A97\u5217\u8868\u6E32\u67D3 (\u542B\u7F16\u8F91\u6309\u94AE); items: [{name,acc,builtin}]
function amRender(items){
  accNames={};
  $('am_body').innerHTML=items.map(function(a){
    accNames[a.acc]=a.name;
    return '<div class="am-item"><div style="min-width:0"><b>'+esc(a.name)+'</b>'+
      '<div style="font-size:11px;color:var(--sub)">'+esc(a.acc)+(a.builtin?' \xB7 \u73AF\u5883\u53D8\u91CF\u914D\u7F6E':'')+'</div></div>'+
      (a.builtin?'':'<div style="display:flex;gap:6px;flex:none">'+
        '<button class="btn sm" data-amedit="'+esc(a.acc)+'" data-amname="'+esc(a.name)+'">\u7F16\u8F91</button>'+
        '<button class="btn sm red" data-amdel="'+esc(a.acc)+'">\u5220\u9664</button></div>')+
      '</div>';
  }).join('')||'<div class="empty">\u6682\u65E0\u6DFB\u52A0\u7684\u8D26\u53F7</div>';
}
// \u70B9"\u7F16\u8F91"\u5728\u8BE5\u8D26\u53F7\u5361\u7247\u4E0B\u5C55\u5F00\u5185\u8054\u7F16\u8F91\u8868\u5355; \u7559\u7A7A\u7684\u5B57\u6BB5\u4FDD\u6301\u539F\u503C\u4E0D\u53D8
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-amedit]');if(!t)return;
  document.querySelectorAll('.am-edit').forEach(function(x){x.remove()}); // \u540C\u65F6\u53EA\u5C55\u5F00\u4E00\u4E2A
  var acc=t.dataset.amedit,orig=t.dataset.amname;
  var div=document.createElement('div');
  div.className='am-edit';
  div.innerHTML=
    '<label style="margin-top:10px">\u8D26\u53F7\u540D\u79F0 (\u7559\u7A7A\u4FDD\u6301\u4E0D\u53D8)</label>'+
    '<input id="ame_name" placeholder="\u5F53\u524D: '+esc(orig)+'" autocomplete="off">'+
    '<label>\u8D26\u6237 ID (\u7559\u7A7A\u4FDD\u6301\u4E0D\u53D8)</label>'+
    '<input id="ame_acc" placeholder="\u5F53\u524D: '+esc(acc)+'" autocapitalize="off" autocomplete="off" spellcheck="false">'+
    '<label>API Token (\u7559\u7A7A\u4FDD\u6301\u4E0D\u53D8; \u6362\u65B0 Token \u4F1A\u5148\u9A8C\u8BC1)</label>'+
    '<input id="ame_token" placeholder="\u7C98\u8D34\u65B0 Token" autocapitalize="off" autocomplete="off" spellcheck="false">'+
    '<div style="display:flex;gap:8px;margin-top:10px">'+
      '<button class="btn gray" id="ame_cancel" style="flex:1">\u53D6\u6D88</button>'+
      '<button class="btn" id="ame_save" style="flex:1">\u4FDD\u5B58</button>'+
    '</div>';
  t.closest('.am-item').after(div);
  $('ame_cancel').onclick=function(){div.remove()};
  $('ame_save').onclick=async function(){
    var sb=this;
    sb.disabled=true;sb.innerHTML='<span class="spin"></span> \u4FDD\u5B58\u4E2D';
    try{
      var d=await api('/tunnel/api/acc',{action:'edit',acc:acc,
        name:$('ame_name').value.trim(),newAcc:$('ame_acc').value.trim(),token:$('ame_token').value.trim()});
      toast('\u8D26\u53F7\u5DF2\u66F4\u65B0');
      amRender(d.accounts||[]);
      renderAccSel({accounts:d.accounts||[],cur:curAcc});
    }catch(e){fail(e)}
    sb.disabled=false;sb.innerHTML='\u4FDD\u5B58';
  };
});
async function openAccMgr(){
  var b=$('am_body');
  b.innerHTML='<div class="empty">\u52A0\u8F7D\u4E2D...</div>';
  openModal('mAccMgr');
  try{
    var d=await api('/tunnel/api/acc',{action:'list'});
    amRender(d.accounts||[]);
  }catch(e){b.innerHTML='<div class="empty">\u52A0\u8F7D\u5931\u8D25</div>';fail(e)}
}
$('am_add').onclick=async function(){
  var b=this,name=$('am_name').value.trim(),acc=$('am_acc').value.trim(),token=$('am_token').value.trim();
  if(!acc||!token){toast('\u8BF7\u586B\u5199\u8D26\u6237 ID \u548C API Token\uFF08\u540D\u79F0\u53EF\u7559\u7A7A\u81EA\u52A8\u8BC6\u522B\uFF09','err');return}
  b.disabled=true;b.innerHTML='<span class="spin"></span> \u9A8C\u8BC1\u4E2D';
  try{
    var d=await api('/tunnel/api/acc',{action:'add',name:name,acc:acc,token:token});
    $('am_name').value='';$('am_acc').value='';$('am_token').value='';
    var autoNote=!name?(d.nameResolved?'\uFF08\u5DF2\u81EA\u52A8\u8BC6\u522B\uFF09':'\uFF08\u672A\u8BC6\u522B\u5230\uFF0C\u5DF2\u6682\u7528 ID\uFF0C\u53EF\u7F16\u8F91\u6539\u540D\uFF09'):'';
    toast('\u8D26\u53F7\u5DF2\u6DFB\u52A0: '+(d.name||name)+autoNote);
    amRender(d.accounts||[]);
    renderAccSel({accounts:d.accounts||[],cur:curAcc});
  }catch(e){fail(e)}
  b.disabled=false;b.innerHTML='\u6DFB\u52A0\u8D26\u53F7';
};
document.addEventListener('click',async function(e){
  var t=e.target.closest('[data-amdel]');if(!t)return;
  if(!(await askConfirm('\u5220\u9664\u8BE5\u8D26\u53F7? \u4EC5\u79FB\u51FA\u9762\u677F, \u4E0D\u5F71\u54CD Cloudflare \u8D26\u6237\u672C\u8EAB','\u5220\u9664\u8D26\u53F7','\u5220\u9664')))return;
  try{
    var d=await api('/tunnel/api/acc',{action:'del',acc:t.dataset.amdel});
    toast('\u5DF2\u5220\u9664');
    var items=d.accounts||[];
    amRender(items);
    // \u5220\u9664\u7684\u662F\u5F53\u524D\u8D26\u53F7 (\u6216\u5176\u5DF2\u4E0D\u5B58\u5728) \u2192 \u81EA\u52A8\u5207\u56DE\u9ED8\u8BA4\u8D26\u53F7 (env \u8D26\u53F7), \u91CD\u65B0\u52A0\u8F7D\u5217\u8868/\u57DF\u540D/\u63D0\u9192
    if(curAcc===t.dataset.amdel||!items.some(function(a){return a.acc===curAcc})){
      var fallback=items.find(function(a){return a.builtin})||items[0];
      if(fallback){
        curAcc=fallback.acc;
        try{await api('/tunnel/api/acc',{action:'switch',acc:curAcc})}catch(e2){}
        renderAccSel({accounts:items,cur:curAcc});
        setBusy(true,'\u8D26\u53F7\u5207\u6362\u4E2D...');
        try{metaCache={};await Promise.all([loadList(),initZones()])}finally{setBusy(false)}
        loadTg();loadMeta();
      }
    }else{
      renderAccSel({accounts:items,cur:curAcc});
    }
  }catch(e){fail(e)}
});
var curView='dash';
function show(v){
  curView=v;
  document.querySelectorAll('.nav a').forEach(function(a){a.className=a.dataset.v===v?'on':''});
  document.querySelectorAll('.view').forEach(function(s){s.className='view'+(s.id==='v-'+v?' on':'')});
  $('ttl').textContent=({dash:'\u4EEA\u8868\u677F',workers:'Worker \u7BA1\u7406',tunnels:'Tunnel \u7BA1\u7406',tg:'Telegram \u914D\u7F6E'})[v]||'';
  $('sidenav').className='sidenav';
  if(v==='workers')loadWorkerMgr(false);
}
document.querySelectorAll('.nav a').forEach(function(a){a.onclick=function(){show(a.dataset.v)}});
$('menu').onclick=function(){$('sidenav').className='sidenav open'};
$('logout').onclick=async function(e){
  e.preventDefault();
  try{await fetch('/tunnel/api/logout',{method:'POST'})}catch(err){}
  location.replace('/');
};
document.querySelectorAll('.view').forEach(function(s){s.addEventListener('click',function(){$('sidenav').className='sidenav'})});

/* ---- \u4EEA\u8868\u677F ---- */
var stText={healthy:'\u5728\u7EBF',degraded:'\u964D\u7EA7',down:'\u79BB\u7EBF',inactive:'\u672A\u542F\u7528'};
function durShort(ms){
  var m=Math.floor(ms/60000);
  if(m<1)return '<1m';
  if(m<60)return m+'m';
  var h=Math.floor(m/60);
  if(h<24)return h+'h';
  return Math.floor(h/24)+'d';
}
/* \u2605 \u4EEA\u8868\u677F\u5C55\u793A\u6846\u72B6\u6001: domains(\u9ED8\u8BA4) / all / online / offline */
var dashView='domains', dashData=null, domainsCache=null, domainsLoading=false;
var workerCheck={}, workerCheckAt=0, workerChecking=false; // \u2605 Worker \u57DF\u540D\u6709\u6548\u6027\u68C0\u6D4B\u7ED3\u679C (\u6309\u57DF\u540D)
var PANEL_META={
  domains:{title:'\u57DF\u540D\u7BA1\u7406\u4E0E\u7ED1\u5B9A\u72B6\u6001',hint:'\u5F53\u524D\u8D26\u53F7\u4E0B\u6258\u7BA1\u7684\u57DF\u540D\u4EE5\u53CA\u5173\u8054\u7684 Tunnel \u9879\u76EE\u3001\u5B50\u57DF\u540D\u548C\u672C\u5730\u670D\u52A1\u3002'},
  all:{title:'\u96A7\u9053\u72B6\u6001 \xB7 \u5168\u90E8 Tunnel',hint:''},
  online:{title:'\u96A7\u9053\u72B6\u6001 \xB7 \u5728\u7EBF Tunnel',hint:''},
  offline:{title:'\u96A7\u9053\u72B6\u6001 \xB7 \u79BB\u7EBF Tunnel',hint:''},
  workers:{title:'Worker \u7ED1\u5B9A\u57DF\u540D \xB7 \u5168\u90E8',hint:'\u6309\u7ED1\u5B9A\u57DF\u540D\u6761\u6570\u7EDF\u8BA1 (\u5728\u7EBF+\u79BB\u7EBF=\u603B Worker); \u6709\u6548\u6027\u7531\u9762\u677F\u670D\u52A1\u7AEF\u81EA\u52A8\u9010\u4E2A\u8BBF\u95EE\u68C0\u6D4B\u3002'},
  workers_online:{title:'Worker \u7ED1\u5B9A\u57DF\u540D \xB7 \u5728\u7EBF',hint:'\u4EE5\u4E0B\u57DF\u540D\u7ECF\u81EA\u52A8\u68C0\u6D4B\u53EF\u6B63\u5E38\u8BBF\u95EE (HTTP \u72B6\u6001\u7801 < 500)\u3002'},
  workers_offline:{title:'Worker \u7ED1\u5B9A\u57DF\u540D \xB7 \u79BB\u7EBF',hint:'\u4EE5\u4E0B\u57DF\u540D\u7ECF\u81EA\u52A8\u68C0\u6D4B\u5931\u6548: \u65E0\u54CD\u5E94\u3001\u8D85\u65F6\u6216 HTTP \u72B6\u6001\u7801 >= 500 (\u542B Cloudflare 52x/530)\u3002'}
};
function setDashView(v){
  dashView=PANEL_META[v]?v:'domains';
  document.querySelectorAll('.stats .stat').forEach(function(el){
    el.className=el.className.replace(/\bsel\b/g,'').trim()+(el.dataset.view===dashView?' sel':'');
  });
  var meta=PANEL_META[dashView];
  $('panel_title').textContent=meta.title;
  $('panel_hint').textContent=meta.hint||'';
  $('panel_hint').style.display=meta.hint?'':'none';
  var isDom=dashView==='domains';
  var isWk=dashView.indexOf('workers')===0;
  $('panel_domains').style.display=isDom?'':'none';
  $('panel_workers').style.display=isWk?'':'none';
  $('dash').style.display=(!isDom&&!isWk)?'':'none';
  if(isDom){ loadDomains(false); }
  else if(isWk){ updateAlertPill(); renderWorkers(); runWorkerCheck(false); }
  else if(dashData){ renderDashList(); updateAlertPill(); }
}
function updateWorkerPill(){
  var pill=$('alert_state');
  var hosts=workerHosts(),on=0,off=0;
  hosts.forEach(function(h){var c=workerCheck[h];if(c)c.ok?on++:off++});
  if(workerChecking){pill.className='pill warn';pill.textContent='\u57DF\u540D\u6709\u6548\u6027\u68C0\u6D4B\u4E2D...'}
  else if(workerCheckAt){pill.className=off?'pill warn':'pill on';pill.textContent='\u5171 '+hosts.length+' \u6761\u7ED1\u5B9A \xB7 \u5728\u7EBF '+on+' \xB7 \u79BB\u7EBF '+off}
  else{pill.className='pill';pill.textContent=hosts.length?('\u5171 '+hosts.length+' \u6761\u7ED1\u5B9A \xB7 \u5F85\u68C0\u6D4B'):'-'}
}
function updateAlertPill(){
  var pill=$('alert_state'),d=dashData;
  if(dashView.indexOf('workers')===0){updateWorkerPill();return}
  if(dashView==='domains'){
    if(domainsCache){pill.className='pill on';pill.textContent='\u5171 '+domainsCache.zones.length+' \u4E2A\u57DF\u540D'}
    else{pill.className='pill';pill.textContent=domainsLoading?'\u52A0\u8F7D\u4E2D...':'-'}
    return;
  }
  if(!d){pill.className='pill';pill.textContent='-';return}
  if(!d.kv){pill.className='pill warn';pill.textContent='\u672A\u7ED1\u5B9A KV: \u4EC5\u67E5\u770B\u72B6\u6001'}
  else if(d.alert&&d.alert.error){pill.className='pill warn';pill.textContent='\u63D0\u9192\u5F02\u5E38: '+d.alert.error}
  else{pill.className='pill on';pill.textContent='\u63D0\u9192\u5DF2\u542F\u7528'}
}
function renderDashList(){
  var d=dashData,box=$('dash');
  if(!d||!d.tunnels||!d.tunnels.length){box.innerHTML='<div class="empty">\u6682\u65E0\u96A7\u9053</div>';return}
  var arr=d.tunnels;
  if(dashView==='online')arr=arr.filter(function(t){return t.up});
  if(dashView==='offline')arr=arr.filter(function(t){return !t.up});
  if(!arr.length){box.innerHTML='<div class="empty">'+(dashView==='online'?'\u6682\u65E0\u5728\u7EBF\u96A7\u9053':'\u6682\u65E0\u79BB\u7EBF\u96A7\u9053')+'</div>';return}
  box.innerHTML=arr.map(function(t){
    return '<div class="item"><div class="top"><span class="dot '+esc(t.status)+'"></span>'+
      '<span class="nm">'+esc(t.name)+'</span>'+
      '<span class="badge '+esc(t.status)+'">'+esc(stText[t.status]||t.status)+'</span></div>'+
      '<div class="id">'+esc(t.id)+'</div></div>';
  }).join('');
}
function renderDash(d){
  dashData=d;
  $('s_on').textContent=d.online;$('s_off').textContent=d.offline;$('s_all').textContent=d.total;
  if(dashView==='domains')updateAlertPill();else{updateAlertPill();renderDashList()}
}

/* ---- \u96A7\u9053\u5217\u8868 + \u641C\u7D22 ---- */
var allTunnels=[],allAlertOn={},metaCache={},upTs={};
function setSum(d){
  $('sum').innerHTML='\u5171 <b>'+d.total+'</b> \xB7 \u5728\u7EBF <b>'+d.online+'</b> \xB7 \u79BB\u7EBF <b>'+d.offline+'</b>';
}
function filtered(){
  var q=$('q').value.trim().toLowerCase();
  if(!q)return allTunnels;
  return allTunnels.filter(function(t){
    var m=metaCache[t.id]||{};
    return (t.name+' '+t.id+' '+(m.hostname||'')).toLowerCase().indexOf(q)>=0;
  });
}
function renderList(){
  var l=$('list'),arr=filtered();
  if(!allTunnels.length){l.innerHTML='<div class="empty">\u6682\u65E0\u96A7\u9053, \u70B9\u53F3\u4E0A\u89D2"\u65B0\u5EFA\u96A7\u9053"\u521B\u5EFA</div>';return}
  if(!arr.length){l.innerHTML='<div class="empty">\u6CA1\u6709\u5339\u914D\u7684\u96A7\u9053</div>';return}
  l.innerHTML=arr.map(function(t){
    var on=allAlertOn[t.id]===true,m=metaCache[t.id]||{};
    // \u5728\u7EBF\u5FBD\u7AE0\u9644\u5E26\u8FD0\u884C\u65F6\u957F (\u968F /api/list \u7684 conns_active_at \u4E0B\u53D1, \u5B9E\u65F6\u8BA1\u7B97)
    var badgeTxt=stText[t.status]||t.status;
    if(t.status==='healthy'&&upTs[t.id])badgeTxt+=' '+durShort(Date.now()-upTs[t.id]);
    var rules=(m.routes&&m.routes.length?m.routes:(m.hostname?[{hostname:m.hostname,path:m.path||'',service:m.service||''}]:[]));
    // routes===null \u8868\u793A\u8FD8\u6CA1\u62C9\u5230\u6216\u62C9\u53D6\u5931\u8D25, \u663E\u793A"\u52A0\u8F7D\u4E2D"\u800C\u4E0D\u662F\u8BEF\u5BFC\u6027\u7684"\u672A\u914D\u7F6E\u57DF\u540D"
    var routeLines=(m.routes===null&&(!rules||!rules.length))
      ?'<span class="rp">\u8DEF\u7531\u4FE1\u606F\u52A0\u8F7D\u4E2D\u2026</span>'
      :(rules.length
        ?rules.map(function(r){return '<b>'+esc(r.hostname)+'</b>'+(r.path?'<span class="rp">'+esc(r.path)+'</span>':'')+(r.service?' \u2192 '+esc(r.service):'')}).join('<br>')
        :'<span style="color:var(--warn)">\u672A\u914D\u7F6E\u57DF\u540D</span>');
    var nRoutes=(m.routes===null&&!rules.length)?'\u2026':rules.length;
    return '<div class="item">'+
      '<div class="trow">'+
      '<span class="dot '+esc(t.status)+'"></span>'+
      '<span class="nm" title="'+esc(t.name)+'">'+esc(t.name)+'</span>'+
      '<span class="id" title="'+esc(t.id)+'">'+esc(t.id)+'</span>'+
      '<span class="pill">'+nRoutes+' \u6761\u8DEF\u7531</span>'+
      '<div class="acts">'+
      '<button class="btn sm" data-act="tk" data-id="'+esc(t.id)+'" data-name="'+esc(t.name)+'"><span class="bico">\u{1F511}</span><span class="btxt">Token</span></button>'+
      '<button class="btn sm" data-act="route" data-id="'+esc(t.id)+'" data-name="'+esc(t.name)+'"><span class="bico">\u{1F310}</span><span class="btxt">\u8DEF\u7531</span></button>'+
      '<button class="btn sm" data-act="edit" data-id="'+esc(t.id)+'" data-name="'+esc(t.name)+'"><span class="bico">\u270F\uFE0F</span><span class="btxt">\u7F16\u8F91</span></button>'+
      '<button class="btn sm" data-act="alert" data-id="'+esc(t.id)+'" data-up="'+(t.up?1:0)+'" data-on="'+(on?1:0)+'">'+(on?'\u{1F514}':'\u{1F515}')+'<span class="btxt">'+(on?'\u63D0\u9192\u5F00':'\u63D0\u9192\u5173')+'</span></button>'+
      '<button class="btn sm red" data-act="del" data-id="'+esc(t.id)+'"><span class="bico">\u{1F5D1}</span><span class="btxt">\u5220\u9664</span></button>'+
      '</div>'+
      '<span class="badge '+esc(t.status)+'" style="position:absolute;right:0;top:50%;transform:translateY(-50%)" title="'+(upTs[t.id]?'\u81EA '+new Date(upTs[t.id]).toLocaleString():'')+'">'+esc(badgeTxt)+'</span>'+
      '</div>'+
      '<div class="routes">'+routeLines+'</div></div>';
  }).join('');
}
$('q').addEventListener('input',function(){
  $('q').parentNode.className='search'+($('q').value?' has':'');
  renderList();
});
$('qclear').onclick=function(){
  $('q').value='';$('q').parentNode.className='search';renderList();$('q').focus();
};
$('refresh').onclick=async function(){
  var b=$('refresh');if(b.disabled)return;
  b.disabled=true;b.innerHTML='<span class="spin"></span> \u5237\u65B0\u4E2D';
  try{
    domainsCache=null; // \u2605 \u5237\u65B0\u65F6\u57DF\u540D\u6570\u636E\u4E5F\u4F5C\u5E9F\u91CD\u62C9
    workerCheck={};workerCheckAt=0; // \u2605 \u68C0\u6D4B\u7ED3\u679C\u4E00\u5E76\u4F5C\u5E9F, loadDomains \u540E\u4F1A\u81EA\u52A8\u91CD\u68C0
    await loadList();await loadMeta();
    if(dashView==='domains'||dashView.indexOf('workers')===0)await loadDomains(true);
    toast('\u5217\u8868\u5DF2\u5237\u65B0');
  }catch(e){}
  b.disabled=false;b.innerHTML='\u5237\u65B0';
};
async function loadList(){
  var l=$('list');
  try{
    var d=await api('/tunnel/api/list');
    allTunnels=d.tunnels||[];allAlertOn=d.alertOn||{};
    upTs={};(d.tunnels||[]).forEach(function(t){if(t.since)upTs[t.id]=t.since});
    setSum(d);renderDash(d);renderList();
  }catch(e){$('sum').innerHTML='';l.innerHTML='<div class="empty">\u52A0\u8F7D\u5931\u8D25</div>';fail(e)}
}
async function loadMeta(){
  // \u5206\u6279\u4E32\u884C, \u6BCF\u6279 6 \u4E2A, \u907F\u514D\u96A7\u9053\u5F88\u591A\u65F6\u88AB Cloudflare API \u9650\u6D41
  for (var i=0;i<allTunnels.length;i+=6){
    await Promise.all(allTunnels.slice(i,i+6).map(async function(t){
      try{
        var r=await api('/tunnel/api/detail',{id:t.id});
        metaCache[t.id]={hostname:(r.rules&&r.rules[0]&&r.rules[0].hostname)||'',path:(r.rules&&r.rules[0]&&r.rules[0].path)||'',service:(r.rules&&r.rules[0]&&r.rules[0].service)||r.service||'',routes:r.rules||[]};
      }catch(e){
        // \u62C9\u53D6\u5931\u8D25 (\u9650\u6D41\u7B49): \u4FDD\u7559\u4E0A\u6B21\u7ED3\u679C, \u4E0D\u5F53\u4F5C"\u672A\u914D\u7F6E\u57DF\u540D"
        if(!metaCache[t.id])metaCache[t.id]={hostname:'',path:'',service:'',routes:null,unknown:true};
        else metaCache[t.id].unknown=true;
      }
    }));
    renderList();
  }
  // \u62C9\u5B8C\u518D\u6574\u4F53\u91CD\u7ED8\u4E00\u6B21, \u6E05\u6389 unknown \u6807\u8BB0\u7684\u663E\u793A
  setTimeout(renderList,0);
  // \u2605 \u8DEF\u7531\u662F\u57DF\u540D\u7ED1\u5B9A\u5339\u914D\u7684\u6570\u636E\u6E90: \u62C9\u5B8C\u540E\u82E5\u6B63\u505C\u5728\u57DF\u540D\u89C6\u56FE, \u7528\u7F13\u5B58\u91CD\u7ED8\u4E00\u6B21 (\u4E0D\u91CD\u590D\u8BF7\u6C42\u63A5\u53E3)
  if(dashView==='domains'&&domainsCache)renderDomains(domainsCache);
}

document.addEventListener('click',function(e){
  var t=e.target.closest('[data-copy],[data-act]');if(!t)return;
  if(t.dataset.copy!==undefined){copy(t.dataset.copy);return}
  var id=t.dataset.id;
  if(t.dataset.act==='tk')showTk(id,t.dataset.name);
  if(t.dataset.act==='route')openRoutes(id,t.dataset.name);
  if(t.dataset.act==='edit')openEdit(id,t.dataset.name);
  if(t.dataset.act==='del')del(id);
  if(t.dataset.act==='alert')toggleAlert(id,t.dataset.on==='1',t.dataset.up==='1');
  if(t.dataset.act==='rmchat')rmChat(t.dataset.chat);
  if(t.dataset.act==='wkinspect')doInspect();
  if(t.dataset.act==='rmdel')rmRoute(t.dataset.host,t.dataset.path);
});

async function toggleAlert(id,on,up){
  try{
    var d=await api('/tunnel/api/alert',{id:id,action:'toggle',on:!on,up:up});
    allAlertOn[id]=!!d.on;renderList();
    toast(d.on?'\u5DF2\u5F00\u542F\u8BE5\u96A7\u9053\u7684\u63D0\u9192':'\u5DF2\u5173\u95ED\u8BE5\u96A7\u9053\u7684\u63D0\u9192');
  }catch(e){
    if(/KV/.test(e.message))toast('\u8BF7\u5148\u7ED1\u5B9A D1 (TUNNEL_DB) \u6216 KV (TUNNEL_STATE)','err');
    else fail(e);
  }
}

/* ---- \u65B0\u5EFA\u96A7\u9053 ---- */
function zoneName(){var o=$('zone').options[$('zone').selectedIndex];return o?o.textContent:''}
function preview(){
  var sub=$('sub').value.trim(),z=zoneName().replace(/^./,''),p=$('path').value.trim(),s=$('svc').value.trim();
  if(!z){$('pv').innerHTML='';return}
  var host=sub?sub+'.'+z:z;
  $('pv').innerHTML='<b>'+esc(host)+'</b>'+(p?' \xB7 \u8DEF\u5F84 '+esc(p):'')+' \u2192 '+esc(s||'(\u672A\u586B\u5199\u672C\u5730\u670D\u52A1)');
}
['sub','zone','path','svc'].forEach(function(i){$(i).addEventListener('input',preview);$(i).addEventListener('change',preview)});
var subDirty=false;
$('name').addEventListener('input',function(){if(!subDirty){$('sub').value=$('name').value;preview()}});
$('sub').addEventListener('input',function(){var v=$('sub').value;subDirty=v!==''&&v!==$('name').value});

async function initZones(){
  try{
    var d=await api('/tunnel/api/init');
    $('zone').innerHTML=d.zones.length?d.zones.map(function(z){return '<option value="'+esc(z.id)+'">.'+esc(z.name)+'</option>'}).join(''):'<option value="">\u65E0\u53EF\u7528\u57DF\u540D</option>';
    if(d.service)$('svc').value=d.service;
    preview();
  }catch(e){
    $('zone').innerHTML='<option value="">\u52A0\u8F7D\u5931\u8D25</option>';
    fail(e);
  }
}
$('newbtn').onclick=function(){
  openModal('mCreate');
  setTimeout(function(){$('name').focus()},50);
};
$('m_x').onclick=closeModal;$('m_cancel').onclick=closeModal;
$('go').onclick=async function(){
  var b=$('go');
  if(!$('name').value.trim()){toast('\u8BF7\u586B\u5199\u96A7\u9053\u540D\u79F0','err');return}
  if(!$('zone').value){toast('\u8BF7\u9009\u62E9\u57DF\u540D','err');return}
  if(!$('svc').value.trim()){toast('\u8BF7\u586B\u5199\u672C\u5730\u670D\u52A1\u5730\u5740','err');return}
  b.disabled=true;b.innerHTML='<span class="spin"></span> \u521B\u5EFA\u4E2D';
  try{
    var d=await api('/tunnel/api/create',{name:$('name').value.trim(),zoneId:$('zone').value,sub:$('sub').value.trim(),path:$('path').value.trim(),service:$('svc').value.trim()});
    closeModal();
    toast('\u96A7\u9053 '+d.name+' \u521B\u5EFA\u6210\u529F');
    // \u91CD\u7F6E\u8868\u5355
    $('name').value='';$('sub').value='';$('path').value='';$('pv').innerHTML='';subDirty=false;
    loadList().then(loadMeta);
    showToken({name:d.name,id:d.id,hostname:d.hostname,path:d.path||'',service:d.service},d.token,true);
  }catch(e){fail(e)}
  b.disabled=false;b.innerHTML='\u521B\u5EFA\u96A7\u9053';
};

/* ---- Token \u5F39\u7A97 ---- */
$('t_x').onclick=closeModal;$('am_x').onclick=closeModal;
function showToken(r,token,fresh){
  $('t_banner').innerHTML='<div class="banner"><span class="ck">\u2713</span><div class="bd">'+
    (fresh?'\u96A7\u9053\u521B\u5EFA\u6210\u529F, \u590D\u5236\u4E0B\u9762\u7684\u57DF\u540D\u548CToken\u5230\u670D\u52A1\u5668\u8FD0\u884Ccloudflared':'\u96A7\u9053: <b>'+esc(r.name||r.id)+'</b>')+
    '</div></div>'+
    // \u591A\u8DEF\u7531\u96A7\u9053: \u9010\u6761\u5217\u51FA\u5168\u90E8\u57DF\u540D, \u6BCF\u6761\u53EF\u5355\u72EC\u70B9\u51FB\u590D\u5236 (\u8DEF\u5F84\u53EA\u663E\u793A\u4E0D\u590D\u5236)
    (function(){
      var rules=(r.rules&&r.rules.length?r.rules:(r.hostname?[{hostname:r.hostname,path:r.path||''}]:[]));
      if(!rules.length)return '';
      return '<div class="tit" style="margin-top:2px"><span>\u57DF\u540D'+(rules.length>1?' ('+rules.length+' \u6761)':'')+'</span></div>'+
        rules.map(function(x){
          return '<div class="code"><span class="hintcp">\u29C9 \u70B9\u51FB\u590D\u5236</span><pre style="max-height:none" data-copy="'+esc(x.hostname)+'">'+esc(x.hostname)+(x.path?'<span style="color:#8b93a0"> \xB7 '+esc(x.path)+'</span>':'')+'</pre></div>';
        }).join('<div style="height:8px"></div>');
    })();
  $('t_body').innerHTML=cmds(token);
  openModal('mToken');
}
async function showTk(id,name){
  openModal('mToken');
  $('t_banner').innerHTML='';
  $('t_body').innerHTML='<div class="empty">\u52A0\u8F7D\u4E2D...</div>';
  try{
    var res=await Promise.all([api('/tunnel/api/token',{id:id}),api('/tunnel/api/detail',{id:id}).catch(function(){return null})]);
    var det=res[1]||{};
    var rules=det.rules||[];
    showToken({name:name,id:id,rules:rules,hostname:rules[0]?rules[0].hostname:'',path:rules[0]?(rules[0].path||''):'',service:det.service||''},res[0].token,false);
  }catch(e){$('t_body').innerHTML='<div class="empty">\u52A0\u8F7D\u5931\u8D25</div>';fail(e)}
}
async function del(id){
  if(!(await askConfirm('\u786E\u5B9A\u5220\u9664\u8BE5\u96A7\u9053?\\n\u5C06\u540C\u65F6\u5220\u9664\u5BF9\u5E94\u7684 DNS \u8BB0\u5F55\u3002','\u5220\u9664\u96A7\u9053','\u5220\u9664')))return;
  setBusy(true,'\u5220\u9664tunnel\u548Cdns\u4E2D...');
  try{
    var d=await api('/tunnel/api/delete',{id:id});
    toast(d.dnsFailed?'\u96A7\u9053\u5DF2\u5220\u9664, \u4F46 DNS \u8BB0\u5F55\u6E05\u7406\u5931\u8D25: '+(d.dnsErr||'\u8BF7\u5230 DNS \u9875\u9762\u624B\u52A8\u5220\u9664'):(d.dns?'\u5DF2\u5220\u9664\u96A7\u9053\u548C '+d.dns+' \u6761 DNS \u8BB0\u5F55':'\u5DF2\u5220\u9664\u96A7\u9053'));
    loadList().then(loadMeta);
  }catch(e){fail(e)}
  setBusy(false);
}

/* ---- \u7F16\u8F91 ---- */
var editId=null,editOld='',editRules=[],editSel=0;
function fillEditRule(i){
  editSel=i;var r=editRules[i];if(!r)return;
  if(r.zoneId)$('e_zone').value=r.zoneId;
  $('e_sub').value=r.sub||'';$('e_path').value=r.path||'';$('e_svc').value=r.service||'';
  ePreview();
}
function ePreview(){
  var sub=$('e_sub').value.trim(),o=$('e_zone').options[$('e_zone').selectedIndex],
      z=o?o.textContent.charAt(0)==='.'?o.textContent.slice(1):'':'',p=$('e_path').value.trim(),s=$('e_svc').value.trim();
  if(!z){$('e_pv').innerHTML='';return}
  $('e_pv').innerHTML='<b>'+esc(sub?sub+'.'+z:z)+'</b>'+(p?' \xB7 \u8DEF\u5F84 '+esc(p):'')+' \u2192 '+esc(s||'(\u672A\u586B\u5199\u672C\u5730\u670D\u52A1)');
}
async function openEdit(id,name){
  editId=id;editOld=name;editRules=[];editSel=0;
  $('e_name').value=name;$('e_sub').value='';$('e_path').value='';$('e_svc').value='';
  $('e_pick').innerHTML='';$('e_pick_wrap').style.display='none';
  $('e_note').innerHTML='\u8BFB\u53D6\u914D\u7F6E\u4E2D...';
  $('e_zone').innerHTML=$('zone').innerHTML;
  $('e_save').disabled=true;
  openModal('mEdit');
  try{
    var d=await api('/tunnel/api/detail',{id:id});
    editRules=d.rules||[];
    var note='';
    if(editRules.length>1){
      // \u591A\u6761\u8DEF\u7531: \u663E\u793A\u9009\u62E9\u5668, \u8868\u5355\u968F\u9009\u62E9\u5207\u6362; \u5355\u6761/\u65E0\u8DEF\u7531\u4FDD\u6301\u539F\u8868\u5355\u4E0D\u53D8
      $('e_pick').innerHTML=editRules.map(function(r,i){
        return '<option value="'+i+'">'+esc(r.hostname+(r.path?' \xB7 '+r.path:''))+(r.service?' \u2192 '+esc(r.service):'')+'</option>';
      }).join('');
      $('e_pick_wrap').style.display='';
      fillEditRule(0);
      note='\u8BE5\u96A7\u9053\u5171\u6709 '+editRules.length+' \u6761\u8DEF\u7531, \u5728"\u6B63\u5728\u7F16\u8F91\u7684\u8DEF\u7531"\u4E2D\u9009\u62E9\u8981\u4FEE\u6539\u7684\u4E00\u6761; \u4FDD\u5B58\u65F6\u5176\u4ED6\u89C4\u5219\u4FDD\u6301\u4E0D\u53D8\u3002';
    }else{
      $('e_sub').value=d.sub;$('e_path').value=d.path;$('e_svc').value=d.service;
      if(d.zoneId)$('e_zone').value=d.zoneId;
      note=d.hostname?'':'\u8BE5\u96A7\u9053\u8FD8\u6CA1\u6709\u516C\u5F00\u57DF\u540D\u89C4\u5219, \u4FDD\u5B58\u540E\u5C06\u65B0\u5EFA\u3002';
      if(d.others)note+=' \u53E6\u6709 '+d.others+' \u6761\u5176\u4ED6\u57DF\u540D\u89C4\u5219, \u4FDD\u5B58\u65F6\u4FDD\u6301\u4E0D\u53D8\u3002';
    }
    $('e_note').innerHTML=esc(note);
    $('e_save').disabled=false;ePreview();
  }catch(e){$('e_note').innerHTML='';fail(e)}
}
async function saveEdit(){
  var b=$('e_save'),name=$('e_name').value.trim();
  if(!name){toast('\u8BF7\u586B\u5199\u96A7\u9053\u540D\u79F0','err');return}
  if(!$('e_zone').value){toast('\u8BF7\u9009\u62E9\u57DF\u540D','err');return}
  if(!$('e_svc').value.trim()){toast('\u8BF7\u586B\u5199\u672C\u5730\u670D\u52A1\u5730\u5740','err');return}
  b.disabled=true;b.innerHTML='<span class="spin"></span> \u4FDD\u5B58\u4E2D';
  try{
    var sel=editRules.length>1?editRules[$('e_pick').selectedIndex]:editRules[0];
    var d=await api('/tunnel/api/update',{id:editId,name:name!==editOld?name:'',zoneId:$('e_zone').value,
      sub:$('e_sub').value.trim(),path:$('e_path').value.trim(),service:$('e_svc').value.trim(),
      host:sel&&sel.hostname||'',oldPath:sel&&sel.path||''});
    closeModal();
    toast(d.dnsFailed?'\u5DF2\u4FDD\u5B58, \u4F46\u65E7 DNS \u8BB0\u5F55\u6E05\u7406\u5931\u8D25: '+(d.dnsErr||'\u8BF7\u624B\u52A8\u5220\u9664'):'\u4FEE\u6539\u5DF2\u4FDD\u5B58');
    loadList().then(loadMeta);
  }catch(e){fail(e)}
  b.disabled=false;b.innerHTML='\u4FDD\u5B58';
}
['e_sub','e_zone','e_path','e_svc'].forEach(function(i){$(i).addEventListener('input',ePreview);$(i).addEventListener('change',ePreview)});
$('e_pick').addEventListener('change',function(){fillEditRule(+this.value)});
$('e_x').onclick=closeModal;$('e_cancel').onclick=closeModal;$('e_save').onclick=saveEdit;

/* ---- \u8DEF\u7531\u7BA1\u7406 ---- */
var routeId=null;
function renderRoutes(rules){
  var box=$('r_list');
  if(!rules||!rules.length){box.innerHTML='<div class="empty">\u8FD8\u6CA1\u6709\u8DEF\u7531, \u5728\u4E0B\u9762\u6DFB\u52A0\u7B2C\u4E00\u6761</div>';return}
  box.innerHTML=rules.map(function(r){
    return '<div class="rt">'+
      '<div class="rh"><b>'+esc(r.hostname)+'</b>'+(r.path?'<span class="rp">'+esc(r.path)+'</span>':'')+'</div>'+
      '<div class="rs" title="'+esc(r.service)+'">'+esc(r.service)+'</div>'+
      '<button class="btn sm red" data-act="rmdel" data-host="'+esc(r.hostname)+'" data-path="'+esc(r.path||'')+'">\u5220\u9664</button>'+
      '</div>';
  }).join('');
}
function rPreview(){
  var sub=$('r_sub').value.trim(),o=$('r_zone').options[$('r_zone').selectedIndex],
      z=o?o.textContent.charAt(0)==='.'?o.textContent.slice(1):'':'',p=$('r_path').value.trim(),s=$('r_svc').value.trim();
  if(!z){$('r_pv').innerHTML='';return}
  $('r_pv').innerHTML='<b>'+esc(sub?sub+'.'+z:z)+'</b>'+(p?' \xB7 \u8DEF\u5F84 '+esc(p):'')+' \u2192 '+esc(s||'(\u672A\u586B\u5199\u672C\u5730\u670D\u52A1)');
}
['r_sub','r_zone','r_path','r_svc'].forEach(function(i){$(i).addEventListener('input',rPreview);$(i).addEventListener('change',rPreview)});
async function openRoutes(id,name){
  routeId=id;
  $('r_name').textContent=name||'';
  $('r_sub').value='';$('r_path').value='';$('r_svc').value='';$('r_pv').innerHTML='';
  $('r_zone').innerHTML=$('zone').innerHTML;
  $('r_list').innerHTML='<div class="empty">\u52A0\u8F7D\u4E2D...</div>';
  openModal('mRoutes');
  try{
    var d=await api('/tunnel/api/route',{id:id,action:'list'});
    renderRoutes(d.rules);
  }catch(e){$('r_list').innerHTML='<div class="empty">\u52A0\u8F7D\u5931\u8D25</div>';fail(e)}
}
$('r_x').onclick=closeModal;$('r_cancel').onclick=closeModal;
async function rmRoute(host,path){
  if(!(await askConfirm('\u5220\u9664\u8DEF\u7531 '+host+(path||'')+' ?\\n\u82E5\u6CA1\u6709\u5176\u4ED6\u8DEF\u7531\u4F7F\u7528\u8BE5\u57DF\u540D, \u5BF9\u5E94\u7684 DNS \u8BB0\u5F55\u4E5F\u4F1A\u4E00\u5E76\u5220\u9664\u3002','\u5220\u9664\u8DEF\u7531','\u5220\u9664')))return;
  try{
    var d=await api('/tunnel/api/route',{id:routeId,action:'del',hostname:host,path:path});
    renderRoutes(d.rules);
    toast(d.dnsFailed?'\u8DEF\u7531\u5DF2\u5220\u9664, \u4F46 DNS \u6E05\u7406\u5931\u8D25: '+(d.dnsErr||'\u8BF7\u624B\u52A8\u5220\u9664'):'\u8DEF\u7531\u5DF2\u5220\u9664');
    loadList().then(loadMeta);
  }catch(e){fail(e)}
}
$('r_add').onclick=async function(){
  var b=this;
  if(!$('r_zone').value){toast('\u8BF7\u9009\u62E9\u57DF\u540D','err');return}
  if(!$('r_svc').value.trim()){toast('\u8BF7\u586B\u5199\u672C\u5730\u670D\u52A1\u5730\u5740','err');return}
  b.disabled=true;b.innerHTML='<span class="spin"></span> \u6DFB\u52A0\u4E2D';
  try{
    var d=await api('/tunnel/api/route',{id:routeId,action:'add',zoneId:$('r_zone').value,
      sub:$('r_sub').value.trim(),path:$('r_path').value.trim(),service:$('r_svc').value.trim()});
    renderRoutes(d.rules);
    $('r_sub').value='';$('r_path').value='';$('r_pv').innerHTML='';
    toast('\u8DEF\u7531\u5DF2\u6DFB\u52A0, DNS \u5DF2\u540C\u6B65');
    loadList().then(loadMeta);
  }catch(e){fail(e)}
  b.disabled=false;b.innerHTML='\uFF0B \u6DFB\u52A0\u8DEF\u7531';
};

/* ---- Telegram ---- */
function renderTg(d){
  var pill=$('tg_state');
  if(!d.kv){pill.className='pill warn';pill.textContent='\u672A\u7ED1\u5B9A KV'}
  else if(d.paused){pill.className='pill warn';pill.textContent='\u63A8\u9001\u5DF2\u6682\u505C'}
  else if(!d.bot&&!d.hasToken){pill.className='pill off';pill.textContent='\u672A\u914D\u7F6E\u673A\u5668\u4EBA'}
  else if(!d.targets){pill.className='pill warn';pill.textContent='\u672A\u6DFB\u52A0\u63A5\u6536\u8005'}
  else{pill.className='pill on';pill.textContent='\u5DF2\u914D\u7F6E '+d.targets+' \u4E2A\u63A5\u6536\u8005'}
  // \u6682\u505C\u6309\u94AE\u72B6\u6001
  var pb=$('tg_pause');
  if(d.paused){pb.textContent='\u25B6 \u6062\u590D\u63A8\u9001';pb.className='btn sm';pb.style.background='#1f9d63';pb.style.borderColor='transparent';pb.style.color='#fff'}
  else{pb.textContent='\u23F8 \u6682\u505C\u63A8\u9001';pb.className='btn gray';pb.style.background='';pb.style.borderColor='';pb.style.color=''}
  // \u56DE\u586B\u5DF2\u4FDD\u5B58\u7684 token (\u53EA\u663E\u793A\u524D\u51E0\u4F4D)
  if(d.hasToken&&!$('tg_token').value)$('tg_token').placeholder='\u5DF2\u4FDD\u5B58: '+(d.tokenMask||'\u2022\u2022\u2022\u2022')+' (\u7559\u7A7A\u5219\u4E0D\u4FEE\u6539)';
  var box=$('tg_list');
  if(!d.chats||!d.chats.length){box.innerHTML='<div class="empty">\u8FD8\u6CA1\u6709\u63A5\u6536\u8005, \u4FDD\u5B58\u540E\u63D0\u9192\u624D\u4F1A\u53D1\u9001</div>';return}
  box.innerHTML=d.chats.map(function(c){
    return '<div class="chat"><div class="ci">\u2708\uFE0F</div><div class="cn"><b>'+esc(c.name)+'</b>'+
      '<span>'+esc(c.id?('chat_id: '+c.id):'\u672A\u89E3\u6790, \u8BF7\u91CD\u65B0\u6DFB\u52A0')+(c.ok?'':' \xB7 \u9700\u9A8C\u8BC1')+'</span></div>'+
      '<button class="btn sm red" data-act="rmchat" data-chat="'+esc(c.name)+'">\u79FB\u9664</button></div>';
  }).join('');
}
async function loadTg(){
  try{renderTg(await api('/tunnel/api/tg',{action:'get'}))}catch(e){fail(e)}
}
function tgInputs(){
  return {chat:$('tg_chat').value.trim(), token:$('tg_token').value.trim()};
}
$('tg_save').onclick=async function(){
  var i=tgInputs();
  if(!i.token&&!$('tg_token').placeholder.indexOf('\u5DF2\u4FDD\u5B58')===0&&!$('tg_token').value){/*\u53EF\u53EA\u6539 chat*/}
  var b=this;b.disabled=true;b.innerHTML='<span class="spin"></span> \u4FDD\u5B58\u4E2D';
  try{
    var d=await api('/tunnel/api/tg',{action:'save',chat:i.chat,token:i.token});
    $('tg_token').value='';
    toast('\u63A8\u9001\u914D\u7F6E\u5DF2\u4FDD\u5B58');
    renderTg(d);loadList().then(loadMeta);
  }catch(e){fail(e)}
  b.disabled=false;b.innerHTML='\u4FDD\u5B58\u63A8\u9001\u914D\u7F6E';
};
$('tg_test').onclick=async function(){
  var i=tgInputs();
  if(!i.chat){toast('\u8BF7\u586B\u5199\u63A5\u6536\u8005 chat_id','err');return}
  var b=this;b.disabled=true;b.innerHTML='<span class="spin"></span> \u53D1\u9001\u4E2D';
  try{
    var d=await api('/tunnel/api/tg',{action:'test',chat:i.chat,token:i.token});
    toast('\u6D4B\u8BD5\u6D88\u606F\u5DF2\u53D1\u9001');
    renderTg(d);loadList().then(loadMeta);
  }catch(e){fail(e)}
  b.disabled=false;b.innerHTML='\u6D4B\u8BD5\u53D1\u9001';
};
$('tg_pause').onclick=async function(){
  var paused=$('tg_state').textContent==='\u63A8\u9001\u5DF2\u6682\u505C';
  var b=this;b.disabled=true;
  try{
    var d;
    if(paused){d=await api('/tunnel/api/tg',{action:'resume'});toast('\u5DF2\u6062\u590D\u63A8\u9001')}
    else{d=await api('/tunnel/api/tg',{action:'pause',minutes:0});toast('\u5DF2\u6682\u505C\u63A8\u9001')}
    renderTg(d);
  }catch(e){fail(e)}
  b.disabled=false;
};
async function rmChat(chat){
  if(!(await askConfirm('\u79FB\u9664\u63A5\u6536\u8005 '+chat+' ?','\u79FB\u9664\u63A5\u6536\u8005','\u79FB\u9664')))return;
  try{renderTg(await api('/tunnel/api/tg',{action:'remove',chat:chat}));toast('\u5DF2\u79FB\u9664\u63A5\u6536\u8005')}catch(e){fail(e)}
}

/* ---- \u2605 \u4EEA\u8868\u677F\u5185\u5D4C\u5C55\u793A: \u603B\u57DF\u540D (\u539F\u5F39\u7A97\u903B\u8F91\u642C\u5230\u8FD9\u91CC, \u6E32\u67D3\u76EE\u6807\u6539\u4E3A #panel_domains) ---- */
function renderDomains(d){
  if($('s_dom'))$('s_dom').textContent=(d.zones&&d.zones.length)?d.zones.length:0;
  updateAlertPill();
  var box=$('panel_domains');
  if(!d.zones||!d.zones.length){box.innerHTML='<div class="empty">\u5F53\u524D\u8D26\u53F7\u4E0B\u6CA1\u6709\u4EFB\u4F55\u6258\u7BA1\u7684\u57DF\u540D</div>';return}
  box.innerHTML=d.zones.map(function(z){
    var bindings=[];
    // 1. \u5339\u914D Tunnel (\u4ECE\u9762\u677F\u5F53\u524D\u7F13\u5B58\u4E2D\u5339\u914D)
    allTunnels.forEach(function(t){
      var m=metaCache[t.id];
      if(!m)return;
      var rules=m.routes&&m.routes.length?m.routes:(m.hostname?[{hostname:m.hostname,path:m.path||'',service:m.service||''}]:[]);
      rules.forEach(function(r){
        if(r.hostname&&(r.hostname===z.name||r.hostname.endsWith('.'+z.name))){
          bindings.push({type:'Tunnel',host:r.hostname,target:t.name,note:r.path?('\u8DEF\u5F84: '+r.path):'\u672C\u5730\u670D\u52A1: '+r.service,st:t.status});
        }
      });
    });
    // 2. \u5339\u914D Workers
    if(d.workers){
      d.workers.forEach(function(w){
        if(w.hostname===z.name||w.hostname.endsWith('.'+z.name)){
          bindings.push({type:'Worker',host:w.hostname,target:w.service,note:'\u73AF\u5883: '+(w.environment||'production')});
        }
      });
    }
    // 3. \u5339\u914D Pages \u9879\u76EE (\u901A\u8FC7 DNS \u7684 CNAME \u8BB0\u5F55\u55C5\u63A2 .pages.dev)
    if(d.dns){
      d.dns.forEach(function(r){
        if(r.zone_name===z.name&&r.type==='CNAME'){
          if(r.content.includes('.pages.dev')){
            bindings.push({type:'Pages',host:r.name,target:r.content.replace('.pages.dev',''),note:'Pages \u9879\u76EE'});
          }
        }
      });
    }
    var bindHtml='';
    if(bindings.length===0){
      bindHtml='<div style="color:var(--sub);font-size:12.5px;padding-top:6px;">\u672A\u53D1\u73B0\u7ED1\u5B9A\u7684 Tunnel\u3001Worker \u6216 Pages \u9879\u76EE</div>';
    }else{
      var seen={};
      bindings=bindings.filter(function(b){
        var key=b.type+'|'+b.host+'|'+b.target;
        return seen.hasOwnProperty(key)?false:(seen[key]=true);
      });
      bindHtml=bindings.map(function(b){
        var color=b.type==='Tunnel'?'#f6821f':(b.type==='Worker'?'#22a06b':'#2aabee');
        return '<div style="margin-top:8px;padding:10px;background:var(--bg);border-radius:8px;font-size:13px;border:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;">'+
               '<div><div style="margin-bottom:4px;"><b style="color:var(--text)">'+esc(b.host)+'</b> <span style="color:var(--sub);font-size:12px;margin-left:6px">'+esc(b.note)+'</span></div>'+
               '<div style="color:var(--sub)">\u7ED1\u5B9A\u7684\u9879\u76EE: <b>'+esc(b.target)+'</b></div></div>'+
               '<span style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none"><span style="padding:2px 6px;border-radius:4px;font-size:11px;background:'+color+'22;color:'+color+'">'+b.type+'</span>'+
               (b.type==='Worker'?wkBadge(b.host):(b.type==='Tunnel'&&b.st?tnBadge(b.st):''))+'</span>'+
               '</div>';
      }).join('');
    }
    return '<div class="card" style="margin-bottom:12px;padding:14px;">'+
           '<div style="font-weight:700;font-size:15px;border-bottom:1px solid var(--line);padding-bottom:8px;">\u{1F310} '+esc(z.name)+'</div>'+
           bindHtml+
           '</div>';
  }).join('');
}
async function loadDomains(force){
  if(domainsLoading)return;
  if(domainsCache&&!force){renderDomains(domainsCache);return}
  domainsLoading=true;updateAlertPill();
  $('panel_domains').innerHTML='<div class="empty"><span class="spin"></span> \u6B63\u5728\u626B\u63CF\u5F53\u524D\u8D26\u53F7\u7684\u5168\u5C40\u8D44\u4EA7...</div>';
  try{
    var d=await api('/tunnel/api/domains_detail');
    domainsCache=d;
    renderDomains(d);
    updateWorkerCounts();
    runWorkerCheck(false); // \u2605 \u6570\u636E\u5230\u624B\u540E\u81EA\u52A8\u68C0\u6D4B Worker \u7ED1\u5B9A\u57DF\u540D\u6709\u6548\u6027 (\u4E0D\u963B\u585E\u5F53\u524D\u6E32\u67D3)
  }catch(e){
    $('panel_domains').innerHTML='<div class="empty" style="color:var(--bad)">\u8BFB\u53D6\u5931\u8D25: '+esc(e.message)+'</div>';
    updateAlertPill();
  }
  domainsLoading=false;updateAlertPill();
}
/* ---- \u2605 Worker \u7ED1\u5B9A\u57DF\u540D: \u81EA\u52A8\u6709\u6548\u6027\u68C0\u6D4B + \u5C55\u793A ---- */
function workerHosts(){
  if(!domainsCache||!domainsCache.workers)return [];
  var seen={},out=[];
  domainsCache.workers.forEach(function(w){if(w.hostname&&!seen[w.hostname]){seen[w.hostname]=1;out.push(w.hostname)}});
  return out;
}
function updateWorkerCounts(){
  var hosts=workerHosts();
  if($('s_wk'))$('s_wk').textContent=hosts.length;
  var on=0,off=0,known=0;
  hosts.forEach(function(h){var c=workerCheck[h];if(c){known++;c.ok?on++:off++}});
  if($('s_wk_on'))$('s_wk_on').textContent=known?on:'-';
  if($('s_wk_off'))$('s_wk_off').textContent=known?off:'-';
}
function wkBadge(h){
  var c=workerCheck[h];
  var base='padding:2px 6px;border-radius:4px;font-size:11px;';
  if(!c)return '<span style="'+base+'background:var(--in);color:var(--sub)">'+(workerChecking?'\u68C0\u6D4B\u4E2D\u2026':'\u5F85\u68C0\u6D4B')+'</span>';
  if(c.ok)return '<span style="'+base+'background:rgba(34,160,107,.14);color:var(--ok)">\u25CF \u5728\u7EBF '+c.status+' \xB7 '+c.ms+'ms</span>';
  return '<span style="'+base+'background:rgba(217,63,63,.13);color:var(--bad)" title="'+esc(c.error||'')+'">\u25CF \u79BB\u7EBF '+(c.status?('HTTP '+c.status):'\u65E0\u54CD\u5E94')+'</span>';
}
function tnBadge(st){
  var base='padding:2px 6px;border-radius:4px;font-size:11px;';
  if(st==='healthy')return '<span style="'+base+'background:rgba(34,160,107,.14);color:var(--ok)">\u25CF \u5728\u7EBF</span>';
  return '<span style="'+base+'background:rgba(217,63,63,.13);color:var(--bad)">\u25CF '+(st==='degraded'?'\u964D\u7EA7':'\u79BB\u7EBF')+'</span>';
}
async function runWorkerCheck(force){
  if(workerChecking)return;
  if(!domainsCache)return;
  var hosts=workerHosts();
  updateWorkerCounts();
  if(!hosts.length)return;
  if(workerCheckAt&&!force)return;
  workerChecking=true;updateWorkerPill();
  if(dashView==='domains'&&domainsCache)renderDomains(domainsCache);
  try{
    var d=await api('/tunnel/api/worker_check',{hostnames:hosts});
    (d.results||[]).forEach(function(r){workerCheck[r.hostname]=r});
    workerCheckAt=d.at||Date.now();
  }catch(e){}
  workerChecking=false;
  updateWorkerCounts();updateWorkerPill();
  if(dashView.indexOf('workers')===0)renderWorkers();
  else if(dashView==='domains'&&domainsCache)renderDomains(domainsCache);
  if(curView==='workers')renderWorkerMgr();
}
/* ---- \u2605 Worker \u7BA1\u7406\u9875: \u6309\u57DF\u540D\u5206\u7EC4\u9879\u76EE + \u8DF3\u8F6C Cloudflare \u540E\u53F0 ---- */
function cfWorkerUrl(service,environment){
  var acc=curAcc||envAccId;
  if(!acc||!service)return '';
  return 'https://dash.cloudflare.com/'+acc+'/workers/services/view/'+encodeURIComponent(service)+'/'+encodeURIComponent(environment||'production');
}
function cfPagesUrl(project){
  var acc=curAcc||envAccId;
  if(!acc||!project)return '';
  return 'https://dash.cloudflare.com/'+acc+'/pages/view/'+encodeURIComponent(project);
}
async function loadWorkerMgr(force){
  if(!domainsCache||force){
    $('wk_list').innerHTML='<div class="empty">\u52A0\u8F7D\u4E2D...</div>';
    try{await loadDomains(true)}catch(e){}
  }
  renderWorkerMgr();
  runWorkerCheck(false);
}
function renderWorkerMgr(){
  var box=$('wk_list');if(!box)return;
  var pill=$('wk_pill');
  if(!domainsCache){box.innerHTML='<div class="empty">\u6B63\u5728\u52A0\u8F7D...</div>';return}
  var zones=domainsCache.zones||[];
  var projCount=0;
  var html=zones.map(function(z){
    var projects={},order=[];
    function addProj(type,service,host,env,url){
      var key=type+'|'+service;
      if(!projects[key]){projects[key]={type:type,service:service,env:env,url:url,hosts:[]};order.push(key);projCount++}
      if(projects[key].hosts.indexOf(host)<0)projects[key].hosts.push(host);
    }
    (domainsCache.workers||[]).forEach(function(w){
      if(w.hostname===z.name||w.hostname.endsWith('.'+z.name))
        addProj('Worker',w.service,w.hostname,w.environment||'production',cfWorkerUrl(w.service,w.environment));
    });
    (domainsCache.dns||[]).forEach(function(r){
      if(r.zone_name===z.name&&r.type==='CNAME'&&r.content&&r.content.includes('.pages.dev')){
        var proj=r.content.replace(/.pages.dev.*$/,'');
        addProj('Pages',proj,r.name,'production',cfPagesUrl(proj));
      }
    });
    var body='';
    if(!order.length){
      body='<div style="color:var(--sub);font-size:12.5px;padding-top:6px;">\u8BE5\u57DF\u540D\u4E0B\u6682\u65E0 Worker / Pages \u9879\u76EE</div>';
    }else{
      body=order.map(function(k){
        var pr=projects[k];
        var color=pr.type==='Worker'?'#22a06b':'#2aabee';
        var hosts=pr.hosts.map(function(h){
          return '<div style="display:flex;align-items:center;gap:8px;padding:3px 0 3px 14px;"><span style="color:var(--text);font-size:13px;"><b>'+esc(h)+'</b></span>'+(pr.type==='Worker'?wkBadge(h):'')+'</div>';
        }).join('');
        return '<div style="margin-top:8px;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--line);">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">'+
          '<div style="min-width:0"><b style="color:var(--text)">'+esc(pr.service)+'</b> <span style="color:var(--sub);font-size:12px;margin-left:4px">\u73AF\u5883: '+esc(pr.env)+'</span> '+
          '<span style="padding:2px 6px;border-radius:4px;font-size:11px;background:'+color+'22;color:'+color+'">'+pr.type+'</span></div>'+
          (pr.url?'<a class="btn sm" href="'+esc(pr.url)+'" target="_blank" rel="noopener" style="text-decoration:none;flex:none">\u7BA1\u7406 \u2197</a>':'<span class="pill">\u65E0\u8D26\u53F7 ID</span>')+
          '</div><div style="margin-top:4px;border-top:1px dashed var(--line);padding-top:4px">'+hosts+'</div></div>';
      }).join('');
    }
    return '<div class="card" style="margin-bottom:12px;padding:14px;"><div style="font-weight:700;font-size:15px;border-bottom:1px solid var(--line);padding-bottom:8px;">\u{1F310} '+esc(z.name)+'</div>'+body+'</div>';
  }).join('');
  box.innerHTML=html||'<div class="empty">\u5F53\u524D\u8D26\u53F7\u4E0B\u6CA1\u6709\u4EFB\u4F55\u6258\u7BA1\u7684\u57DF\u540D</div>';
  if(pill)pill.textContent='\u5171 '+zones.length+' \u4E2A\u57DF\u540D \xB7 '+projCount+' \u4E2A\u9879\u76EE\u7ED1\u5B9A';
}
$('wk_reload').onclick=function(){loadWorkerMgr(true)};
async function doInspect(){
  setBusy(true,'\u6B63\u5728\u5DE1\u68C0 Worker \u57DF\u540D...');
  try{
    var d=await api('/tunnel/api/worker_check',{hostnames:workerHosts(),inspect:true});
    (d.results||[]).forEach(function(r){workerCheck[r.hostname]=r});
    workerCheckAt=d.at||Date.now();
    updateWorkerCounts();renderWorkers();
    var ins=d.inspect||{};
    if(!ins.offline)toast('\u5DE1\u68C0\u5B8C\u6210: \u5168\u90E8 '+ins.total+' \u6761\u7ED1\u5B9A\u5728\u7EBF');
    else if(ins.tgSent)toast('\u5DE1\u68C0\u5B8C\u6210: '+ins.offline+' \u6761\u79BB\u7EBF, \u5DF2\u53D1\u9001 Telegram \u63D0\u9192');
    else toast('\u5DE1\u68C0\u5B8C\u6210: '+ins.offline+' \u6761\u79BB\u7EBF, \u4F46\u63D0\u9192\u672A\u53D1\u51FA: '+(ins.tgError||'\u672A\u77E5\u539F\u56E0'),'err');
  }catch(e){fail(e)}
  setBusy(false);
}
function renderWorkers(){
  var box=$('panel_workers');if(!box)return;
  updateWorkerCounts();updateWorkerPill();
  if(!domainsCache){box.innerHTML='<div class="empty">\u6B63\u5728\u52A0\u8F7D Worker \u7ED1\u5B9A...</div>';return}
  var seen={},list=[];
  (domainsCache.workers||[]).forEach(function(w){
    var key=w.hostname+'|'+w.service;
    if(w.hostname&&!seen[key]){seen[key]=1;list.push(w)}
  });
  if(dashView==='workers_online')list=list.filter(function(w){var c=workerCheck[w.hostname];return c&&c.ok});
  if(dashView==='workers_offline')list=list.filter(function(w){var c=workerCheck[w.hostname];return c&&!c.ok});
  if(!list.length){
    box.innerHTML='<div class="empty">'+(!domainsCache.workers||!domainsCache.workers.length?'\u5F53\u524D\u8D26\u53F7\u4E0B\u6CA1\u6709\u7ED1\u5B9A\u57DF\u540D\u7684 Worker':
      (!workerCheckAt?'\u81EA\u52A8\u68C0\u6D4B\u8FDB\u884C\u4E2D, \u8BF7\u7A0D\u5019...':(dashView==='workers_online'?'\u6682\u65E0\u5728\u7EBF\u7684 Worker \u57DF\u540D':'\u6682\u65E0\u79BB\u7EBF\u7684 Worker \u57DF\u540D')))+'</div>';
    return;
  }
  var toolbar='<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn sm" data-act="wkinspect">\u{1F4E8} \u7ACB\u5373\u5DE1\u68C0\u5E76\u901A\u77E5</button></div>';
  var groups={},order=[];
  list.forEach(function(w){if(!groups[w.service]){groups[w.service]=[];order.push(w.service)}groups[w.service].push(w)});
  box.innerHTML=toolbar+order.map(function(svc){
    var rows=groups[svc].map(function(w){
      return '<div style="margin-top:8px;padding:10px;background:var(--bg);border-radius:8px;font-size:13px;border:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:8px;">'+
        '<div><div style="margin-bottom:4px;"><b style="color:var(--text)">'+esc(w.hostname)+'</b> <span style="color:var(--sub);font-size:12px;margin-left:6px">\u73AF\u5883: '+esc(w.environment||'production')+'</span></div>'+
        '<div style="color:var(--sub)">\u7ED1\u5B9A\u7684\u9879\u76EE: <b>'+esc(svc)+'</b></div></div>'+wkBadge(w.hostname)+'</div>';
    }).join('');
    return '<div class="card" style="margin-bottom:12px;padding:14px;">'+
      '<div style="font-weight:700;font-size:15px;border-bottom:1px solid var(--line);padding-bottom:8px;">\u{1F9E9} '+esc(svc)+' <span style="color:var(--sub);font-size:12px;font-weight:400">'+groups[svc].length+' \u4E2A\u57DF\u540D</span></div>'+
      rows+'</div>';
  }).join('');
}
/* \u2605 \u7EDF\u8BA1\u5361\u70B9\u51FB\u5207\u6362\u5C55\u793A\u6846 (\u4E0D\u518D\u5F39\u7A97) */
[['btn_show_domains','domains'],['btn_show_all','all'],['btn_show_online','online'],['btn_show_offline','offline'],
 ['btn_show_workers','workers'],['btn_show_workers_on','workers_online'],['btn_show_workers_off','workers_offline']].forEach(function(pair){
  var el=$(pair[0]);if(el)el.onclick=function(){setDashView(pair[1])};
});

/* ---- \u4E3B\u9898\u5207\u6362 ---- */
function applyTheme(t){
  if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);
  else document.documentElement.removeAttribute('data-theme');
  $('theme').textContent=(t==='dark')?'\u2600\uFE0F':'\u{1F319}'; // \u5F53\u524D\u6697\u8272\u2192\u70B9\u4E00\u4E0B\u53D8\u4EAE\u8272(\u663E\u793A\u592A\u9633)
}
function toggleTheme(){
  // \u672A\u8BBE\u7F6E\u8FC7\u65F6\u6309\u5F53\u524D\u5B9E\u9645\u6E32\u67D3\u5224\u5B9A (matchMedia), \u5207\u6362\u540E\u5199\u5165 localStorage
  var cur=document.documentElement.getAttribute('data-theme')
    ||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  var next=cur==='dark'?'light':'dark';
  try{localStorage.setItem('theme',next)}catch(e){}
  applyTheme(next);
}
$('theme').onclick=toggleTheme;
var savedTheme='';
try{savedTheme=localStorage.getItem('theme')||''}catch(e){}
applyTheme(savedTheme);

/* ---- \u542F\u52A8 ---- */
show((location.hash||'').replace('#','')||'dash');
setDashView('domains'); // \u2605 \u6253\u5F00\u9762\u677F\u9ED8\u8BA4\u5C55\u793A\u603B\u57DF\u540D (\u5185\u5D4C\u5C55\u793A\u6846, \u4E0D\u5F39\u7A97)
initZones().catch(function(){}).then(loadAccs).then(function(){
  loadList().then(loadMeta).then(function(){if(dashView==='domains'||dashView.indexOf('workers')===0)loadDomains(true)});
  loadTg();
});
if('serviceWorker' in navigator)navigator.serviceWorker.register('/tunnel/sw.js',{scope:'/tunnel/'}).catch(function(){});
<\/script></body></html>`;
async function scheduledTunnel(event, env, ctx) {
  env = applyConfig(env);
  if (!store(env)) return;
  const meta = await getMeta(env);
  for (const a of accountList(meta, env)) {
    try {
      await runChecks(
        { ...env, cfToken: a.token || env.CF_API_TOKEN, cfAcc: a.acc },
        await listTunnels(
          { ...env, cfToken: a.token || env.CF_API_TOKEN, cfAcc: a.acc },
          `/accounts/${a.acc}/cfd_tunnel`
        )
      );
    } catch (e) {
    }
  }
  for (const a of accountList(meta, env)) {
    try {
      await runWorkerInspection(env, { ...env, cfToken: a.token || env.CF_API_TOKEN, cfAcc: a.acc }, meta, a.name, {});
    } catch (e) {
    }
  }
}

// src/auth.js
var HUB_COOKIE = "cf_hub_sid";
var SESSION_TTL2 = 7 * 24 * 3600;
var keyCache2 = { src: "", key: null };
async function sessionKey2(env) {
  const src = "cf-hub-session:" + (str2(env.SESSION_SECRET) || str2(env.PASSWORD));
  if (keyCache2.src !== src || !keyCache2.key) {
    keyCache2 = { src, key: await crypto.subtle.importKey("raw", new TextEncoder().encode(src), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]) };
  }
  return keyCache2.key;
}
function str2(v) {
  return v === void 0 || v === null ? "" : String(v);
}
var b64u2 = (s) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
var unb64u2 = (s) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));
async function hmac2(env, text) {
  const sig = await crypto.subtle.sign("HMAC", await sessionKey2(env), new TextEncoder().encode(text));
  let s = "";
  for (const b of new Uint8Array(sig)) s += String.fromCharCode(b);
  return b64u2(s);
}
async function makeHubSession(env) {
  const raw = b64u2(JSON.stringify({ exp: Math.floor(Date.now() / 1e3) + SESSION_TTL2 }));
  return raw + "." + await hmac2(env, "sid:" + raw);
}
async function checkHubSession(env, value) {
  const i = String(value || "").indexOf(".");
  if (i < 0) return false;
  const raw = value.slice(0, i), sig = value.slice(i + 1);
  let exp = 0;
  try {
    exp = Number(JSON.parse(unb64u2(raw)).exp) || 0;
  } catch (e) {
    return false;
  }
  if (!exp || exp * 1e3 < Date.now()) return false;
  const want = await hmac2(env, "sid:" + raw);
  let diff = want.length ^ sig.length;
  for (let k = 0; k < sig.length; k++) diff |= (sig.charCodeAt(k) || 0) ^ (want.charCodeAt(k) || 0);
  return diff === 0;
}
function hubCookieValue(request) {
  for (const part of (request.headers.get("Cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === HUB_COOKIE) return part.slice(i + 1).trim();
  }
  return "";
}
function setHubCookie(value, maxAge) {
  return `${HUB_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax${value ? "; Secure" : ""}; Max-Age=${maxAge}`;
}
function sameSecret2(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

// src/usage.js
async function handleUsage(request, env, ctx) {
  const \u9762\u677F\u7BA1\u7406\u5458\u8D26\u53F7 = env.USER || env.user || env.USERNAME || env.username || "admin";
  const \u9762\u677F\u7BA1\u7406\u5458\u5BC6\u7801 = env.ADMIN || env.admin || env.PASSWORD || env.password || env.pswd;
  const \u6F14\u793A\u6837\u677F = env.DEMO ? true : false;
  if (!\u9762\u677F\u7BA1\u7406\u5458\u5BC6\u7801) {
    return new Response("\u8BF7\u5148\u5728\u53D8\u91CF\u4E2D\u8BBE\u7F6E PASSWORD \u53D8\u91CF", { status: 500 });
  }
  if (env.KV && typeof env.KV.get === "function") {
    const url = new URL(request.url);
    const UA = request.headers.get("User-Agent") || "null";
    const \u8BBF\u95EE\u8DEF\u5F84 = url.pathname.slice(1).toLowerCase();
    const \u533A\u5206\u5927\u5C0F\u5199\u8BBF\u95EE\u8DEF\u5F84 = url.pathname.slice(1);
    const \u7BA1\u7406\u5458TOKEN = await MD5MD5(\u9762\u677F\u7BA1\u7406\u5458\u5BC6\u7801 + \u9762\u677F\u7BA1\u7406\u5458\u8D26\u53F7);
    const \u4E34\u65F6TOKEN = await MD5MD5(url.hostname + \u7BA1\u7406\u5458TOKEN + UA);
    const \u7BA1\u7406\u5458COOKIE = await MD5MD5(\u7BA1\u7406\u5458TOKEN + UA);
    const \u9A8C\u8BC1\u7BA1\u7406\u5458Cookie = () => request.headers.get("x-hub-authed") === "1";
    if (\u8BBF\u95EE\u8DEF\u5F84 == "usage.json") {
      let usage_json = \u521B\u5EFA\u9ED8\u8BA4Usage(false);
      if (url.searchParams.get("token") === \u4E34\u65F6TOKEN || url.searchParams.get("token") === \u7BA1\u7406\u5458TOKEN) {
        const \u5F53\u524D\u65F6\u95F4 = Date.now();
        const \u5DF2\u4FDD\u5B58Usage = await env.KV.get("usage.json", { type: "json" });
        const \u5DF2\u4FDD\u5B58\u66F4\u65B0\u65F6\u95F4 = Number(\u5DF2\u4FDD\u5B58Usage?.UpdateTime || 0) || 0;
        usage_json = \u8865\u5168Usage\u7ED3\u6784(\u5DF2\u4FDD\u5B58Usage || {});
        usage_json.success = true;
        usage_json.total = (usage_json.pages || 0) + (usage_json.workers || 0);
        usage_json.msg = "\u2705 \u6210\u529F\u52A0\u8F7D\u514D\u8D39\u989D\u5EA6\u4F7F\u7528\u6570\u636E";
        if (!\u5DF2\u4FDD\u5B58\u66F4\u65B0\u65F6\u95F4 || \u5F53\u524D\u65F6\u95F4 - \u5DF2\u4FDD\u5B58\u66F4\u65B0\u65F6\u95F4 > \u83B7\u53D6\u5355\u8D26\u53F7\u67E5\u8BE2\u95F4\u9694\u6BEB\u79D2(env)) usage_json = await \u66F4\u65B0\u8BF7\u6C42\u6570(env);
      }
      return new Response(JSON.stringify(usage_json, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
    } else if (\u8BBF\u95EE\u8DEF\u5F84 == "admin" || \u8BBF\u95EE\u8DEF\u5F84.startsWith("admin/")) {
      if (\u9A8C\u8BC1\u7BA1\u7406\u5458Cookie()) {
        if (\u533A\u5206\u5927\u5C0F\u5199\u8BBF\u95EE\u8DEF\u5F84 === "admin/config.json") {
          const usage_config_json = await env.KV.get("usage_config.json", { type: "json" }) || [];
          const masked_config_json = usage_config_json.map((item) => {
            const updateTime = \u83B7\u53D6\u8D26\u53F7\u6700\u540E\u66F4\u65B0\u65F6\u95F4(item);
            return {
              ...item,
              UpdateTime: updateTime || item.UpdateTime,
              Usage: \u8865\u5168\u8D26\u53F7Usage\u7ED3\u6784(item),
              GlobalAPIKey: item.GlobalAPIKey ? \u63A9\u7801\u654F\u611F\u4FE1\u606F(item.GlobalAPIKey) : null,
              APIToken: item.APIToken ? \u63A9\u7801\u654F\u611F\u4FE1\u606F(item.APIToken) : null
            };
          });
          return new Response(JSON.stringify(masked_config_json, null, 2), { status: 200, headers: { "Content-Type": "application/json;charset=UTF-8" } });
        } else if (\u533A\u5206\u5927\u5C0F\u5199\u8BBF\u95EE\u8DEF\u5F84 === "admin/usage.json") {
          const usage_json = await \u66F4\u65B0\u8BF7\u6C42\u6570(env, { force: url.searchParams.get("force") === "1" });
          return new Response(JSON.stringify(usage_json, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" } });
        }
        return UsagePanel\u7BA1\u7406\u9762\u677F(\u7BA1\u7406\u5458TOKEN);
      } else return new Response(null, { status: 302, headers: { "Location": "/login" } });
    } else if (\u533A\u5206\u5927\u5C0F\u5199\u8BBF\u95EE\u8DEF\u5F84.startsWith("api/")) {
      if (\u533A\u5206\u5927\u5C0F\u5199\u8BBF\u95EE\u8DEF\u5F84 === "api/login") {
        if (request.method !== "POST") {
          return new Response(JSON.stringify({ success: false, msg: "Method Not Allowed" }), { status: 405, headers: { "Content-Type": "application/json;charset=UTF-8" } });
        }
        try {
          const body = await request.json();
          const \u8F93\u5165\u8D26\u53F7 = body.username || "";
          const \u8F93\u5165\u5BC6\u7801 = body.password || "";
          if (\u8F93\u5165\u8D26\u53F7 === \u9762\u677F\u7BA1\u7406\u5458\u8D26\u53F7 && \u8F93\u5165\u5BC6\u7801 === \u9762\u677F\u7BA1\u7406\u5458\u5BC6\u7801) {
            return new Response(JSON.stringify({ success: true, msg: "\u767B\u5F55\u6210\u529F" }), {
              status: 200,
              headers: {
                "Content-Type": "application/json;charset=UTF-8",
                "Set-Cookie": setHubCookie(await makeHubSession(env), SESSION_TTL2)
              }
            });
          } else {
            return new Response(JSON.stringify({ success: false, msg: "\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF" }), {
              status: 401,
              headers: { "Content-Type": "application/json;charset=UTF-8" }
            });
          }
        } catch (e) {
          return new Response(JSON.stringify({ success: false, msg: "\u8BF7\u6C42\u683C\u5F0F\u9519\u8BEF" }), {
            status: 400,
            headers: { "Content-Type": "application/json;charset=UTF-8" }
          });
        }
      }
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, msg: "Method Not Allowed" }), { status: 405, headers: { "Content-Type": "application/json;charset=UTF-8" } });
      }
      if (!\u9A8C\u8BC1\u7BA1\u7406\u5458Cookie()) return new Response(null, { status: 302, headers: { "Location": "/login" } });
      if (\u533A\u5206\u5927\u5C0F\u5199\u8BBF\u95EE\u8DEF\u5F84 === "api/logout") {
        return new Response(JSON.stringify({ success: true, msg: "\u767B\u51FA\u6210\u529F" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "Set-Cookie": setHubCookie(await makeHubSession(env), SESSION_TTL2)
          }
        });
      } else if (\u533A\u5206\u5927\u5C0F\u5199\u8BBF\u95EE\u8DEF\u5F84 === "api/add" && !\u6F14\u793A\u6837\u677F) {
        try {
          const newConfig = await request.json();
          const hasEmailAuth = newConfig.Email && newConfig.GlobalAPIKey;
          const hasTokenAuth = newConfig.AccountID && newConfig.APIToken;
          if (!hasEmailAuth && !hasTokenAuth) {
            return new Response(JSON.stringify({ success: false, msg: "\u914D\u7F6E\u4E0D\u5B8C\u6574\uFF0C\u9700\u8981\u63D0\u4F9B Email+GlobalAPIKey \u6216 AccountID+APIToken" }), { status: 400, headers: { "Content-Type": "application/json;charset=utf-8" } });
          }
          const now = Date.now();
          const CF_JSON = {
            ID: 0,
            Name: newConfig.Name || "\u672A\u547D\u540D\u8D26\u53F7",
            Email: hasEmailAuth ? newConfig.Email : null,
            GlobalAPIKey: hasEmailAuth ? newConfig.GlobalAPIKey : null,
            AccountID: newConfig.AccountID || null,
            APIToken: hasTokenAuth ? newConfig.APIToken : null,
            UpdateTime: now,
            LastCheckTime: now,
            Usage: \u521B\u5EFA\u9ED8\u8BA4Usage(false)
          };
          const usage_result = await getCloudflareUsage(CF_JSON.Email, CF_JSON.GlobalAPIKey, CF_JSON.AccountID, CF_JSON.APIToken);
          if (!usage_result.success) {
            return new Response(JSON.stringify({ success: false, msg: "\u65E0\u6CD5\u9A8C\u8BC1\u8BE5CF\u8D26\u53F7\u7684API\u4FE1\u606F" }), { status: 400, headers: { "Content-Type": "application/json;charset=utf-8" } });
          }
          CF_JSON.UpdateTime = Date.now();
          CF_JSON.LastCheckTime = CF_JSON.UpdateTime;
          CF_JSON.Usage = \u8865\u5168\u8D26\u53F7Usage\u7ED3\u6784({ ...CF_JSON, Usage: usage_result });
          if (!newConfig.Name && CF_JSON.AccountID && CF_JSON.APIToken) {
            try {
              const rr = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_JSON.AccountID}`, { method: "GET", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${CF_JSON.APIToken}` } });
              const dd = await rr.json().catch(() => ({}));
              if (rr.ok && dd?.result?.name) CF_JSON.Name = String(dd.result.name).slice(0, 64);
            } catch (e) {
            }
          }
          let usage_config_json = await env.KV.get("usage_config.json", { type: "json" });
          if (!Array.isArray(usage_config_json)) {
            usage_config_json = [];
          }
          const existingIndex = usage_config_json.findIndex(
            (item) => CF_JSON.Email && item.Email && item.Email.toLowerCase() === CF_JSON.Email.toLowerCase() || CF_JSON.AccountID && item.AccountID && item.AccountID === CF_JSON.AccountID
          );
          if (existingIndex !== -1) {
            const existingAccount = usage_config_json[existingIndex];
            CF_JSON.ID = existingAccount.ID;
            usage_config_json[existingIndex] = CF_JSON;
            await env.KV.put("usage_config.json", JSON.stringify(usage_config_json));
            return new Response(JSON.stringify({ success: true, msg: "\u8D26\u53F7\u5DF2\u5B58\u5728\uFF0C\u5DF2\u66F4\u65B0\u8D26\u53F7\u4FE1\u606F", data: { ID: CF_JSON.ID, Name: CF_JSON.Name } }), { status: 200, headers: { "Content-Type": "application/json;charset=utf-8" } });
          }
          CF_JSON.ID = usage_config_json.length > 0 ? Math.max(...usage_config_json.map((item) => item.ID || 0)) + 1 : 1;
          usage_config_json.push(CF_JSON);
          await env.KV.put("usage_config.json", JSON.stringify(usage_config_json));
          return new Response(JSON.stringify({ success: true, msg: "\u8D26\u53F7\u6DFB\u52A0\u6210\u529F", data: { ID: CF_JSON.ID, Name: CF_JSON.Name } }), { status: 200, headers: { "Content-Type": "application/json;charset=utf-8" } });
        } catch (error) {
          console.error("\u4FDD\u5B58\u914D\u7F6E\u5931\u8D25:", error);
          return new Response(JSON.stringify({ success: false, msg: "\u4FDD\u5B58\u914D\u7F6E\u5931\u8D25: " + error.message }), { status: 500, headers: { "Content-Type": "application/json;charset=utf-8" } });
        }
      } else if (\u533A\u5206\u5927\u5C0F\u5199\u8BBF\u95EE\u8DEF\u5F84 === "api/del" && !\u6F14\u793A\u6837\u677F) {
        try {
          const body = await request.json();
          const deleteId = body.ID;
          if (deleteId === void 0 || deleteId === null) {
            return new Response(JSON.stringify({ success: false, msg: "\u8BF7\u63D0\u4F9B\u8981\u5220\u9664\u7684\u8D26\u53F7ID" }), { status: 400, headers: { "Content-Type": "application/json;charset=utf-8" } });
          }
          let usage_config_json = await env.KV.get("usage_config.json", { type: "json" });
          if (!Array.isArray(usage_config_json) || usage_config_json.length === 0) {
            return new Response(JSON.stringify({ success: false, msg: "\u914D\u7F6E\u5217\u8868\u4E3A\u7A7A\uFF0C\u65E0\u6CD5\u5220\u9664" }), { status: 404, headers: { "Content-Type": "application/json;charset=utf-8" } });
          }
          const targetIndex = usage_config_json.findIndex((item) => item.ID === deleteId);
          if (targetIndex === -1) {
            return new Response(JSON.stringify({ success: false, msg: `\u672A\u627E\u5230ID\u4E3A ${deleteId} \u7684\u8D26\u53F7` }), { status: 404, headers: { "Content-Type": "application/json;charset=utf-8" } });
          }
          const deletedName = usage_config_json[targetIndex].Name || "\u672A\u547D\u540D\u8D26\u53F7";
          usage_config_json.splice(targetIndex, 1);
          await env.KV.put("usage_config.json", JSON.stringify(usage_config_json));
          return new Response(JSON.stringify({ success: true, msg: `\u8D26\u53F7 "${deletedName}" \u5DF2\u5220\u9664`, data: { ID: deleteId, Name: deletedName } }), { status: 200, headers: { "Content-Type": "application/json;charset=utf-8" } });
        } catch (error) {
          console.error("\u5220\u9664\u8D26\u53F7\u5931\u8D25:", error);
          return new Response(JSON.stringify({ success: false, msg: "\u5220\u9664\u8D26\u53F7\u5931\u8D25: " + error.message }), { status: 500, headers: { "Content-Type": "application/json;charset=utf-8" } });
        }
      } else if (\u533A\u5206\u5927\u5C0F\u5199\u8BBF\u95EE\u8DEF\u5F84 === "api/check" && !\u6F14\u793A\u6837\u677F) {
        try {
          const Usage_JSON = await getCloudflareUsage(url.searchParams.get("Email"), url.searchParams.get("GlobalAPIKey"), url.searchParams.get("AccountID"), url.searchParams.get("APIToken"));
          return new Response(JSON.stringify(Usage_JSON, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (err) {
          const errorResponse = { msg: "\u67E5\u8BE2\u8BF7\u6C42\u91CF\u5931\u8D25\uFF0C\u5931\u8D25\u539F\u56E0\uFF1A" + err.message, error: err.message };
          return new Response(JSON.stringify(errorResponse, null, 2), { status: 500, headers: { "Content-Type": "application/json;charset=utf-8" } });
        }
      } else if (\u6F14\u793A\u6837\u677F) {
        return new Response(JSON.stringify({ success: false, msg: "\u9884\u89C8\u6A21\u5F0F\u4E0B\uFF0C\u65E0\u6CD5\u8FDB\u884C\u6B64\u64CD\u4F5C" }), { status: 403, headers: { "Content-Type": "application/json;charset=utf-8" } });
      }
    } else if (\u8BBF\u95EE\u8DEF\u5F84 === "robots.txt") {
      return new Response("User-agent: *\nDisallow: /", { status: 200, headers: { "Content-Type": "text/plain; charset=UTF-8" } });
    } else if (url.pathname === "/") {
      return UsagePanel\u4E3B\u9875(\u4E34\u65F6TOKEN);
    }
    return new Response("404 Not Found", { status: 404 });
  } else {
    return new Response("\u8BF7\u5148\u7ED1\u5B9A\u4E00\u4E2AKV\u547D\u540D\u7A7A\u95F4\u5230\u53D8\u91CFKV", { status: 500 });
  }
}
async function scheduledUsage(event, env, ctx) {
  ctx.waitUntil((async () => {
    await \u66F4\u65B0\u8BF7\u6C42\u6570(env);
  })());
}
var \u514D\u8D39\u989D\u5EA6 = {
  requestsDaily: 1e5,
  d1RowsReadDaily: 5e6,
  d1RowsWrittenDaily: 1e5,
  d1StorageBytes: 5 * 1024 * 1024 * 1024,
  kvReadsDaily: 1e5,
  kvWritesDaily: 1e3,
  kvDeletesDaily: 1e3,
  kvListsDaily: 1e3,
  kvStorageBytes: 1 * 1024 * 1024 * 1024,
  r2ClassAMonthly: 1e6,
  r2ClassBMonthly: 1e7,
  r2StorageBytes: 10 * 1024 * 1024 * 1024
};
var \u9ED8\u8BA4\u5355\u8D26\u53F7\u67E5\u8BE2\u95F4\u9694\u6BEB\u79D2 = 20 * 60 * 1e3;
var \u9ED8\u8BA4\u6BCF\u8F6E\u6700\u591A\u5916\u90E8\u5B50\u8BF7\u6C42\u6570 = 50;
var R2_CLASS_A_ACTIONS = /* @__PURE__ */ new Set([
  "listbuckets",
  "putbucket",
  "listobjects",
  "listobjectsv2",
  "putobject",
  "copyobject",
  "completemultipartupload",
  "createmultipartupload",
  "lifecyclestoragetiertransition",
  "listmultipartuploads",
  "uploadpart",
  "uploadpartcopy",
  "listparts",
  "putbucketencryption",
  "putbucketcors",
  "putbucketlifecycleconfiguration"
]);
var R2_CLASS_B_ACTIONS = /* @__PURE__ */ new Set([
  "headbucket",
  "headobject",
  "getobject",
  "usagesummary",
  "getbucketencryption",
  "getbucketlocation",
  "getbucketcors",
  "getbucketlifecycleconfiguration"
]);
var R2_FREE_ACTIONS = /* @__PURE__ */ new Set(["deleteobject", "deleteobjects", "deletebucket", "abortmultipartupload"]);
function \u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1() {
  return {
    d1: {
      rowsRead: 0,
      rowsReadLimit: \u514D\u8D39\u989D\u5EA6.d1RowsReadDaily,
      rowsWritten: 0,
      rowsWrittenLimit: \u514D\u8D39\u989D\u5EA6.d1RowsWrittenDaily,
      readQueries: 0,
      writeQueries: 0,
      storageBytes: 0,
      storageLimitBytes: \u514D\u8D39\u989D\u5EA6.d1StorageBytes,
      databases: 0,
      period: "day"
    },
    kv: {
      reads: 0,
      readsLimit: \u514D\u8D39\u989D\u5EA6.kvReadsDaily,
      writes: 0,
      writesLimit: \u514D\u8D39\u989D\u5EA6.kvWritesDaily,
      deletes: 0,
      deletesLimit: \u514D\u8D39\u989D\u5EA6.kvDeletesDaily,
      lists: 0,
      listsLimit: \u514D\u8D39\u989D\u5EA6.kvListsDaily,
      operations: 0,
      storageBytes: 0,
      storageLimitBytes: \u514D\u8D39\u989D\u5EA6.kvStorageBytes,
      keys: 0,
      namespaces: 0,
      period: "day"
    },
    r2: {
      classA: 0,
      classALimit: \u514D\u8D39\u989D\u5EA6.r2ClassAMonthly,
      classB: 0,
      classBLimit: \u514D\u8D39\u989D\u5EA6.r2ClassBMonthly,
      free: 0,
      other: 0,
      operations: 0,
      storageBytes: 0,
      storageLimitBytes: \u514D\u8D39\u989D\u5EA6.r2StorageBytes,
      objects: 0,
      buckets: 0,
      period: "month"
    }
  };
}
function \u521B\u5EFA\u6C47\u603B\u8D44\u6E90\u7EDF\u8BA1() {
  const resources = \u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1();
  resources.d1.rowsReadLimit = 0;
  resources.d1.rowsWrittenLimit = 0;
  resources.d1.storageLimitBytes = 0;
  resources.kv.readsLimit = 0;
  resources.kv.writesLimit = 0;
  resources.kv.deletesLimit = 0;
  resources.kv.listsLimit = 0;
  resources.kv.storageLimitBytes = 0;
  resources.r2.classALimit = 0;
  resources.r2.classBLimit = 0;
  resources.r2.storageLimitBytes = 0;
  return resources;
}
function \u521B\u5EFA\u9ED8\u8BA4Usage(success = false, msg = "\u274C \u65E0\u6548TOKEN") {
  return {
    success,
    pages: 0,
    workers: 0,
    total: 0,
    max: success ? \u514D\u8D39\u989D\u5EA6.requestsDaily : 0,
    resources: \u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1(),
    UpdateTime: Date.now(),
    msg
  };
}
function \u5408\u5E76\u8D44\u6E90\u7EDF\u8BA1(base, extra = {}) {
  const merged = { ...base };
  for (const key of Object.keys(base)) {
    merged[key] = { ...base[key], ...extra?.[key] || {} };
  }
  return merged;
}
function \u8865\u5168Usage\u7ED3\u6784(usage) {
  const source = usage || {};
  const base = \u521B\u5EFA\u9ED8\u8BA4Usage(false);
  const normalized = { ...base, ...source };
  const updateTime = Number(source.UpdateTime || 0) || 0;
  const hasResourceData = !!source.resources;
  normalized.pages = Number(normalized.pages) || 0;
  normalized.workers = Number(normalized.workers) || 0;
  normalized.total = Number(normalized.total) || normalized.pages + normalized.workers;
  normalized.max = Number(normalized.max) || \u514D\u8D39\u989D\u5EA6.requestsDaily;
  normalized.UpdateTime = updateTime;
  normalized.resources = \u5408\u5E76\u8D44\u6E90\u7EDF\u8BA1(hasResourceData ? \u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1() : \u521B\u5EFA\u6C47\u603B\u8D44\u6E90\u7EDF\u8BA1(), normalized.resources || {});
  return normalized;
}
function \u7D2F\u52A0\u8D44\u6E90\u7EDF\u8BA1(target, source) {
  const data = \u5408\u5E76\u8D44\u6E90\u7EDF\u8BA1(\u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1(), source || {});
  target.d1.rowsRead += data.d1.rowsRead || 0;
  target.d1.rowsReadLimit += data.d1.rowsReadLimit || \u514D\u8D39\u989D\u5EA6.d1RowsReadDaily;
  target.d1.rowsWritten += data.d1.rowsWritten || 0;
  target.d1.rowsWrittenLimit += data.d1.rowsWrittenLimit || \u514D\u8D39\u989D\u5EA6.d1RowsWrittenDaily;
  target.d1.readQueries += data.d1.readQueries || 0;
  target.d1.writeQueries += data.d1.writeQueries || 0;
  target.d1.storageBytes += data.d1.storageBytes || 0;
  target.d1.storageLimitBytes += data.d1.storageLimitBytes || \u514D\u8D39\u989D\u5EA6.d1StorageBytes;
  target.d1.databases += data.d1.databases || 0;
  target.kv.reads += data.kv.reads || 0;
  target.kv.readsLimit += data.kv.readsLimit || \u514D\u8D39\u989D\u5EA6.kvReadsDaily;
  target.kv.writes += data.kv.writes || 0;
  target.kv.writesLimit += data.kv.writesLimit || \u514D\u8D39\u989D\u5EA6.kvWritesDaily;
  target.kv.deletes += data.kv.deletes || 0;
  target.kv.deletesLimit += data.kv.deletesLimit || \u514D\u8D39\u989D\u5EA6.kvDeletesDaily;
  target.kv.lists += data.kv.lists || 0;
  target.kv.listsLimit += data.kv.listsLimit || \u514D\u8D39\u989D\u5EA6.kvListsDaily;
  target.kv.operations += data.kv.operations || 0;
  target.kv.storageBytes += data.kv.storageBytes || 0;
  target.kv.storageLimitBytes += data.kv.storageLimitBytes || \u514D\u8D39\u989D\u5EA6.kvStorageBytes;
  target.kv.keys += data.kv.keys || 0;
  target.kv.namespaces += data.kv.namespaces || 0;
  target.r2.classA += data.r2.classA || 0;
  target.r2.classALimit += data.r2.classALimit || \u514D\u8D39\u989D\u5EA6.r2ClassAMonthly;
  target.r2.classB += data.r2.classB || 0;
  target.r2.classBLimit += data.r2.classBLimit || \u514D\u8D39\u989D\u5EA6.r2ClassBMonthly;
  target.r2.free += data.r2.free || 0;
  target.r2.other += data.r2.other || 0;
  target.r2.operations += data.r2.operations || 0;
  target.r2.storageBytes += data.r2.storageBytes || 0;
  target.r2.storageLimitBytes += data.r2.storageLimitBytes || \u514D\u8D39\u989D\u5EA6.r2StorageBytes;
  target.r2.objects += data.r2.objects || 0;
  target.r2.buckets += data.r2.buckets || 0;
}
function \u83B7\u53D6\u7EDF\u8BA1\u65F6\u95F4\u7A97\u53E3() {
  const now = /* @__PURE__ */ new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return {
    nowIso: now.toISOString(),
    dayStartIso: dayStart.toISOString(),
    monthStartIso: monthStart.toISOString(),
    dayStartDate: dayStart.toISOString().slice(0, 10),
    monthStartDate: monthStart.toISOString().slice(0, 10),
    dateEnd: now.toISOString().slice(0, 10)
  };
}
function \u83B7\u53D6\u5355\u8D26\u53F7\u67E5\u8BE2\u95F4\u9694\u6BEB\u79D2(env = {}) {
  const ms = Number(env.ACCOUNT_CHECK_INTERVAL_MS || env.account_check_interval_ms);
  if (Number.isFinite(ms) && ms > 0) return ms;
  const minutes = Number(env.ACCOUNT_CHECK_INTERVAL_MINUTES || env.account_check_interval_minutes || env.CHECK_INTERVAL_MINUTES || env.check_interval_minutes);
  if (Number.isFinite(minutes) && minutes > 0) return minutes * 60 * 1e3;
  return \u9ED8\u8BA4\u5355\u8D26\u53F7\u67E5\u8BE2\u95F4\u9694\u6BEB\u79D2;
}
function \u83B7\u53D6\u6BCF\u8F6E\u6700\u591A\u5916\u90E8\u5B50\u8BF7\u6C42\u6570(env = {}) {
  const configured = Number(env.MAX_EXTERNAL_SUBREQUESTS_PER_RUN || env.max_external_subrequests_per_run);
  if (Number.isFinite(configured) && configured > 0) return Math.min(Math.max(1, Math.floor(configured)), \u9ED8\u8BA4\u6BCF\u8F6E\u6700\u591A\u5916\u90E8\u5B50\u8BF7\u6C42\u6570);
  return \u9ED8\u8BA4\u6BCF\u8F6E\u6700\u591A\u5916\u90E8\u5B50\u8BF7\u6C42\u6570;
}
function \u4F30\u7B97\u8D26\u53F7\u67E5\u8BE2\u5916\u90E8\u5B50\u8BF7\u6C42\u6570(account = {}) {
  if (account.AccountID) return 4;
  if (account.Email && account.GlobalAPIKey) return 5;
  return 5;
}
function \u83B7\u53D6\u8D26\u53F7\u6700\u540E\u66F4\u65B0\u65F6\u95F4(account) {
  return Number(account?.UpdateTime || account?.Usage?.UpdateTime || 0) || 0;
}
function \u8865\u5168\u8D26\u53F7Usage\u7ED3\u6784(account) {
  const usage = \u8865\u5168Usage\u7ED3\u6784(account?.Usage || {});
  delete usage.UpdateTime;
  return usage;
}
function \u5199\u5165\u8D26\u53F7\u67E5\u8BE2\u7ED3\u679C(account, usage, queryTime = Date.now()) {
  const normalized = \u8865\u5168Usage\u7ED3\u6784(usage || {});
  normalized.UpdateTime = queryTime;
  account.Usage = \u8865\u5168\u8D26\u53F7Usage\u7ED3\u6784({ ...account, Usage: normalized });
  account.UpdateTime = queryTime;
  account.LastCheckTime = queryTime;
  delete account.LastCheckError;
  delete account.LastCheckErrorTime;
  return normalized;
}
function \u5199\u5165\u8D26\u53F7\u67E5\u8BE2\u5931\u8D25(account, error, queryTime = Date.now()) {
  const lastUpdateTime = \u83B7\u53D6\u8D26\u53F7\u6700\u540E\u66F4\u65B0\u65F6\u95F4(account);
  if (lastUpdateTime && !account.UpdateTime) account.UpdateTime = lastUpdateTime;
  account.LastCheckTime = queryTime;
  account.LastCheckErrorTime = queryTime;
  account.LastCheckError = typeof error === "string" ? error : error?.msg || error?.message || "\u67E5\u8BE2\u5931\u8D25";
  account.Usage = \u8865\u5168\u8D26\u53F7Usage\u7ED3\u6784(account);
  return account.Usage;
}
async function \u66F4\u65B0\u8BF7\u6C42\u6570(env, options = {}) {
  let usage_config_json = await env.KV.get("usage_config.json", { type: "json" });
  let usage_json = \u521B\u5EFA\u9ED8\u8BA4Usage(false);
  if (!usage_config_json) {
    usage_config_json = [];
    await env.KV.put("usage_config.json", JSON.stringify(usage_config_json));
    usage_json.success = true;
    usage_json.resources = \u521B\u5EFA\u6C47\u603B\u8D44\u6E90\u7EDF\u8BA1();
    usage_json.msg = "\u26A0\uFE0F \u5C1A\u672A\u6DFB\u52A0\u4EFB\u4F55Cloudflare\u8D26\u53F7";
    await env.KV.put("usage.json", JSON.stringify(usage_json));
  } else if (Array.isArray(usage_config_json) && usage_config_json.length > 0) {
    const thresholdMs = Number(options.thresholdMs) || \u83B7\u53D6\u5355\u8D26\u53F7\u67E5\u8BE2\u95F4\u9694\u6BEB\u79D2(env);
    const externalSubrequestLimit = \u83B7\u53D6\u6BCF\u8F6E\u6700\u591A\u5916\u90E8\u5B50\u8BF7\u6C42\u6570(env);
    const now = Date.now();
    const accountStates = usage_config_json.map((account, index) => {
      const lastUpdateTime = \u83B7\u53D6\u8D26\u53F7\u6700\u540E\u66F4\u65B0\u65F6\u95F4(account);
      account.Usage = \u8865\u5168\u8D26\u53F7Usage\u7ED3\u6784(account);
      if (lastUpdateTime && !account.UpdateTime) account.UpdateTime = lastUpdateTime;
      if (lastUpdateTime && !account.LastCheckTime) account.LastCheckTime = lastUpdateTime;
      return { account, index, lastUpdateTime };
    });
    const expiredAccounts = accountStates.filter((item) => options.force || !item.lastUpdateTime || now - item.lastUpdateTime > thresholdMs).sort((a, b) => (a.lastUpdateTime || 0) - (b.lastUpdateTime || 0));
    const accountsToRefresh = [];
    let estimatedExternalSubrequests = 0;
    for (const item of expiredAccounts) {
      const accountSubrequests = \u4F30\u7B97\u8D26\u53F7\u67E5\u8BE2\u5916\u90E8\u5B50\u8BF7\u6C42\u6570(item.account);
      if (estimatedExternalSubrequests + accountSubrequests > externalSubrequestLimit) continue;
      accountsToRefresh.push({ ...item, estimatedExternalSubrequests: accountSubrequests });
      estimatedExternalSubrequests += accountSubrequests;
    }
    let refreshedCount = 0;
    let failedRefreshCount = 0;
    await Promise.all(accountsToRefresh.map(async ({ account }) => {
      try {
        const usage = await getCloudflareUsage(account.Email, account.GlobalAPIKey, account.AccountID, account.APIToken);
        if (!usage.success) {
          \u5199\u5165\u8D26\u53F7\u67E5\u8BE2\u5931\u8D25(account, usage, Date.now());
          failedRefreshCount += 1;
          return;
        }
        \u5199\u5165\u8D26\u53F7\u67E5\u8BE2\u7ED3\u679C(account, usage, Date.now());
        refreshedCount += 1;
      } catch (error) {
        failedRefreshCount += 1;
        console.error(`\u8D26\u53F7 ${account.ID} \u67E5\u8BE2\u5931\u8D25:`, error.message);
        \u5199\u5165\u8D26\u53F7\u67E5\u8BE2\u5931\u8D25(account, error, Date.now());
      }
    }));
    let total_pages = 0;
    let total_workers = 0;
    let total_max = 0;
    const total_resources = \u521B\u5EFA\u6C47\u603B\u8D44\u6E90\u7EDF\u8BA1();
    for (const account of usage_config_json) {
      const usage = \u8865\u5168\u8D26\u53F7Usage\u7ED3\u6784(account);
      account.Usage = usage;
      if (usage.success) {
        total_pages += usage.pages || 0;
        total_workers += usage.workers || 0;
        total_max += usage.max || \u514D\u8D39\u989D\u5EA6.requestsDaily;
        \u7D2F\u52A0\u8D44\u6E90\u7EDF\u8BA1(total_resources, usage.resources);
      }
    }
    await env.KV.put("usage_config.json", JSON.stringify(usage_config_json));
    usage_json.success = true;
    usage_json.pages = total_pages;
    usage_json.workers = total_workers;
    usage_json.total = total_pages + total_workers;
    usage_json.max = total_max;
    usage_json.resources = total_resources;
    usage_json.UpdateTime = Date.now();
    usage_json.RefreshStats = {
      refreshed: refreshedCount,
      failed: failedRefreshCount,
      cached: Math.max(usage_config_json.length - refreshedCount, 0),
      skippedByLimit: Math.max(expiredAccounts.length - accountsToRefresh.length, 0),
      maxRefresh: accountsToRefresh.length,
      externalSubrequestsEstimated: estimatedExternalSubrequests,
      externalSubrequestLimit,
      perAccountExternalSubrequests: { withAccountId: 4, withoutAccountId: 5 },
      thresholdMs
    };
    usage_json.msg = failedRefreshCount > 0 ? `\u26A0\uFE0F \u90E8\u5206\u8D26\u53F7\u67E5\u8BE2\u5931\u8D25\uFF08\u672C\u6B21\u5237\u65B0 ${refreshedCount} \u4E2A\u8D26\u53F7\uFF0C\u5931\u8D25 ${failedRefreshCount} \u4E2A\uFF0C${usage_json.RefreshStats.cached} \u4E2A\u4F7F\u7528\u5386\u53F2\u6570\u636E\uFF09` : `\u2705 \u6210\u529F\u66F4\u65B0\u514D\u8D39\u989D\u5EA6\u4F7F\u7528\u6570\u636E\uFF08\u672C\u6B21\u5237\u65B0 ${refreshedCount} \u4E2A\u8D26\u53F7\uFF0C${usage_json.RefreshStats.cached} \u4E2A\u4F7F\u7528\u5386\u53F2\u6570\u636E\uFF09`;
    await env.KV.put("usage.json", JSON.stringify(usage_json));
  } else {
    usage_json.success = true;
    usage_json.resources = \u521B\u5EFA\u6C47\u603B\u8D44\u6E90\u7EDF\u8BA1();
    usage_json.UpdateTime = Date.now();
    usage_json.msg = "\u26A0\uFE0F \u5C1A\u672A\u6DFB\u52A0\u4EFB\u4F55Cloudflare\u8D26\u53F7";
    await env.KV.put("usage.json", JSON.stringify(usage_json));
  }
  return usage_json;
}
async function MD5MD5(\u6587\u672C) {
  const \u7F16\u7801\u5668 = new TextEncoder();
  const \u7B2C\u4E00\u6B21\u54C8\u5E0C = await crypto.subtle.digest("MD5", \u7F16\u7801\u5668.encode(\u6587\u672C));
  const \u7B2C\u4E00\u6B21\u54C8\u5E0C\u6570\u7EC4 = Array.from(new Uint8Array(\u7B2C\u4E00\u6B21\u54C8\u5E0C));
  const \u7B2C\u4E00\u6B21\u5341\u516D\u8FDB\u5236 = \u7B2C\u4E00\u6B21\u54C8\u5E0C\u6570\u7EC4.map((\u5B57\u8282) => \u5B57\u8282.toString(16).padStart(2, "0")).join("");
  const \u7B2C\u4E8C\u6B21\u54C8\u5E0C = await crypto.subtle.digest("MD5", \u7F16\u7801\u5668.encode(\u7B2C\u4E00\u6B21\u5341\u516D\u8FDB\u5236.slice(7, 27)));
  const \u7B2C\u4E8C\u6B21\u54C8\u5E0C\u6570\u7EC4 = Array.from(new Uint8Array(\u7B2C\u4E8C\u6B21\u54C8\u5E0C));
  const \u7B2C\u4E8C\u6B21\u5341\u516D\u8FDB\u5236 = \u7B2C\u4E8C\u6B21\u54C8\u5E0C\u6570\u7EC4.map((\u5B57\u8282) => \u5B57\u8282.toString(16).padStart(2, "0")).join("");
  return \u7B2C\u4E8C\u6B21\u5341\u516D\u8FDB\u5236.toLowerCase();
}
function \u6570\u5B57(value) {
  return Number(value) || 0;
}
function \u5408\u8BA1\u8BF7\u6C42\u6570(groups) {
  return groups?.reduce((total, item) => total + \u6570\u5B57(item?.sum?.requests), 0) || 0;
}
function \u89C4\u8303\u5316\u52A8\u4F5C\u540D\u79F0(action) {
  return String(action || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}
function \u9009\u62E9\u6700\u65B0\u5206\u7EC4(groups, idField, timeField) {
  const latest = /* @__PURE__ */ new Map();
  for (const group of groups || []) {
    const dimensions = group?.dimensions || {};
    const id = dimensions[idField] || "__account";
    const time = String(dimensions[timeField] || "");
    const current = latest.get(id);
    if (!current || time >= current.time) latest.set(id, { time, group });
  }
  return Array.from(latest.values()).map((item) => item.group);
}
async function \u53D1\u9001GraphQL\u8BF7\u6C42(API2, headers, query, variables) {
  const res = await fetch(`${API2}/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error(`\u67E5\u8BE2\u5931\u8D25: ${res.status}`);
  const result = await res.json();
  if (result.errors?.length) throw new Error(result.errors.map((error) => error.message).join("; "));
  const account = result?.data?.viewer?.accounts?.[0];
  if (!account) throw new Error("\u672A\u627E\u5230\u8D26\u6237\u6570\u636E");
  return account;
}
async function \u83B7\u53D6Cloudflare\u8D26\u6237ID(API2, headers, Email) {
  const r = await fetch(`${API2}/accounts`, { method: "GET", headers });
  if (!r.ok) throw new Error(`\u8D26\u6237\u83B7\u53D6\u5931\u8D25: ${r.status}`);
  const d = await r.json();
  if (!d?.result?.length) throw new Error("\u672A\u627E\u5230\u8D26\u6237");
  const idx = d.result.findIndex((account) => account.name?.toLowerCase().startsWith(Email.toLowerCase()));
  return d.result[idx >= 0 ? idx : 0]?.id;
}
async function \u67E5\u8BE2WorkersPages\u7EDF\u8BA1(API2, headers, AccountID, \u65F6\u95F4\u7A97\u53E3) {
  const account = await \u53D1\u9001GraphQL\u8BF7\u6C42(API2, headers, `query getBillingMetrics($AccountID: String!, $filter: AccountWorkersInvocationsAdaptiveFilter_InputObject) {
        viewer { accounts(filter: {accountTag: $AccountID}) {
            pagesFunctionsInvocationsAdaptiveGroups(limit: 1000, filter: $filter) { sum { requests } }
            workersInvocationsAdaptive(limit: 10000, filter: $filter) { sum { requests } }
        } }
    }`, {
    AccountID,
    filter: { datetime_geq: \u65F6\u95F4\u7A97\u53E3.dayStartIso, datetime_leq: \u65F6\u95F4\u7A97\u53E3.nowIso }
  });
  return {
    pages: \u5408\u8BA1\u8BF7\u6C42\u6570(account.pagesFunctionsInvocationsAdaptiveGroups),
    workers: \u5408\u8BA1\u8BF7\u6C42\u6570(account.workersInvocationsAdaptive)
  };
}
async function \u67E5\u8BE2D1\u7EDF\u8BA1(API2, headers, AccountID, \u65F6\u95F4\u7A97\u53E3) {
  const d1 = \u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1().d1;
  const account = await \u53D1\u9001GraphQL\u8BF7\u6C42(API2, headers, `query D1Usage($accountTag: String!, $dayStart: Date!, $dateEnd: Date!, $storageStart: Date!) {
        viewer { accounts(filter: {accountTag: $accountTag}) {
            d1AnalyticsAdaptiveGroups(limit: 10000, filter: {date_geq: $dayStart, date_leq: $dateEnd}) {
                sum { rowsRead rowsWritten readQueries writeQueries }
                dimensions { date databaseId }
            }
            d1StorageAdaptiveGroups(limit: 10000, filter: {date_geq: $storageStart, date_leq: $dateEnd}, orderBy: [date_DESC]) {
                max { databaseSizeBytes }
                dimensions { date databaseId }
            }
        } }
    }`, {
    accountTag: AccountID,
    dayStart: \u65F6\u95F4\u7A97\u53E3.dayStartDate,
    dateEnd: \u65F6\u95F4\u7A97\u53E3.dateEnd,
    storageStart: \u65F6\u95F4\u7A97\u53E3.monthStartDate
  });
  for (const group of account.d1AnalyticsAdaptiveGroups || []) {
    d1.rowsRead += \u6570\u5B57(group?.sum?.rowsRead);
    d1.rowsWritten += \u6570\u5B57(group?.sum?.rowsWritten);
    d1.readQueries += \u6570\u5B57(group?.sum?.readQueries);
    d1.writeQueries += \u6570\u5B57(group?.sum?.writeQueries);
  }
  const storageGroups = \u9009\u62E9\u6700\u65B0\u5206\u7EC4(account.d1StorageAdaptiveGroups, "databaseId", "date");
  d1.databases = storageGroups.length;
  d1.storageBytes = storageGroups.reduce((total, group) => total + \u6570\u5B57(group?.max?.databaseSizeBytes), 0);
  return d1;
}
async function \u67E5\u8BE2KV\u7EDF\u8BA1(API2, headers, AccountID, \u65F6\u95F4\u7A97\u53E3) {
  const kv = \u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1().kv;
  const account = await \u53D1\u9001GraphQL\u8BF7\u6C42(API2, headers, `query KvUsage($accountTag: String!, $dayStart: Date!, $dateEnd: Date!, $storageStart: Date!) {
        viewer { accounts(filter: {accountTag: $accountTag}) {
            kvOperationsAdaptiveGroups(limit: 10000, filter: {date_geq: $dayStart, date_leq: $dateEnd}) {
                sum { requests }
                dimensions { actionType }
            }
            kvStorageAdaptiveGroups(limit: 10000, filter: {date_geq: $storageStart, date_leq: $dateEnd}, orderBy: [date_DESC]) {
                max { keyCount byteCount }
                dimensions { date namespaceId }
            }
        } }
    }`, {
    accountTag: AccountID,
    dayStart: \u65F6\u95F4\u7A97\u53E3.dayStartDate,
    dateEnd: \u65F6\u95F4\u7A97\u53E3.dateEnd,
    storageStart: \u65F6\u95F4\u7A97\u53E3.monthStartDate
  });
  for (const group of account.kvOperationsAdaptiveGroups || []) {
    const requests = \u6570\u5B57(group?.sum?.requests);
    const actionType = String(group?.dimensions?.actionType || "").toLowerCase();
    kv.operations += requests;
    if (actionType.includes("read")) kv.reads += requests;
    else if (actionType.includes("write")) kv.writes += requests;
    else if (actionType.includes("delete")) kv.deletes += requests;
    else if (actionType.includes("list")) kv.lists += requests;
  }
  const storageGroups = \u9009\u62E9\u6700\u65B0\u5206\u7EC4(account.kvStorageAdaptiveGroups, "namespaceId", "date");
  kv.namespaces = storageGroups.length;
  kv.keys = storageGroups.reduce((total, group) => total + \u6570\u5B57(group?.max?.keyCount), 0);
  kv.storageBytes = storageGroups.reduce((total, group) => total + \u6570\u5B57(group?.max?.byteCount), 0);
  return kv;
}
async function \u67E5\u8BE2R2\u7EDF\u8BA1(API2, headers, AccountID, \u65F6\u95F4\u7A97\u53E3) {
  const r2 = \u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1().r2;
  const account = await \u53D1\u9001GraphQL\u8BF7\u6C42(API2, headers, `query R2Usage($accountTag: String!, $monthStart: Time!, $now: Time!) {
        viewer { accounts(filter: {accountTag: $accountTag}) {
            r2OperationsAdaptiveGroups(limit: 10000, filter: {datetime_geq: $monthStart, datetime_leq: $now}) {
                sum { requests }
                dimensions { actionType actionStatus }
            }
            r2StorageAdaptiveGroups(limit: 10000, filter: {datetime_geq: $monthStart, datetime_leq: $now}, orderBy: [datetime_DESC]) {
                max { objectCount uploadCount payloadSize metadataSize }
                dimensions { datetime bucketName }
            }
        } }
    }`, {
    accountTag: AccountID,
    monthStart: \u65F6\u95F4\u7A97\u53E3.monthStartIso,
    now: \u65F6\u95F4\u7A97\u53E3.nowIso
  });
  for (const group of account.r2OperationsAdaptiveGroups || []) {
    const status = String(group?.dimensions?.actionStatus || "success").toLowerCase();
    if (status && status !== "success") continue;
    const requests = \u6570\u5B57(group?.sum?.requests);
    const action = \u89C4\u8303\u5316\u52A8\u4F5C\u540D\u79F0(group?.dimensions?.actionType);
    r2.operations += requests;
    if (R2_CLASS_A_ACTIONS.has(action)) r2.classA += requests;
    else if (R2_CLASS_B_ACTIONS.has(action)) r2.classB += requests;
    else if (R2_FREE_ACTIONS.has(action)) r2.free += requests;
    else r2.other += requests;
  }
  const storageGroups = \u9009\u62E9\u6700\u65B0\u5206\u7EC4(account.r2StorageAdaptiveGroups, "bucketName", "datetime");
  r2.buckets = storageGroups.length;
  r2.objects = storageGroups.reduce((total, group) => total + \u6570\u5B57(group?.max?.objectCount), 0);
  r2.storageBytes = storageGroups.reduce((total, group) => total + \u6570\u5B57(group?.max?.payloadSize) + \u6570\u5B57(group?.max?.metadataSize), 0);
  return r2;
}
async function getCloudflareUsage(Email, GlobalAPIKey, AccountID, APIToken) {
  const API2 = "https://api.cloudflare.com/client/v4";
  const cfg = { "Content-Type": "application/json" };
  const fallback = \u521B\u5EFA\u9ED8\u8BA4Usage(false);
  fallback.max = \u514D\u8D39\u989D\u5EA6.requestsDaily;
  try {
    if (!AccountID && (!Email || !GlobalAPIKey)) return fallback;
    const hdr = APIToken ? { ...cfg, "Authorization": `Bearer ${APIToken}` } : { ...cfg, "X-AUTH-EMAIL": Email, "X-AUTH-KEY": GlobalAPIKey };
    if (!AccountID) AccountID = await \u83B7\u53D6Cloudflare\u8D26\u6237ID(API2, hdr, Email);
    const \u65F6\u95F4\u7A97\u53E3 = \u83B7\u53D6\u7EDF\u8BA1\u65F6\u95F4\u7A97\u53E3();
    const usage = \u521B\u5EFA\u9ED8\u8BA4Usage(true, "\u2705 \u6210\u529F\u66F4\u65B0\u514D\u8D39\u989D\u5EA6\u4F7F\u7528\u6570\u636E");
    const core = await \u67E5\u8BE2WorkersPages\u7EDF\u8BA1(API2, hdr, AccountID, \u65F6\u95F4\u7A97\u53E3);
    usage.pages = core.pages;
    usage.workers = core.workers;
    usage.total = core.pages + core.workers;
    usage.max = \u514D\u8D39\u989D\u5EA6.requestsDaily;
    const errors = [];
    const safeQuery = async (label, query, defaultValue) => {
      try {
        return await query();
      } catch (error) {
        console.warn(`${label} \u7EDF\u8BA1\u5931\u8D25:`, error.message);
        errors.push(`${label}: ${error.message}`);
        return defaultValue;
      }
    };
    const [d1, kv, r2] = await Promise.all([
      safeQuery("D1", () => \u67E5\u8BE2D1\u7EDF\u8BA1(API2, hdr, AccountID, \u65F6\u95F4\u7A97\u53E3), \u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1().d1),
      safeQuery("KV", () => \u67E5\u8BE2KV\u7EDF\u8BA1(API2, hdr, AccountID, \u65F6\u95F4\u7A97\u53E3), \u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1().kv),
      safeQuery("R2", () => \u67E5\u8BE2R2\u7EDF\u8BA1(API2, hdr, AccountID, \u65F6\u95F4\u7A97\u53E3), \u521B\u5EFA\u9ED8\u8BA4\u8D44\u6E90\u7EDF\u8BA1().r2)
    ]);
    usage.resources.d1 = d1;
    usage.resources.kv = kv;
    usage.resources.r2 = r2;
    if (errors.length) usage.errors = errors;
    console.log(`\u7EDF\u8BA1\u7ED3\u679C - Pages: ${usage.pages}, Workers: ${usage.workers}, D1\u8BFB: ${d1.rowsRead}, KV\u8BFB: ${kv.reads}, R2 A/B: ${r2.classA}/${r2.classB}`);
    return usage;
  } catch (error) {
    console.error("\u83B7\u53D6\u4F7F\u7528\u91CF\u9519\u8BEF:", error.message);
    fallback.msg = "\u274C \u83B7\u53D6\u4F7F\u7528\u91CF\u5931\u8D25: " + error.message;
    return fallback;
  }
}
function \u63A9\u7801\u654F\u611F\u4FE1\u606F(\u6587\u672C, \u524D\u7F00\u957F\u5EA6 = 3, \u540E\u7F00\u957F\u5EA6 = 2) {
  if (!\u6587\u672C || typeof \u6587\u672C !== "string") return \u6587\u672C;
  if (\u6587\u672C.length <= \u524D\u7F00\u957F\u5EA6 + \u540E\u7F00\u957F\u5EA6) return \u6587\u672C;
  const \u524D\u7F00 = \u6587\u672C.slice(0, \u524D\u7F00\u957F\u5EA6);
  const \u540E\u7F00 = \u6587\u672C.slice(-\u540E\u7F00\u957F\u5EA6);
  const \u661F\u53F7\u6570\u91CF = \u6587\u672C.length - \u524D\u7F00\u957F\u5EA6 - \u540E\u7F00\u957F\u5EA6;
  return `${\u524D\u7F00}${"*".repeat(\u661F\u53F7\u6570\u91CF)}${\u540E\u7F00}`;
}
async function UsagePanel\u7BA1\u7406\u9762\u677F(TOKEN) {
  const userIDMD5 = await MD5MD5(TOKEN);
  const UUID = [userIDMD5.slice(0, 8), userIDMD5.slice(8, 12), "4" + userIDMD5.slice(13, 16), "8" + userIDMD5.slice(17, 20), userIDMD5.slice(20)].join("-");
  const \u4E13\u5C5EID\u6807\u8BC6 = "ed" + userIDMD5.slice(0, 8);
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UsagePanel \u7BA1\u7406\u9762\u677F</title>
    <link rel="icon" href="https://cf-assets.www.cloudflare.com/dzlvafdwdttg/5uhbWfhjepEoUiM9phzhgJ/9658369030266cde9e35a3c5d4e4beb2/cloud-upload.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1;
            --primary-glow: rgba(99, 102, 241, 0.4);
            --accent: #a855f7;
            --background: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --stroke: rgba(255, 255, 255, 0.08);
            --danger: #ef4444;
            --heading-grad: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
            --item-bg: rgba(255, 255, 255, 0.03);
            --footer-color: rgba(255, 255, 255, 0.2);
            --footer-hover: rgba(255, 255, 255, 0.4);
            --track-bg: rgba(0, 0, 0, 0.2);
            --input-bg: rgba(0, 0, 0, 0.2);
        }

        :root.light-mode {
            --primary: #4f46e5;
            --primary-glow: rgba(79, 70, 229, 0.2);
            --accent: #9333ea;
            --background: #f1f5f9;
            --card-bg: rgba(255, 255, 255, 0.8);
            --text-main: #0f172a;
            --text-muted: #64748b;
            --stroke: rgba(0, 0, 0, 0.1);
            --danger: #dc2626;
            --heading-grad: linear-gradient(135deg, #1e293b 0%, #475569 100%);
            --item-bg: rgba(0, 0, 0, 0.03);
            --footer-color: rgba(15, 23, 42, 0.4);
            --footer-hover: var(--primary);
            --track-bg: rgba(0, 0, 0, 0.08);
            --input-bg: rgba(255, 255, 255, 0.8);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html {
            scrollbar-gutter: stable both-edges;
        }

        @supports not (scrollbar-gutter: stable) {
            html { overflow-y: scroll; }
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--background);
            background-image: 
                radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.15) 0px, transparent 50%);
            background-attachment: fixed;
            color: var(--text-main);
            min-height: 100vh;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .top-nav {
            width: 100%;
            max-width: 680px;
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-bottom: 1rem;
            animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-btn {
            padding: 0.6rem 1.2rem;
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--stroke);
            border-radius: 12px;
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
            border-color: var(--primary);
        }

        .nav-btn.logout:hover {
            border-color: var(--danger);
            color: var(--danger);
        }

        .container {
            width: 100%;
            max-width: 680px;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-card {
            background: var(--card-bg);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--stroke);
            border-radius: 24px;
            padding: 2rem;
            box-shadow: 
                0 25px 50px -12px rgba(0, 0, 0, 0.5),
                0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }

        .summary-card {
            position: static;
        }

        .accounts-card {
            min-width: 0;
        }

        header {
            margin-bottom: 1.5rem;
        }

        h1, h2 {
            font-size: 1.5rem;
            font-weight: 700;
            background: var(--heading-grad);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 1rem;
            letter-spacing: -0.01em;
        }

        .module-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .module-header h2 { margin-bottom: 0; }

        .add-btn {
            padding: 0.6rem 1.2rem;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            border: none;
            border-radius: 12px;
            color: white;
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .add-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 20px var(--primary-glow);
        }

        /* Usage Section Styles (from homepage) */
        .usage-section { margin-bottom: 2rem; position: relative; }
        .usage-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1rem; }
        .label { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; }
        .percentage { font-family: 'Outfit', monospace; font-size: 1.25rem; font-weight: 600; color: var(--gradient-color, var(--text-main)); text-shadow: 0 0 20px var(--gradient-color-shadow, var(--primary-glow)); transition: color 0.6s ease, text-shadow 0.6s ease; }
        .progress-track { background: var(--track-bg); border: 1px solid var(--stroke); border-radius: 999px; height: 14px; overflow: hidden; position: relative; }
        .progress-bar { height: 100%; background: linear-gradient(90deg, #10b981 0%, #eab308 50%, #ef4444 100%); background-size: var(--bg-size, 100%); background-position: left; border-radius: 999px; width: 0%; transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; overflow: hidden; }
        .progress-bar::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); transform: translateX(-100%); animation: shimmer 2.5s infinite; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
        .mini-card { 
            background: var(--item-bg); 
            border: 1px solid var(--stroke); 
            border-radius: 16px; 
            padding: 1rem 1.25rem; 
            display: flex; 
            align-items: center; 
            gap: 1.25rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .mini-card:hover { 
            background: rgba(99, 102, 241, 0.08); 
            transform: translateY(-4px); 
            border-color: var(--primary); 
            box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2);
        }
        .mini-icon { font-size: 1.75rem; margin-bottom: 0; line-height: 1; }
        .mini-info { display: flex; flex-direction: column; justify-content: center; }
        .mini-label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0; letter-spacing: 0.05em; font-weight: 500; }
        .mini-value { font-size: 1.25rem; font-weight: 700; color: var(--text-main); line-height: 1.2; }
        .total-text { text-align: right; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; }
        .quota-details { margin-top: 1.25rem; overflow: hidden; }
        .quota-details[open] { display: flex; flex-direction: column; }
        .quota-details.quota-animating .quota-summary { pointer-events: none; }
        .quota-summary { list-style: none; background: linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(14, 165, 233, 0.1)); border: 1px solid rgba(99, 102, 241, 0.5); border-radius: 14px; padding: 0.8rem 0.85rem; cursor: pointer; display: flex; justify-content: space-between; gap: 0.75rem; align-items: center; color: var(--text-main); font-size: 0.85rem; font-weight: 700; box-shadow: 0 12px 28px -18px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.08); transition: all 0.3s ease; }
        .quota-summary::-webkit-details-marker { display: none; }
        .quota-summary:hover, .quota-summary:focus-visible { border-color: var(--primary); background: linear-gradient(135deg, rgba(99, 102, 241, 0.24), rgba(14, 165, 233, 0.14)); box-shadow: 0 16px 32px -18px var(--primary-glow), 0 0 0 3px rgba(99, 102, 241, 0.12); outline: none; }
        .quota-summary-title { min-width: 0; }
        .quota-summary::after { content: '\u5C55\u5F00\u7EC6\u8282'; color: #fff; background: var(--primary); border-radius: 999px; padding: 0.38rem 0.7rem; font-size: 0.75rem; font-weight: 700; white-space: nowrap; box-shadow: 0 10px 20px -12px var(--primary-glow); }
        .quota-details[open] .quota-summary::after { content: '\u6536\u8D77\u7EC6\u8282'; }
        .quota-details[open] .quota-summary { order: 2; margin-top: 0.875rem; }
        .quota-summary-meta { color: var(--text-muted); font-size: 0.75rem; font-weight: 600; margin-left: auto; white-space: nowrap; }
        .quota-body { overflow: hidden; }
        .quota-details[open] .quota-body { order: 1; }
        .quota-details.quota-animating .quota-body { will-change: height, opacity, transform; }
        .quota-list { display: grid; gap: 0.875rem; margin-top: 0.875rem; }
        .quota-details[open] .quota-list { margin-top: 0; }
        .quota-item { background: var(--item-bg); border: 1px solid var(--stroke); border-radius: 14px; padding: 0.875rem 1rem; }
        .quota-group-head { display: flex; justify-content: space-between; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; }
        .quota-group-title { color: var(--text-main); font-size: 0.9rem; font-weight: 700; }
        .quota-group-meta { color: var(--text-muted); font-size: 0.75rem; font-variant-numeric: tabular-nums; text-align: right; }
        .quota-row { margin-top: 0.75rem; }
        .quota-group-head + .quota-row { margin-top: 0; }
        .quota-top { display: flex; justify-content: space-between; gap: 0.75rem; color: var(--text-muted); font-size: 0.78rem; margin-bottom: 0.55rem; }
        .quota-title { color: var(--text-main); font-weight: 600; }
        .quota-meta { text-align: right; font-variant-numeric: tabular-nums; }
        .quota-track { height: 7px; background: var(--track-bg); border: 1px solid var(--stroke); border-radius: 999px; overflow: hidden; }
        .quota-fill { height: 100%; border-radius: inherit; min-width: 0; transition: width 1s ease; }
        .resource-note { margin-top: 0.875rem; color: var(--text-muted); font-size: 0.75rem; line-height: 1.5; }

        /* Account List Styles */
        .account-list { display: flex; flex-direction: column; gap: 1rem; }
        .account-item {
            background: var(--item-bg);
            border: 1px solid var(--stroke);
            border-radius: 20px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            transition: all 0.3s ease;
        }
        .account-item:hover {
            border-color: rgba(99, 102, 241, 0.3);
            background: rgba(99, 102, 241, 0.02);
        }
        .account-info { display: flex; justify-content: space-between; align-items: center; }
        .account-name { font-weight: 600; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem; }
        .account-id { font-size: 0.8rem; color: var(--text-muted); font-family: monospace; }
        
        .delete-btn {
            padding: 0.5rem 1rem;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 10px;
            color: #fca5a5;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .delete-btn:hover {
            background: var(--danger);
            color: white;
            border-color: var(--danger);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        }
        .modal-overlay.active { display: flex; }
        .modal {
            background: var(--card-bg);
            backdrop-filter: blur(24px);
            border: 1px solid var(--stroke);
            border-radius: 24px;
            padding: 2rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal h3 { margin-bottom: 1.5rem; text-align: center; }
        .input-group { margin-bottom: 1rem; }
        .input-group label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; }
        .input-group input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: var(--input-bg);
            border: 1px solid var(--stroke);
            border-radius: 12px;
            color: var(--text-main);
            outline: none;
            transition: border-color 0.3s;
        }
        .input-group input:focus { border-color: var(--primary); }
        .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
        .modal-btn { flex: 1; padding: 0.75rem; border-radius: 12px; cursor: pointer; font-weight: 600; border: none; transition: all 0.3s; }
        .modal-btn.cancel { background: rgba(255, 255, 255, 0.05); color: var(--text-main); }
        .modal-btn.confirm { background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; }
        .modal-btn:hover { transform: translateY(-2px); }

        .toast {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 3000;
            opacity: 0;
            visibility: hidden;
            transform: translateX(30px) translateY(30px);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast.active { 
            opacity: 1;
            visibility: visible;
            transform: translateX(0) translateY(0); 
        }

        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }

        .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-wrap { display: flex; justify-content: center; padding: 3rem; }

        @media (min-width: 1024px) {
            .top-nav {
                max-width: 1180px;
            }

            .container {
                max-width: 1180px;
                display: grid;
                grid-template-columns: minmax(320px, 0.85fr) minmax(520px, 1.15fr);
                align-items: start;
            }

            .summary-card {
                position: sticky;
                top: 1.5rem;
            }
        }

        .footer {
            grid-column: 1 / -1;
            margin-top: 2.5rem;
            text-align: center;
            font-size: 0.75rem;
            color: var(--footer-color);
            transition: color 0.3s;
        }
        
        .footer:hover {
            color: var(--footer-hover);
        }

        a.footer {
            color: inherit;
            text-decoration: none;
        }

        a.footer:hover {
            text-decoration: underline;
        }

        /* ============ \u79FB\u52A8\u7AEF\u54CD\u5E94\u5F0F\u5E03\u5C40 ============ */
        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }

            .top-nav {
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
            }

            .nav-btn {
                padding: 0.5rem 0.8rem;
                font-size: 0.8rem;
                border-radius: 10px;
                flex: 1;
                min-width: calc(50% - 0.25rem);
                justify-content: center;
            }

            .nav-btn svg {
                width: 16px;
                height: 16px;
            }

            .container {
                max-width: 680px;
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .summary-card {
                position: static;
            }

            .glass-card {
                padding: 1.5rem;
                border-radius: 20px;
            }

            h1, h2 {
                font-size: 1.25rem;
                margin-bottom: 1rem;
            }

            .module-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .add-btn {
                width: 100%;
                padding: 0.7rem 1rem;
            }

            .stats-grid {
                grid-template-columns: 1fr;
                gap: 0.75rem;
                margin-top: 1rem;
            }

            .mini-card {
                padding: 1rem;
                gap: 1rem;
            }

            .mini-icon {
                font-size: 1.5rem;
            }

            .mini-label {
                font-size: 0.65rem;
            }

            .mini-value {
                font-size: 1.1rem;
            }

            .account-item {
                padding: 1.25rem;
                border-radius: 16px;
                gap: 1rem;
            }

            .account-info {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }

            .delete-btn {
                width: 100%;
                text-align: center;
                padding: 0.6rem 1rem;
            }

            .usage-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .percentage {
                font-size: 1.1rem;
            }

            .modal {
                max-width: calc(100% - 2rem);
                padding: 1.5rem;
                border-radius: 20px;
            }

            .modal h3 {
                font-size: 1.1rem;
                margin-bottom: 1.25rem;
            }

            .input-group {
                margin-bottom: 0.875rem;
            }

            .input-group input {
                padding: 0.65rem 0.875rem;
                font-size: 0.9rem;
            }

            .modal-actions {
                gap: 0.75rem;
                margin-top: 1.25rem;
            }

            .modal-btn {
                padding: 0.65rem;
                font-size: 0.9rem;
            }

            .toast {
                bottom: 1rem;
                right: 1rem;
                left: 1rem;
                padding: 0.875rem 1.25rem;
                font-size: 0.875rem;
                border-radius: 10px;
            }

            .footer {
                grid-column: auto;
                margin-top: 2rem;
                font-size: 0.7rem;
            }

            .total-text {
                font-size: 0.75rem;
            }

            .quota-top {
                flex-direction: column;
                gap: 0.35rem;
            }

            .quota-summary, .quota-group-head {
                align-items: flex-start;
                flex-direction: column;
                gap: 0.35rem;
            }

            .quota-summary-meta {
                margin-left: 0;
            }

            .quota-group-meta {
                text-align: left;
            }

            .quota-meta {
                text-align: left;
            }

            .account-id {
                font-size: 0.75rem;
                word-break: break-all;
            }
        }

        /* \u8D85\u5C0F\u5C4F\u5E55\u4F18\u5316 */
        @media (max-width: 420px) {
            body {
                padding: 0.75rem;
            }

            .glass-card {
                padding: 1.25rem;
                border-radius: 18px;
            }

            h1, h2 {
                font-size: 1.1rem;
            }

            .nav-btn {
                min-width: 100%;
                font-size: 0.75rem;
            }

            .stats-grid {
                gap: 0.5rem;
            }

            .mini-card {
                padding: 0.875rem;
            }

            .account-item {
                padding: 1rem;
            }

            .modal {
                padding: 1.25rem;
            }
        }
    </style>
</head>
<body>
    <div class="top-nav">
        <button class="nav-btn" onclick="toggleTheme()" id="theme-toggle">
            <svg id="sun-icon" style="display:none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="18.36" x2="5.64" y2="19.78"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>
            <svg id="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            <span id="theme-text">\u5207\u6362\u663E\u793A\u6A21\u5F0F</span>
        </button>
        <button class="nav-btn" onclick="copyUsageAPI()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            \u590D\u5236 UsageAPI
        </button>
        <button class="nav-btn logout" onclick="logout()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            \u9000\u51FA\u7BA1\u7406\u9762\u677F
        </button>
    </div>

    <div class="container">
        <div class="glass-card summary-card">
            <h1>Cloudflare \u989D\u5EA6\u6C47\u603B</h1>
            <div id="summary-content">
                <div class="loading-wrap"><div class="loading-spinner"></div></div>
            </div>
        </div>

        <div class="glass-card accounts-card">
            <div class="module-header">
                <h2>\u2601\uFE0F Cloudflare \u8D26\u53F7\u7BA1\u7406</h2>
                <button class="add-btn" onclick="openAddModal()">\u6DFB\u52A0\u8D26\u53F7</button>
            </div>
            <div id="config-content">
                <div class="loading-wrap"><div class="loading-spinner"></div></div>
            </div>
        </div>

        <div class="footer">
            \u7531 <a href="https://github.com/cmliu/CF-Workers-UsagePanel" target="_blank" rel="noopener" class="footer">CF-Workers-UsagePanel</a> \u5F3A\u529B\u9A71\u52A8
        </div>
    </div>

    <!-- \u6DFB\u52A0\u8D26\u53F7\u6A21\u6001\u6846 -->
    <div class="modal-overlay" id="addModal">
        <div class="modal" style="max-width: 440px;">
            <h3>\u2699\uFE0F \u6DFB\u52A0 Cloudflare \u8D26\u53F7</h3>
            <div class="input-group">
                <label>\u8D26\u53F7\u5907\u6CE8\uFF08\u53EF\u9009\uFF0C\u7559\u7A7A\u81EA\u52A8\u8BC6\u522B\uFF09</label>
                <input type="text" id="newName" placeholder="\u7559\u7A7A\u81EA\u52A8\u8BC6\u522B">
            </div>
            <div class="input-group">
                <label>\u9A8C\u8BC1\u65B9\u5F0F</label>
                <select id="authMethod" onchange="switchAuthMethod()" style="width: 100%; padding: 0.75rem 1rem; background: var(--input-bg); border: 1px solid var(--stroke); border-radius: 12px; color: var(--text-main); outline: none; cursor: pointer; appearance: none; -webkit-appearance: none;">
                    <option value="token">Account ID + API Token</option>
                    <option value="global">Email + Global API Key</option>
                </select>
            </div>
            <div id="tokenFields">
                <div class="input-group">
                    <label>Account ID</label>
                    <input type="text" id="newAccountID" placeholder="Workers\u548CPages \u9762\u677F\u53F3\u4FA7\u7684 AccountID">
                </div>
                <div class="input-group">
                    <label>API Token</label>
                    <input type="password" id="newAPIToken" placeholder='\u5305\u542B"\u9605\u8BFB\u5206\u6790\u6570\u636E\u548C\u65E5\u5FD7"\u6743\u9650\u7684 API\u4EE4\u724C'>
                </div>
            </div>
            <div id="globalFields" style="display: none;">
                <div class="input-group">
                    <label>Email</label>
                    <input type="email" id="newEmail" placeholder="\u60A8\u7684 Cloudflare \u8D26\u53F7\u90AE\u7BB1">
                </div>
                <div class="input-group">
                    <label>Global API Key</label>
                    <input type="password" id="newGlobalAPIKey" placeholder="\u60A8\u7684 Global API Key">
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-btn cancel" onclick="closeAddModal()">\u53D6\u6D88</button>
                <button class="modal-btn confirm" onclick="handleAddAccount()">\u6DFB\u52A0</button>
            </div>
        </div>
    </div>

    <div class="toast" id="toast"></div>

    <script>
        const TOKEN = '${TOKEN}';

        function initTheme() {
            const savedTheme = localStorage.getItem('theme');
            const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
            if (savedTheme === 'light' || (!savedTheme && systemLight)) {
                document.documentElement.classList.add('light-mode');
            }
            updateThemeIcons();
        }

        function toggleTheme() {
            const isLight = document.documentElement.classList.toggle('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            updateThemeIcons();
        }

        function updateThemeIcons() {
            const isLight = document.documentElement.classList.contains('light-mode');
            document.getElementById('sun-icon').style.display = isLight ? 'none' : 'block';
            document.getElementById('moon-icon').style.display = isLight ? 'block' : 'none';
        }

        initTheme();
        
        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.classList.add('active');
            setTimeout(() => toast.classList.remove('active'), 3000);
        }

        function copyUsageAPI() {
            const url = \`https://\${window.location.hostname}/usage.json?token=\${TOKEN}\`;
            navigator.clipboard.writeText(url).then(() => {
                showToast('\u2705 UsageAPI \u5DF2\u590D\u5236\u5230\u7C98\u8D34\u677F');
            });
        }

        async function logout() {
            try {
                await fetch('./api/logout', { method: 'POST' });
            } catch (err) {
                console.error('\u767B\u51FA\u8BF7\u6C42\u5931\u8D25:', err);
            } finally {
                window.location.href = '/';
            }
        }

        // \u6839\u636E\u767E\u5206\u6BD4\u8BA1\u7B97\u989C\u8272\uFF08\u7EFF -> \u9EC4 -> \u7EA2\uFF09
        function getGradientColor(percent) {
            percent = Math.max(0, Math.min(100, percent));
            
            let r, g, b;
            
            if (percent <= 50) {
                // \u7EFF\u8272 (16, 185, 129) \u5230 \u9EC4\u8272 (234, 179, 8)
                const t = percent / 50;
                r = Math.round(16 + (234 - 16) * t);
                g = Math.round(185 + (179 - 185) * t);
                b = Math.round(129 - 129 * t);
            } else {
                // \u9EC4\u8272 (234, 179, 8) \u5230 \u7EA2\u8272 (239, 68, 68)
                const t = (percent - 50) / 50;
                r = Math.round(234 + (239 - 234) * t);
                g = Math.round(179 - 179 * t);
                b = Math.round(8 + (68 - 8) * t);
            }
            
            return \`rgb(\${r}, \${g}, \${b})\`;
        }

        // \u83B7\u53D6\u5BF9\u5E94\u767E\u5206\u6BD4\u7684\u8272\u9634\u5F71
        function getGradientShadow(percent) {
            const color = getGradientColor(percent);
            const rgb = color.match(/\\d+/g);
            return \`rgba(\${rgb[0]}, \${rgb[1]}, \${rgb[2]}, 0.4)\`;
        }

        // \u5E94\u7528\u989C\u8272\u5230\u8FDB\u5EA6\u6761\u5BB9\u5668
        function applyGradientColor(container, percent) {
            const color = getGradientColor(percent);
            const shadow = getGradientShadow(percent);
            container.style.setProperty('--gradient-color', color);
            container.style.setProperty('--gradient-color-shadow', \`0 0 20px \${shadow}\`);
            
            // \u8BBE\u7F6E\u8FDB\u5EA6\u6761\u80CC\u666F\u5927\u5C0F\uFF0C\u8BA9\u6E10\u53D8\u6B63\u786E\u663E\u793A
            const bar = container.querySelector('.progress-bar');
            if (bar && percent > 0) {
                const bgSize = (100 / percent) * 100;
                bar.style.setProperty('--bg-size', \`\${bgSize}%\`);
            }
        }

        function percentOf(used, limit) {
            used = Number(used) || 0;
            limit = Number(limit) || 0;
            return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
        }

        function formatNumber(value) {
            return (Number(value) || 0).toLocaleString();
        }

        function formatBytes(bytes) {
            bytes = Number(bytes) || 0;
            if (bytes >= 1024 * 1024 * 1024) return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
            if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
            if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
            return bytes.toLocaleString() + ' B';
        }

        function getResources(data) {
            return (data && data.resources) || { d1: {}, kv: {}, r2: {} };
        }

        function renderQuotaBar(label, used, limit, formatter) {
            formatter = formatter || formatNumber;
            const percent = percentOf(used, limit);
            const color = getGradientColor(percent);
            return '<div class="quota-row">' +
                '<div class="quota-top">' +
                    '<span class="quota-title">' + label + '</span>' +
                    '<span class="quota-meta">' + formatter(used) + ' / ' + formatter(limit) + ' \xB7 ' + percent.toFixed(1) + '%</span>' +
                '</div>' +
                '<div class="quota-track"><div class="quota-fill" style="width:' + percent + '%; background:' + color + '"></div></div>' +
            '</div>';
        }

        function renderQuotaGroup(title, meta, rows) {
            return '<div class="quota-item">' +
                '<div class="quota-group-head">' +
                    '<span class="quota-group-title">' + title + '</span>' +
                    '<span class="quota-group-meta">' + meta + '</span>' +
                '</div>' +
                rows.join('') +
            '</div>';
        }

        function renderResourceQuotas(resources) {
            const d1 = resources.d1 || {};
            const kv = resources.kv || {};
            const r2 = resources.r2 || {};
            return '<details class="quota-details">' +
                '<summary class="quota-summary"><span class="quota-summary-title">\u8D44\u6E90\u989D\u5EA6\u7EC6\u8282</span><span class="quota-summary-meta">KV / D1 / R2</span></summary>' +
                '<div class="quota-body"><div class="quota-list">' +
                    renderQuotaGroup('KV', formatNumber(kv.namespaces || 0) + ' \u4E2A\u547D\u540D\u7A7A\u95F4', [
                        renderQuotaBar('\u8BFB\u53D6\uFF08\u4ECA\u65E5\uFF09', kv.reads, kv.readsLimit),
                        renderQuotaBar('\u5199\u5165\uFF08\u4ECA\u65E5\uFF09', kv.writes, kv.writesLimit),
                        renderQuotaBar('\u5220\u9664/\u5217\u8868\uFF08\u4ECA\u65E5\uFF09', (kv.deletes || 0) + (kv.lists || 0), (kv.deletesLimit || 0) + (kv.listsLimit || 0)),
                        renderQuotaBar('\u5B58\u50A8', kv.storageBytes, kv.storageLimitBytes, formatBytes)
                    ]) +
                    renderQuotaGroup('D1', formatNumber(d1.databases || 0) + ' \u4E2A\u6570\u636E\u5E93', [
                        renderQuotaBar('\u8BFB\u53D6\uFF08\u4ECA\u65E5\uFF09', d1.rowsRead, d1.rowsReadLimit),
                        renderQuotaBar('\u5199\u5165\uFF08\u4ECA\u65E5\uFF09', d1.rowsWritten, d1.rowsWrittenLimit),
                        renderQuotaBar('\u5B58\u50A8', d1.storageBytes, d1.storageLimitBytes, formatBytes)
                    ]) +
                    renderQuotaGroup('R2', formatNumber(r2.buckets || 0) + ' \u4E2A\u5B58\u50A8\u6876', [
                        renderQuotaBar('Class A\uFF08\u672C\u6708\uFF09', r2.classA, r2.classALimit),
                        renderQuotaBar('Class B\uFF08\u672C\u6708\uFF09', r2.classB, r2.classBLimit),
                        renderQuotaBar('\u5B58\u50A8', r2.storageBytes, r2.storageLimitBytes, formatBytes)
                    ]) +
                '</div><div class="resource-note">D1/KV \u6309 UTC \u81EA\u7136\u65E5\u7EDF\u8BA1\uFF0CR2 \u64CD\u4F5C\u6309\u672C\u6708\u7EDF\u8BA1\uFF1B\u5B58\u50A8\u4E3A\u6700\u8FD1\u4E00\u6B21\u6307\u6807\u5FEB\u7167\u3002</div></div>' +
            '</details>';
        }

        function prefersReducedMotion() {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }

        function isDesktopAdminView() {
            return window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
        }

        function resetQuotaBody(body) {
            body.style.height = '';
            body.style.opacity = '';
            body.style.transform = '';
            body.style.overflow = '';
        }

        function animateQuotaDetails(details, opening) {
            const body = details.querySelector('.quota-body');
            if (!body || typeof body.animate !== 'function') {
                details.open = opening;
                return;
            }

            details.classList.add('quota-animating');
            body.style.overflow = 'hidden';

            if (opening) {
                details.open = true;
                body.style.height = '0px';
                body.style.opacity = '0';
                body.style.transform = 'translateY(6px)';
            } else {
                body.style.height = body.scrollHeight + 'px';
                body.style.opacity = '1';
                body.style.transform = 'translateY(0)';
            }

            const startHeight = opening ? 0 : body.scrollHeight;
            const endHeight = opening ? body.scrollHeight : 0;
            const animation = body.animate([
                { height: startHeight + 'px', opacity: opening ? 0 : 1, transform: opening ? 'translateY(6px)' : 'translateY(0)' },
                { height: endHeight + 'px', opacity: opening ? 1 : 0, transform: opening ? 'translateY(0)' : 'translateY(6px)' }
            ], {
                duration: 260,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
            });

            animation.onfinish = () => {
                animation.cancel();
                if (!opening) details.open = false;
                resetQuotaBody(body);
                details.classList.remove('quota-animating');
            };

            animation.oncancel = () => {
                resetQuotaBody(body);
                details.classList.remove('quota-animating');
            };
        }

        function bindQuotaDetailsAnimations(scope, defaultOpenOnDesktop = false) {
            if (!scope) return;
            scope.querySelectorAll('.quota-details').forEach(details => {
                if (details.dataset.quotaAnimationBound) return;
                const summary = details.querySelector('.quota-summary');
                const body = details.querySelector('.quota-body');
                if (!summary || !body) return;
                if (defaultOpenOnDesktop && isDesktopAdminView()) details.open = true;

                details.dataset.quotaAnimationBound = 'true';
                summary.addEventListener('click', (event) => {
                    if (prefersReducedMotion() || typeof body.animate !== 'function') return;
                    event.preventDefault();
                    if (details.classList.contains('quota-animating')) return;
                    animateQuotaDetails(details, !details.open);
                });
            });
        }

        async function logout() {
            try {
                await fetch('./api/logout', { method: 'POST' });
            } catch (err) {
                console.error('\u767B\u51FA\u8BF7\u6C42\u5931\u8D25:', err);
            } finally {
                window.location.href = '/';
            }
        }

        async function fetchSummary() {
            const container = document.getElementById('summary-content');
            try {
                const res = await fetch('./admin/usage.json?t=' + Date.now());
                const data = await res.json();
                
                const total = data.total || 0;
                const max = data.max || 100000;
                const percent = Math.min((total / max) * 100, 100).toFixed(1);
                const resources = getResources(data);
                
                container.innerHTML = \`
                    <div class="usage-section">
                        <div class="usage-header">
                            <span class="label">\u603B\u8BF7\u6C42\u5360\u6BD4</span>
                            <span class="percentage">\${percent}%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-bar" style="width: \${percent}%"></div>
                        </div>
                        <div class="total-text">
                            \${total.toLocaleString()} / \${max.toLocaleString()} \u603B\u8BA1\u8BF7\u6C42
                        </div>
                    </div>
                    <div class="stats-grid">
                        <div class="mini-card">
                            <div class="mini-icon">\u{1F536}</div>
                            <div class="mini-info">
                                <div class="mini-label">Workers</div>
                                <div class="mini-value">\${(data.workers || 0).toLocaleString()}</div>
                            </div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-icon">\u26A1\uFE0F</div>
                            <div class="mini-info">
                                <div class="mini-label">Pages</div>
                                <div class="mini-value">\${(data.pages || 0).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                    \${renderResourceQuotas(resources)}
                \`;
                bindQuotaDetailsAnimations(container, true);
                
                // \u5E94\u7528\u989C\u8272\u5230\u767E\u5206\u6570
                const usageSection = container.querySelector('.usage-section');
                applyGradientColor(usageSection, percent);
            } catch (err) {
                container.innerHTML = '<div style="color: var(--danger)">\u52A0\u8F7D\u6C47\u603B\u6570\u636E\u5931\u8D25</div>';
            }
        }

        async function fetchConfig() {
            const container = document.getElementById('config-content');
            try {
                const res = await fetch('./admin/config.json?t=' + Date.now());
                const data = await res.json();
                
                if (data.length === 0) {
                    container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">\u6682\u65E0\u8D26\u53F7\uFF0C\u8BF7\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0</div>';
                    return;
                }

                container.innerHTML = '<div class="account-list">' + data.map(acc => {
                    const usage = acc.Usage || {};
                    const resources = getResources(usage);
                    const total = usage.total || 0;
                    const max = usage.max || 100000;
                    const percent = Math.min((total / max) * 100, 100).toFixed(1);
                    const updateTimeValue = acc.UpdateTime || acc.LastCheckTime;
                    const updateTime = updateTimeValue ? new Date(updateTimeValue).toLocaleString() : '\u4ECE\u672A\u66F4\u65B0';
                    const percentColor = getGradientColor(percent);
                    const bgSize = percent > 0 ? (100 / percent) * 100 : 100;
                    
                    return \`
                        <div class="account-item">
                            <div class="account-info">
                                <div>
                                    <div class="account-name">\u{1F511} \${acc.Name}</div>
                                    <div class="account-id">\${acc.AccountID ? \`\u{1F512} AccountID: \${acc.AccountID}\` : \`\u{1F4E7} Email: \${acc.Email}\`}</div>
                                    <div class="account-id" style="margin-top: 4px; opacity: 0.8;">\u{1F552} \u66F4\u65B0\u65F6\u95F4: \${updateTime}</div>
                                </div>
                                <button class="delete-btn" onclick="deleteAccount(\${acc.ID})">\u5220\u9664\u8D26\u53F7</button>
                            </div>
                            <div class="usage-section" style="margin-bottom: 0">
                                <div class="usage-header">
                                    <span class="label">\u8BF7\u6C42\u4F7F\u7528\u60C5\u51B5: \${total.toLocaleString()} / \${max.toLocaleString()} <b style="color: \${percentColor}; margin-left: 4px;">\${percent}%</b></span>
                                    <span class="label" style="font-size: 0.8rem; font-variant-numeric: tabular-nums;">
                                        W: \${(usage.workers || 0).toLocaleString()} | P: \${(usage.pages || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div class="progress-track" style="height: 8px">
                                    <div class="progress-bar" style="width: \${percent}%; --bg-size: \${bgSize}%"></div>
                                </div>
                            </div>
                            \${renderResourceQuotas(resources)}
                        </div>
                    \`;
                }).join('') + '</div>';
                bindQuotaDetailsAnimations(container);
            } catch (err) {
                container.innerHTML = '<div style="color: var(--danger)">\u52A0\u8F7D\u8BE6\u60C5\u6570\u636E\u5931\u8D25</div>';
            }
        }

        function openAddModal() { 
            document.getElementById('addModal').classList.add('active'); 
            document.getElementById('authMethod').value = 'token';
            switchAuthMethod();
        }

        function switchAuthMethod() {
            const method = document.getElementById('authMethod').value;
            document.getElementById('tokenFields').style.display = method === 'token' ? 'block' : 'none';
            document.getElementById('globalFields').style.display = method === 'global' ? 'block' : 'none';
        }

        function closeAddModal() { 
            document.getElementById('addModal').classList.remove('active');
            document.getElementById('newName').value = '';
            document.getElementById('newAccountID').value = '';
            document.getElementById('newAPIToken').value = '';
            document.getElementById('newEmail').value = '';
            document.getElementById('newGlobalAPIKey').value = '';
        }

        async function handleAddAccount() {
            const name = document.getElementById('newName').value;
            const method = document.getElementById('authMethod').value;
            
            let accountID = null, apiToken = null, email = null, globalAPIKey = null;

            if (method === 'token') {
                accountID = document.getElementById('newAccountID').value;
                apiToken = document.getElementById('newAPIToken').value;
                if (!accountID || !apiToken) {
                    showToast('\u26A0\uFE0F \u8BF7\u586B\u5199 Account ID \u548C API Token\uFF08\u5907\u6CE8\u53EF\u7559\u7A7A\u81EA\u52A8\u8BC6\u522B\uFF09');
                    return;
                }
            } else {
                email = document.getElementById('newEmail').value;
                globalAPIKey = document.getElementById('newGlobalAPIKey').value;
                if (!email || !globalAPIKey) {
                    showToast('\u26A0\uFE0F \u8BF7\u586B\u5199\u5B8C\u6574\u4FE1\u606F');
                    return;
                }
            }

            try {
                const res = await fetch('./api/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        Name: name, 
                        AccountID: accountID, 
                        APIToken: apiToken,
                        Email: email,
                        GlobalAPIKey: globalAPIKey
                    })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('\u2705 \u6DFB\u52A0\u6210\u529F\uFF0C\u6B63\u5728\u66F4\u65B0\u6570\u636E...');
                    closeAddModal();
                    setTimeout(() => {
                        fetchSummary();
                        fetchConfig();
                    }, 1000);
                } else {
                    showToast('\u274C ' + (data.msg || '\u6DFB\u52A0\u5931\u8D25'));
                }
            } catch (err) {
                showToast('\u274C \u7F51\u7EDC\u9519\u8BEF');
            }
        }

        async function deleteAccount(id) {
            if (!confirm('\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u8D26\u53F7\u5417\uFF1F')) return;
            
            try {
                const res = await fetch('./api/del', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ID: id })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('\u2705 \u5220\u9664\u6210\u529F\uFF0C\u6B63\u5728\u66F4\u65B0\u6570\u636E...');
                    setTimeout(() => {
                        fetchSummary();
                        fetchConfig();
                    }, 1000);
                } else {
                    showToast('\u274C ' + (data.msg || '\u5220\u9664\u5931\u8D25'));
                }
            } catch (err) {
                showToast('\u274C \u7F51\u7EDC\u9519\u8BEF');
            }
        }

        // \u521D\u59CB\u52A0\u8F7D
        fetchSummary().then(() => fetchConfig());
    <\/script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=UTF-8" } });
}
async function UsagePanel\u4E3B\u9875(TOKEN) {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudflare \u989D\u5EA6\u4F7F\u7528\u7EDF\u8BA1</title>
    <link rel="icon" href="https://cf-assets.www.cloudflare.com/dzlvafdwdttg/5uhbWfhjepEoUiM9phzhgJ/9658369030266cde9e35a3c5d4e4beb2/cloud-upload.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1;
            --primary-glow: rgba(99, 102, 241, 0.4);
            --accent: #a855f7;
            --background: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --stroke: rgba(255, 255, 255, 0.08);
            --heading-grad: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
            --footer-color: rgba(255, 255, 255, 0.2);
            --footer-hover: rgba(255, 255, 255, 0.4);
            --item-bg: rgba(255, 255, 255, 0.03);
            --track-bg: rgba(0, 0, 0, 0.2);
        }

        :root.light-mode {
            --primary: #4f46e5;
            --primary-glow: rgba(79, 70, 229, 0.2);
            --accent: #9333ea;
            --background: #f1f5f9;
            --card-bg: rgba(255, 255, 255, 0.8);
            --text-main: #0f172a;
            --text-muted: #64748b;
            --stroke: rgba(0, 0, 0, 0.1);
            --heading-grad: linear-gradient(135deg, #1e293b 0%, #475569 100%);
            --footer-color: rgba(15, 23, 42, 0.4);
            --footer-hover: var(--primary);
            --item-bg: rgba(0, 0, 0, 0.03);
            --track-bg: rgba(0, 0, 0, 0.08);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html {
            scrollbar-gutter: stable both-edges;
        }

        @supports not (scrollbar-gutter: stable) {
            html { overflow-y: scroll; }
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--background);
            background-image: 
                radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.15) 0px, transparent 50%);
            background-attachment: fixed;
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1.5rem;
        }

        .container {
            width: 100%;
            max-width: 500px;
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-card {
            background: var(--card-bg);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--stroke);
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 
                0 25px 50px -12px rgba(0, 0, 0, 0.5),
                0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }

        header {
            text-align: center;
            margin-bottom: 2.5rem;
        }

        h1 {
            font-size: 1.5rem;
            font-weight: 700;
            background: var(--heading-grad);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 0.5rem;
            letter-spacing: -0.01em;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 99px;
            font-size: 0.75rem;
            color: #818cf8;
            font-weight: 500;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            background: #818cf8;
            border-radius: 50%;
            box-shadow: 0 0 8px var(--primary);
            animation: statusPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes statusPulse {
            0%, 100% {
                box-shadow: 0 0 8px var(--primary), 0 0 0 0 rgba(129, 140, 248, 0.7);
                transform: scale(1);
            }
            50% {
                box-shadow: 0 0 12px var(--primary), 0 0 0 6px rgba(129, 140, 248, 0);
                transform: scale(1.2);
            }
        }

        .usage-section {
            margin-bottom: 2rem;
            position: relative;
        }

        .usage-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 1rem;
        }

        .label {
            font-size: 0.9rem;
            color: var(--text-muted);
            font-weight: 500;
        }

        .percentage {
            font-family: 'Outfit', monospace;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--gradient-color, var(--text-main));
            text-shadow: 0 0 20px var(--gradient-color-shadow, var(--primary-glow));
            transition: color 0.6s ease, text-shadow 0.6s ease;
        }

        .progress-track {
            background: var(--track-bg);
            border: 1px solid var(--stroke);
            border-radius: 999px;
            height: 14px;
            overflow: hidden;
            position: relative;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #eab308 50%, #ef4444 100%);
            background-size: var(--bg-size, 100%);
            background-position: left;
            border-radius: 999px;
            width: 0%;
            transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            overflow: hidden;
        }
        
        .progress-bar::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            transform: translateX(-100%);
            animation: shimmer 2.5s infinite;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 1.5rem;
        }

        .mini-card { 
            background: var(--item-bg); 
            border: 1px solid var(--stroke); 
            border-radius: 16px; 
            padding: 1rem 1.25rem; 
            display: flex; 
            align-items: center; 
            gap: 1.25rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            position: relative;
            overflow: hidden;
        }
        .mini-card:hover { 
            background: rgba(99, 102, 241, 0.08); 
            transform: translateY(-4px); 
            border-color: var(--primary); 
            box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2);
        }
        .mini-icon { 
            font-size: 1.75rem; 
            margin-bottom: 0; 
            line-height: 1;
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.1));
        }
        .mini-info { display: flex; flex-direction: column; justify-content: center; }
        .mini-label { 
            font-size: 0.7rem; 
            text-transform: uppercase; 
            letter-spacing: 0.05em;
            color: var(--text-muted); 
            margin-bottom: 0; 
            font-weight: 500;
        }
        .mini-value { 
            font-size: 1.25rem; 
            font-weight: 700; 
            color: var(--text-main); 
            line-height: 1.2;
        }

        .total-text {
            text-align: right;
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-top: 0.5rem;
            font-variant-numeric: tabular-nums;
        }

        .quota-details { margin-top: 1.25rem; overflow: hidden; }
        .quota-details[open] { display: flex; flex-direction: column; }
        .quota-details.quota-animating .quota-summary { pointer-events: none; }
        .quota-summary { list-style: none; background: linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(14, 165, 233, 0.1)); border: 1px solid rgba(99, 102, 241, 0.5); border-radius: 14px; padding: 0.8rem 0.85rem; cursor: pointer; display: flex; justify-content: space-between; gap: 0.75rem; align-items: center; color: var(--text-main); font-size: 0.85rem; font-weight: 700; box-shadow: 0 12px 28px -18px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.08); transition: all 0.3s ease; }
        .quota-summary::-webkit-details-marker { display: none; }
        .quota-summary:hover, .quota-summary:focus-visible { border-color: var(--primary); background: linear-gradient(135deg, rgba(99, 102, 241, 0.24), rgba(14, 165, 233, 0.14)); box-shadow: 0 16px 32px -18px var(--primary-glow), 0 0 0 3px rgba(99, 102, 241, 0.12); outline: none; }
        .quota-summary-title { min-width: 0; }
        .quota-summary::after { content: '\u5C55\u5F00\u7EC6\u8282'; color: #fff; background: var(--primary); border-radius: 999px; padding: 0.38rem 0.7rem; font-size: 0.75rem; font-weight: 700; white-space: nowrap; box-shadow: 0 10px 20px -12px var(--primary-glow); }
        .quota-details[open] .quota-summary::after { content: '\u6536\u8D77\u7EC6\u8282'; }
        .quota-details[open] .quota-summary { order: 2; margin-top: 0.875rem; }
        .quota-summary-meta { color: var(--text-muted); font-size: 0.75rem; font-weight: 600; margin-left: auto; white-space: nowrap; }
        .quota-body { overflow: hidden; }
        .quota-details[open] .quota-body { order: 1; }
        .quota-details.quota-animating .quota-body { will-change: height, opacity, transform; }
        .quota-list { display: grid; gap: 0.875rem; margin-top: 0.875rem; }
        .quota-details[open] .quota-list { margin-top: 0; }
        .quota-item { background: var(--item-bg); border: 1px solid var(--stroke); border-radius: 14px; padding: 0.875rem 1rem; }
        .quota-group-head { display: flex; justify-content: space-between; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; }
        .quota-group-title { color: var(--text-main); font-size: 0.9rem; font-weight: 700; }
        .quota-group-meta { color: var(--text-muted); font-size: 0.75rem; font-variant-numeric: tabular-nums; text-align: right; }
        .quota-row { margin-top: 0.75rem; }
        .quota-group-head + .quota-row { margin-top: 0; }
        .quota-top { display: flex; justify-content: space-between; gap: 0.75rem; color: var(--text-muted); font-size: 0.78rem; margin-bottom: 0.55rem; }
        .quota-title { color: var(--text-main); font-weight: 600; }
        .quota-meta { text-align: right; font-variant-numeric: tabular-nums; }
        .quota-track { height: 7px; background: var(--track-bg); border: 1px solid var(--stroke); border-radius: 999px; overflow: hidden; }
        .quota-fill { height: 100%; border-radius: inherit; min-width: 0; transition: width 1s ease; }
        .resource-note { margin-top: 0.875rem; color: var(--text-muted); font-size: 0.75rem; line-height: 1.5; }

        .footer {
            margin-top: 2.5rem;
            text-align: center;
            font-size: 0.75rem;
            color: var(--footer-color);
            transition: color 0.3s;
        }
        
        .footer:hover {
            color: var(--footer-hover);
        }

        /* \u7BA1\u7406\u5458\u767B\u5F55\u6C14\u6CE1 */
        .admin-bubble {
            position: fixed;
            top: 1.5rem;
            right: 1.5rem;
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
            transition: all 0.3s ease;
            z-index: 1001;
        }

        .admin-bubble:hover {
            transform: scale(1.1);
            box-shadow: 0 12px 32px rgba(99, 102, 241, 0.5);
        }

        .admin-bubble svg {
            width: 24px;
            height: 24px;
            fill: white;
        }

        /* \u767B\u5F55\u6A21\u6001\u6846 */
        .login-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        }

        .login-modal-overlay.active {
            display: flex;
        }

        .login-modal {
            background: var(--card-bg);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--stroke);
            border-radius: 20px;
            padding: 2rem;
            max-width: 360px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .login-modal h2 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            text-align: center;
            background: var(--heading-grad);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .login-input {
            width: 100%;
            padding: 0.875rem 1rem;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: var(--text-main);
            font-size: 1rem;
            font-family: 'Outfit', sans-serif;
            outline: none;
            transition: all 0.3s ease;
            margin-bottom: 1rem;
        }

        .login-input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .login-input::placeholder {
            color: var(--text-muted);
        }

        :root.light-mode .login-input {
            background: rgba(79, 70, 229, 0.08);
            border-color: rgba(79, 70, 229, 0.2);
        }

        :root.light-mode .login-input:focus {
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }

        .login-btn {
            width: 100%;
            padding: 0.875rem;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 1rem;
            font-weight: 600;
            font-family: 'Outfit', sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        :root.light-mode .login-btn:hover {
            box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
        }

        .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .login-error {
            background: rgba(239, 68, 68, 0.15);
            color: #fca5a5;
            padding: 0.75rem 1rem;
            border-radius: 10px;
            font-size: 0.85rem;
            margin-bottom: 1rem;
            border: 1px solid rgba(239, 68, 68, 0.2);
            text-align: center;
            display: none;
        }

        .login-error.show {
            display: block;
            animation: shake 0.4s ease;
        }

        :root.light-mode .login-error {
            background: rgba(239, 68, 68, 0.08);
            color: #dc2626;
            border-color: rgba(239, 68, 68, 0.3);
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
        }

        .close-modal {
            position: absolute;
            top: 1rem;
            right: 1rem;
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 50%;
            color: var(--text-muted);
            font-size: 1.25rem;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s ease;
        }

        .close-modal:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }

        .login-modal-wrapper {
            position: relative;
        }

        .toast-notification {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.95), rgba(99, 102, 241, 0.95));
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(168, 85, 247, 0.5);
            border-radius: 12px;
            padding: 1.25rem 1.5rem;
            color: #fff;
            font-size: 0.95rem;
            font-weight: 500;
            box-shadow: 0 15px 35px rgba(168, 85, 247, 0.3), 0 0 1px rgba(255,255,255,0.1) inset;
            animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 1000;
            max-width: 300px;
            word-break: break-word;
        }

        @keyframes toastSlideIn {
            from { opacity: 0; transform: translateX(30px) translateY(30px); }
            to { opacity: 1; transform: translateX(0) translateY(0); }
        }

        .loading-container {
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1rem;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            border-top-color: var(--primary);
            animation: spin 1s ease-in-out infinite;
        }

        .error-msg {
            background: rgba(239, 68, 68, 0.15);
            color: #fca5a5;
            padding: 1rem;
            border-radius: 12px;
            font-size: 0.9rem;
            border: 1px solid rgba(239, 68, 68, 0.2);
            text-align: center;
        }

        /* \u4E3B\u9898\u5207\u6362\u6C14\u6CE1 */
        .theme-bubble {
            position: fixed;
            top: 1.5rem;
            left: 1.5rem;
            width: 48px;
            height: 48px;
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid var(--stroke);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            z-index: 1001;
            color: var(--text-main);
        }

        .theme-bubble:hover {
            transform: scale(1.1);
            border-color: var(--primary);
        }

        .theme-bubble svg { width: 22px; height: 22px; stroke: currentColor; }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }

        /* ============ \u79FB\u52A8\u7AEF\u54CD\u5E94\u5F0F\u4F18\u5316 ============ */
        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }

            .container {
                max-width: 100%;
            }

            .glass-card {
                padding: 1.5rem;
                border-radius: 20px;
            }

            header {
                margin-bottom: 2rem;
            }

            h1 {
                font-size: 1.25rem;
                margin-bottom: 0.75rem;
            }

            .status-badge {
                padding: 5px 10px;
                font-size: 0.7rem;
                gap: 4px;
            }

            .status-dot {
                width: 5px;
                height: 5px;
            }

            .usage-section {
                margin-bottom: 1.5rem;
            }

            .usage-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
                margin-bottom: 0.75rem;
            }

            .label {
                font-size: 0.85rem;
            }

            .percentage {
                font-size: 1.1rem;
            }

            .progress-track {
                height: 12px;
            }

            .stats-grid {
                grid-template-columns: 1fr;
                gap: 0.75rem;
                margin-top: 1.25rem;
            }

            .mini-card {
                padding: 0.875rem 1rem;
                gap: 1rem;
            }

            .mini-icon {
                font-size: 1.5rem;
            }

            .mini-label {
                font-size: 0.65rem;
            }

            .mini-value {
                font-size: 1.1rem;
            }

            .total-text {
                font-size: 0.75rem;
                margin-top: 0.375rem;
            }

            .quota-top {
                flex-direction: column;
                gap: 0.35rem;
            }

            .quota-summary, .quota-group-head {
                align-items: flex-start;
                flex-direction: column;
                gap: 0.35rem;
            }

            .quota-summary-meta {
                margin-left: 0;
            }

            .quota-group-meta {
                text-align: left;
            }

            .quota-meta {
                text-align: left;
            }

            .footer {
                margin-top: 2rem;
                font-size: 0.7rem;
            }

            .theme-bubble {
                top: 1rem;
                left: 1rem;
                width: 44px;
                height: 44px;
            }

            .theme-bubble svg {
                width: 20px;
                height: 20px;
            }

            .admin-bubble {
                top: 1rem;
                right: 1rem;
                width: 44px;
                height: 44px;
            }

            .admin-bubble svg {
                width: 22px;
                height: 22px;
            }

            .login-modal {
                max-width: calc(100% - 2rem);
                padding: 1.5rem;
                border-radius: 18px;
            }

            .login-modal h2 {
                font-size: 1.1rem;
                margin-bottom: 1.25rem;
            }

            .login-input {
                padding: 0.75rem 0.875rem;
                font-size: 0.95rem;
                margin-bottom: 0.875rem;
                border-radius: 10px;
            }

            .login-btn {
                padding: 0.75rem 1rem;
                font-size: 0.95rem;
                border-radius: 10px;
            }

            .close-modal {
                width: 28px;
                height: 28px;
                font-size: 1.1rem;
                top: 0.75rem;
                right: 0.75rem;
            }

            .login-error {
                padding: 0.65rem 0.875rem;
                font-size: 0.8rem;
                border-radius: 8px;
                margin-bottom: 0.875rem;
            }

            .toast-notification {
                bottom: 1.5rem;
                right: 1rem;
                left: 1rem;
                padding: 1rem 1.25rem;
                font-size: 0.875rem;
                border-radius: 10px;
            }

            .loading-container {
                min-height: 150px;
                gap: 0.75rem;
            }

            .spinner {
                width: 36px;
                height: 36px;
                border-width: 2px;
            }

            .error-msg {
                padding: 0.875rem;
                font-size: 0.85rem;
                border-radius: 10px;
            }
        }

        /* \u8D85\u5C0F\u5C4F\u5E55\u4F18\u5316 (max-width: 480px) */
        @media (max-width: 480px) {
            body {
                padding: 0.75rem;
                min-height: 100vh;
            }

            .container {
                max-width: 100%;
            }

            .glass-card {
                padding: 1.25rem;
                border-radius: 16px;
                box-shadow: 
                    0 15px 30px -8px rgba(0, 0, 0, 0.5),
                    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
            }

            header {
                margin-bottom: 1.5rem;
            }

            h1 {
                font-size: 1.15rem;
                margin-bottom: 0.5rem;
            }

            .status-badge {
                padding: 4px 8px;
                font-size: 0.65rem;
                gap: 3px;
            }

            .usage-section {
                margin-bottom: 1.25rem;
            }

            .usage-header {
                gap: 0.25rem;
                margin-bottom: 0.625rem;
            }

            .label {
                font-size: 0.8rem;
            }

            .percentage {
                font-size: 1rem;
            }

            .progress-track {
                height: 10px;
                border-radius: 999px;
            }

            .stats-grid {
                gap: 0.5rem;
                margin-top: 1rem;
            }

            .mini-card {
                padding: 0.75rem 0.875rem;
                gap: 0.875rem;
            }

            .mini-card:hover {
                transform: translateY(-2px);
            }

            .mini-icon {
                font-size: 1.4rem;
            }

            .mini-label {
                font-size: 0.6rem;
                letter-spacing: 0.03em;
            }

            .mini-value {
                font-size: 1rem;
            }

            .total-text {
                font-size: 0.7rem;
            }

            .footer {
                margin-top: 1.5rem;
                font-size: 0.65rem;
            }

            .theme-bubble, .admin-bubble {
                width: 40px;
                height: 40px;
                top: 0.75rem;
            }

            .theme-bubble {
                left: 0.75rem;
            }

            .admin-bubble {
                right: 0.75rem;
            }

            .theme-bubble svg, .admin-bubble svg {
                width: 18px;
                height: 18px;
            }

            .login-modal-overlay {
                padding: 1rem;
            }

            .login-modal {
                max-width: 100%;
                width: 100%;
                padding: 1.25rem;
                border-radius: 16px;
            }

            .login-modal h2 {
                font-size: 1rem;
                margin-bottom: 1rem;
            }

            .login-input {
                padding: 0.65rem 0.75rem;
                font-size: 0.9rem;
                margin-bottom: 0.75rem;
                border-radius: 8px;
            }

            .login-input::placeholder {
                font-size: 0.9rem;
            }

            .login-btn {
                padding: 0.65rem 0.875rem;
                font-size: 0.9rem;
            }

            .close-modal {
                width: 26px;
                height: 26px;
                font-size: 1rem;
                top: 0.5rem;
                right: 0.5rem;
            }

            .login-error {
                padding: 0.6rem 0.75rem;
                font-size: 0.75rem;
                margin-bottom: 0.75rem;
            }

            .toast-notification {
                bottom: 1rem;
                right: 0.75rem;
                left: 0.75rem;
                padding: 0.875rem 1rem;
                font-size: 0.8rem;
                max-width: 100%;
            }

            .loading-container {
                min-height: 120px;
                gap: 0.5rem;
            }

            .spinner {
                width: 32px;
                height: 32px;
                border-width: 2px;
            }

            .error-msg {
                padding: 0.75rem;
                font-size: 0.8rem;
            }
        }

        /* \u7AD6\u5C4F\u8D85\u5927\u624B\u673A\u4F18\u5316 (min-height: 800px) */
        @media (min-height: 800px) and (max-width: 768px) {
            body {
                justify-content: flex-start;
                padding-top: 3rem;
                padding-bottom: 2rem;
            }

            .container {
                margin: 0 auto;
            }
        }
    </style>
</head>
<body>
    <!-- \u4E3B\u9898\u5207\u6362\u6C14\u6CE1 -->
    <div class="theme-bubble" onclick="toggleTheme()" title="\u5207\u6362\u663E\u793A\u6A21\u5F0F">
        <svg id="sun-icon" style="display:none" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="18.36" x2="5.64" y2="19.78"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>
        <svg id="moon-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
    </div>

    <!-- \u7BA1\u7406\u5458\u767B\u5F55\u6C14\u6CE1 -->
    <div class="admin-bubble" onclick="openLoginModal()" title="\u7BA1\u7406\u5458\u767B\u5F55">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
    </div>

    <!-- \u767B\u5F55\u6A21\u6001\u6846 -->
    <div class="login-modal-overlay" id="loginModal">
        <div class="login-modal-wrapper">
            <div class="login-modal">
                <button class="close-modal" onclick="closeLoginModal()">&times;</button>
                <h2>\u{1F510} \u7BA1\u7406\u5458\u767B\u5F55</h2>
                <div class="login-error" id="loginError"></div>
                <input type="text" class="login-input" id="adminUsername" placeholder="\u8BF7\u8F93\u5165\u7BA1\u7406\u5458\u8D26\u53F7" onkeydown="if(event.key==='Enter')document.getElementById('adminPassword').focus()">
                <input type="password" class="login-input" id="adminPassword" placeholder="\u8BF7\u8F93\u5165\u7BA1\u7406\u5458\u5BC6\u7801" onkeydown="if(event.key==='Enter')handleLogin()">
                <button class="login-btn" id="loginBtn" onclick="handleLogin()">\u767B \u5F55</button>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="glass-card">
            <header>
                <h1>\u2601\uFE0F Cloudflare \u989D\u5EA6\u7EDF\u8BA1</h1>
                <div class="status-badge">
                    <div class="status-dot"></div>
                    <span>System Online</span>
                </div>
            </header>

            <div id="content">
                <div class="loading-container">
                    <div class="spinner"></div>
                    <div style="color: var(--text-muted); font-size: 0.9rem;">\u6B63\u5728\u83B7\u53D6\u6570\u636E...</div>
                </div>
            </div>

            <div class="footer">
                \u7531 <a href="https://github.com/cmliu/CF-Workers-UsagePanel" target="_blank" rel="noopener" class="footer">CF-Workers-UsagePanel</a> \u5F3A\u529B\u9A71\u52A8
            </div>
        </div>
    </div>

    <script>
        function initTheme() {
            const savedTheme = localStorage.getItem('theme');
            const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
            if (savedTheme === 'light' || (!savedTheme && systemLight)) {
                document.documentElement.classList.add('light-mode');
            }
            updateThemeIcons();
        }

        function toggleTheme() {
            const isLight = document.documentElement.classList.toggle('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            updateThemeIcons();
        }

        function updateThemeIcons() {
            const isLight = document.documentElement.classList.contains('light-mode');
            document.getElementById('sun-icon').style.display = isLight ? 'none' : 'block';
            document.getElementById('moon-icon').style.display = isLight ? 'block' : 'none';
        }

        initTheme();

        // \u6839\u636E\u767E\u5206\u6BD4\u8BA1\u7B97\u989C\u8272\uFF08\u7EFF -> \u9EC4 -> \u7EA2\uFF09
        function getGradientColor(percent) {
            percent = Math.max(0, Math.min(100, percent));
            
            let r, g, b;
            
            if (percent <= 50) {
                // \u7EFF\u8272 (16, 185, 129) \u5230 \u9EC4\u8272 (234, 179, 8)
                const t = percent / 50;
                r = Math.round(16 + (234 - 16) * t);
                g = Math.round(185 + (179 - 185) * t);
                b = Math.round(129 - 129 * t);
            } else {
                // \u9EC4\u8272 (234, 179, 8) \u5230 \u7EA2\u8272 (239, 68, 68)
                const t = (percent - 50) / 50;
                r = Math.round(234 + (239 - 234) * t);
                g = Math.round(179 - 179 * t);
                b = Math.round(8 + (68 - 8) * t);
            }
            
            return \`rgb(\${r}, \${g}, \${b})\`;
        }

        // \u83B7\u53D6\u5BF9\u5E94\u767E\u5206\u6BD4\u7684\u8272\u9634\u5F71
        function getGradientShadow(percent) {
            const color = getGradientColor(percent);
            const rgb = color.match(/\\d+/g);
            return \`rgba(\${rgb[0]}, \${rgb[1]}, \${rgb[2]}, 0.4)\`;
        }

        // \u5E94\u7528\u989C\u8272\u5230\u8FDB\u5EA6\u6761\u5BB9\u5668
        function applyGradientColor(container, percent) {
            const color = getGradientColor(percent);
            const shadow = getGradientShadow(percent);
            container.style.setProperty('--gradient-color', color);
            container.style.setProperty('--gradient-color-shadow', \`0 0 20px \${shadow}\`);
            
            // \u8BBE\u7F6E\u8FDB\u5EA6\u6761\u80CC\u666F\u5927\u5C0F\uFF0C\u8BA9\u6E10\u53D8\u6B63\u786E\u663E\u793A
            const bar = container.querySelector('.progress-bar');
            if (bar && percent > 0) {
                const bgSize = (100 / percent) * 100;
                bar.style.setProperty('--bg-size', \`\${bgSize}%\`);
            }
        }

        function percentOf(used, limit) {
            used = Number(used) || 0;
            limit = Number(limit) || 0;
            return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
        }

        function formatNumber(value) {
            return (Number(value) || 0).toLocaleString();
        }

        function formatBytes(bytes) {
            bytes = Number(bytes) || 0;
            if (bytes >= 1024 * 1024 * 1024) return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
            if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
            if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
            return bytes.toLocaleString() + ' B';
        }

        function getResources(data) {
            return (data && data.resources) || { d1: {}, kv: {}, r2: {} };
        }

        function renderQuotaBar(label, used, limit, formatter) {
            formatter = formatter || formatNumber;
            const percent = percentOf(used, limit);
            const color = getGradientColor(percent);
            return '<div class="quota-row">' +
                '<div class="quota-top">' +
                    '<span class="quota-title">' + label + '</span>' +
                    '<span class="quota-meta">' + formatter(used) + ' / ' + formatter(limit) + ' \xB7 ' + percent.toFixed(1) + '%</span>' +
                '</div>' +
                '<div class="quota-track"><div class="quota-fill" style="width:' + percent + '%; background:' + color + '"></div></div>' +
            '</div>';
        }

        function renderQuotaGroup(title, meta, rows) {
            return '<div class="quota-item">' +
                '<div class="quota-group-head">' +
                    '<span class="quota-group-title">' + title + '</span>' +
                    '<span class="quota-group-meta">' + meta + '</span>' +
                '</div>' +
                rows.join('') +
            '</div>';
        }

        function renderResourceQuotas(resources) {
            const d1 = resources.d1 || {};
            const kv = resources.kv || {};
            const r2 = resources.r2 || {};
            return '<details class="quota-details">' +
                '<summary class="quota-summary"><span class="quota-summary-title">\u8D44\u6E90\u989D\u5EA6\u7EC6\u8282</span><span class="quota-summary-meta">KV / D1 / R2</span></summary>' +
                '<div class="quota-body"><div class="quota-list">' +
                    renderQuotaGroup('KV', formatNumber(kv.namespaces || 0) + ' \u4E2A\u547D\u540D\u7A7A\u95F4', [
                        renderQuotaBar('\u8BFB\u53D6\uFF08\u4ECA\u65E5\uFF09', kv.reads, kv.readsLimit),
                        renderQuotaBar('\u5199\u5165\uFF08\u4ECA\u65E5\uFF09', kv.writes, kv.writesLimit),
                        renderQuotaBar('\u5220\u9664/\u5217\u8868\uFF08\u4ECA\u65E5\uFF09', (kv.deletes || 0) + (kv.lists || 0), (kv.deletesLimit || 0) + (kv.listsLimit || 0)),
                        renderQuotaBar('\u5B58\u50A8', kv.storageBytes, kv.storageLimitBytes, formatBytes)
                    ]) +
                    renderQuotaGroup('D1', formatNumber(d1.databases || 0) + ' \u4E2A\u6570\u636E\u5E93', [
                        renderQuotaBar('\u8BFB\u53D6\uFF08\u4ECA\u65E5\uFF09', d1.rowsRead, d1.rowsReadLimit),
                        renderQuotaBar('\u5199\u5165\uFF08\u4ECA\u65E5\uFF09', d1.rowsWritten, d1.rowsWrittenLimit),
                        renderQuotaBar('\u5B58\u50A8', d1.storageBytes, d1.storageLimitBytes, formatBytes)
                    ]) +
                    renderQuotaGroup('R2', formatNumber(r2.buckets || 0) + ' \u4E2A\u5B58\u50A8\u6876', [
                        renderQuotaBar('Class A\uFF08\u672C\u6708\uFF09', r2.classA, r2.classALimit),
                        renderQuotaBar('Class B\uFF08\u672C\u6708\uFF09', r2.classB, r2.classBLimit),
                        renderQuotaBar('\u5B58\u50A8', r2.storageBytes, r2.storageLimitBytes, formatBytes)
                    ]) +
                '</div><div class="resource-note">D1/KV \u6309 UTC \u81EA\u7136\u65E5\u7EDF\u8BA1\uFF0CR2 \u64CD\u4F5C\u6309\u672C\u6708\u7EDF\u8BA1\uFF1B\u5B58\u50A8\u4E3A\u6700\u8FD1\u4E00\u6B21\u6307\u6807\u5FEB\u7167\u3002</div></div>' +
            '</details>';
        }

        function prefersReducedMotion() {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }

        function resetQuotaBody(body) {
            body.style.height = '';
            body.style.opacity = '';
            body.style.transform = '';
            body.style.overflow = '';
        }

        function animateQuotaDetails(details, opening) {
            const body = details.querySelector('.quota-body');
            if (!body || typeof body.animate !== 'function') {
                details.open = opening;
                return;
            }

            details.classList.add('quota-animating');
            body.style.overflow = 'hidden';

            if (opening) {
                details.open = true;
                body.style.height = '0px';
                body.style.opacity = '0';
                body.style.transform = 'translateY(6px)';
            } else {
                body.style.height = body.scrollHeight + 'px';
                body.style.opacity = '1';
                body.style.transform = 'translateY(0)';
            }

            const startHeight = opening ? 0 : body.scrollHeight;
            const endHeight = opening ? body.scrollHeight : 0;
            const animation = body.animate([
                { height: startHeight + 'px', opacity: opening ? 0 : 1, transform: opening ? 'translateY(6px)' : 'translateY(0)' },
                { height: endHeight + 'px', opacity: opening ? 1 : 0, transform: opening ? 'translateY(0)' : 'translateY(6px)' }
            ], {
                duration: 260,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
            });

            animation.onfinish = () => {
                animation.cancel();
                if (!opening) details.open = false;
                resetQuotaBody(body);
                details.classList.remove('quota-animating');
            };

            animation.oncancel = () => {
                resetQuotaBody(body);
                details.classList.remove('quota-animating');
            };
        }

        function bindQuotaDetailsAnimations(scope) {
            if (!scope) return;
            scope.querySelectorAll('.quota-details').forEach(details => {
                if (details.dataset.quotaAnimationBound) return;
                const summary = details.querySelector('.quota-summary');
                const body = details.querySelector('.quota-body');
                if (!summary || !body) return;

                details.dataset.quotaAnimationBound = 'true';
                summary.addEventListener('click', (event) => {
                    if (prefersReducedMotion() || typeof body.animate !== 'function') return;
                    event.preventDefault();
                    if (details.classList.contains('quota-animating')) return;
                    animateQuotaDetails(details, !details.open);
                });
            });
        }

        async function fetchUsage() {
            const content = document.getElementById('content');
            try {
                const start = Date.now();
                const response = await fetch('./usage.json?token=${TOKEN}&t=' + start);
                const data = await response.json();
                
                // Artificially wait a bit for smooth UX if too fast
                const elapsed = Date.now() - start;
                if (elapsed < 600) await new Promise(r => setTimeout(r, 600 - elapsed));
                
                if (!data.success && typeof data.total === 'undefined') {
                    throw new Error('No Data Available');
                }

                const total = data.total || 0;
                const max = data.max || 100000;
                const percent = Math.min((total / max) * 100, 100).toFixed(1);
                const resources = getResources(data);
                
                content.innerHTML = \`
                    <div class="usage-section">
                        <div class="usage-header">
                            <span class="label">\u603B\u914D\u989D</span>
                            <span class="percentage">\${percent}%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-bar" style="width: 0%"></div>
                        </div>
                        <div class="total-text">
                            \${total.toLocaleString()} / \${max.toLocaleString()} \u8BF7\u6C42\u6B21\u6570
                        </div>
                    </div>

                    <div class="stats-grid">
                        <div class="mini-card">
                            <div class="mini-icon">\u{1F536}</div>
                            <div class="mini-info">
                                <div class="mini-label">Workers</div>
                                <div class="mini-value">\${(data.workers || 0).toLocaleString()}</div>
                            </div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-icon">\u26A1\uFE0F</div>
                            <div class="mini-info">
                                <div class="mini-label">Pages</div>
                                <div class="mini-value">\${(data.pages || 0).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                    \${renderResourceQuotas(resources)}
                \`;
                bindQuotaDetailsAnimations(content);

                // Animate progress bar and apply colors
                requestAnimationFrame(() => {
                    const usageSection = content.querySelector('.usage-section');
                    const bar = content.querySelector('.progress-bar');
                    if(usageSection) applyGradientColor(usageSection, percent);
                    if(bar) bar.style.width = percent + '%';
                });

            } catch (error) {
                console.error(error);
                content.innerHTML = \`
                    <div class="error-msg">
                        <div style="margin-bottom: 0.25rem; font-weight: 600;">\u6570\u636E\u83B7\u53D6\u5931\u8D25</div>
                        <div style="font-size: 0.8rem; opacity: 0.8;">\${error.message || '\u672A\u77E5\u9519\u8BEF'}</div>
                    </div>
                \`;
            }
        }
        
        fetchUsage();

        // \u7BA1\u7406\u5458\u767B\u5F55\u76F8\u5173\u51FD\u6570
        function openLoginModal() {
            document.getElementById('loginModal').classList.add('active');
            document.getElementById('adminUsername').focus();
        }

        function closeLoginModal() {
            document.getElementById('loginModal').classList.remove('active');
            document.getElementById('adminUsername').value = '';
            document.getElementById('adminPassword').value = '';
            document.getElementById('loginError').classList.remove('show');
        }

        // \u70B9\u51FB\u6A21\u6001\u6846\u5916\u90E8\u5173\u95ED
        document.getElementById('loginModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeLoginModal();
            }
        });

        // ESC\u952E\u5173\u95ED\u6A21\u6001\u6846
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeLoginModal();
            }
        });

        async function handleLogin() {
            const username = document.getElementById('adminUsername').value || 'admin';
            const password = document.getElementById('adminPassword').value;
            const loginBtn = document.getElementById('loginBtn');
            const errorDiv = document.getElementById('loginError');

            if (!password) {
                errorDiv.textContent = '\u8BF7\u8F93\u5165\u5BC6\u7801';
                errorDiv.classList.add('show');
                document.getElementById('adminPassword').focus();
                return;
            }

            loginBtn.disabled = true;
            loginBtn.textContent = '\u767B\u5F55\u4E2D...';
            errorDiv.classList.remove('show');

            try {
                const response = await fetch('./api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (data.success) {
                    // \u767B\u5F55\u6210\u529F\uFF0C\u8DF3\u8F6C\u5230\u7BA1\u7406\u9762\u677F
                    window.location.href = './admin';
                } else {
                    errorDiv.textContent = data.msg || '\u767B\u5F55\u5931\u8D25';
                    errorDiv.classList.add('show');
                    document.getElementById('adminUsername').select();
                }
            } catch (err) {
                errorDiv.textContent = '\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u91CD\u8BD5';
                errorDiv.classList.add('show');
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = '\u767B \u5F55';
            }
        }

        // 1\u79D2\u540E\u663E\u793A\u6D88\u606F\u6C14\u6CE1
        setTimeout(() => {
            fetch('./usage.json?token=${TOKEN}&t=' + Date.now())
                .then(r => r.json())
                .then(data => {
                    const msgElement = document.createElement('div');
                    msgElement.className = 'toast-notification';
                    msgElement.textContent = data.msg || '\u52A0\u8F7D\u6210\u529F';
                    document.body.appendChild(msgElement);
                    
                    // 3\u79D2\u540E\u81EA\u52A8\u6D88\u5931
                    setTimeout(() => {
                        msgElement.style.opacity = '0';
                        msgElement.style.transition = 'opacity 0.4s ease';
                        setTimeout(() => msgElement.remove(), 400);
                    }, 3000);
                })
                .catch(err => {
                    console.error('\u65E0\u6CD5\u83B7\u53D6\u6D88\u606F:', err);
                });
        }, 1000);
    <\/script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=UTF-8" } });
}

// src/deploy_assets.js
var DEPLOY_HTML = '<!doctype html>\n<!-- \u4E91\u7AEF\u90E8\u7F72\u5668 \u2014\u2014 \u7531 \u6570\u7801\u89E3\u7801 \u72EC\u7ACB\u5F00\u53D1\u5E76\u7EF4\u62A4 \xB7 \u8BF7\u52FF\u79FB\u9664\u4F5C\u8005\u4E0E\u7248\u6743\u58F0\u660E -->\n<html lang="zh-CN">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>\u661F\u4E91\u89E3\u7801 \xB7 \u4E00\u952E\u90E8\u7F72\u5230 Cloudflare</title>\n    <link rel="stylesheet" href="/deploy/styles.css" />\n  </head>\n  <body>\n    <main class="shell">\n      <section class="hero">\n        <div>\n          <p class="eyebrow">\u661F\u4E91\u89E3\u7801 Nebula-Decode</p>\n          <h1>\u661F\u4E91\u89E3\u7801 \u4E00\u952E\u90E8\u7F72</h1>\n          <p class="summary">\u586B\u90AE\u7BB1\u548C Global API Key\uFF0C\u4E00\u952E\u628A\u661F\u4E91\u89E3\u7801\u90E8\u7F72\u5230 Cloudflare\uFF1A\u81EA\u52A8\u5B8C\u6210 Pages\u3001\u968F\u673A UUID\u3001\u968F\u673A KV \u548C\u968F\u673A\u9879\u76EE\u540D\uFF1B\u57DF\u540D\u7ED1\u5B9A\u53EF\u9009\uFF0C\u5B50\u57DF\u540D\u81EA\u52A8\u968F\u673A\u3002</p>\n        </div>\n        <div class="status-card">\n          <span class="status-dot"></span>\n          <strong>Key \u4E0D\u4F1A\u6301\u4E45\u5316</strong>\n          <p>\u524D\u7AEF\u4E0D\u5199\u5165\u672C\u5730\u5B58\u50A8\uFF0C\u5F53\u524D\u90E8\u7F72\u5668 API \u4EC5\u7528\u4E8E\u8F6C\u53D1 Cloudflare \u8BF7\u6C42\u3002</p>\n        </div>\n      </section>\n\n      <section id="loginPage" class="panel login-panel">\n        <div class="panel-head">\n          <div>\n            <h2>1. \u767B\u5F55 Cloudflare</h2>\n            <p>\u53EA\u9700\u8981\u90AE\u7BB1\u548C Global API Key\u3002\u767B\u5F55\u540E\u518D\u8FDB\u5165\u90E8\u7F72\u9875\u3002</p>\n          </div>\n        </div>\n        <div class="grid two">\n          <label>\n            <span>\u90AE\u7BB1</span>\n            <input id="email" autocomplete="username" placeholder="you@example.com" />\n          </label>\n          <label>\n            <span>Global API Key</span>\n            <input id="key" type="password" autocomplete="current-password" placeholder="Cloudflare Global API Key" />\n          </label>\n        </div>\n        <div class="quick-action">\n          <button id="loginButton" class="primary">\u767B\u5F55\u5E76\u7EE7\u7EED</button>\n          <div id="loginStatus" class="result">\u672A\u767B\u5F55</div>\n        </div>\n      </section>\n\n      <section id="deployPage" class="page-hidden">\n        <section class="panel quick-panel">\n          <div class="panel-head">\n            <div>\n              <h2>2. \u4E00\u952E\u90E8\u7F72</h2>\n              <p>\u9ED8\u8BA4\u4F7F\u7528 Pages + \u52A0\u5BC6/\u6DF7\u6DC6\u6E90\u3002\u57DF\u540D\u7ED1\u5B9A\u662F\u53EF\u9009\u9879\uFF0C\u5F00\u542F\u540E\u81EA\u52A8\u751F\u6210\u968F\u673A\u5B50\u57DF\u540D\u3002</p>\n            </div>\n            <button id="backToLogin" class="secondary">\u8FD4\u56DE\u767B\u5F55</button>\n          </div>\n          <div class="grid two">\n            <label class="span-two">\n              <span>\u9879\u76EE\u540D\u79F0\uFF08\u53EF\u9009\uFF0C\u7559\u7A7A\u81EA\u52A8\u968F\u673A\uFF09</span>\n              <input id="quickProjectName" placeholder="\u4F8B\u5982 my-panel\uFF0C\u7559\u7A7A\u5219\u968F\u673A\u751F\u6210" />\n            </label>\n            <label>\n              <span>\u53EF\u9009\u57DF\u540D</span>\n              <select id="quickZone"></select>\n            </label>\n            <label>\n              <span>\u968F\u673A\u5B50\u57DF\u540D\u9884\u89C8</span>\n              <input id="quickHostnamePreview" value="\u4E0D\u7ED1\u5B9A\u57DF\u540D" disabled />\n            </label>\n            <label class="span-two">\n              <span>\u90E8\u7F72\u5305\uFF08\u53EF\u9009\uFF0C.zip\uFF0C\u7559\u7A7A\u5219\u90E8\u7F72\u8FDC\u7A0B\u9ED8\u8BA4\u6E90\uFF09</span>\n              <input id="packageFile" type="file" accept=".zip,application/zip" />\n            </label>\n            <p id="packageHint" class="form-note span-two">\u9009\u62E9\u4E00\u4E2A .zip \u538B\u7F29\u5305\u5373\u53EF\u4E00\u952E\u90E8\u7F72\u5B83\uFF1B\u4E0D\u9009\u5219\u90E8\u7F72\u8FDC\u7A0B\u9ED8\u8BA4\u6E90\u3002\u538B\u7F29\u5305\u5185\u542B _worker.js \u65F6\u4F1A\u4F5C\u4E3A Pages \u9AD8\u7EA7\u6A21\u5F0F\u811A\u672C\u4E00\u8D77\u63D0\u4EA4\u3002</p>\n            <label class="toggle span-two">\n              <input id="bindDomain" type="checkbox" />\n              <span>\u7ED1\u5B9A\u968F\u673A\u5B50\u57DF\u540D</span>\n            </label>\n          </div>\n          <div class="quick-action">\n            <button id="quickDeploy" class="primary">\u4E00\u952E\u90E8\u7F72</button>\n            <div id="result" class="result">\u7B49\u5F85\u90E8\u7F72</div>\n          </div>\n          <div id="resultActions" class="result-actions page-hidden"></div>\n        </section>\n        <details class="panel advanced-panel">\n          <summary>\u9AD8\u7EA7\u8BBE\u7F6E\u548C\u66F4\u65B0\u73B0\u6709\u9879\u76EE</summary>\n          <div class="panel-head">\n            <div>\n              <h2>\u9AD8\u7EA7\u8BBE\u7F6E</h2>\n              <p>\u9700\u8981\u6307\u5B9A Worker\u3001\u660E\u6587\u6E90\u3001\u73B0\u6709\u9879\u76EE\u6216\u73B0\u6709 KV \u65F6\u518D\u5C55\u5F00\u8FD9\u91CC\u3002</p>\n            </div>\n            <div class="button-group">\n              <button id="loadAccounts" class="secondary">\u5237\u65B0\u8D26\u6237/\u57DF\u540D</button>\n              <button id="loadResources" class="secondary">\u8BFB\u53D6\u73B0\u6709\u9879\u76EE</button>\n              <button id="newNames" class="secondary">\u968F\u673A\u540D\u79F0</button>\n              <button id="newUuid" class="secondary">\u751F\u6210 UUID</button>\n            </div>\n          </div>\n          <div class="grid three">\n            <label>\n              <span>Account</span>\n              <select id="accountId"></select>\n            </label>\n            <label>\n              <span>Zone</span>\n              <select id="zoneId"></select>\n            </label>\n            <label>\n              <span>\u81EA\u5B9A\u4E49\u57DF\u540D</span>\n              <input id="advancedHostname" placeholder="\u7559\u7A7A\u4E0D\u7ED1\u5B9A\uFF0C\u586B\u6839\u57DF\u5219\u968F\u673A\u5B50\u57DF\u540D" />\n            </label>\n            <label>\n              <span>\u64CD\u4F5C</span>\n              <select id="deployMode">\n                <option value="create">\u968F\u673A\u65B0\u5EFA</option>\n                <option value="update">\u66F4\u65B0\u73B0\u6709</option>\n              </select>\n            </label>\n            <label class="span-two">\n              <span>\u73B0\u6709\u9879\u76EE</span>\n              <select id="existingProject"></select>\n            </label>\n            <label>\n              <span>\u90E8\u7F72\u65B9\u5F0F</span>\n              <select id="deployType">\n                <option value="pages">Pages</option>\n                <option value="worker">Worker</option>\n              </select>\n            </label>\n            <label>\n              <span>\u90E8\u7F72\u6E90</span>\n              <select id="sourceMode">\n                <option value="encoded">\u52A0\u5BC6 / \u6DF7\u6DC6</option>\n                <option value="plain">\u660E\u6587</option>\n              </select>\n            </label>\n            <label>\n              <span>\u9879\u76EE\u540D\u79F0</span>\n              <input id="projectName" />\n            </label>\n            <label class="span-two">\n              <span>UUID</span>\n              <input id="uuid" />\n            </label>\n            <label>\n              <span>KV \u540D\u79F0</span>\n              <input id="kvTitle" />\n            </label>\n            <label>\n              <span>\u73B0\u6709 KV</span>\n              <select id="kvId"></select>\n            </label>\n            <p id="modeHint" class="form-note span-two">\u65B0\u5EFA\u6A21\u5F0F\u4F1A\u914D\u7F6E\u968F\u673A UUID\u3001KV \u548C\u57DF\u540D\uFF1B\u66F4\u65B0\u6A21\u5F0F\u53EA\u540C\u6B65\u4EE3\u7801\u3002</p>\n            <label class="toggle">\n              <input id="enableWorkersDev" type="checkbox" />\n              <span>Worker \u6A21\u5F0F\u542F\u7528 workers.dev</span>\n            </label>\n          </div>\n          <section class="action-row">\n            <button id="deploy" class="primary">\u9AD8\u7EA7\u90E8\u7F72</button>\n          </section>\n        </details>\n      </section>\n\n      <section id="historyPanel" class="panel history-panel page-hidden">\n        <div class="panel-head compact">\n          <div>\n            <h2>\u90E8\u7F72\u5386\u53F2</h2>\n            <p>\u4EC5\u4FDD\u5B58\u5728\u672C\u673A\u6D4F\u89C8\u5668\uFF08localStorage\uFF09\uFF0C\u4E0D\u5305\u542B\u4EFB\u4F55\u5BC6\u94A5\u3002</p>\n          </div>\n          <button id="clearHistory" class="secondary small">\u6E05\u7A7A\u5386\u53F2</button>\n        </div>\n        <div id="historyList" class="history-list"></div>\n      </section>\n\n      <section class="panel logs-panel">\n        <div class="panel-head compact">\n          <h2>\u65E5\u5FD7</h2>\n          <button id="clearLogs" class="secondary small">\u6E05\u7A7A</button>\n        </div>\n        <pre id="logs"></pre>\n      </section>\n    </main>\n    <script src="/deploy/app.js"><\/script>\n  </body>\n</html>\n';
var DEPLOY_JS = "// \u4E91\u7AEF\u90E8\u7F72\u5668 \xB7 \u524D\u7AEF\u903B\u8F91 \u2014\u2014 \u7531 \u6570\u7801\u89E3\u7801 \u72EC\u7ACB\u5F00\u53D1\u5E76\u7EF4\u62A4 \xB7 \u8BF7\u52FF\u79FB\u9664\u4F5C\u8005\u4E0E\u7248\u6743\u58F0\u660E\nconst $ = id => document.getElementById(id);\n\nconst state = {\n  loggedIn: false,\n  accounts: [],\n  zones: [],\n  workers: [],\n  pages: [],\n  kvs: [],\n  packageFiles: null,\n  history: []\n};\n\nconst HISTORY_KEY = 'cf-deploy-history';\n\nloadHistory();\nsetRandomNames();\n$('uuid').value = crypto.randomUUID();\nfillSelect($('accountId'), [], '\u81EA\u52A8\u9009\u62E9\u7B2C\u4E00\u4E2A\u8D26\u6237');\nfillSelect($('zoneId'), [], '\u81EA\u52A8\u968F\u673A\u5B50\u57DF\u540D');\nfillSelect($('quickZone'), [], '\u65E0\u53EF\u7528\u57DF\u540D');\nfillProjectSelect();\nfillKvSelect();\nrenderHistory();\n\n$('loginButton').addEventListener('click', login);\n$('backToLogin').addEventListener('click', () => {\n  state.loggedIn = false;\n  showPage('login');\n  setLoginStatus('\u5DF2\u8FD4\u56DE\u767B\u5F55\u9875');\n});\n$('quickDeploy').addEventListener('click', () => runDeploy(collectQuickPayload));\n$('deploy').addEventListener('click', () => runDeploy(collectAdvancedPayload));\n\n$('newNames').addEventListener('click', setRandomNames);\n\n$('newUuid').addEventListener('click', () => {\n  $('uuid').value = crypto.randomUUID();\n});\n\n$('bindDomain').addEventListener('change', updateQuickDomainPreview);\n$('quickZone').addEventListener('change', updateQuickDomainPreview);\n\n$('packageFile').addEventListener('change', onPackageChange);\n\n$('clearLogs').addEventListener('click', () => {\n  $('logs').textContent = '';\n});\n\n$('clearHistory').addEventListener('click', () => {\n  if (!confirm('\u786E\u5B9A\u6E05\u7A7A\u672C\u673A\u90E8\u7F72\u5386\u53F2\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002')) return;\n  state.history = [];\n  saveHistory();\n  renderHistory();\n  log('\u90E8\u7F72\u5386\u53F2\u5DF2\u6E05\u7A7A');\n});\n\n$('accountId').addEventListener('change', async () => {\n  if ($('accountId').value) await loadResources();\n});\n\n$('zoneId').addEventListener('change', () => {\n  if (!$('advancedHostname').value.trim()) return;\n  const zone = state.zones.find(item => item.id === $('zoneId').value);\n  if (zone && $('advancedHostname').value.trim().split('.').length <= 2) $('advancedHostname').value = zone.name;\n});\n\n$('deployMode').addEventListener('change', syncModeState);\n\n$('existingProject').addEventListener('change', () => {\n  const selected = parseProjectValue($('existingProject').value);\n  if (!selected) return;\n  $('deployMode').value = 'update';\n  $('deployType').value = selected.type;\n  $('projectName').value = selected.name;\n  syncModeState();\n  setResult(`\u5DF2\u9009\u62E9 ${selected.type === 'pages' ? 'Pages' : 'Worker'} \u9879\u76EE\uFF0C\u66F4\u65B0\u6A21\u5F0F\u53EA\u540C\u6B65\u4EE3\u7801`, 'success');\n});\n\n$('kvId').addEventListener('change', () => {\n  const selected = state.kvs.find(item => item.id === $('kvId').value);\n  if (selected) $('kvTitle').value = selected.title || '';\n});\n\n$('loadAccounts').addEventListener('click', async () => {\n  setResult('\u5237\u65B0 Cloudflare \u8D26\u6237\u548C\u57DF\u540D\u4E2D...');\n  setBusy(true);\n  try {\n    await loadCloudflareBase();\n    setResult('\u8D26\u6237\u548C\u57DF\u540D\u8BFB\u53D6\u5B8C\u6210', 'success');\n    if ($('accountId').value) await loadResources();\n  } catch (error) {\n    setResult(error.message, 'error');\n    log(`\u9519\u8BEF: ${error.message}`);\n  } finally {\n    setBusy(false);\n  }\n});\n\n$('loadResources').addEventListener('click', async () => {\n  setBusy(true);\n  try {\n    await loadResources();\n  } catch (error) {\n    setResult(error.message, 'error');\n    log(`\u9519\u8BEF: ${error.message}`);\n  } finally {\n    setBusy(false);\n  }\n});\n\nasync function login() {\n  setLoginStatus('\u767B\u5F55\u4E2D...');\n  setBusy(true);\n  try {\n    await loadCloudflareBase();\n    state.loggedIn = true;\n    showPage('deploy');\n    setLoginStatus('\u767B\u5F55\u6210\u529F', 'success');\n    setResult('\u5DF2\u767B\u5F55\uFF0C\u53EF\u4EE5\u4E00\u952E\u90E8\u7F72', 'success');\n  } catch (error) {\n    setLoginStatus(error.message, 'error');\n    log(`\u767B\u5F55\u5931\u8D25: ${error.message}`);\n  } finally {\n    setBusy(false);\n  }\n}\n\nasync function loadCloudflareBase() {\n  const credentials = getCredentials();\n  const [accountsRes, zonesRes] = await Promise.all([\n    post('/api/deploy/accounts', { credentials }),\n    post('/api/deploy/zones', { credentials })\n  ]);\n  state.accounts = accountsRes.accounts || [];\n  state.zones = zonesRes.zones || [];\n  fillSelect($('accountId'), state.accounts, '\u81EA\u52A8\u9009\u62E9\u7B2C\u4E00\u4E2A\u8D26\u6237');\n  fillSelect($('zoneId'), state.zones, '\u81EA\u52A8\u968F\u673A\u5B50\u57DF\u540D');\n  fillSelect($('quickZone'), state.zones, state.zones.length ? '\u4E0D\u7ED1\u5B9A\u57DF\u540D' : '\u65E0\u53EF\u7528\u57DF\u540D');\n  updateQuickDomainPreview();\n  log(`\u8D26\u6237\u6570\u91CF: ${state.accounts.length}`);\n  log(`\u53EF\u7528 Zone: ${state.zones.length}`);\n}\n\nasync function runDeploy(collector) {\n  if (!state.loggedIn) {\n    setResult('\u8BF7\u5148\u767B\u5F55', 'error');\n    showPage('login');\n    return;\n  }\n  setResult('\u90E8\u7F72\u4E2D...');\n  hideResultActions();\n  setBusy(true);\n  try {\n    const payload = collector();\n    const result = await post('/api/deploy/deploy', payload);\n    (result.logs || []).forEach(log);\n    const info = buildDeployInfo(payload, result);\n    setResult(info.text, 'success');\n    if (payload.deployMode !== 'update') {\n      recordHistory(info);\n      renderResultActions(info);\n    }\n  } catch (error) {\n    setResult(error.message, 'error');\n    log(`\u9519\u8BEF: ${error.message}`);\n  } finally {\n    setBusy(false);\n  }\n}\n\nfunction buildDeployInfo(payload, result) {\n  if (payload.deployMode === 'update') {\n    return { text: `${result.projectName} \u4EE3\u7801\u540C\u6B65\u5B8C\u6210`, projectName: result.projectName, uuid: null, url: null, mode: 'update' };\n  }\n  const subdomain = `${result.projectName}.pages.dev`;\n  const url = result.domain?.hostname\n    ? `https://${result.domain.hostname}/${result.uuid}`\n    : `https://${subdomain}/${result.uuid}`;\n  return {\n    text: `${result.projectName} \u90E8\u7F72\u5B8C\u6210`,\n    projectName: result.projectName,\n    uuid: result.uuid,\n    url,\n    rootUrl: `https://${subdomain}`,\n    domain: result.domain?.hostname || '',\n    mode: 'create'\n  };\n}\n\nfunction formatDeployResult(payload, result) {\n  return buildDeployInfo(payload, result).text;\n}\n\nfunction renderResultActions(info) {\n  const box = $('resultActions');\n  box.innerHTML = '';\n  const link = document.createElement('a');\n  link.href = info.url;\n  link.target = '_blank';\n  link.rel = 'noopener';\n  link.className = 'result-link';\n  link.textContent = info.url;\n  const wrap = document.createElement('div');\n  wrap.className = 'result-link-wrap';\n  wrap.append(link);\n  box.append(wrap);\n  box.append(actionButton('\u590D\u5236\u94FE\u63A5', () => copyText(info.url)));\n  box.append(actionButton('\u590D\u5236 UUID', () => copyText(info.uuid)));\n  box.append(actionButton('\u6253\u5F00\u9762\u677F', () => window.open(info.url, '_blank', 'noopener')));\n  box.classList.remove('page-hidden');\n}\n\nfunction actionButton(label, onClick) {\n  const button = document.createElement('button');\n  button.type = 'button';\n  button.className = 'secondary small';\n  button.textContent = label;\n  button.addEventListener('click', onClick);\n  return button;\n}\n\nfunction hideResultActions() {\n  const box = $('resultActions');\n  box.innerHTML = '';\n  box.classList.add('page-hidden');\n}\n\nasync function copyText(text) {\n  if (!text) return;\n  try {\n    await navigator.clipboard.writeText(text);\n    log(`\u5DF2\u590D\u5236: ${text}`);\n  } catch {\n    const area = document.createElement('textarea');\n    area.value = text;\n    document.body.append(area);\n    area.select();\n    document.execCommand('copy');\n    area.remove();\n    log(`\u5DF2\u590D\u5236: ${text}`);\n  }\n}\n\nasync function loadResources() {\n  const credentials = getCredentials();\n  const accountId = $('accountId').value;\n  if (!accountId) throw new Error('\u8BF7\u5148\u8BFB\u53D6\u5E76\u9009\u62E9 Account');\n  setResult('\u8BFB\u53D6\u73B0\u6709\u9879\u76EE\u548C KV \u4E2D...');\n  const resources = await post('/api/deploy/resources', { credentials, accountId });\n  state.workers = resources.workers || [];\n  state.pages = resources.pages || [];\n  state.kvs = resources.kvs || [];\n  fillProjectSelect();\n  fillKvSelect();\n  log(`\u73B0\u6709 Worker: ${state.workers.length}`);\n  log(`\u73B0\u6709 Pages: ${state.pages.length}`);\n  log(`\u73B0\u6709 KV: ${state.kvs.length}`);\n  (resources.warnings || []).forEach(warning => log(`\u63D0\u793A: ${warning}`));\n  setResult('\u73B0\u6709\u9879\u76EE\u8BFB\u53D6\u5B8C\u6210', 'success');\n}\n\nfunction getCredentials() {\n  const email = $('email').value.trim();\n  const key = $('key').value.trim();\n  if (!email || !key) throw new Error('\u8BF7\u586B\u5199 Cloudflare \u90AE\u7BB1\u548C Global API Key');\n  return { email, key };\n}\n\nfunction collectQuickPayload() {\n  const selectedZone = state.zones.find(item => item.id === $('quickZone').value) || state.zones[0];\n  const shouldBindDomain = $('bindDomain').checked && !!selectedZone;\n  const hostname = shouldBindDomain ? randomSubdomain(selectedZone.name) : '';\n  const payload = {\n    credentials: getCredentials(),\n    accountId: $('accountId').value,\n    deployMode: 'create',\n    deployType: 'pages',\n    sourceMode: 'encoded',\n    projectName: resolveProjectName(),\n    uuid: crypto.randomUUID(),\n    kvTitle: randomName('store'),\n    hostname,\n    zoneId: shouldBindDomain ? selectedZone.id : '',\n    autoDomain: false\n  };\n  if (state.packageFiles && state.packageFiles.length) {\n    payload.files = state.packageFiles;\n  }\n  return payload;\n}\n\nfunction resolveProjectName() {\n  const custom = sanitizeProjectName($('quickProjectName').value);\n  if (custom) return custom;\n  const file = $('packageFile').files && $('packageFile').files[0];\n  if (file) {\n    const base = sanitizeProjectName(file.name.replace(/\\.zip$/i, ''));\n    if (base) return `${base.slice(0, 44)}-${randomName('edge').split('-')[1]}`;\n  }\n  return randomName('edge');\n}\n\nfunction sanitizeProjectName(name) {\n  return String(name || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 52);\n}\n\nfunction collectAdvancedPayload() {\n  const credentials = getCredentials();\n  const deployMode = $('deployMode').value;\n  const selectedProject = parseProjectValue($('existingProject').value);\n  if (deployMode === 'update') {\n    const projectName = $('projectName').value.trim() || selectedProject?.name || '';\n    if (!projectName) throw new Error('\u66F4\u65B0\u73B0\u6709\u9879\u76EE\u65F6\u5FC5\u987B\u9009\u62E9\u6216\u586B\u5199\u9879\u76EE\u540D\u79F0');\n    return {\n      credentials,\n      accountId: $('accountId').value,\n      deployMode,\n      deployType: $('deployType').value,\n      sourceMode: $('sourceMode').value,\n      projectName\n    };\n  }\n  const hostname = $('advancedHostname').value.trim();\n  const zoneId = $('zoneId').value;\n  if (hostname && !zoneId && state.zones.length) {\n    const matched = matchZone(hostname);\n    if (matched) $('zoneId').value = matched.id;\n  }\n  if (hostname && !$('zoneId').value && !hostname.includes('.')) throw new Error('\u81EA\u5B9A\u4E49\u57DF\u540D\u9700\u8981\u5B8C\u6574\u57DF\u540D\u6216\u5148\u9009\u62E9 Zone');\n  return {\n    credentials,\n    accountId: $('accountId').value,\n    deployMode,\n    deployType: $('deployType').value,\n    sourceMode: $('sourceMode').value,\n    projectName: $('projectName').value.trim() || randomName('edge'),\n    uuid: $('uuid').value.trim() || crypto.randomUUID(),\n    kvTitle: $('kvTitle').value.trim() || randomName('store'),\n    kvId: $('kvId').value,\n    hostname,\n    zoneId: $('zoneId').value,\n    autoDomain: false,\n    enableWorkersDev: $('enableWorkersDev').checked\n  };\n}\n\nfunction fillSelect(select, items, emptyLabel) {\n  select.innerHTML = '';\n  const empty = document.createElement('option');\n  empty.value = '';\n  empty.textContent = emptyLabel;\n  select.append(empty);\n  for (const item of items) {\n    const option = document.createElement('option');\n    option.value = item.id;\n    option.textContent = `${item.name} (${item.id})`;\n    select.append(option);\n  }\n  if (items.length === 1) select.value = items[0].id;\n}\n\nfunction fillProjectSelect() {\n  const select = $('existingProject');\n  select.innerHTML = '';\n  const empty = document.createElement('option');\n  empty.value = '';\n  empty.textContent = state.workers.length || state.pages.length ? '\u8BF7\u9009\u62E9\u8981\u66F4\u65B0\u7684\u9879\u76EE' : '\u6682\u65E0\u9879\u76EE\uFF0C\u5148\u8BFB\u53D6';\n  select.append(empty);\n  for (const worker of state.workers) appendOption(select, `worker:${worker.name}`, `Worker: ${worker.title || worker.name}`);\n  for (const page of state.pages) {\n    const kvText = page.kvId ? ` / \u5DF2\u6709 KV: ${shortId(page.kvId)}` : '';\n    appendOption(select, `pages:${page.name}`, `Pages: ${page.title || page.name}${kvText}`);\n  }\n}\n\nfunction fillKvSelect() {\n  const select = $('kvId');\n  select.innerHTML = '';\n  appendOption(select, '', $('deployMode').value === 'update' ? '\u66F4\u65B0\u6A21\u5F0F\u4E0D\u4FEE\u6539 KV' : '\u65B0\u5EFA\u968F\u673A KV');\n  for (const kv of state.kvs) appendOption(select, kv.id, `${kv.title || kv.id} (${kv.id})`);\n}\n\nfunction appendOption(select, value, text) {\n  const option = document.createElement('option');\n  option.value = value;\n  option.textContent = text;\n  select.append(option);\n}\n\nfunction parseProjectValue(value) {\n  if (!value || !value.includes(':')) return null;\n  const index = value.indexOf(':');\n  return {\n    type: value.slice(0, index),\n    name: value.slice(index + 1)\n  };\n}\n\nasync function post(url, body) {\n  const response = await fetch(url, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(body)\n  });\n  const data = await response.json();\n  if (!response.ok || !data.ok) throw new Error(data.error || `\u8BF7\u6C42\u5931\u8D25: ${response.status}`);\n  return data;\n}\n\nfunction setRandomNames() {\n  $('projectName').value = randomName('edge');\n  $('kvTitle').value = randomName('store');\n  $('kvId').value = '';\n  $('existingProject').value = '';\n  $('deployMode').value = 'create';\n  updateQuickDomainPreview();\n  syncModeState();\n}\n\nfunction updateQuickDomainPreview() {\n  const selectedZone = state.zones.find(item => item.id === $('quickZone').value) || state.zones[0];\n  if (!$('bindDomain').checked) {\n    $('quickHostnamePreview').value = '\u4E0D\u7ED1\u5B9A\u57DF\u540D';\n    return;\n  }\n  if (!selectedZone) {\n    $('quickHostnamePreview').value = '\u8D26\u53F7\u5185\u6CA1\u6709\u53EF\u7528\u57DF\u540D';\n    return;\n  }\n  $('quickHostnamePreview').value = randomSubdomain(selectedZone.name);\n}\n\nfunction randomSubdomain(zoneName) {\n  return `${randomName('edge')}.${zoneName}`;\n}\n\nfunction randomName(prefix) {\n  const bytes = new Uint8Array(4);\n  crypto.getRandomValues(bytes);\n  const suffix = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');\n  return `${prefix}-${suffix}`;\n}\n\nfunction shortId(id) {\n  return id && id.length > 12 ? `${id.slice(0, 6)}...${id.slice(-6)}` : id;\n}\n\nfunction matchZone(hostname) {\n  return state.zones\n    .filter(zone => hostname === zone.name || hostname.endsWith(`.${zone.name}`))\n    .sort((a, b) => b.name.length - a.name.length)[0];\n}\n\nasync function onPackageChange(event) {\n  const file = event.target.files && event.target.files[0];\n  if (!file) {\n    state.packageFiles = null;\n    $('packageHint').textContent = '\u9009\u62E9\u4E00\u4E2A .zip \u538B\u7F29\u5305\u5373\u53EF\u4E00\u952E\u90E8\u7F72\u5B83\uFF1B\u4E0D\u9009\u5219\u90E8\u7F72\u8FDC\u7A0B\u9ED8\u8BA4\u6E90\u3002\u538B\u7F29\u5305\u5185\u542B _worker.js \u65F6\u4F1A\u4F5C\u4E3A Pages \u9AD8\u7EA7\u6A21\u5F0F\u811A\u672C\u4E00\u8D77\u63D0\u4EA4\u3002';\n    $('packageHint').className = 'form-note span-two';\n    return;\n  }\n  if (!/\\.zip$/i.test(file.name)) {\n    state.packageFiles = null;\n    event.target.value = '';\n    $('packageHint').textContent = '\u53EA\u652F\u6301 .zip \u538B\u7F29\u5305\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u3002';\n    $('packageHint').className = 'form-note span-two error-note';\n    return;\n  }\n  try {\n    $('packageHint').textContent = `\u6B63\u5728\u89E3\u6790 ${file.name} ...`;\n    $('packageHint').className = 'form-note span-two';\n    const files = await unzipToFiles(file);\n    if (!files.length) throw new Error('\u538B\u7F29\u5305\u5185\u6CA1\u6709\u53EF\u90E8\u7F72\u7684\u6587\u4EF6');\n    state.packageFiles = files;\n    const \u6709Worker = files.some(item => item.path.endsWith('_worker.js'));\n    $('packageHint').textContent = `\u5DF2\u8BFB\u53D6 ${file.name}\uFF1A\u5171 ${files.length} \u4E2A\u6587\u4EF6${\u6709Worker ? '\uFF08\u542B _worker.js\uFF0C\u5C06\u4F5C\u4E3A Pages \u9AD8\u7EA7\u6A21\u5F0F\u811A\u672C\u63D0\u4EA4\uFF09' : ''}`;\n    $('packageHint').className = 'form-note span-two';\n    log(`\u5DF2\u89E3\u6790\u538B\u7F29\u5305: ${file.name}\uFF0C\u6587\u4EF6\u6570 ${files.length}`);\n    for (const item of files.slice(0, 20)) log(`  \xB7 ${item.path} (${item.size} \u5B57\u8282)`);\n    if (files.length > 20) log(`  \xB7 ... \u5176\u4F59 ${files.length - 20} \u4E2A\u6587\u4EF6\u7701\u7565`);\n  } catch (error) {\n    state.packageFiles = null;\n    event.target.value = '';\n    $('packageHint').textContent = `\u89E3\u6790\u5931\u8D25: ${error.message}`;\n    $('packageHint').className = 'form-note span-two error-note';\n    log(`\u538B\u7F29\u5305\u89E3\u6790\u5931\u8D25: ${error.message}`);\n  }\n}\n\nfunction loadHistory() {\n  try {\n    const raw = localStorage.getItem(HISTORY_KEY);\n    const parsed = raw ? JSON.parse(raw) : [];\n    state.history = Array.isArray(parsed) ? parsed.filter(item => item && item.projectName) : [];\n  } catch {\n    state.history = [];\n  }\n}\n\nfunction saveHistory() {\n  try {\n    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, 50)));\n  } catch {\n    // \u672C\u5730\u5B58\u50A8\u4E0D\u53EF\u7528\u65F6\u9759\u9ED8\u964D\u7EA7\uFF0C\u4E0D\u5F71\u54CD\u90E8\u7F72\n  }\n}\n\nfunction recordHistory(info) {\n  if (!info || info.mode === 'update' || !info.projectName) return;\n  state.history.unshift({\n    projectName: info.projectName,\n    uuid: info.uuid || '',\n    url: info.url || '',\n    domain: info.domain || '',\n    account: $('accountId').selectedOptions?.[0]?.textContent || '',\n    time: new Date().toISOString()\n  });\n  state.history = state.history.slice(0, 50);\n  saveHistory();\n  renderHistory();\n}\n\nfunction renderHistory() {\n  const panel = $('historyPanel');\n  const list = $('historyList');\n  if (!state.history.length) {\n    panel.classList.add('page-hidden');\n    list.innerHTML = '';\n    return;\n  }\n  panel.classList.remove('page-hidden');\n  list.innerHTML = '';\n  for (const item of state.history) {\n    const row = document.createElement('div');\n    row.className = 'history-row';\n\n    const info = document.createElement('div');\n    info.className = 'history-info';\n    const title = document.createElement('strong');\n    title.textContent = item.projectName;\n    const meta = document.createElement('span');\n    meta.className = 'history-meta';\n    meta.textContent = `${formatTime(item.time)}${item.domain ? ` \xB7 \u57DF\u540D ${item.domain}` : ''}`;\n    info.append(title, meta);\n\n    const actions = document.createElement('div');\n    actions.className = 'history-actions';\n    if (item.url) {\n      const open = document.createElement('a');\n      open.href = item.url;\n      open.target = '_blank';\n      open.rel = 'noopener';\n      open.className = 'secondary small history-open';\n      open.textContent = '\u6253\u5F00';\n      actions.append(open);\n      actions.append(actionButton('\u590D\u5236', () => copyText(item.url)));\n    }\n    actions.append(actionButton('\u5220\u9664', () => removeHistory(item)));\n\n    row.append(info, actions);\n    list.append(row);\n  }\n}\n\nfunction removeHistory(item) {\n  state.history = state.history.filter(entry => !(entry.projectName === item.projectName && entry.time === item.time));\n  saveHistory();\n  renderHistory();\n}\n\nfunction formatTime(iso) {\n  const date = new Date(iso);\n  if (Number.isNaN(date.getTime())) return '';\n  const pad = value => String(value).padStart(2, '0');\n  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;\n}\n\nasync function unzipToFiles(file) {\n  const buffer = new Uint8Array(await file.arrayBuffer());\n  const view = new DataView(buffer.buffer);\n  const decoder = new TextDecoder('utf-8');\n  const files = [];\n  for (let offset = 0; offset + 4 <= buffer.length;) {\n    const signature = view.getUint32(offset, true);\n    if (signature !== 0x04034b50) break;\n    const flags = view.getUint16(offset + 6, true);\n    const method = view.getUint16(offset + 8, true);\n    const compressedSize = view.getUint32(offset + 18, true);\n    const nameLength = view.getUint16(offset + 26, true);\n    const extraLength = view.getUint16(offset + 28, true);\n    let nameStart = offset + 30;\n    const nameEnd = nameStart + nameLength;\n    if (nameEnd + extraLength > buffer.length) break;\n    const rawName = decoder.decode(buffer.subarray(nameStart, nameEnd));\n    const dataStart = nameEnd + extraLength;\n    const hasDataDescriptor = (flags & 0x08) !== 0;\n    let size = compressedSize;\n    if (hasDataDescriptor || size === 0) {\n      const nextOffset = findNextLocalHeader(buffer, view, dataStart);\n      size = nextOffset === -1 ? buffer.length - dataStart : nextOffset - dataStart;\n    }\n    const dataEnd = Math.min(dataStart + size, buffer.length);\n    const compressed = buffer.subarray(dataStart, dataEnd);\n    const path = normalizeZipPath(rawName);\n    if (path && !path.endsWith('/')) {\n      const content = await decompressEntry(compressed, method);\n      files.push({\n        path,\n        base64: bytesToBase64(content),\n        size: content.length\n      });\n    }\n    if (hasDataDescriptor) {\n      const nextOffset = findNextLocalHeader(buffer, view, dataStart);\n      if (nextOffset === -1) break;\n      offset = nextOffset;\n    } else {\n      offset = dataEnd;\n    }\n  }\n  return files;\n}\n\nfunction findNextLocalHeader(buffer, view, from) {\n  for (let index = from; index + 4 <= buffer.length; index++) {\n    if (view.getUint32(index, true) === 0x04034b50) return index;\n  }\n  return -1;\n}\n\nasync function decompressEntry(compressed, method) {\n  if (method === 0) return compressed;\n  if (method !== 8) throw new Error(`\u4E0D\u652F\u6301\u7684\u538B\u7F29\u65B9\u5F0F (method=${method})`);\n  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));\n  return new Uint8Array(await new Response(stream).arrayBuffer());\n}\n\nfunction normalizeZipPath(path) {\n  const cleaned = path.replace(/\\\\/g, '/').replace(/^\\/+/, '').replace(/^\\.\\//, '');\n  if (!cleaned || cleaned.includes('..')) return '';\n  return cleaned.endsWith('/') ? cleaned : `/${cleaned.replace(/^\\/+/, '')}`;\n}\n\nfunction bytesToBase64(bytes) {\n  let binary = '';\n  const step = 0x8000;\n  for (let index = 0; index < bytes.length; index += step) {\n    binary += String.fromCharCode(...bytes.subarray(index, index + step));\n  }\n  return btoa(binary);\n}\n\nfunction syncModeState() {\n  const updating = $('deployMode').value === 'update';\n  $('deploy').textContent = updating ? '\u66F4\u65B0\u90E8\u7F72' : '\u9AD8\u7EA7\u90E8\u7F72';\n  $('modeHint').textContent = updating\n    ? '\u66F4\u65B0\u6A21\u5F0F\u53EA\u540C\u6B65\u4EE3\u7801\uFF0C\u4E0D\u521B\u5EFA KV\uFF0C\u4E0D\u4FEE\u6539 UUID\u3001KV \u7ED1\u5B9A\u3001\u57DF\u540D\u6216 Pages \u9879\u76EE\u914D\u7F6E\u3002'\n    : '\u65B0\u5EFA\u6A21\u5F0F\u4F1A\u6309\u8868\u5355\u914D\u7F6E\u968F\u673A UUID\u3001KV \u548C\u53EF\u9009\u57DF\u540D\u3002';\n  for (const id of ['uuid', 'kvTitle', 'kvId', 'advancedHostname', 'zoneId', 'enableWorkersDev']) {\n    $(id).disabled = updating;\n  }\n  if ($('kvId').options[0]) $('kvId').options[0].textContent = updating ? '\u66F4\u65B0\u6A21\u5F0F\u4E0D\u4FEE\u6539 KV' : '\u65B0\u5EFA\u968F\u673A KV';\n}\n\nfunction showPage(page) {\n  $('loginPage').classList.toggle('page-hidden', page !== 'login');\n  $('deployPage').classList.toggle('page-hidden', page !== 'deploy');\n}\n\nfunction setBusy(busy) {\n  for (const button of document.querySelectorAll('button')) button.disabled = busy;\n}\n\nfunction setLoginStatus(text, type = '') {\n  $('loginStatus').textContent = text;\n  $('loginStatus').className = `result ${type}`.trim();\n}\n\nfunction setResult(text, type = '') {\n  $('result').textContent = text;\n  $('result').className = `result ${type}`.trim();\n}\n\nfunction log(text) {\n  const target = $('logs');\n  target.textContent += `${text}\\n`;\n  target.scrollTop = target.scrollHeight;\n}\n";
var DEPLOY_CSS = '/* \u4E91\u7AEF\u90E8\u7F72\u5668 \xB7 \u6837\u5F0F \u2014\u2014 \u7531 \u6570\u7801\u89E3\u7801 \u72EC\u7ACB\u5F00\u53D1\u5E76\u7EF4\u62A4 \xB7 \u8BF7\u52FF\u79FB\u9664\u4F5C\u8005\u4E0E\u7248\u6743\u58F0\u660E */\n/* \u89C6\u89C9\u57FA\u56E0\u4E0E\u661F\u4E91\u89E3\u7801\uFF08Nebula-Decode\uFF09\u9762\u677F\u4FDD\u6301\u4E00\u81F4\uFF1A\u6DF1\u7A7A\u9ED1\u5E95 + \u9752\u7EFF/\u975B\u84DD\u6D41\u5149 */\n:root {\n  color-scheme: dark;\n  --bg: #05080f;\n  --panel: rgba(17, 24, 39, 0.62);\n  --panel-strong: rgba(12, 18, 30, 0.86);\n  --text: #e6edf3;\n  --muted: #8b9bb0;\n  --dim: #6b7a8f;\n  --line: rgba(148, 163, 184, 0.14);\n  --line-strong: rgba(148, 163, 184, 0.24);\n  --accent: #5eead4;\n  --accent-2: #818cf8;\n  --accent-strong: #2dd4bf;\n  --accent-soft: rgba(94, 234, 212, 0.1);\n  --brand: #fbbf77;\n  --danger: #fb7185;\n  --shadow: 0 26px 70px rgba(0, 0, 0, 0.55);\n  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;\n}\n\n* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  min-height: 100dvh;\n  color: var(--text);\n  background: var(--bg);\n  background-image:\n    radial-gradient(1100px 520px at 12% -8%, rgba(45, 212, 191, 0.13), transparent 60%),\n    radial-gradient(900px 480px at 88% 112%, rgba(129, 140, 248, 0.12), transparent 60%),\n    radial-gradient(700px 360px at 92% 6%, rgba(45, 212, 191, 0.06), transparent 55%);\n  background-attachment: fixed;\n  -webkit-font-smoothing: antialiased;\n  text-rendering: optimizeLegibility;\n}\n\n::selection {\n  background: rgba(94, 234, 212, 0.26);\n}\n\n::-webkit-scrollbar {\n  width: 10px;\n  height: 10px;\n}\n\n::-webkit-scrollbar-thumb {\n  background: rgba(148, 163, 184, 0.22);\n  border-radius: 6px;\n}\n\n::-webkit-scrollbar-thumb:hover {\n  background: rgba(94, 234, 212, 0.32);\n}\n\n::-webkit-scrollbar-track {\n  background: transparent;\n}\n\nbutton,\ninput,\nselect {\n  font: inherit;\n}\n\ninput,\nselect,\nbutton {\n  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;\n}\n\n.shell {\n  width: min(1180px, calc(100vw - 32px));\n  margin: 0 auto;\n  padding: 40px 0 64px;\n}\n\n/* ---------- Hero ---------- */\n.hero {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 360px;\n  gap: 24px;\n  align-items: end;\n  padding: 24px 0 28px;\n}\n\n.eyebrow {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  margin: 0 0 16px;\n  padding: 5px 14px;\n  border: 1px solid rgba(94, 234, 212, 0.28);\n  border-radius: 999px;\n  color: var(--accent);\n  background: rgba(94, 234, 212, 0.06);\n  font-size: 12px;\n  font-weight: 700;\n  letter-spacing: 2px;\n}\n\n.eyebrow::before {\n  content: "";\n  width: 6px;\n  height: 6px;\n  border-radius: 999px;\n  background: var(--accent);\n  box-shadow: 0 0 12px var(--accent);\n}\n\nh1 {\n  margin: 0;\n  font-size: clamp(40px, 6.4vw, 76px);\n  line-height: 1.02;\n  letter-spacing: 2px;\n  font-weight: 800;\n  background: linear-gradient(92deg, #eafffb 0%, #5eead4 46%, #818cf8 100%);\n  -webkit-background-clip: text;\n  background-clip: text;\n  color: transparent;\n}\n\nh2 {\n  margin: 0;\n  font-size: 17px;\n  line-height: 1.3;\n  letter-spacing: 0.5px;\n  font-weight: 700;\n}\n\n.summary {\n  max-width: 620px;\n  margin: 20px 0 0;\n  color: var(--muted);\n  font-size: 17px;\n  line-height: 1.7;\n}\n\n/* ---------- \u5361\u7247 ---------- */\n.status-card,\n.panel {\n  position: relative;\n  border: 1px solid var(--line);\n  background: var(--panel);\n  backdrop-filter: blur(22px) saturate(150%);\n  -webkit-backdrop-filter: blur(22px) saturate(150%);\n  box-shadow: var(--shadow);\n}\n\n.status-card {\n  border-radius: 22px;\n  padding: 22px;\n  overflow: hidden;\n}\n\n.status-card::before {\n  content: "";\n  position: absolute;\n  inset: 0 auto auto 0;\n  width: 100%;\n  height: 2px;\n  background: linear-gradient(90deg, transparent, rgba(94, 234, 212, 0.6), rgba(129, 140, 248, 0.5), transparent);\n}\n\n.status-card strong {\n  font-size: 15px;\n  letter-spacing: 0.5px;\n}\n\n.status-card p {\n  margin: 10px 0 0;\n  color: var(--muted);\n  line-height: 1.6;\n  font-size: 14px;\n}\n\n.status-dot {\n  display: inline-block;\n  width: 9px;\n  height: 9px;\n  margin-right: 10px;\n  border-radius: 999px;\n  background: var(--accent);\n  box-shadow: 0 0 0 5px rgba(94, 234, 212, 0.12), 0 0 14px rgba(94, 234, 212, 0.7);\n  vertical-align: middle;\n}\n\n.panel {\n  margin-top: 20px;\n  border-radius: 24px;\n  padding: 24px;\n}\n\n.page-hidden {\n  display: none !important;\n}\n\n.login-panel {\n  max-width: 760px;\n}\n\n/* ---------- \u6298\u53E0\u9762\u677F ---------- */\nsummary {\n  cursor: pointer;\n  color: var(--accent);\n  font-weight: 700;\n  letter-spacing: 0.5px;\n  list-style: none;\n  display: flex;\n  align-items: center;\n  transition: color 0.18s ease;\n}\n\nsummary:hover {\n  color: var(--accent-strong);\n}\n\nsummary::-webkit-details-marker {\n  display: none;\n}\n\nsummary::before {\n  content: "+";\n  display: inline-grid;\n  place-items: center;\n  width: 24px;\n  height: 24px;\n  margin-right: 10px;\n  border-radius: 999px;\n  color: #05202a;\n  background: linear-gradient(135deg, var(--accent), var(--accent-2));\n  font-weight: 800;\n  line-height: 1;\n}\n\ndetails[open] summary::before {\n  content: "\u2212";\n}\n\n.advanced-panel .panel-head {\n  margin-top: 20px;\n}\n\n/* ---------- \u533A\u5757\u5934 ---------- */\n.panel-head {\n  display: flex;\n  gap: 18px;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 20px;\n}\n\n.panel-head p {\n  margin: 6px 0 0;\n  color: var(--muted);\n  line-height: 1.55;\n  font-size: 14px;\n}\n\n.panel-head.compact {\n  margin-bottom: 12px;\n}\n\n.button-group {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-end;\n  gap: 10px;\n}\n\n/* ---------- \u6805\u683C\u4E0E\u8868\u5355 ---------- */\n.grid {\n  display: grid;\n  gap: 16px;\n}\n\n.two {\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n}\n\n.three {\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n}\n\n.span-two {\n  grid-column: span 2;\n}\n\nlabel span {\n  display: block;\n  margin-bottom: 8px;\n  color: #aab8c8;\n  font-size: 12px;\n  font-weight: 700;\n  letter-spacing: 0.6px;\n}\n\n.form-note {\n  align-self: end;\n  min-height: 46px;\n  margin: 0;\n  padding: 13px 15px;\n  border: 1px solid rgba(94, 234, 212, 0.16);\n  border-radius: 14px;\n  color: var(--accent);\n  background: rgba(94, 234, 212, 0.06);\n  font-size: 13px;\n  line-height: 1.55;\n}\n\n.form-note.error-note {\n  border-color: rgba(251, 113, 133, 0.28);\n  color: var(--danger);\n  background: rgba(251, 113, 133, 0.08);\n}\n\ninput,\nselect {\n  width: 100%;\n  height: 46px;\n  border: 1px solid var(--line-strong);\n  border-radius: 13px;\n  padding: 0 14px;\n  color: var(--text);\n  background: rgba(5, 8, 15, 0.6);\n  outline: none;\n}\n\nselect option {\n  background: #0b111c;\n  color: var(--text);\n}\n\ninput::placeholder {\n  color: var(--dim);\n}\n\ninput:focus,\nselect:focus {\n  border-color: rgba(94, 234, 212, 0.6);\n  box-shadow: 0 0 0 4px rgba(94, 234, 212, 0.12), 0 0 22px rgba(45, 212, 191, 0.14);\n  background: rgba(5, 8, 15, 0.85);\n}\n\ninput:disabled {\n  color: var(--dim);\n  background: rgba(5, 8, 15, 0.35);\n  cursor: not-allowed;\n}\n\ninput[type="file"] {\n  height: auto;\n  padding: 10px 14px;\n  line-height: 1.5;\n  color: var(--muted);\n  font-size: 13px;\n}\n\ninput[type="file"]::file-selector-button {\n  margin-right: 12px;\n  padding: 7px 14px;\n  border: 1px solid rgba(94, 234, 212, 0.32);\n  border-radius: 9px;\n  color: var(--accent);\n  background: rgba(94, 234, 212, 0.08);\n  font: inherit;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.18s ease, border-color 0.18s ease;\n}\n\ninput[type="file"]::file-selector-button:hover {\n  background: rgba(94, 234, 212, 0.16);\n  border-color: rgba(94, 234, 212, 0.5);\n}\n\n.toggle {\n  display: flex;\n  align-items: center;\n  min-height: 46px;\n  gap: 10px;\n  padding-top: 23px;\n}\n\n.toggle input {\n  width: 18px;\n  height: 18px;\n  accent-color: var(--accent-strong);\n  cursor: pointer;\n}\n\n.toggle span {\n  margin: 0;\n}\n\n/* ---------- \u6309\u94AE ---------- */\nbutton {\n  min-height: 42px;\n  border: 1px solid transparent;\n  border-radius: 999px;\n  padding: 0 20px;\n  cursor: pointer;\n  font-weight: 600;\n  letter-spacing: 0.4px;\n  color: var(--text);\n  background: rgba(148, 163, 184, 0.1);\n}\n\nbutton:hover:not(:disabled) {\n  transform: translateY(-1px);\n}\n\nbutton:active:not(:disabled) {\n  transform: translateY(1px) scale(0.99);\n}\n\nbutton:disabled {\n  opacity: 0.55;\n  cursor: not-allowed;\n}\n\n.primary {\n  min-height: 52px;\n  padding: 0 30px;\n  color: #05202a;\n  background: linear-gradient(135deg, var(--accent), var(--accent-2));\n  box-shadow: 0 16px 40px rgba(45, 212, 191, 0.24);\n  font-weight: 800;\n  letter-spacing: 1.2px;\n}\n\n.primary:hover:not(:disabled) {\n  box-shadow: 0 20px 48px rgba(45, 212, 191, 0.36), 0 0 30px rgba(129, 140, 248, 0.28);\n}\n\n.secondary {\n  color: var(--accent);\n  border-color: rgba(94, 234, 212, 0.26);\n  background: rgba(94, 234, 212, 0.07);\n  font-weight: 700;\n}\n\n.secondary:hover:not(:disabled) {\n  background: rgba(94, 234, 212, 0.14);\n  border-color: rgba(94, 234, 212, 0.48);\n  box-shadow: 0 0 20px rgba(45, 212, 191, 0.18);\n}\n\n.small {\n  min-height: 34px;\n  padding: 0 15px;\n}\n\n.action-row {\n  display: flex;\n  gap: 18px;\n  align-items: center;\n  margin: 22px 0 0;\n}\n\n.quick-action {\n  display: grid;\n  grid-template-columns: 220px minmax(0, 1fr);\n  gap: 18px;\n  align-items: center;\n  margin-top: 22px;\n}\n\n/* ---------- \u7ED3\u679C\u6761 ---------- */\n.result {\n  flex: 1;\n  min-width: 0;\n  min-height: 52px;\n  display: flex;\n  align-items: center;\n  border: 1px solid var(--line);\n  border-radius: 16px;\n  padding: 12px 16px;\n  color: var(--muted);\n  background: var(--panel-strong);\n  font-size: 14px;\n  line-height: 1.5;\n  overflow-wrap: anywhere;\n}\n\n.result.success {\n  color: var(--accent);\n  border-color: rgba(94, 234, 212, 0.24);\n  background: rgba(94, 234, 212, 0.07);\n}\n\n.result.error {\n  color: var(--danger);\n  border-color: rgba(251, 113, 133, 0.26);\n  background: rgba(251, 113, 133, 0.08);\n}\n\n.result-actions {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 10px;\n  margin-top: 14px;\n  padding: 12px 14px;\n  border: 1px solid rgba(94, 234, 212, 0.2);\n  border-radius: 16px;\n  background: rgba(94, 234, 212, 0.05);\n}\n\n.result-link-wrap {\n  flex: 1 1 100%;\n  min-width: 0;\n}\n\n.result-link {\n  display: inline-block;\n  max-width: 100%;\n  color: var(--accent);\n  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;\n  font-size: 13.5px;\n  font-weight: 600;\n  text-decoration: none;\n  word-break: break-all;\n  border-bottom: 1px dashed rgba(94, 234, 212, 0.5);\n  transition: color 0.18s ease, border-color 0.18s ease;\n}\n\n.result-link:hover {\n  color: #aef7e8;\n  border-bottom-color: var(--accent);\n}\n\n/* ---------- \u90E8\u7F72\u5386\u53F2 ---------- */\n.history-panel {\n  padding-bottom: 16px;\n}\n\n.history-list {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.history-row {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 14px;\n  padding: 13px 15px;\n  border: 1px solid var(--line);\n  border-radius: 14px;\n  background: rgba(5, 8, 15, 0.45);\n  transition: border-color 0.18s ease, background 0.18s ease;\n}\n\n.history-row:hover {\n  border-color: rgba(94, 234, 212, 0.28);\n  background: rgba(94, 234, 212, 0.05);\n}\n\n.history-info {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n}\n\n.history-info strong {\n  font-size: 14px;\n  letter-spacing: 0.3px;\n  color: var(--text);\n  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;\n  word-break: break-all;\n}\n\n.history-meta {\n  color: var(--dim);\n  font-size: 12px;\n}\n\n.history-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  justify-content: flex-end;\n}\n\n.history-open {\n  display: inline-flex;\n  align-items: center;\n  border-radius: 999px;\n  text-decoration: none;\n  min-height: 34px;\n  padding: 0 15px;\n  color: var(--accent);\n  border: 1px solid rgba(94, 234, 212, 0.26);\n  background: rgba(94, 234, 212, 0.07);\n  font-weight: 700;\n  font-size: 14px;\n}\n\n.history-open:hover {\n  background: rgba(94, 234, 212, 0.14);\n  border-color: rgba(94, 234, 212, 0.48);\n}\n\n/* ---------- \u65E5\u5FD7 ---------- */\n.logs-panel {\n  padding-bottom: 14px;\n}\n\npre {\n  min-height: 220px;\n  max-height: 420px;\n  overflow: auto;\n  margin: 0;\n  border: 1px solid rgba(94, 234, 212, 0.18);\n  border-radius: 16px;\n  padding: 16px 18px;\n  color: #b8f5e6;\n  background: rgba(2, 6, 12, 0.9);\n  font: 12.5px/1.65 ui-monospace, "SF Mono", Menlo, Consolas, "Cascadia Code", monospace;\n  white-space: pre-wrap;\n  box-shadow: inset 0 0 44px rgba(45, 212, 191, 0.06);\n}\n\npre::selection {\n  background: rgba(94, 234, 212, 0.28);\n}\n\n/* ---------- \u54CD\u5E94\u5F0F ---------- */\n@media (max-width: 860px) {\n  .hero,\n  .two,\n  .three {\n    grid-template-columns: 1fr;\n  }\n\n  .span-two {\n    grid-column: auto;\n  }\n\n  .panel-head,\n  .action-row,\n  .quick-action {\n    align-items: stretch;\n    display: flex;\n    flex-direction: column;\n  }\n\n  .button-group {\n    justify-content: stretch;\n  }\n\n  .primary,\n  .secondary,\n  .button-group button {\n    width: 100%;\n  }\n}\n\n@media (prefers-reduced-transparency: reduce) {\n  .status-card,\n  .panel {\n    background: rgba(11, 17, 28, 0.96);\n    backdrop-filter: none;\n    -webkit-backdrop-filter: none;\n  }\n}\n';

// src/worker.js
var json2 = (obj, status = 200, headers = {}) => new Response(JSON.stringify(obj), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
});
function rewrite(request, newPath, authed = false) {
  const u = new URL(request.url);
  u.pathname = newPath;
  u.search = request.url.includes("?") ? u.search : u.search;
  const headers = new Headers(request.headers);
  headers.delete("x-hub-authed");
  if (authed) headers.set("x-hub-authed", "1");
  const init = { method: request.method, headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }
  return new Request(u.toString(), init);
}
var LOGIN_HTML2 = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>\u767B\u5F55 \xB7 CF Hub</title>
<style>body{font-family:system-ui,sans-serif;background:#0c0e13;color:#e8eaee;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#1a1d23;border:1px solid #2a2e36;border-radius:16px;padding:32px;width:340px}
h1{font-size:19px;margin:0 0 6px}p{color:#8b93a0;font-size:13px;margin:0 0 20px}
input{width:100%;box-sizing:border-box;padding:12px;margin-bottom:12px;background:#12151a;color:#e8eaee;border:1px solid #2a2e36;border-radius:10px;font-size:15px}
button{width:100%;padding:12px;border:0;border-radius:10px;background:#f6821f;color:#fff;font-size:15px;font-weight:700;cursor:pointer}
.err{color:#e05252;min-height:20px;font-size:13px;text-align:center;margin-top:12px}</style></head>
<body><form class="card" id="f"><h1>CF Hub</h1><p>\u90E8\u7F72 \xB7 Tunnel \xB7 \u7528\u91CF\u7EDF\u8BA1\uFF0C\u4E00\u4E2A\u5165\u53E3</p>
<input id="u" placeholder="\u8D26\u53F7\uFF08\u9ED8\u8BA4 admin\uFF09" autocomplete="username">
<input id="p" type="password" placeholder="\u5BC6\u7801" autocomplete="current-password" autofocus>
<button>\u767B \u5F55</button><div class="err" id="e"></div></form>
<script>var f=document.getElementById('f');
f.addEventListener('submit',async function(ev){ev.preventDefault();
var r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({username:document.getElementById('u').value,password:document.getElementById('p').value})});
if(r.ok){var n=new URLSearchParams(location.search).get('next')||'/';location.replace(n);}
else{document.getElementById('e').textContent='\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF';}});<\/script></body></html>`;
var HUB_HTML = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CF Hub</title>
<style>body{font-family:system-ui,sans-serif;background:#0c0e13;color:#e8eaee;margin:0;padding:32px}
h1{font-size:22px;margin:0 0 6px}p.sub{color:#8b93a0;margin:0 0 24px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;max-width:960px}
.card{background:#1a1d23;border:1px solid #2a2e36;border-radius:16px;padding:22px;text-decoration:none;color:#e8eaee;display:block}
.card:hover{border-color:#f6821f}.card h2{font-size:17px;margin:0 0 8px}.card p{color:#8b93a0;font-size:13px;line-height:1.6;margin:0}
.card .go{color:#f6821f;font-size:13px;display:block;margin-top:12px}
button{margin-top:24px;padding:10px 18px;border:1px solid #2a2e36;border-radius:10px;background:transparent;color:#e8eaee;cursor:pointer}</style></head>
<body><h1>CF Hub</h1><p class="sub">\u4E00\u6B21\u767B\u5F55\uFF0C\u4E09\u4E2A\u9762\u677F\u3002\u90E8\u7F72\u3001Tunnel\u3001\u7528\u91CF\u7EDF\u8BA1\u90FD\u5728\u8FD9\u91CC\u3002</p>
<div class="grid">
<a class="card" href="/deploy/"><h2>\u{1F680} \u4E00\u952E\u90E8\u7F72</h2><p>\u586B\u90AE\u7BB1 + Global API Key\uFF0C\u4E00\u952E\u521B\u5EFA Pages / Worker \u9879\u76EE\u3001\u968F\u673A UUID\u3001KV \u4E0E\u57DF\u540D\u7ED1\u5B9A\u3002\u539F cf-deploy-panel\u3002</p><span class="go">\u6253\u5F00 /deploy/ \u2192</span></a>
<a class="card" href="/tunnel/"><h2>\u{1F310} \u57DF\u540D \xB7 Tunnel</h2><p>\u591A\u8D26\u53F7\u57DF\u540D\u4E0E Tunnel \u7BA1\u7406\uFF1A\u65B0\u5EFA/\u7F16\u8F91/\u5220\u9664\u96A7\u9053\u3001\u8DEF\u7531\u3001\u5728\u7EBF\u72B6\u6001\u3001Telegram \u4E0A\u4E0B\u7EBF\u63D0\u9192\u3002\u539F Tunnel \u9762\u677F\u3002</p><span class="go">\u6253\u5F00 /tunnel/ \u2192</span></a>
<a class="card" href="/usage/"><h2>\u{1F4CA} \u7528\u91CF\u7EDF\u8BA1</h2><p>\u591A\u8D26\u53F7 Workers / Pages / D1 / KV / R2 \u514D\u8D39\u989D\u5EA6\u7EDF\u8BA1\uFF0C\u5B9A\u65F6\u81EA\u52A8\u5237\u65B0\u3002\u539F UsagePanel\u3002</p><span class="go">\u6253\u5F00 /usage/ \u2192</span></a>
</div>
<button onclick="fetch('/api/logout',{method:'POST'}).then(()=>location.replace('/login'))">\u9000\u51FA\u767B\u5F55</button>
</body></html>`;
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (!env.PASSWORD) {
      return new Response("\u8BF7\u5148\u5728\u53D8\u91CF\u4E2D\u8BBE\u7F6E PASSWORD", { status: 500 });
    }
    if (path === "/api/login" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const username = String(env.USERNAME || env.USER || "admin");
      if (body.username && String(body.username) !== username || !sameSecret2(String(body.password || ""), String(env.PASSWORD))) {
        await new Promise((r) => setTimeout(r, 500));
        return json2({ ok: false, error: "\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF" }, 401);
      }
      return json2(
        { ok: true },
        200,
        { "Set-Cookie": setHubCookie(await makeHubSession(env), SESSION_TTL2) }
      );
    }
    if (path === "/api/logout" && request.method === "POST") {
      return json2({ ok: true }, 200, { "Set-Cookie": setHubCookie("", 0) });
    }
    if (path === "/login") {
      if (await checkHubSession(env, hubCookieValue(request))) {
        return new Response(null, {
          status: 302,
          headers: { Location: url.searchParams.get("next") || "/" }
        });
      }
      return new Response(LOGIN_HTML2, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    if (path === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /", {
        headers: { "Content-Type": "text/plain; charset=UTF-8" }
      });
    }
    if (path === "/usage.json" || path === "/usage/usage.json") {
      return handleUsage(rewrite(request, "/usage.json"), env, ctx);
    }
    const loggedIn = await checkHubSession(env, hubCookieValue(request));
    if (!loggedIn) {
      if (path.includes("/api/")) return json2({ ok: false, error: "\u8BF7\u5148\u767B\u5F55" }, 401);
      return new Response(null, {
        status: 302,
        headers: { Location: "/login?next=" + encodeURIComponent(path) }
      });
    }
    if (path === "/" || path === "/index.html") {
      return new Response(HUB_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    if (path === "/deploy" || path === "/deploy/") {
      return new Response(DEPLOY_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    if (path === "/deploy/app.js") {
      return new Response(DEPLOY_JS, {
        headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    if (path === "/deploy/styles.css") {
      return new Response(DEPLOY_CSS, {
        headers: { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    if (path.startsWith("/api/deploy/")) {
      return handleDeploy(rewrite(request, path.replace("/api/deploy", "/api")), env, ctx);
    }
    if (path === "/tunnel" || path === "/tunnel/" || path === "/tunnel/index.html") {
      return handleTunnel(rewrite(request, "/"), env);
    }
    if (path.startsWith("/tunnel/api/")) {
      return handleTunnel(rewrite(request, path.replace("/tunnel", "")), env);
    }
    if (path === "/tunnel/manifest.json" || path === "/tunnel/sw.js" || path === "/tunnel/icon-192.png" || path === "/tunnel/icon-512.png") {
      return handleTunnel(rewrite(request, path.replace("/tunnel", "")), env);
    }
    if (path === "/usage" || path === "/usage/") {
      return handleUsage(rewrite(request, "/", true), env, ctx);
    }
    if (path.startsWith("/usage/")) {
      return handleUsage(rewrite(request, path.replace("/usage", "") || "/", true), env, ctx);
    }
    return new Response("Not Found", { status: 404 });
  },
  async scheduled(event, env, ctx) {
    try {
      await scheduledTunnel(event, env, ctx);
    } catch (e) {
      console.error("tunnel scheduled failed:", e);
    }
    try {
      await scheduledUsage(event, env, ctx);
    } catch (e) {
      console.error("usage scheduled failed:", e);
    }
  }
};
export {
  worker_default as default
};
