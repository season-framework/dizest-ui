let wiz_controller = async ($scope, $render, $alert, $file, $loading, $util) => {
    $scope.status = {};

    let info = $scope.info = (() => {
        let obj = {};

        obj.config = angular.copy(wiz.data.config);
        delete obj.config.db;

        obj.timestamp = {};
        obj.timestamp.icon = new Date().getTime();

        obj.uploader = {};
        obj.uploader.logo = async () => {
            obj.config.logo = await $file.image({ size: 180, limit: 1024 * 100 });
            await $render();
        }
        obj.uploader.icon = async () => {
            $("#file-uploader").click();
        }

        obj.updater = {};
        obj.updater.config = async () => {
            $loading.show();
            let config = angular.copy(obj.config);
            config = JSON.stringify(config);
            let { code, data } = await wiz.API.async("update", { data: config });
            if (code == 200) {
                toastr.success("config updated");
            } else {
                $alert(data);
            }
            $loading.hide();
        }

        obj.updater.icon = async (fd) => {
            await $loading.show('progress');
            let url = wiz.API.url('upload');
            await $render();
            await $file.upload(url, fd, async (percent, total, current) => {
                if (percent == 100 && $loading.status()) {
                    return await $loading.show();
                }
                total = $util.filesize(total);
                current = $util.filesize(current);
                await $loading.message('Uploading... ' + current + ' / ' + total + " (" + Math.round(percent) + "%)");
                await $loading.progress(percent);
            });
            $('#file-uploader').val(null);
            await $loading.hide();

            obj.timestamp.icon = new Date().getTime();
            await $render();
        }

        document.getElementById('file-uploader').onchange = async () => {
            let fd = new FormData($('#file-form')[0]);
            await obj.updater.icon(fd);
        };

        return obj;
    })();

    let database = $scope.database = (() => {
        let obj = {};

        obj.config = {};
        obj.config.db = angular.copy(wiz.data.config.db);
        obj.status = false;

        obj.update = async () => {
            if (obj.status) return;

            $loading.show();
            let config = angular.copy(obj.config);
            config = JSON.stringify(config);
            let { code, data } = await wiz.API.async("updatedb", { data: config });

            if (code == 200) {
                toastr.success("config updated");
            } else {
                await $alert("Database connection error");
            }

            await $render();
            $loading.hide();
        }

        $scope.$watch("database.config", async () => {
            obj.status = false;
            await $render();
        }, true);

        return obj;
    })();

    let updater = $scope.updater = (() => {
        let obj = {};
        obj.version = wiz.data.deploy;
        obj.latest = angular.copy(obj.version);

        obj.check = async () => {
            let { code, data } = await wiz.API.async("check_update");
            if (code != 200) return;
            obj.latest = data;
            await $render();
        }

        obj.upgrade = async (type) => {
            $loading.show();
            wiz.API.async("upgrade", { type: type });
            await $render(5000);
            while (true) {
                try {
                    let res = await wiz.API.async("health");
                    if (res.code == 200 || res.code == 401) {
                        location.reload();
                        return;
                    }
                } catch (e) {
                    await $render(1000);
                }
            }
        }

        return obj;
    })();

    await updater.check();
}