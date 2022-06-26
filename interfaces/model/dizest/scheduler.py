import season
import os
import sys
import datetime
import time
import urllib
sys.path.insert(0, '/opt/workspace/dizest/src')
import dizest

BASEPATH = os.path.realpath(season.path.project + "/..")

class Model:
    def __init__(self, wpid, package=None):
        dizestconfig = wiz.model("dizest/config").load()
        kernel_cache = os.path.join(BASEPATH, "cache")
        kernel_mode = "spawn"

        if dizestconfig.kernel is not None:
            if dizestconfig.kernel.cache is not None:
                kernel_cache = dizestconfig.kernel.cache
            if dizestconfig.kernel.mode is not None:
                kernel_mode = dizestconfig.kernel.mode

        host = urllib.parse.urlparse(wiz.flask.request.base_url)
        host = f"{host.scheme}://{host.netloc}/dizest/api/kernel"
        session = wiz.model("session").use()

        cache = self.cache = wiz.model("dizest/cache").use("dizest.workflow.cache")
        kernel = cache.get(wpid)
        if kernel is None:
            if package is not None:
                cwd = os.path.realpath(season.path.project + "/../storage/local/" + session.get("id"))
                workflow = dizest.Workflow(package, api=host, cwd=cwd, cache=kernel_cache, kernel_mode=kernel_mode)
                workflow.user_id = session.get("id")
                workflow.created = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                workflow.instance_id = int(time.time())
                kernel = workflow.kernel()
                cache.set(workflow.id(), kernel)
            else:
                kernel = None

        self.kernel = kernel

        if package is not None:
            self.kernel.workflow.update(package)
            self.kernel.update()

    @staticmethod
    def dizest():
        return dizest

    @staticmethod
    def running():
        cache = wiz.model("dizest/cache").use("dizest.workflow.cache")
        return cache.keys()

    def instance_id(self):
        return self.kernel.workflow.instance_id

    def start(self):
        self.kernel.start()

    def restart(self):
        try:
            self.kernel.kill()
        except:
            pass
        try:
            self.kernel.start()
        except:
            pass

    def stop(self):
        if self.kernel is None:
            return
        self.kernel.stop()
    
    def kill(self):
        cache = self.cache
        if self.kernel is None:
            return
        self.kernel.kill()
        cache.delete(self.kernel.workflow.id())

    def run(self, flow_id):
        try:
            self.kernel.run(flow_id)
        except:
            self.start()
            self.kernel.run(flow_id)

    def update(self, package):
        self.kernel.workflow.update(package)
        self.kernel.update()

    def status(self, flow_id=None):
        res = season.stdClass()
        if self.kernel is None:
            return res
        flow = self.kernel.workflow.flow(flow_id)
        if flow is None: return res
        res.flow_id = flow.id()
        res.status = flow.status.get("status", "ready")
        res.index = flow.status.get("index", 1)
        res.code = flow.status.get("code", 0)
        res.message = flow.status.get("message", "")
        return res

    def flow(self, flow_id):
        return self.kernel.workflow.flow(flow_id)