const Router = require('./router')

const MAINPAGE = require('./mainpage.html')

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function get_req(url) {
    return await (await fetch(new Request(url))).text(); 
}

async function get_reqs() {
    return await Promise.all([
        get_req("https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css"),
        get_req("https://code.jquery.com/jquery-3.5.1.slim.min.js"),
        get_req("https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js"),
        get_req("https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js"),
        get_req("https://cdnjs.cloudflare.com/ajax/libs/ipaddr.js/1.9.1/ipaddr.min.js"),
        get_req("https://peterolson.github.io/BigInteger.js/BigInteger.min.js"),
        get_req("https://cdnjs.cloudflare.com/ajax/libs/UpUp/1.1.0/upup.min.js"),
    ])
}

async function mainpage_html(request) {
    // var bscss = await (await fetch(new Request("https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css"))).text()
    // var jqueryjs = await (await fetch(new Request("https://code.jquery.com/jquery-3.5.1.slim.min.js"))).text()
    // var popperjs = await (await fetch(new Request("https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js"))).text()
    // var bootstrapjs = await (await fetch(new Request("https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js"))).text()
    // var ipaddrjs = await (await fetch(new Request("https://cdnjs.cloudflare.com/ajax/libs/ipaddr.js/1.9.1/ipaddr.min.js"))).text()
    // var bigintjs = await (await fetch(new Request("https://peterolson.github.io/BigInteger.js/BigInteger.min.js"))).text()
    // var upupjs = await (await fetch(new Request("https://cdnjs.cloudflare.com/ajax/libs/UpUp/1.1.0/upup.min.js"))).text()

    try{
        var html = await kv.get("cached")
        var was_cached = true;
    }catch(_){
        var was_cached = false;
        var reqs = await get_reqs()
    
        html = MAINPAGE.replace("{{title}}","IP Tools")
                            .replace("{{bootstrapcss}}",reqs[0])
                            .replace("{{jqueryjs}}",reqs[1])
                            .replace("{{popperjs}}",reqs[2])
                            .replace("{{bootstrapjs}}",reqs[3])
                            .replace("{{ipaddrjs}}",reqs[4])
                            .replace("{{bigintjs}}",reqs[5])
                            .replace("{{upupjs}}",reqs[6])
                            .replace(/sourceMappingURL=.+\.map/gm,"")

        await kv.set("cached", html)
    }

    return new Response(html,{headers:{"content-type":"text/html","Cache-Control":"public","x-is-cached":was_cached}})
}

async function handleRequest(request) {
    const r = new Router()
    r.get('/', mainpage_html) 

    let swjs = `
    self.addEventListener("message", function(e) {
        if(e.data=="clear"){
            caches.keys().then((a)=>{for(var b of a)caches.delete(b);})
        }
        if(e.data=="devel"){
            this.devel = this.devel==null?true:!this.devel;
        }
    }),
    
    self.addEventListener("fetch", function(t) {
        if(this.devel == null) this.devel=false;
        const cache_prefix = "ip-tools-cache";
        const cache_version = "v1.0.3";
        const cache_name = cache_prefix + "-" + cache_version;

        t.respondWith(caches.open(cache_name).then(function(cache){return cache.match(t.request).then(function(e) {
            if(e == null || this.devel){
                return fetch(t.request).then(function(r) {
                    caches.open(cache_name).then(function(cache) {
                    if(r.ok)cache.put(t.request, r);
                    });  
                    return r.clone();
                });
            }else{
                return e;
            }
          })}))
    });`

    r.get("/swcacher.sw.js",async ()=>
        new Response(swjs,{headers:{"content-type":"text/javascript","Cache-Control":"public, max-age=3600"}})
    )

    r.get(".*", () => Response.redirect("https://"+request.headers.get("Host")+"/"))

    const resp = await r.route(request)
    return resp
}
