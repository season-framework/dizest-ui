wiz.res.theme("dizest") \
    .js('libs/sortable/sortable.min.js') \
    .js('libs/sortable/sortable.ng.js') \
    .ng('ui.sortable') \
    .js('libs/season/dragger.js') \
    .js('libs/season/dragger.ng.js') \
    .ng('season.dragger')

if 'server_id' not in kwargs: kwargs['server_id'] = 'main'