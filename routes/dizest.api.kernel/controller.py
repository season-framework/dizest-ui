action = wiz.request.query("mode")

socketio = wiz.server.wsgi.socketio
branch = wiz.branch()
basenamespace = f"/wiz/app/{branch}"

if action == 'wpstat':
    wpid = wiz.request.query("workflow_id", True)
    dizest = wiz.model("dizest/scheduler")(wpid)
    socketio.emit("wpstatus", dizest.kernel.workflow.status.get("status"), to=wpid, namespace=f"{basenamespace}/hub.workflow.item", broadcast=True)
    wiz.response.status(200)

if action == 'flowstat':
    wpid = wiz.request.query("workflow_id", True)
    fid = wiz.request.query("flow_id", True)
    dizest = wiz.model("dizest/scheduler")(wpid)
    socketio.emit("status", dict(dizest.status(fid)), to=wpid, namespace=f"{basenamespace}/hub.workflow.item", broadcast=True)
    wiz.response.status(200)

if action == 'stdout':
    wpid = wiz.request.query("workflow_id", True)
    fid = wiz.request.query("flow_id", True)
    data = wiz.request.query("data", True)
    res = dict()
    res['flow_id'] = fid
    res['data'] = data + "\n"
    socketio.emit("log", res, to=wpid, namespace=f"{basenamespace}/hub.workflow.item", broadcast=True)
    wiz.response.status(200)

wiz.response.status(200)