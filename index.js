const Router = require('./router')

const MAINPAGE = require('./mainpage.js')

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function mainpage_html(request) {
    var bscss = await (await fetch(new Request("https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css"))).text()
    var jqueryjs = await (await fetch(new Request("https://code.jquery.com/jquery-3.5.1.slim.min.js"))).text()
    var popperjs = await (await fetch(new Request("https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js"))).text()
    var bootstrapjs = await (await fetch(new Request("https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js"))).text()
    var ipaddrjs = await (await fetch(new Request("https://cdnjs.cloudflare.com/ajax/libs/ipaddr.js/1.9.1/ipaddr.min.js"))).text()
    var bigintjs = await (await fetch(new Request("https://peterolson.github.io/BigInteger.js/BigInteger.min.js"))).text()
    var upupjs = await (await fetch(new Request("https://cdnjs.cloudflare.com/ajax/libs/UpUp/1.1.0/upup.min.js"))).text()

    var html = MAINPAGE.replace("{{title}}","IP Tools")
                        .replace("{{bootstrapcss}}",bscss)
                        .replace("{{jqueryjs}}",jqueryjs)
                        .replace("{{popperjs}}",popperjs)
                        .replace("{{bootstrapjs}}",bootstrapjs)
                        .replace("{{ipaddrjs}}",ipaddrjs)
                        .replace("{{bigintjs}}",bigintjs)
                        .replace("{{upupjs}}",upupjs)
                        .replace(/sourceMappingURL=.+\.map/gm,"")

    return new Response(html,{headers:{"content-type":"text/html","Cache-Control":"public"}})
}

async function handleRequest(request) {
    const r = new Router()
    r.get('/', mainpage_html) 

    swjs = `
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
        const cache_version = "v1.0.1";
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
