import os
import psutil
import dizest

if wiz.session.get("role") != "admin":
    wiz.response.abort(401)

kwargs['session'] = wiz.session.get()

config = wiz.model("dizest").package()
process = psutil.Process(os.getpid())

deploy = season.stdClass()
deploy.process_id = os.getpid()
deploy.subprocess = len(psutil.Process(os.getpid()).children(recursive=True))
deploy.cwd = os.getcwd()
deploy.dizest_version = dizest.version
deploy.dizest_ui_version = wiz.model("dizest").VERSION
kwargs['deploy'] = deploy

config = wiz.model("dizest").package()
kwargs['config'] = config