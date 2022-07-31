app.factory('$file', () => {
    return (() => {
        let obj = {};
        let wiz = window.season_wiz.load();

        obj.json = async (accept) => {
            if (!accept) accept = 'json';
            return await wiz.connect("dizest.component.file").data(accept).event("json");
        }

        obj.image = async (opts) => {
            if (!opts) opts = {};
            return await wiz.connect("dizest.component.file").data(opts).event("image");
        }

        return obj;
    })();
});