let wiz_controller = async ($sce, $scope, $timeout) => {
    $scope.history = [];

    $scope.history.push({
        name: "v2022.08.23.1933",
        log: [
            "[workflow] add textarea option at flow input"
        ]
    });

    $scope.history.push({
        name: "v2022.08.23.1808",
        log: [
            "[workflow] input/output validate bug fixed",
            "[workflow] app asc sorted by title",
            "[workflow] flow status trigger (for fix error)",
            "[workflow] support UI Mode on mobile"
        ]
    });

    $scope.history.push({
        name: "v2022.08.23.1536",
        log: [
            "[admin] Releases Info",
            "[admin] UI / Core version update on web setting"
        ]
    });
}