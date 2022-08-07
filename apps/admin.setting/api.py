import json

if wiz.session.get("role") != "admin":
    wiz.response.abort(401)

def update():
    dbupdate = wiz.request.query("db", False)
    data = wiz.request.query("data", True)
    data = json.loads(data)

    if dbupdate == 'false':
        prev = wiz.model("dizest").config()
        data['db'] = prev.db

    wiz.model("dizest").config(data)
    wiz.response.status(200)

def checkdb():
    prev = wiz.model("dizest").config()
    data = wiz.request.query("data", True)
    data = json.loads(data)

    model = wiz.model("orm").use('userf')
    users = model.rows()
    model = wiz.model("orm").use('workflow')
    workflow = model.rows()
    
    wiz.model("dizest").config(data)
    try:
        model = wiz.model("orm").use('userf')
        count = model.count()
        if count is None:
            wiz.model("orm").use('userf').create()
            wiz.model("orm").use('workflow').create()

        model = wiz.model("orm").use('userf')
        count = model.count()
        if count is None:
            raise Exception("Not connected")
        
        if count == 0:
            model = wiz.model("orm").use('userf')
            for user in users: model.insert(user)
            model = wiz.model("orm").use('workflow')
            for wp in workflow: model.insert(wp)

    except Exception as e:
        count = -1

    wiz.model("dizest").config(prev)
    
    if count == -1:
        wiz.response.status(500, count)
    wiz.response.status(200, count)
