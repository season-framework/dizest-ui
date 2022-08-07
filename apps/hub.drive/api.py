import os
import season
import json
import datetime
from flask import Response

server_id = wiz.request.uri().split("/")[5]
user_id = wiz.session.get("id")

dizest = wiz.model("dizest").load(server_id)
server = dizest.server()

def drive_api():
    fnname = wiz.request.uri().split("/")[6]
    path = "/".join(wiz.request.uri().split("/")[7:])

    request = wiz.request.request()
    resp = None
    
    if fnname == 'ls':
        resp = server.drive_api.ls(path)
    elif fnname == 'create':
        data = wiz.request.query()
        resp = server.drive_api.create(path, data)
    elif fnname == 'rename':
        data = wiz.request.query()
        resp = server.drive_api.rename(path, data)
    elif fnname == 'remove':
        data = wiz.request.query()
        resp = server.drive_api.remove(path, data)
    elif fnname == 'upload':
        filepath = wiz.request.query("filepath", "[]")
        filepath = json.loads(filepath)
        files = wiz.request.files()
        for i in range(len(files)):
            f = files[i]
            fd = (f.filename, f.stream, f.content_type, f.headers)
            fdd = dict()
            if len(filepath) > 0: 
                fdd['filepath'] = filepath[i]
            server.drive_api.upload(path, method=request.method, files={"file": fd}, data=fdd)
        wiz.response.status(200)
    elif fnname == 'download':
        resp = server.drive_api.download(path)

    if resp is None:
        wiz.response.status(404)
    
    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    headers = [(name, value) for (name, value) in resp.raw.headers.items() if name.lower() not in excluded_headers]
    response = Response(resp.content, resp.status_code, headers)
    wiz.response.response(response)