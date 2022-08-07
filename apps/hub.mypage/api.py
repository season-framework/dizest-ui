def update():
    data = wiz.request.query()
    if 'repeat_password' in data:
        del data['repeat_password']
    if 'id' in data: del data['id']
    if 'role' in data: del data['role']
    if '_permanent' in data: del data['_permanent']
    
    user_id = wiz.session.get("id")
    db = wiz.model("orm").use("user")
    db.update(data, id=user_id)

    user = db.get(id=user_id)
    del user['password']
    wiz.session.set(**user)
    wiz.response.status(200)