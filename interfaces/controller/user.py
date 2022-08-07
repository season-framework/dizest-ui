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
            .add(title='Mypage', ko="마이페이지", url='/mypage') \
            .add(title='Logout', ko="로그아웃", url='/auth/logout') \
            .add(title='Language', url='/language') \
                .child(title="English", url="?lang=en") \
                .child(title="한국어", url="?lang=ko") \
            .build()

        wiz.menu.main \
            .add(title='Workspace', ko="작업공간", type="header") \
            .add(title='Dashboard', url='/hub/dashboard', icon="fa-solid fa-table-columns") \
            .add(title='Workflow', url='/hub/workflow/list', icon="fa-solid fa-cubes") \
            .add(title='Explore', url='/hub/explore', icon="fa-solid fa-magnifying-glass") \
            .add(title='Drive', url='/hub/drive', icon="fa-solid fa-hard-drive")

        if wiz.session.get("role") == 'admin':
            wiz.menu.main \
                .add(title='Admin', ko="관리자", type="header") \
                .add(title='Setting', ko="설정", url='/hub/admin/setting', icon="fa-solid fa-cogs") \
                .add(title='Users', ko="사용자", url='/hub/admin/users', icon="fa-solid fa-users") \
                .add(title='Kernel', ko="커널", url='/hub/admin/kernel', icon="fa-solid fa-microchip") \
                .add(title='Web Resources', ko="Web Resources", url='/hub/admin/webresources', icon="fa-brands fa-html5")
        wiz.menu.main.build()
