let wiz_controller = async ($scope, $render, $alert) => {
    $scope.session = wiz.data.session;

    let users = $scope.users = (() => {
        let obj = {};

        obj.list = [];
        obj.selected = null;
        obj.status = {};

        obj.load = async () => {
            let { code, data } = await wiz.API.async('users');
            let {users, status} = data;
            obj.list = users;
            obj.status = status;
            await $render();
        }

        obj.select = async (item) => {
            obj.created = null;
            obj.selected = angular.copy(item);
            await $render();
        }

        obj.update = async () => {
            let user = angular.copy(obj.selected);

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

            obj.selected = null;
            await obj.load();
            await $render();
        }

        obj.create = async () => {
            obj.selected = null;
            obj.created = { role: 'user' };
            await $render();
        }

        obj.close = async () => {
            obj.created = null;
            await $render();
        }

        obj.send = async () => {
            let user = angular.copy(obj.created);
            if (!user.id || user.id.length < 4) return await $alert('user id must 4 characters or more');
            if (!user.password) return await $alert('password must 8 characters or more');
            if (user.password.length < 8)
                return await $alert('password must 8 characters or more');
            if (!user.repeat_password)
                return await $alert('check password');
            if (user.password != user.repeat_password)
                return await $alert('check password');

            let { code, data } = await wiz.API.async("create", user);
            if (code != 200) return await $alert(data);

            obj.created = null;
            await obj.load();
            await $render();
        }

        obj.delete = async () => {
            let res = await $alert("Are you sure delete this user?", { btn_action: 'Delete' });
            if (!res) return;
            let user = angular.copy(obj.selected);
            let { code, data } = await wiz.API.async("delete", user);
            if (code != 200) return await $alert(data);
            obj.selected = null;
            await obj.load();
            await $render();
        }

        return obj;
    })();

    await users.load();
}