import json
import datetime

db = season.stdClass()
db.apps = wiz.model("dizest/orm").use("app")
db.workflow = wiz.model("dizest/orm").use("workflow")

user_id = wiz.session.get("id")

def update():
    try:
        data = wiz.request.query("data", True)
        data = json.loads(data)
        wp_id = data['id']
        wp = db.workflow.get(id=wp_id)
        if wp['user_id'] != user_id:
            raise Exception("Unauthorized")
        if 'created' not in data:
            data['created'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        data['updated'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        db.workflow.update(data, id=wp_id)
    except Exception as e:
        wiz.response.status(500)
    wiz.response.status(200)

def run():
    try:
        wpid = wiz.request.query("workflow_id", True)
        fids = wiz.request.query("flow_id", None)
        if fids is None: return

        workflow = db.workflow.get(id=wpid)
        
        dizest = wiz.model("dizest/scheduler")(wpid, package=workflow)
        fids = fids.split(",")
        for fid in fids:
            status = dizest.status(fid)
            if status['status'] == 'pending' or status['status'] == 'running':
                continue
            dizest.run(fid)

    except Exception as e:
        wiz.response.status(500)
    
    wiz.response.status(200)