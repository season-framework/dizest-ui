import os
import sys
import season
import urllib
import requests
import dizest

BASEPATH = os.path.realpath(season.path.project + "/..")

class Model:
    def __init__(self, name):
        self.name = name
        self.branch = branch = wiz.branch()
        self.basenamespace = f"/wiz/app/{branch}"
        host = urllib.parse.urlparse(wiz.flask.request.base_url)
        self.host = f"{host.scheme}://{host.netloc}/dizest/api/kernel/log"
        
    @classmethod
    def load(cls, name):
        return cls(name)

    @staticmethod
    def config():
        fs = dizest.util.os.storage(BASEPATH)
        code = fs.read("config.py")
        env = season.stdClass()
        env.wiz = wiz
        exec(compile(code, fs.abspath(), 'exec'), env)
        return env

    @staticmethod
    def package(package=None):
        try:
            fs = dizest.util.os.storage(BASEPATH)
            if package is None:
                package = fs.read.json("dizest.json")
                package = season.stdClass(package)
                return package
            
            fs.write.json("dizest.json", package)
        except:
            return None
    
    @staticmethod
    def status():
        config = Model.package()
        if config is None:
            return False
        try:
            db = wiz.model("orm").use("user")
            count = db.count()
            if count == 0 or count == None:
                return False
        except:
            return False
        return True

    def broker(self, workflow, flow_id, mode, data):
        try:
            host = self.host
            workflow_id = workflow.id()

            pd = dict()
            pd['mode'] = mode
            pd['server'] = self.name
            pd['workflow_id'] = workflow_id
            pd['flow_id'] = flow_id
            pd['data'] = data

            res = requests.post(host, data=pd)
        except Exception as e:
            pass

    def server(self, load=True):
        name = self.name

        if wiz.session.has("id") == False:
            return None
        
        if wiz.session.get("id") is None:
            return None

        configpy = self.config()
        cwd = configpy.cwd()
        spawner_class = dizest.spawner.SimpleSpawner
        if configpy.spawner_class is not None:
            spawner_class = configpy.spawner_class

        server = dizest.server(name, broker=self.broker, spawner_class=spawner_class, cwd=cwd, user=wiz.session.get("id"))
        
        config = self.package()
        kernelspecs = config.kernelspec
        if kernelspecs is not None:
            server.clear_kernelspec()
            for kernelspec in kernelspecs:
                server.set_kernelspec(**kernelspec)
        
        if load:
            server.start()
        return server