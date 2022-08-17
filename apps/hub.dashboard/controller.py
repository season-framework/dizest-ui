import season
import dizest
import os
import time
import psutil
import platform
import resource

user_id = wiz.session.get("id")

db = season.stdClass()
db.workflow = wiz.model("orm").use("workflow")
db.user = wiz.model("orm").use("user")

config = wiz.model("dizest").package()
process = psutil.Process(os.getpid())

data = season.stdClass()
data.deploy = season.stdClass()
data.deploy.dizest_version = dizest.version
data.deploy.dizest_ui_version = wiz.model("dizest").VERSION
data.deploy.wiz_version = season.version
data.deploy.python_version = platform.python_version()
data.deploy.database = config.db.type

data.system = season.stdClass()

data.system.memory = season.stdClass()
data.system.memory.usage = psutil.virtual_memory().used
data.system.memory.dizest_usage = process.memory_info().rss
data.system.memory.total = psutil.virtual_memory().total

data.system.cpu = season.stdClass()
data.system.cpu.count = psutil.cpu_count()
data.system.cpu.usage = psutil.cpu_percent()
data.system.cpu.dizest_usage = process.cpu_percent()

data.system.disk = season.stdClass()
hdd = psutil.disk_usage('/')
data.system.disk.total = hdd.total
data.system.disk.used = hdd.used
data.system.disk.free = hdd.free

data.dizest = season.stdClass()
data.dizest.users = db.user.count()
data.dizest.workflows = db.workflow.count(user_id=user_id)

kwargs['data'] = dict(data)