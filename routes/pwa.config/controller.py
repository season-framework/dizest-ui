if wiz.request.uri() == "/pwa/sw.js":
    swjs = "self.addEventListener('fetch', function (e) {});"
    wiz.response.send(swjs, content_type="text/javascript")

if wiz.request.uri() == "/pwa/manifest.json":
    config = wiz.model("dizest").package()

    manifest = dict()
    manifest['name'] = config['title']
    manifest['short_name'] = config['title']
    manifest['start_url'] = '/'
    manifest['icons'] = [
        {
            "src": "/resources/images/brand/icon.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/resources/images/brand/icon.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
    
    manifest['theme_color'] = '#3843d0'
    manifest['background_color'] = '#3843d0'
    manifest['display'] = 'standalone'

    wiz.response.json(manifest)

wiz.response.status(404)