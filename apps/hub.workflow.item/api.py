import season
import json
import datetime

workflow_id = wiz.request.query("workflow_id", True)
manager_id = wiz.request.query("manager_id", True)
user_id = wiz.session.get("id")

db = wiz.model("orm").use("workflow")
dizest = wiz.model("dizest").load(manager_id)
manager = dizest.manager()

wpdata = db.get(id=workflow_id)

if wpdata is None: wiz.response.status(404, 'Not found')
if wpdata['user_id'] != user_id: wiz.response.status(401, 'Unauthorized')

workflow = manager.workflow(wpdata)

def data():
    wiz.response.status(200, wpdata)

def kernelspecs():
    data = manager.kernelspecs()
    wiz.response.status(200, data)

def status():
    try:
        stat = workflow.status()
        spec = workflow.kernelspec()
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
                log[flow_id] = "\n".join(logs)
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
        db.update(data, id=workflow_id)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def start():
    specs = manager.kernelspecs()
    spec = wiz.request.query("spec", None)

    if spec not in specs:
        wiz.response.status(500, f'not supported kernel spec')
    
    workflow.spawn(kernel_name=spec, cwd='/home/season')
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
        if fids is None: return

        workflow.update(wpdata)
        
        fids = fids.split(",")
        for fid in fids:
            flow = workflow.flow(fid)
            flow.run()
    except Exception as e:
        wiz.response.status(500, str(e))
    
    wiz.response.status(200)

def stop():
    try:
        wpid = wiz.request.query("workflow_id", True)
        fid = wiz.request.query("flow_id", None)
        # dizest = wiz.model("dizest/scheduler")(wpid)
        # dizest.stop()
    except:
        pass
    wiz.response.status(200)
