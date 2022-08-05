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
    def config():
        try:
            fs = dizest.util.os.storage(BASEPATH)
            config = fs.read.json("dizest.json")
            config = season.stdClass(config)
            return config
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

    @staticmethod
    def drive(path=""):
        config = wiz.config("dizest")
        cwd = config.cwd()
        path = os.path.join(cwd, path)
        return Drive(path, cwd)

    def manager(self):
        name = self.name
        config = self.config()
        spawner_class = dizest.kernel.spawner.SimpleSpawner
        if config.spawner_class is not None:
            spawner_class = config.spawner_class
        manager = dizest.load(name, broker=self.broker, spawner_class=spawner_class)

        kernelspecs = config.kernelspec
        if kernelspecs is not None:
            manager.clear_kernelspec()
            for kernelspec in kernelspecs:
                manager.set_kernelspec(**kernelspec)
        
        manager.start()
        return manager

    def broker(self, spawner, flow_id, mode, data):
        try:
            host = self.host
            workflow_id = spawner.workflow.id()

            pd = dict()
            pd['mode'] = mode
            pd['manager'] = self.name
            pd['workflow_id'] = workflow_id
            pd['flow_id'] = flow_id
            pd['data'] = data

            res = requests.post(host, data=pd)
        except Exception as e:
            pass

