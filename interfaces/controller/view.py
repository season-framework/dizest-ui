import season
import datetime
import json
import os

class Controller(wiz.controller("base")):
    def __init__(self):
        super().__init__()

        if wiz.session.has("id"):
            wiz.menu.top \
                .add(title='WIZ', url='/wiz') \
                .add(title='My Page', url='/mypage') \
                .add(title='Logout', url='/auth/logout') \
                .build()
        else:
            wiz.menu.top \
                .add(title='WIZ', url='/wiz') \
                .add(title='Sign-up', url='/auth/join') \
                .add(title='Sign-in', url='/auth/login') \
                .build()

        wiz.menu.main \
            .add(title='Styles', url='/style', icon="fa-solid fa-brush") \
            .add(title='Side Style', url='/side', icon="fa-solid fa-list") \
                .child(title='Buttons', url='/side/buttons', icon="fa-solid fa-code") \
                .child(title='test', url='/side/test', icon="fa-brands fa-rocketchat") \
            .add(title='Tutorial', url='/tutorial', icon="fa-solid fa-book") \
                .child(title='Use Database', url='/tutorial/database') \
                .child(title='Chat Example', url='/tutorial/chat') \
            .build()
