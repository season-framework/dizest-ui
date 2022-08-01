let wiz_controller = async ($sce, $scope, $render, $alert) => {
    $scope.login = async (user) => {
        user = angular.copy(user);
        let res = await wiz.API.async('login', user);

        if (res.code == 200) {
            location.href = "/";
            return;
        }

        await $alert(res.data, {
            title: "Warning",
            btn_close: "Cancel",
            btn_action: "Confirm",
            btn_class: "btn-red"
        });
    }
}