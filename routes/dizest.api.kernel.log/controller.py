socketio = wiz.server.wsgi.socketio
branch = wiz.branch()
basenamespace = f"/wiz/app/{branch}"
mode = wiz.request.query("mode", True)
manager = wiz.request.query("manager", True)
wpid = wiz.request.query("workflow_id", True)
data = wiz.request.query()
to = manager + "-" + wpid
socketio.emit(mode, data, to=to, namespace=f"{basenamespace}/dizest.workflow.editor", broadcast=True)
wiz.response.status(200)