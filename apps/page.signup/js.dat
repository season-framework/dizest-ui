let wiz_controller = async ($sce, $scope, $timeout) => {
    let alert = async (message) => {
        await wiz.connect("modal.message")
            .data({
                title: "Warning",
                message: message,
                btn_close: "Cancel",
                btn_action: "Confirm",
                btn_class: "btn-warning"
            })
            .event("modal-show");
    }


    $scope.join = async (user) => {
        user = angular.copy(user);

        if (user.password != user.password_re) {
            await alert('Password mismatch');
            return;
        }

        let res = await wiz.API.async('join', user);

        if (res.code == 200) {
            location.href = "/auth/login";
            return;
        }

        await alert(res.data);
    }
}