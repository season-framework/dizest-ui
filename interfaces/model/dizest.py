import os
import sys
import season
import json
import urllib
import requests
import dizest

BASEPATH = os.path.realpath(season.path.project + "/..")

class Model:
    VERSION = "v2022.08.18.2223"

    def __init__(self, name):
        self.name = name
        self.branch = branch = wiz.branch()
        self.basenamespace = f"/wiz/app/{branch}"
        self.configpy = Model.config()
        host = urllib.parse.urlparse(wiz.flask.request.base_url)
        
        self.host = f"{host.scheme}://{host.netloc}/dizest/api/kernel/log"
        if self.configpy.broker_api is not None:
            self.host = self.configpy.broker_api
        
    @classmethod
    def load(cls, name):
        return cls(name)

    @staticmethod
    def config():
        fs = dizest.util.os.storage(BASEPATH)
        code = fs.read("config.py")
        env = os.environ.copy()
        env['wiz'] = wiz
        exec(compile(code, fs.abspath(), 'exec'), env)
        env = season.stdClass(env)
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

    def broker(self, logs):
        try:
            pd = dict()
            pd['server'] = self.name
            pd['logs'] = json.dumps(logs)
            
            host = self.host
            res = requests.post(host, data=pd)
        except Exception as e:
            pass

    def server(self, user_id=None):
        name = self.name

        if wiz.session.has("id") == False:
            return None
        
        if wiz.session.get("id") is None:
            return None

        configpy = self.configpy

        spawner_class = dizest.spawner.SimpleSpawner
        if configpy.spawner_class is not None:
            spawner_class = configpy.spawner_class

        kwargs = dict()
        kwargs['broker'] = self.broker
        kwargs['spawner_class'] = spawner_class

        if configpy.executable is not None:
            kwargs['executable'] = configpy.executable

        if user_id is None:
            kwargs['cwd'] = configpy.cwd(wiz.session.get("id"))
            kwargs['user'] = wiz.session.get("id")
        else:
            kwargs['cwd'] = configpy.cwd(user_id)
            kwargs['user'] = user_id

        server = dizest.server(name, **kwargs)
        
        config = self.package()
        
        kernelspecs = configpy.kernelspec
        if kernelspecs is None:
            kernelspecs = config.kernelspec

        if kernelspecs is not None:
            server.clear_kernelspec()
            for kernelspec in kernelspecs:
                server.set_kernelspec(**kernelspec)
        
        if user_id is None:
            server.start()
        return server