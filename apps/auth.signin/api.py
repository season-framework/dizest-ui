def login(wiz):
    user_id = wiz.request.query("id", True)
    user_password = wiz.request.query("password", True)

    # check user in code
    user = None
    if user_id == "admin" and user_password == "1234":
        user = dict()
        user['id'] = "admin"
        user['role'] = "admin"
        user['email'] = "contact@season.co.kr"
        user['status'] = "active"
    
    ## Use Database
    userdb = wiz.model("orm").use('user')
    user = userdb.get(id=user_id)
    if user is None:
        wiz.response.status(401, "Check userid or password")
    
    # check password
    checkpw = user['password'](user_password)
    if checkpw == False:
        wiz.response.status(401, "Check password")

    # delete password check function
    del user['password']

    # set session and response
    wiz.session.set(**user)
    wiz.response.status(200, True)