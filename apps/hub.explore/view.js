let wiz_controller = async ($sce, $scope, $render, $loading, $file, $alert) => {
    await $loading.show();

    $scope.trustAsHtml = $sce.trustAsHtml;

    let workflow = $scope.workflow = (() => {
        let obj = {};
        obj.data = [];
        obj.ids = '[]';
        obj.status = {};

        obj.pager = {};
        obj.query = { page: 1, text: '' };

        obj.pagination = () => {
            const lastpage = obj.pager.lastpage * 1;
            const startpage = Math.floor((obj.query.page - 1) / 10) * 10 + 1;

            obj.pager.pages = [];
            for (let i = 0; i < 10; i++) {
                if (startpage + i > lastpage) break;
                obj.pager.pages.push(startpage + i);
            }
        }

        obj.page = async (page) => {
            if (page < 1) return;
            if (page > obj.pager.lastpage) page = obj.pager.lastpage;
            if (obj.query.page * 1 === page * 1) return;
            obj.query.page = page;
            await obj.search();
        }

        obj.search = async (refresh) => {
            if (refresh) {
                obj.query.page = 1;
            }

            let { code, data } = await wiz.API.async("list", angular.copy(obj.query));
            if (code != 200) return;
            let { rows, lastpage } = data;

            obj.data = rows;
            obj.pager.lastpage = lastpage;

            obj.ids = [];
            for (let i = 0; i < obj.data.length; i++)
                obj.ids.push(obj.data[i].id);
            obj.ids = JSON.stringify(obj.ids);

            obj.pagination();
            await $render();
            await $loading.hide();
        }

        obj.create = async () => {
            let pd = angular.copy(obj.importdata);
            let { code, data } = await wiz.API.async("create", { data: JSON.stringify(pd) });
            if (code != 200) {
                return await $alert(data);
            }
            location.reload();
        }

        return obj;
    })();

    let tab = $scope.tab = (() => {
        let obj = {};
        obj.active = null;

        obj.is = (value) => {
            if (obj.active == value) return true;
            return false;
        }

        obj.open = async (value) => {
            obj.active = value;
            await $render();
        }

        obj.close = async () => {
            obj.active = null;
            viewer.data = null;
            await $render();
        }

        return obj;
    })();

    let viewer = $scope.viewer = (() => {
        let obj = {};
        obj.data = null;

        obj.select = async (item) => {
            let { code, data } = await wiz.API.async("get", { id: item.id })
            if (code != 200) return await $alert('error on load');
            obj.data = data;
            tab.open('viewer');
            await $render();
        }

        obj.showdown = (text) => {
            let converter = new showdown.Converter();
            html = converter.makeHtml(text);
            html = $scope.trustAsHtml(html);
            return html;
        }

        obj.copy = async () => {
            let data = angular.copy(obj.data);
            delete data.id;
            delete data.user_id;
            delete data.created;
            delete data.updated;
            delete data.updatepolicy;

            data.visibility = 'private';
            if (!data.flow || !data.apps) {
                return $alert(wiz.dic.importerror);
            }

            workflow.importdata = data;
            workflow.importmode = 'copy';

            await tab.open("import");
            await $render();
        }

        return obj;
    })();

    await workflow.search();
}
