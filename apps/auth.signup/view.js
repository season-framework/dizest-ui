let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    let alert = async (message) => {
        await wiz.connect("component.modal")
            .data({
                title: "Warning",
                message: message,
                btn_close: "Cancel",
                btn_action: "Confirm",
                btn_class: "btn-red"
            })
            .event("modal-show");
    }

    $scope.join = async (user) => {
        if (!user) return;
        user = angular.copy(user);
        if (user.password != user.password_re) {
            await alert('Password mismatch');
            return;
        }

        delete user.password_re;
        let res = await wiz.API.async('join', user);

        if (res.code == 200) {
            await alert('Welcome!');
            location.href = "/auth/login";
            return;
        }

        await alert(res.data);
    }
}