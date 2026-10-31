// 電波がなくても開けるように、アプリのファイルを携帯に保存しておく
// アプリを直したら VER を上げる（index.html の「版」表示も合わせる）
// v2: 管理番号の追加 / v3: 書き出しを管理番号フォルダに / v4: 管理番号の削除 / v5: 削除ボタン・長押し改善・更新の仕組み
const VER = "genchi-v5";
const FILES = ["./", "index.html", "manifest.json", "icon-180.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VER).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VER).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  // 画面（index.html）は電波があれば最新を取る（3秒で来なければ保存版）。それ以外は保存版を先に使う
  const page = e.request.mode === "navigate";
  e.respondWith(caches.open(VER).then(async (c) => {
    const hit = await c.match(e.request, { ignoreSearch: true }) || (page && await c.match("index.html"));
    const net = fetch(e.request, { cache: "no-cache" }).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; });
    if (!page) return hit || net;
    if (!hit) return net;
    return Promise.race([net.catch(() => hit), new Promise((ok) => setTimeout(() => ok(hit), 3000))]);
  }));
});
