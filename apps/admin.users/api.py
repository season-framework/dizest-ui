if wiz.session.get("role") != "admin":
    wiz.response.status(401)

def users():
    db = wiz.model("orm").use("user")
    rows = db.rows()
    for row in rows:
        del row['password']
    wiz.response.status(200, rows)

def update():
    data = wiz.request.query()
    if 'repeat_password' in data:
        del data['repeat_password']

    user_id = data['id']

    db = wiz.model("orm").use("user")
    db.update(data, id=user_id)

    wiz.response.status(200)

def create():
    data = wiz.request.query()
    if 'repeat_password' in data:
        del data['repeat_password']

    db = wiz.model("orm").use("user")

    user_id = data['id']
    if db.get(id=user_id) is not None:
        wiz.response.status(401, "user id already exists")

    email = data['email']
    if db.get(email=email) is not None:
        wiz.response.status(401, "email already exists")

    db.insert(data)
    wiz.response.status(200)

def delete():
    db = wiz.model("orm").use("user")
    user_id = wiz.request.query("id", True)
    db.delete(id=user_id)
    db = wiz.model("orm").use("workflow")
    db.delete(user_id=user_id)
    wiz.response.status(200)