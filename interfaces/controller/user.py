import season
import datetime
import json
import os

class Controller(wiz.controller("base")):
    def __init__(self):
        super().__init__()

        if wiz.session.has("id") == False:
            wiz.response.redirect("/")

        wiz.menu.top \
            .add(title='WIZ', url='/wiz') \
            .add(title='Mypage', ko="마이페이지", url='/mypage') \
            .add(title='Logout', ko="로그아웃", url='/auth/logout') \
            .add(title='Language', url='/language') \
                .child(title="English", url="?lang=en") \
                .child(title="한국어", url="?lang=ko") \
            .build()

        wiz.menu.main \
            .add(title='Workspace', ko="작업공간", type="header") \
            .add(title='Dashboard', ko="대시보드", url='/hub/dashboard', icon="fa-solid fa-cubes") \
            .add(title='Workflow', ko="워크플로우", url='/hub/workflow/list', icon="fa-solid fa-cubes") \
            .add(title='Drive', ko="드라이브", url='/hub/drive', icon="fa-solid fa-folder-tree") \
            .build()
