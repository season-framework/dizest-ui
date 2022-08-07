let wiz_controller = async ($scope, $render, $loading, $alert) => {
    let package = $scope.package = (() => {
        let obj = {};
        obj.kernelspec = wiz.data.dizest.kernelspec;
        obj.selected = obj.kernelspec[0].name;
        obj.installed = [];
        obj.text = '';

        obj.load = async () => {
            await $loading.show();
            let { code, data } = await wiz.API.async('load', { kernel_name: obj.selected });
            await $loading.hide();
            if (code != 200) {
                obj.installed = [];
            } else {
                obj.installed = data;
            }
            await $render();
        }

        obj.install = async () => {
            await $loading.show();
            let { code, data } = await wiz.API.async('package_installer', { kernel_name: obj.selected, package: obj.text });
            if (code != 200) {
                await $alert(data);
            }
            await $loading.hide();
            await package.load();
        }

        return obj;
    })();

    await package.load();
}