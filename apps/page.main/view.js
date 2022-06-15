let wiz_controller = async ($sce, $scope, $timeout) => {
    $scope.link = async (url) => {
        location.href = url;
    }
}