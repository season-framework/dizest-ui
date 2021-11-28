import season
import datetime
import json
import os

class Controller(wiz.controller("base")):
    def __startup__(self, wiz):
        super().__startup__(wiz)
        
        if wiz.session.has("id") == False:
            wiz.response.abort(401)