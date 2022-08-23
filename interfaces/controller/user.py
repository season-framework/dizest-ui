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
            .add(title='Mypage', ko="마이페이지", url='/hub/mypage') \
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
                .add(title='Users', ko="사용자관리", url='/hub/admin/users', icon="fa-solid fa-users") \
                .add(title='Package', ko="패키지관리", url='/hub/admin/package', icon="fa-solid fa-boxes-packing") \
                .add(title='Releases', ko="릴리즈", url='/hub/admin/release', icon="fa-solid fa-book")
        wiz.menu.main.build()
