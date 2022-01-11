def login(wiz):
    user_id = wiz.request.query("id", True)
    user_password = wiz.request.query("password", True)

    # check user
    user = None
    if user_id == "admin" and user_password == "1234":
        user = dict()
        user['id'] = "admin"
        user['role'] = "admin"
        user['email'] = "contact@season.co.kr"
        user['status'] = "active"
    
    ## Use Database
    # userdb = wiz.model("mysql").use("users")
    # user = userdb.get(id=user_id, password={"format": "PASSWORD(%s)", "op": "=", "value": user_password})
    
    if user is None:
        wiz.response.status(401, "Check userid or password")
    if user['status'] != 'active':
        wiz.response.status(401, "You can login after administrator's approval.")
    
    wiz.session.set(**user)
    wiz.response.status(200, True)