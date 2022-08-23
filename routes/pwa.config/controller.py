import os
import season

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
            "src": "/pwa/icon.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/pwa/icon.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
    
    manifest['theme_color'] = '#3843d0'
    manifest['background_color'] = '#3843d0'
    manifest['display'] = 'standalone'
    manifest['orientation'] = 'any'

    wiz.response.json(manifest)

if wiz.request.uri() == "/pwa/icon.png":
    BASEPATH = os.path.realpath(season.path.project + "/..")
    fs = season.util.os.FileSystem(BASEPATH)
    if fs.exists('icon.png') == False:
        respath = os.path.join(wiz.branchpath(), 'resources')
        iconpath = season.util.os.FileSystem(respath).abspath('images/brand/icon.png')
        wiz.response.download(iconpath)

    iconpath = fs.abspath('icon.png')
    wiz.response.download(iconpath)
        

wiz.response.status(404)