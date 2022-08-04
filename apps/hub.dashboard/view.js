let wiz_controller = async ($scope, $loading, $render) => {
    $scope.data = wiz.data.data;

    $scope.timer = (time) => {
        let minute = Math.round(time / 60);
        if (minute == 0) return time + " sec";
        let hour = Math.round(minute / 60);
        if (hour == 0) return minute + " min";
        return hour + " hr"
    }

    let monitor = $scope.monitor = (() => {
        let obj = {};

        obj.active = true;
        obj.data = {};

        obj.load = async () => {
            let { code, data } = await wiz.API.async('health');
            if (code != 200) return;
            obj.data = data;
            await $render();
        }

        return obj;
    })();

    let workflow = $scope.workflow = (() => {
        let obj = {};

        obj.list = [];
        
        obj.status_class = (item) => {
            if (item.status == 'stop') return 'bg-secondary';
            if (item.status == 'running') return 'bg-primary';
            return 'bg-yellow';
        }

        obj.click = async (item) => {
            window.open('/hub/workflow/item/' + item.id, "_blank");
        }

        obj.load = async () => {
            let { code, data } = await wiz.API.async("workflow");
            if (code != 200) return;
            obj.list = data;
            await $render();
        }

        obj.stop = async () => {
            await $loading.show();
            await wiz.API.async("stop");
            await $loading.hide();
        }

        return obj;
    })();

    await monitor.load();
    await workflow.load();

    setInterval(async () => {
        if (monitor.active) {
            await monitor.load();
        }
    }, 1000);
}