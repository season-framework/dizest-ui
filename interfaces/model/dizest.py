import os
import sys
import season
import dizest
import urllib
import requests

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

    def manager(self):
        name = self.name
        manager = dizest.load(name, path=os.path.join(BASEPATH, 'kernelspec'), broker=self.broker)
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

