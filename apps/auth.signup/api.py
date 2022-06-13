def join(wiz):
    user = wiz.request.query()
    required = ['id', 'password', 'email']
    for req in required:
        if req not in user:
            wiz.response.status(400, f"{req} must required")

    userdb = wiz.model("orm").use('user')   # load orm
    userdb.create()                         # create table

    # check user id exists
    check = userdb.get(id=user["id"])
    if check is not None:
        wiz.response.status(401, "already joined id")

    # check email is exists
    check = userdb.get(email=user["email"])
    if check is not None:
        wiz.response.status(401, "already joined email")

    try:
        user['role'] = 'user'  # set role
        userdb.insert(user)    # craete user
    except Exception as e:
        wiz.response.status(500, str(e))

    wiz.response.status(200, True)