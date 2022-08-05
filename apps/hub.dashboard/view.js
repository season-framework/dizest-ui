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

        obj.ids = '[]';
        obj.list = [];

        obj.status_class = (status) => {
            if (status == 'stop') return 'bg-secondary';
            if (status == 'running') return 'bg-primary';
            return 'bg-yellow';
        }

        obj.click = async (item) => {
            window.open('/hub/workflow/item/' + item.id, "_blank");
        }

        obj.load = async () => {
            let { code, data } = await wiz.API.async("workflow");
            if (code != 200) return;
            obj.list = data;

            obj.ids = [];
            for (let i = 0; i < obj.list.length; i++)
                obj.ids.push(obj.list[i].id);
            obj.ids = JSON.stringify(obj.ids);

            await $render();
        }

        obj.stop = async () => {
            await $loading.show();
            await wiz.API.async("stop");
            await $loading.hide();
        }

        obj.get_status = async () => {
            let { code, data } = await wiz.API.async('status', { id: obj.ids });
            if (code != 200) return;
            obj.status = data;
            await $render();
        }

        return obj;
    })();

    await monitor.load();
    await workflow.load();

    setInterval(async () => {
        if (monitor.active) {
            await monitor.load();
            await workflow.get_status();
        }
    }, 1000);
}