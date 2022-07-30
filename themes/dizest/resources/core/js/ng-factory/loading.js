app.factory('$loading', () => {
    return (() => {
        let obj = {};
        let wiz = window.season_wiz.load();

        obj.show = async () => {
            await wiz.connect("component.loading").event("show");
        }

        obj.hide = async () => {
            await wiz.connect("component.loading").event("hide");
        }

        return obj;
    })();
});