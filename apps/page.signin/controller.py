if wiz.session.has("id"):
    wiz.response.redirect("/")

db = wiz.model("orm").use("user")
count = db.count()
if count == 0:
    wiz.response.redirect("/")
