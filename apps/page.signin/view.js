let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    $scope.login = async (user) => {
        user = angular.copy(user);
        let res = await wiz.API.async('login', user);

        if (res.code == 200) {
            location.href = "/";
            return;
        }

        await wiz.connect("component.modal")
            .data({
                title: "Warning",
                message: res.data,
                btn_close: "Cancel",
                btn_action: "Confirm",
                btn_class: "btn-primary"
            })
            .event("modal-show");
    }
}