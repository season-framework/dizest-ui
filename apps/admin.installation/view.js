let wiz_controller = async ($sce, $scope, $render, $alert, $file) => {
    $scope.step = 'step1';

    $scope.status = {};
    $scope.config = wiz.data.config;

    console.log($scope.config);

    $scope.uploader = async () => {
        $scope.config.logo = await $file.image({ size: 180, limit: 1024 * 100 });
        await $render();
    }

    $scope.$watch('config.db', async () => {
        $scope.status.db = false;
        await $render();
    }, true);

    await $render();

    $scope.movestep = async (step) => {
        $scope.step = step;
        await $render();
    }

    $scope.step1 = async () => {
        let data = angular.copy($scope.config);
        data = JSON.stringify(data);
        await wiz.API.async("step1", { data: data });
        $scope.step = 'step2';
        await $render();
    }

    $scope.step2 = async () => {
        let data = angular.copy($scope.config);
        data = JSON.stringify(data);
        let res = await wiz.API.async("step2", { data: data });
        if (res.code == 200) {
            $scope.step = 'step3';
            await $render();
        } else if (res.code == 301) {
            location.href = "/auth/login";
        } else {
            await $alert("Database Configuration Error!");
        }
    }

    $scope.step3 = async (user) => {
        user = angular.copy(user);
        if (user.password != user.password_re) {
            await $alert('Password mismatch');
            return;
        }

        let res = await wiz.API.async('step3', user);

        if (res.code == 200) {
            location.href = "/auth/login";
            return;
        }

        await $alert(res.data);
    }
}