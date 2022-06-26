wiz.res.theme("dizest") \
    .js('libs/ckeditor/dizest/translations/en.js') \
    .js('libs/ckeditor/dizest/ckeditor.js') \
    .js('libs/sortable/sortable.min.js') \
    .js('libs/sortable/sortable.ng.js') \
    .ng('ui.sortable') \
    .css('libs/drawflow/drawflow.css') \
    .js('libs/drawflow/drawflow.js') \
    .js('libs/ansi/ansi.js') \
    .js('libs/monaco/ui-monaco.js') \
    .ng('ui.monaco') \
    .js('libs/monaco/min/vs/loader.js', onload=True) \
    .script("require.config({ paths: { vs: '/resources/themes/dizest/libs/monaco/min/vs' } });")

wpid = wiz.request.segment.workflow_id
db = wiz.model("dizest/orm").use("workflow")
workflow = db.get(id=wpid)
if workflow is not None:
    if workflow['user_id'] != wiz.session.get("id"):
        wiz.response.redirect("/")
kwargs['workflow'] = workflow
