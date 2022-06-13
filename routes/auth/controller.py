wiz.response.render('/auth/login', "auth.signin")
wiz.response.render('/auth/join', "auth.signup")

if wiz.match("/auth/logout") is not None:
    if wiz.session.has("id"):
        wiz.session.clear()
    wiz.response.redirect("/auth/login")

if wiz.session.has("id"):
    wiz.response.redirect("/")

wiz.response.redirect("/auth/login")