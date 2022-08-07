import json

dizest = wiz.model("dizest")

def step1(wiz):
    data = wiz.request.query("data", True)
    data = json.loads(data)
    dizest.package(data)
    wiz.response.status(200)

def step2(wiz):
    data = wiz.request.query("data", True)
    data = json.loads(data)
    dizest.package(data)

    db_user = wiz.model("orm").use("user")
    db_workflow = wiz.model("orm").use("workflow")
    
    try:
        db_user.create()
    except:
        pass
    try:
        db_workflow.create()
    except:
        pass

    count = db_user.count()
    if count is None:
        wiz.response.status(500)
    if count > 0:
        wiz.response.status(301)
    wiz.response.status(200)

def step3(wiz):
    db_user = wiz.model("orm").use("user")
    count = db_user.count()
    if count is None: count = 0
    if count > 0:
        wiz.response.status(401)

    user = wiz.request.query()
    required = ['id', 'password', 'email', 'username']
    for req in required:
        if req not in user:
            wiz.response.status(400, f"{req} must required")
    del user['password_re']
    user['role'] = 'admin'
    db_user.insert(user)
    wiz.response.status(200, True)