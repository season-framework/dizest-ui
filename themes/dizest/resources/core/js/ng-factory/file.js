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

        obj.convert = {};
        obj.convert.json = (file) => new Promise((resolve) => {
            let fr = new FileReader();
            fr.onload = () => {
                let data = fr.result;
                data = JSON.parse(data);
                resolve(data);
            };
            fr.readAsText(file);
        });

        obj.upload = (url, fd, callback) => new Promise((resolve) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: fd,
                cache: false,
                contentType: false,
                processData: false,
                xhr: () => {
                    let myXhr = $.ajaxSettings.xhr();
                    if (myXhr.upload) {
                        myXhr.upload.addEventListener('progress', async (event) => {
                            let percent = 0;
                            let position = event.loaded || event.position;
                            let total = event.total;
                            if (event.lengthComputable) {
                                percent = Math.round(position / total * 10000) / 100;
                                if (callback) await callback(percent, total, position);
                            }
                        }, false);
                    }
                    return myXhr;
                }
            }).always(function (res) {
                resolve(res);
            });
        });

        return obj;
    })();
});