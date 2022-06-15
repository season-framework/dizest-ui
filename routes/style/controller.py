wiz.menu.sub \
    .add(title='Button', url="/style") \
    .add(title='Form', url="/style/form") \
    .build()

wiz.response.render("page.style")