let wiz_controller = async ($scope, $render, $alert) => {

    $scope.user = (() => {
        let obj = {};
        obj.data = wiz.data.session;

        obj.update = async () => {
            let user = angular.copy(obj.data);

            if (user.password) {
                if (user.password.length < 8)
                    return await $alert('password must 8 characters or more');
                if (!user.repeat_password)
                    return await $alert('check password');
                if (user.password != user.repeat_password)
                    return await $alert('check password');
            }

            let { code, data } = await wiz.API.async("update", user);
            if (code != 200) return await $alert(data);
            
            delete obj.data.password;
            delete obj.data.repeat_password;
            toastr.success('updated');
            await $render();
        }

        return obj;
    })();

}