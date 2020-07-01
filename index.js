const Router = require('./router')

const HTML = require('./mainpage.js')

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

function mainpage(request) {
        
    return new Response(HTML)
}

async function handleRequest(request) {
    const r = new Router()
    // Replace with the approriate paths and handlers

    r.get('/', mainpage) // return a default message for the root route

    const resp = await r.route(request)
    return resp
}
