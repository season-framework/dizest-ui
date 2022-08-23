import sys
import os
import season
import json
import time
import psutil
import signal
import subprocess

if wiz.session.get("role") != "admin":
    wiz.response.abort(401)

def update():
    data = wiz.request.query("data", True)
    data = json.loads(data)

    # update except db config
    prev = wiz.model("dizest").package()
    data['db'] = prev.db
    
    wiz.model("dizest").package(data)
    time.sleep(3)
    wiz.response.status(200)

def updatedb():
    prev = wiz.model("dizest").package()

    data = wiz.request.query("data", True)
    data = json.loads(data)

    datamigration = True
    try:
        model = wiz.model("orm").use('userf')
        users = model.rows()
        model = wiz.model("orm").use('workflow')
        workflow = model.rows()
    except:
        datamigration = False
    
    wiz.model("dizest").package(data)
    try:
        model = wiz.model("orm").use('userf')
        count = model.count()
        if count is None:
            wiz.model("orm").use('userf').create()
            wiz.model("orm").use('workflow').create()

        model = wiz.model("orm").use('userf')
        count = model.count()
        if count is None:
            raise Exception("Not connected")
        
        if count == 0 and datamigration:
            model = wiz.model("orm").use('userf')
            for user in users: model.insert(user)
            model = wiz.model("orm").use('workflow')
            for wp in workflow: model.insert(wp)
    except Exception as e:
        count = -1

    wiz.model("dizest").package(prev)
    
    if count == -1:
        wiz.response.status(500, count)

    prev['db'] = data['db']
    wiz.model("dizest").package(prev)

    time.sleep(3)
    wiz.response.status(200, count)

def upload():
    files = wiz.request.files()
    try:
        icon = files[0]
        ext = os.path.splitext(icon.filename)[-1]
        ext = ext.lower()
        if ext == '.png':
            respath = os.path.join(wiz.branchpath(), 'resources')
            fs = season.util.os.FileSystem(respath)
            fs.write.file('images/brand/icon.png', icon)
    except Exception as e:
        pass
    wiz.response.status(200)

def health():
    wiz.response.status(200)

def upgrade():
    BASEPATH = os.path.realpath(season.path.project + "/..")
    os.chdir(BASEPATH)

    cmd = str(sys.executable) + " -m pip install dizest --upgrade"
    cmd = cmd.split(" ")
    output = subprocess.run(cmd, capture_output=True)
    
    cmd = str(sys.executable) + " -m dizest.cmd update"
    cmd = cmd.split(" ")
    output = subprocess.run(cmd, capture_output=True)
    
    pid = os.getpid()
    for child in psutil.Process(pid).children(recursive=True):
        os.kill(int(child.pid), signal.SIGKILL)
    os.kill(int(pid), signal.SIGKILL)
    wiz.response.status(200)