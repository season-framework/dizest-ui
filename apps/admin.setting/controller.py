if wiz.session.get("role") != "admin":
    wiz.response.abort(401)

kwargs['session'] = wiz.session.get()
config = wiz.model("dizest").config()
kwargs['config'] = config