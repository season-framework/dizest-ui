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
                .add(title='Mypage', ko="마이페이지", url='/mypage') \
                .add(title='Logout', ko="로그아웃", url='/auth/logout')
        else:
            wiz.menu.top \
                .add(title='Sign-up', ko="회원가입", url='/auth/join') \
                .add(title='Sign-in', ko="로그인", url='/auth/login')
        
        wiz.menu.top \
            .add(title='Language', url='/language') \
                .child(title="English", url="?lang=en") \
                .child(title="한국어", url="?lang=ko") \
            .build()

        wiz.menu.main \
            .add(title='Dashboard', url='/', pattern=r"^/$", icon="fa-solid fa-home") \
            .add(title='Concept', url='/concept', icon="fa-solid fa-lightbulb") \
            .add(title='Styles', url='/style', icon="fa-solid fa-brush") \
            .add(title='Sidebar', url='/side', icon="fa-solid fa-list") \
                .child(title='Buttons', url='/side/buttons', icon="fa-solid fa-code") \
                .child(title='test', url='/side/test', icon="fa-brands fa-rocketchat") \
            .add(title='Tutorial', url='/tutorial', icon="fa-solid fa-book") \
                .child(title='Use Database', url='/tutorial/database', icon="fa-solid fa-database") \
                .child(title='Chat Example', url='/tutorial/chat', icon="fa-brands fa-rocketchat") \
            .build()
