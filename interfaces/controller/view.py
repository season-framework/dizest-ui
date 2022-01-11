import season
import datetime
import json
import os

class Controller(wiz.controller("base")):
    def __startup__(self, wiz):
        super().__startup__(wiz)
        
        menu = []
        menu.append({ 'title': 'WIZ', 'url': '/wiz' })
        if wiz.session.has("id"):
            menu.append({ 'title': 'My Page', 'url': '/mypage' })
            menu.append({ 'title': 'Logout', 'url': '/auth/logout' })
        else:
            menu.append({ 'title': 'Sign up', 'url': '/auth/join' })
            menu.append({ 'title': 'Sign in', 'url': '/auth/login' })
        self.set_menu(top=menu)

        menu = []
        menu.append({ 'title': 'Home', 'url': '/' })
        menu.append({ 'title': 'About', 'url': '/about' })
        menu.append({ 'title': 'Project', 'url': '/project' })
        self.set_menu(main=menu)
