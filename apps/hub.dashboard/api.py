import season
import dizest
import os
import time
import psutil
import platform
import resource
import json

server_id = "main-" + wiz.session.get("id")
dbname = "workflow"

def health():
    process = psutil.Process(os.getpid())

    data = season.stdClass()
    data.cpu = season.stdClass()
    data.cpu.count = psutil.cpu_count()
    data.cpu.usage = psutil.cpu_percent()

    hdd = psutil.disk_usage('/')
    data.disk = season.stdClass()
    data.disk.total = hdd.total
    data.disk.used = hdd.used

    data.memory = season.stdClass()
    data.memory.usage = psutil.virtual_memory().used
    data.memory.total = psutil.virtual_memory().total

    wiz.response.status(200, data)

def workflow():
    user_id = wiz.session.get("id")
    db = wiz.model("orm").use(dbname)
    rows = db.rows(user_id=user_id, fields="id,title,updated", orderby="updated", order="DESC")
    
    dizest = wiz.model("dizest").load(server_id)
    server = dizest.server()

    wps = []
    for row in rows:
        wpid = row['id']
        wp = server.workflow_by_id(wpid)
        if wp is None: continue
        status = wp.status()
        if status == 'stop': continue
        row = db.get(id=wpid)
        row['status'] = status
        wps.append(row)

    wiz.response.status(200, wps)

def status():
    workflow_ids = wiz.request.query("id", True)
    workflow_ids = json.loads(workflow_ids)
    res = dict()

    dizest = wiz.model("dizest").load(server_id)
    server = dizest.server()

    for workflow_id in workflow_ids:
        workflow = server.workflow_by_id(workflow_id)
        status = "stop"
        if workflow is not None:
            status = workflow.status()
        res[workflow_id] = status
    wiz.response.status(200, res)

def stop():
    user_id = wiz.session.get("id")
    db = wiz.model("orm").use(dbname)
    rows = db.rows(user_id=user_id, fields="id")
    
    dizest = wiz.model("dizest").load(server_id)
    server = dizest.server()

    for row in rows:
        wpid = row['id']
        wp = server.workflow_by_id(wpid)
        if wp is None: continue
        status = wp.status()
        if status == 'stop': continue
        wp.kill()
        
    wiz.response.status(200)