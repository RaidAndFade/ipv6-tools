const Router = require('./router')

const MAINPAGE = require('./mainpage.js')

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

function mainpage_html(request) {
    var html = MAINPAGE.replace("{{title}}","IP Tools")

    return new Response(html,{headers:{"content-type":"text/html"}})
}

async function handleRequest(request) {
    const r = new Router()
    // Replace with the approriate paths and handlers

    r.get('/', mainpage_html) 
    // r.get('/js', mainpage_js) 
    // r.get('/css', mainpage_css)

    r.get(".*", () => Response.redirect("https://"+request.headers.get("Host")+"/"))

    const resp = await r.route(request)
    return resp
}
