let wiz_controller = async ($scope, $render, $alert, $file) => {
    $scope.status = {};
    $scope.config = wiz.data.config;
    $scope.processes = wiz.data.processes;

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

    await $render();
}