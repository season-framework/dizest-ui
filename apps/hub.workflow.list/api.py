import season
import json
import math
import datetime

server_id = "main-" + wiz.session.get("id")
dbname = "workflow"

dizest = wiz.model("dizest").load(server_id)    
server = dizest.server()

db = wiz.model("orm").use(dbname)
user_id = wiz.session.get("id")

def list():
    page = int(wiz.request.query("page", 1))
    text = wiz.request.query("text", "")
    dump = 12

    where = dict()
    where['user_id'] = user_id
    if len(text) > 0:
        where['title'] = text
        where['like'] = 'title'
    rows = db.rows(fields="updated,featured,id,logo,title", orderby='updated', order='DESC', page=page, dump=dump, **where)   
    total = db.count(**where)
    wiz.response.status(200, rows=rows, lastpage=math.ceil(total/dump), page=page)

def get():
    workflow_id = wiz.request.query("id", True)
    item = db.get(id=workflow_id)
    wiz.response.status(200, item)

def status():
    workflow_ids = wiz.request.query("id", True)
    workflow_ids = json.loads(workflow_ids)
    res = dict()
    for workflow_id in workflow_ids:
        workflow = server.workflow_by_id(workflow_id)
        status = "stop"
        if workflow is not None:
            status = workflow.status()
        res[workflow_id] = status
    wiz.response.status(200, res)

def create():
    try:
        data = wiz.request.query("data", True)
        data = json.loads(data)
        data['user_id'] = user_id
        data['created'] = datetime.datetime.now()
        data['updated'] = datetime.datetime.now()
        res = db.insert(data)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def kill():
    workflow_id = wiz.request.query("workflow_id", True)
    try:
        workflow = server.workflow_by_id(workflow_id)
        workflow.kill()
    except:
        pass
    wiz.response.status(200)

def start():
    specs = server.kernelspecs()
    workflow_id = wiz.request.query("workflow_id", True)
    spec = wiz.request.query("spec", True)

    if spec not in specs:
        wiz.response.status(500, f'not supported kernel spec')
    
    workflow = server.workflow_by_id(workflow_id)
    if workflow is None:
        wpdata = db.get(id=workflow_id)
        workflow = server.workflow(wpdata)

    workflow.spawn(kernel_name=spec)
    wiz.response.status(200)

def run():
    workflow_id = wiz.request.query("workflow_id", True)
    try:
        workflow = server.workflow_by_id(workflow_id)
        if workflow is None or workflow.status() == 'stop':
            raise Exception("kernel not selected")
        workflow.run()
    except Exception as e:
        wiz.response.status(500, str(e))

    wiz.response.status(200)

def delete():
    workflow_id = wiz.request.query("workflow_id", True)
    try:
        workflow = server.workflow_by_id(workflow_id)
        workflow.kill()
    except:
        pass
    db.delete(id=workflow_id)
    wiz.response.status(200)

def kernelspecs():
    data = server.kernelspecs()
    rows = []
    for item in data:
        item = server.kernelspec(item)
        rows.append(item)
    wiz.response.status(200, rows)