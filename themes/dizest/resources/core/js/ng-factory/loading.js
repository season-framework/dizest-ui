app.factory('$loading', () => {
    return (() => {
        let obj = {};
        let wiz = window.season_wiz.load();

        obj.show = async () => {
            await wiz.connect("dizest.component.loading").event("show");
        }

        obj.hide = async () => {
            await wiz.connect("dizest.component.loading").event("hide");
        }

        return obj;
    })();
});