import os
import season
import json
import datetime
from flask import Response
from crontab import CronTab
import urllib

action = wiz.request.uri().split("/")[4]
user_id = wiz.session.get("id")

if action not in ["api", "render", "drive_api"]:
    workflow_id = wiz.request.query("workflow_id", True)
    server_id = wiz.request.query("server_id", True)
    dbname = wiz.request.query("db", True)
else:
    workflow_id = wiz.request.uri().split("/")[7]
    server_id = wiz.request.uri().split("/")[6]
    dbname = wiz.request.uri().split("/")[5]

db = wiz.model("orm").use(dbname)
dizest = wiz.model("dizest").load(server_id)
server = dizest.server()

wpdata = db.get(id=workflow_id)

# check authorization
if wpdata is None: wiz.response.status(404, 'Not found')
if wpdata['user_id'] != user_id: wiz.response.status(401, 'Unauthorized')

# load workflow instance
workflow = server.workflow(wpdata)
    
def data():
    wiz.response.status(200, wpdata)

def kernelspecs():
    data = server.kernelspecs()
    rows = []
    for item in data:
        item = server.kernelspec(item)
        rows.append(item)
    wiz.response.status(200, rows)

def status():
    try:
        stat = workflow.status()
        spec = workflow.kernelspec()
        spec = server.kernelspec(spec)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200, status=stat, spec=spec)

def flow_status():
    status = dict()
    log = dict()
    try:
        flows = workflow.flows()
        for flow_id in flows:
            try:
                flow = workflow.flow(flow_id)
            except:
                pass
            
            try:
                status[flow_id] = dict()
                status[flow_id]['flow_id'] = flow_id
                status[flow_id]['status'] = flow.status()
                status[flow_id]['index'] = flow.index()
            except:
                pass

            try:
                logs = flow.log()
                log[flow_id] = "".join(logs)
            except:
                pass
    except:
        pass

    wiz.response.status(200, status=status, log=log)

