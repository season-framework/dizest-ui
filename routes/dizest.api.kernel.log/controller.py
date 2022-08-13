import json

socketio = wiz.server.wsgi.socketio
branch = wiz.branch()
basenamespace = f"/wiz/app/{branch}"

server = wiz.request.query("server", True)
logs = wiz.request.query("logs", True)
logs = json.loads(logs)

for log in logs:
    mode = log['mode']
    wpid = log['workflow_id']
    to = server + "-" + wpid
    socketio.emit(mode, log, to=to, namespace=f"{basenamespace}/dizest.workflow.editor", broadcast=True)

wiz.response.status(200)