import season
import datetime
import json
import os

class Resource:
    def __init__(self):
        self.__theme__ = "default"

    def theme(self, theme):
        self.__theme__ = theme
        return self

    def css(self, url):
        if url[0] == "/": url = url[1:]
        theme = self.__theme__
        data = wiz.response.data.get("wiz_resources_css")
        if data is None: data = list()
        data.append(f"/resources/themes/{theme}/{url}")
        wiz.response.data.set(wiz_resources_css=data)
        return self
    
    def js(self, url, onload=False):
        if url[0] == "/": url = url[1:]
        theme = self.__theme__
        
        if onload: data = wiz.response.data.get("wiz_resources_js_load")
        else: data = wiz.response.data.get("wiz_resources_js")

        if data is None: data = list()
        data.append(f"/resources/themes/{theme}/{url}")
        
        if onload: wiz.response.data.set(wiz_resources_js_load=data)
        else: wiz.response.data.set(wiz_resources_js=data)
        
        return self

    def script(self, code):
        data = wiz.response.data.get("wiz_resources_script")
        if data is None: data = list()
        data.append(code)
        wiz.response.data.set(wiz_resources_script=data)
        return self

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

                lang = wiz.request.lang()
                if lang in menu: menu['title'] = menu[lang]
                if lang.lower() in menu: menu['title'] = menu[lang.lower()]

                menu['class'] = ''
                if pt is not None:
                    if request.match(pt): 
                        menu['class'] = 'active'

                if 'child' in menu:
                    menu['show'] = ''
                    for i in range(len(menu['child'])):
                        child = menu['child'][i]
                        cpt = None

                        if lang in menu['child'][i]: menu['child'][i]['title'] = menu['child'][i][lang]
                        if lang.lower() in menu['child'][i]: menu['child'][i]['title'] = menu['child'][i][lang.lower()]
                    
                        if 'pattern' in child: cpt = child['pattern']
                        elif 'url' in child: cpt = child['url']

                        if menu['class'] == 'active':
                            menu['show'] = 'active'

                        menu['child'][i]['class'] = ''
                        if cpt is not None:
                            try:
                                if request.match(cpt): 
                                    menu['child'][i]['class'] = 'active'
                            except:
                                pass
            
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

        def clear(self):
            self.data = []
            return self

class Controller:
    def __init__(self):
        wiz.menu = Menu()
        wiz.res = wiz.resource = Resource()

        wiz.session = wiz.model("session").use()
        sessiondata = wiz.session.get()
        wiz.response.data.set(session=sessiondata)

        lang = wiz.request.query("lang", None)
        if lang is not None:
            wiz.response.lang(lang)
            wiz.response.redirect(wiz.request.uri())

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