def update():
    try:
        data = wiz.request.query("data", True)
        data = json.loads(data)
        if 'created' not in data:
            data['created'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        data['updated'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            del data['language']
        except:
            pass
        workflow.update(data)
        db.update(data, id=workflow_id)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def start():
    specs = server.kernelspecs()
    spec = wiz.request.query("spec", None)

    if spec not in specs:
        wiz.response.status(500, f'not supported kernel spec')
    
    workflow.spawn(kernel_name=spec)
    wiz.response.status(200)

def kill():
    try:
        workflow.kill()
    except:
        pass
    wiz.response.status(200)

def run():
    try:
        fids = wiz.request.query("flow_id", None)
        if fids is None:
            workflow.run()
        else:
            fids = fids.split(",")
            for fid in fids:
                flow = workflow.flow(fid)
                flow.run()
    except Exception as e:
        wiz.response.status(500, str(e))
    
    wiz.response.status(200)

def stop():
    try:
        workflow.stop()
    except:
        pass
    wiz.response.status(200)

def delete():
    workflow.kill()
    db.delete(id=workflow_id)
    wiz.response.status(200)

def drive_api():
    fnname= wiz.request.uri().split("/")[8]
    path = "/".join(wiz.request.uri().split("/")[9:])    
    
    request = wiz.request.request()
    resp = None
    
    if fnname == 'ls':
        resp = workflow.server.drive_api.ls(path)
    elif fnname == 'create':
        data = wiz.request.query()
        resp = workflow.server.drive_api.create(path, data)
    elif fnname == 'rename':
        data = wiz.request.query()
        resp = workflow.server.drive_api.rename(path, data)
    elif fnname == 'remove':
        data = wiz.request.query()
        resp = workflow.server.drive_api.remove(path, data)
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
            workflow.server.drive_api.upload(path, method=request.method, files={"file": fd}, data=fdd)
        wiz.response.status(200)
    elif fnname == 'download':
        resp = workflow.server.drive_api.download(path)

    if resp is None:
        wiz.response.status(404)
    
    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    headers = [(name, value) for (name, value) in resp.raw.headers.items() if name.lower() not in excluded_headers]
    response = Response(resp.content, resp.status_code, headers)
    wiz.response.response(response)

def api():
    flow_id = wiz.request.uri().split("/")[8]
    fnname = "/".join(wiz.request.uri().split("/")[9:])
    flow = workflow.flow(flow_id)    
    request = wiz.request.request()

    resp = flow.api(fnname, \
        method=request.method, \
        headers={key: value for (key, value) in request.headers if key != 'Host'}, \
        data=request.values, \
        cookies=request.cookies, \
        files=request.files)
    
    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    headers = [(name, value) for (name, value) in resp.raw.headers.items() if name.lower() not in excluded_headers]
    response = Response(resp.content, resp.status_code, headers)
    
    wiz.response.response(response)

def render():
    flow_id = wiz.request.uri().split("/")[8]
    url = "/".join(wiz.request.uri().split("/")[:4] + ['api', dbname, server_id, workflow_id, flow_id])
    flow = workflow.flow(flow_id)
    headjs = '''
    <script type="text/javascript">
    let _log = console.log;
    
    let Style = {
        base: [
            "color: #fff",
            "background-color: #444",
            "padding: 2px 4px",
            "border-radius: 2px"
        ],
        warning: [
            "color: #eee",
            "background-color: red"
        ],
        success: [
            "background-color: green"
        ]
    }

    console.log = function() {
        let style = Style.base.join(';') + ';';
        style += Style.base.join(';');
        _log(`%cdizest.js`, style, ...arguments);
    }

    window.API = (()=> {
        let obj = {};
        obj.url = (fnname)=> "{url}/" + fnname;
        obj.async = obj.function = obj.call = async(fnname, data, opts = {})=> {
            let _url = obj.url(fnname);
            
            let ajax = {
                url: _url,
                type: "POST",
                data: data,
                ...opts
            };

            return new Promise((resolve) => {
                $.ajax(ajax).always(function (a, b, c) {
                    resolve(a, b, c);
                });
            });
        };
        return obj;
    })();
    </script>
    '''.replace('{url}', url)

    view = flow.render(head=headjs)
    wiz.response.send(view, content_type="text/html")

def cron_list():
    try:
        res = []
        user_id = wiz.session.get("id")
        cron  = CronTab(user=user_id)
        for job in cron:
            time = " ".join([str(x) for x in job.slices])
            comment = ";".join(job.comment.split(";")[1:])
            res.append(dict(comment=comment, time=time))
    except Exception as e:
        wiz.response.status(500, e)
    wiz.response.status(200, res)

def cron_remove():
    try:
        comment = wiz.request.query("comment", True)
        comment = f"{workflow_id};{comment}"
        user_id = wiz.session.get("id")
        cron  = CronTab(user=user_id)
        rows = cron.find_comment(comment)
        for job in rows:
            job.enable(False)
            cron.remove(job)
        cron.write()
    except Exception as e:
        wiz.response.status(500, e)
    wiz.response.status(200)

def cron_add():
    try:
        configpy = wiz.model("dizest").config()
        host = urllib.parse.urlparse(wiz.flask.request.base_url)
        host = f"{host.scheme}://{host.netloc}"
        if configpy.broker_api is not None:
            host = configpy.broker_api
            host = host.split("/")[:3]
            host = "/".join(host)
        host = f"{host}/dizest/api/cron"

        comment = wiz.request.query("comment", True)
        comment = f"{workflow_id};{comment}"

        time = wiz.request.query("time", True)
        spec = wiz.request.query("spec", True)
        user_id = wiz.session.get("id")

        cron  = CronTab(user=user_id)
        command = f'curl "{host}?user_id={user_id}&workflow_id={workflow_id}&server_id={server_id}&dbname={dbname}&spec={spec}"'
        job = cron.new(command=command, comment=comment)
        job.setall(time)
        cron.write()
        job.enable()
    except Exception as e:
        wiz.response.status(500, e)
    wiz.response.status(200)