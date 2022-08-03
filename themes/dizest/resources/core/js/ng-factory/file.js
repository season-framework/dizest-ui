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

        obj.download = async (exportObj, exportName) => {
            if (!exportName) exportName = 'download.json';
            let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
            let downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", exportName);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        return obj;
    })();
});