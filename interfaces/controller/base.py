import season
import datetime
import json
import os

class Menu:
    def __init__(self):
        self.data = dict()

    def __getattr__(self, key):
        if key not in self.data:
            self.data[key] = self.MenuItem(key)
        return self.data[key]
    
    class MenuItem:
        def __init__(self, name):
            self.name = name
            self.data = []
        
        def build(self):
            menus = self.data
            request = wiz.request
            for menu in menus:
                pt = None
                if 'pattern' in menu: pt = menu['pattern']
                elif 'url' in menu: pt = menu['url']

                if pt is not None:
                    if request.match(pt): menu['class'] = 'active'
                    else: menu['class'] = ''

                if 'child' in menu:
                    menu['show'] = ''
                    for i in range(len(menu['child'])):
                        child = menu['child'][i]
                        cpt = None
                    
                        if 'pattern' in child: cpt = child['pattern']
                        elif 'url' in child: cpt = child['url']

                        if menu['class'] == 'active':
                            menu['show'] = 'active'

                        if cpt is not None:
                            if request.match(cpt): 
                                menu['child'][i]['class'] = 'active'
                            else: 
                                menu['child'][i]['class'] = ''
            
            data = wiz.response.data.get("menu")
            key = self.name
            if data is None: data = dict()
            data[key] = menus
            wiz.response.data.set(menu=data)

        def add(self, **menu):
            self.data.append(menu)
            return self

        def child(self, **menu):
            if 'child' not in self.data[-1]:
                self.data[-1]['child'] = []
            self.data[-1]['child'].append(menu)
            return self

class Controller:
    def __init__(self):
        wiz.menu = Menu()
        wiz.session = wiz.model("session").use()
        sessiondata = wiz.session.get()
        wiz.response.data.set(session=sessiondata)

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
