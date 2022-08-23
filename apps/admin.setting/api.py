import sys
import os
import season
import json
import time
import psutil
import signal
import subprocess
import requests
import dizest

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
        BASEPATH = os.path.realpath(season.path.project + "/..")
        icon = files[0]
        ext = os.path.splitext(icon.filename)[-1]
        ext = ext.lower()
        if ext == '.png':
            fs = season.util.os.FileSystem(BASEPATH)
            fs.write.file('icon.png', icon)
    except Exception as e:
        pass
    wiz.response.status(200)

def health():
    wiz.response.status(200)

def restart():    
    pid = os.getpid()
    for child in psutil.Process(pid).children(recursive=True):
        os.kill(int(child.pid), signal.SIGKILL)
    os.kill(int(pid), signal.SIGKILL)
    wiz.response.status(200)

def upgrade():
    BASEPATH = os.path.realpath(season.path.project + "/..")
    current = os.getcwd()
    os.chdir(BASEPATH)

    cmd = str(sys.executable) + " -m pip install dizest --upgrade"
    cmd = cmd.split(" ")
    output = subprocess.run(cmd, capture_output=True)
    
    cmd = str(sys.executable) + " -m dizest.cmd update"
    cmd = cmd.split(" ")
    output = subprocess.run(cmd, capture_output=True)

    os.chdir(current)
    
    pid = os.getpid()
    for child in psutil.Process(pid).children(recursive=True):
        os.kill(int(child.pid), signal.SIGKILL)
    os.kill(int(pid), signal.SIGKILL)
    wiz.response.status(200)

def check_update():
    try:
        res = requests.get("https://raw.githubusercontent.com/season-framework/dizest-ui/main/config/version.txt", timeout=5)
        latest_ui_version = str(res.text)
    except Exception as e:
        latest_ui_version = None

    try:
        res = requests.get("https://raw.githubusercontent.com/season-framework/dizest/main/src/dizest/version.py", timeout=5)
        code = str(res.text)
        env = dict()
        exec(code, env)
        latest_version = env['VERSION_STRING']
    except Exception as e:
        latest_version = None
    
    dizest_version = dizest.version
    ui_version = wiz.model("dizest").VERSION

    is_update = False
    if latest_version is not None and latest_ui_version is not None:
        if dizest_version != dizest_version:
            is_update = True
        if latest_ui_version != ui_version:
            is_update = True
    
    wiz.response.status(200, dizest_version=latest_version, dizest_ui_version=latest_ui_version, is_update=is_update)
