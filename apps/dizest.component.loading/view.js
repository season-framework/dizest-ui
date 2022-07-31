let wiz_controller = async ($scope, $render) => {
    $scope.loading = false;
    wiz.bind("show", async () => {
        $scope.loading = true;
        await $render();
        return true;
    });

    wiz.bind("hide", async () => {
        $scope.loading = false;
        await $render();
        return true;
    });
}