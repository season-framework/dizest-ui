import season
import datetime
import json
import os

class Controller:
    def __startup__(self, wiz):
        self.__wiz__ = wiz
        wiz.session = wiz.model("session").use()

    def parse_json(self, jsonstr, default=None):
        try:
            return json.loads(jsonstr)
        except:
            pass
        return default

    def json_default(self, value):
        if isinstance(value, datetime.date):
            return value.strftime('%Y-%m-%d %H:%M:%S')
        return str(value).replace('<', '&lt;').replace('>', '&gt;')
