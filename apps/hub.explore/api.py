import season
import json
import math
import datetime

dbname = "workflow"
db = wiz.model("orm").use(dbname)
user_id = wiz.session.get("id")

def list():
    page = int(wiz.request.query("page", 1))
    text = wiz.request.query("text", "")
    dump = 12

    where = dict()
    if len(text) > 0:
        where['title'] = text
        where['like'] = 'title'
    rows = db.rows(fields="user_id,updated,featured,id,logo,title", visibility='public', orderby='updated', order='DESC', page=page, dump=dump, **where)   
    total = db.count(**where)
    wiz.response.status(200, rows=rows, lastpage=math.ceil(total/dump), page=page)

def get():
    workflow_id = wiz.request.query("id", True)
    item = db.get(id=workflow_id)
    wiz.response.status(200, item)

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
