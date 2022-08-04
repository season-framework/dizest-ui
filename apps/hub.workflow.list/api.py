import season
import json
import math
import datetime

manager_id = wiz.request.query("manager_id", "main")

dizest = wiz.model("dizest").load(manager_id)    
manager = dizest.manager()

db = wiz.model("orm").use("workflow")
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
    rows = db.rows(orderby='updated', order='DESC', page=page, dump=dump, **where)
    for row in rows:
        wpid = row['id']
        workflow = manager.workflow_by_id(wpid)
        status = "stop"
        if workflow is not None:
            status = workflow.status()
        row['status'] = status        
    total = db.count(**where)
    wiz.response.status(200, rows=rows, lastpage=math.ceil(total/dump), page=page)

def create():
    try:
        data = wiz.request.query("data", True)
        data = json.loads(data)
        data['user_id'] = user_id
        data['created'] = datetime.datetime.now()
        data['updated'] = datetime.datetime.now()
        res = db.insert(data)
        print(res)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)