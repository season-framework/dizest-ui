def join(wiz):    
    user = wiz.request.query()

    # customize for your database scheme

    required = ['id', 'password', 'email']
    for req in required:
        if req not in user:
            wiz.response.status(400, f"{req} must required")

    userdb = wiz.model("mysql/auth").use("users")
    check = userdb.get(id=user["id"])
    if check is not None:
        wiz.response.status(401, "userid exists")

    check = userdb.get(email=user["email"])
    if check is not None:
        wiz.response.status(401, "already joined email")

    if 'name_ko' in user:
        user['name_en'] = user['name_ko']

    user['status'] = 'ready'
    user['role'] = 'user'
    
    userdb.insert(user, password="PASSWORD(%s)")

    wiz.response.status(200, True)