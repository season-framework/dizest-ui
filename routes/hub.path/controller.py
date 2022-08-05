wiz.response.render("/hub/dashboard/<path:path>", "hub.dashboard")
wiz.response.render("/hub/workflow/item/<workflow_id>/<path:path>", "dizest.workflow.editor", manager_id="main", url="/hub/workflow/list", db='workflow')

wiz.response.render("/hub/workflow/list", "hub.workflow.list", manager_id="main")
if wiz.match("/hub/workflow/<path:path>") is not None:
    wiz.response.redirect("/hub/workflow/list")

if wiz.session.get("role") == "admin":
    wiz.response.render("/hub/admin/users", "admin.users")
    wiz.response.render("/hub/admin/setting", "admin.setting")

wiz.response.redirect("/hub/dashboard")