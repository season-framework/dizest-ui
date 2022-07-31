import os
import season
import time
import builtins
import urllib
import requests
import traceback
import datetime

db = wiz.model("orm").use("workflow")

class Controller:
    def __init__(self):
        pass
        
    def join(self, wiz, data, io):
        try:
            io.join(data)
            io.emit("join", data, to=data, broadcast=True)
        except:
            pass

    def connect(self, wiz, data):
        pass

    def disconnect(self, wiz, data):            
        pass
