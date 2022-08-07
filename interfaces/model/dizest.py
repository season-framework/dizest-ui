import os
import sys
import season
import urllib
import requests
import dizest

BASEPATH = os.path.realpath(season.path.project + "/..")

class Drive(dizest.util.os.storage):
    def __init__(self, basepath, cwd):
        super().__init__(basepath)
        self.cwd = cwd
    
    def abspath(self, filepath=""):
        path = super().abspath(filepath)
        cwd = self.cwd
        if path[:len(cwd)] != cwd:
            raise Exception("Unauthroized")
        return path

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
    def config(config=None):
        try:
            fs = dizest.util.os.storage(BASEPATH)
            if config is None:
                config = fs.read.json("dizest.json")
                config = season.stdClass(config)
                return config
            
            fs.write.json("dizest.json", config)
        except:
            return None
    
    @staticmethod
    def status():
        config = Model.config()
        if config is None:
            return False
        try:
            db = wiz.model("orm").use("user")
            count = db.count()
            if count == 0:
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

    def server(self):
        name = self.name

        configpy = wiz.config("dizest")
        name = configpy.server(name)
        cwd = configpy.cwd()
        spawner_class = dizest.spawner.SimpleSpawner
        if configpy.spawner_class is not None:
            spawner_class = configpy.spawner_class

        server = dizest.server(name, broker=self.broker, spawner_class=spawner_class, cwd=cwd)
        
        config = self.config()
        kernelspecs = config.kernelspec
        if kernelspecs is not None:
            server.clear_kernelspec()
            for kernelspec in kernelspecs:
                server.set_kernelspec(**kernelspec)
        
        server.start()
        return server