let wiz_controller = async ($scope, $render, $alert, $file, $loading, $util) => {
    $scope.status = {};
    $scope.config = wiz.data.config;
    $scope.processes = wiz.data.processes;
    $scope.timestamp = new Date().getTime();

    $scope.icon_updated = true;

    $scope.check = async () => {
        if ($scope.status.db) return;
        let data = angular.copy($scope.config);
        data = JSON.stringify(data);
        let res = await wiz.API.async("checkdb", { data: data });
        if (res.code == 200) {
            $scope.status.db = true;
        } else {
            await $alert("Database connection error");
        }

        await $render();
    }

    $scope.update = async () => {
        let data = angular.copy($scope.config);
        data = JSON.stringify(data);
        await wiz.API.async("update", { data: data, db: $scope.status.db });
        location.reload();
    }

    $scope.uploader = async () => {
        $scope.config.logo = await $file.image({ size: 180, limit: 1024 * 100 });
        await $render();
    }

    $scope.$watch('config.db', async () => {
        $scope.status.db = false;
        await $render();
    }, true);

    $scope.icon_upload = async () => {
        $("#file-uploader").click();
    }

    $scope.icon_update = async (fd) => {
        $scope.icon_updated = false;
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
        $scope.timestamp = new Date().getTime();

        $scope.icon_updated = true;
        await $render();
    }

    document.getElementById('file-uploader').onchange = async () => {
        let fd = new FormData($('#file-form')[0]);
        await $scope.icon_update(fd);
    };

    await $render();
}