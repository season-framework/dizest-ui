let wiz_controller = async ($scope, $render) => {
    $scope.loading = false;

    wiz.bind("status", async () => {
        return $scope.loading;
    });

    wiz.bind("show", async (mode) => {
        if (mode) $scope.mode = mode;
        else $scope.mode = 'spinner';
        $scope.progress = 0;
        $scope.message = null;
        $scope.loading = true;
        await $render();
        return true;
    });

    wiz.bind("hide", async () => {
        $scope.loading = false;
        await $render();
        return true;
    });

    wiz.bind("progress", async (percent) => {
        $scope.progress = percent;
        await $render();
        return true;
    });

    wiz.bind("message", async (text) => {
        $scope.message = text;
        await $render();
        return true;
    });
}