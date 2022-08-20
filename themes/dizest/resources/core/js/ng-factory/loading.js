app.factory('$loading', () => {
    return (() => {
        let obj = {};
        let wiz = window.season_wiz.load();

        obj.show = async (mode) => {
            await wiz.connect("dizest.component.loading").data(mode).event("show");
        }

        obj.hide = async () => {
            await wiz.connect("dizest.component.loading").event("hide");
        }

        obj.progress = async (percent) => {
            await wiz.connect("dizest.component.loading").data(percent).event("progress");
        }

        obj.message = async (text) => {
            await wiz.connect("dizest.component.loading").data(text).event("message");
        }

        obj.status = async () => {
            await wiz.connect("dizest.component.loading").event("status");
        }

        return obj;
    })();
});