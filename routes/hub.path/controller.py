wiz.response.render("/hub/dashboard/<path:path>", "hub.dashboard")
wiz.response.render("/hub/workflow/item/<workflow_id>/<path:path>", "dizest.workflow.editor", manager_id="main", url="/hub/workflow/list", db='workflow')

wiz.response.render("/hub/workflow/list", "hub.workflow.list")
if wiz.match("/hub/workflow/<path:path>") is not None:
    wiz.response.redirect("/hub/workflow/list")

wiz.response.render("/hub/drive/<mode>", "page.hub.drive")

wiz.response.redirect("/hub/dashboard")