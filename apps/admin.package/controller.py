if wiz.session.get("role") != "admin":
    wiz.response.abort(401)
    
package = wiz.model("dizest").package()
kwargs['dizest'] = package