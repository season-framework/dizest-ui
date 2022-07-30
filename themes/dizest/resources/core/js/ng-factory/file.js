app.factory('$file', () => {
    return (() => {
        let obj = {};
        let wiz = window.season_wiz.load();

        obj.json = async (accept) => {
            if (!accept) accept = 'json';
            return await wiz.connect("component.file").data(accept).event("json");
        }

        return obj;
    })();
});