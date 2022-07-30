let wiz_controller = async ($scope, $render, $loading, $file, $alert) => {
    await $loading.show();
    
    let workflow = $scope.workflow = (() => {
        let obj = {};
        obj.data = [];

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

            obj.pagination();
            await $render();
            await $loading.hide();
        }

        obj.click = async (item) => {
            location.href = '/hub/workflow/item/' + item.id;
        }

        obj.import = async () => {
            let data = await $file.json(".dwp,.json");
            delete data.id;
            delete data.user_id;
            delete data.created;
            delete data.updated;
            delete data.updatepolicy;

            data.visibility = 'private';
            if (!data.flow || !data.apps) {
                return $alert(wiz.dic.importerror);
            }

            obj.importdata = data;

            await $render();
            $('#import-modal').modal("show");
        }

        obj.create = async () => {
            let pd = angular.copy(obj.importdata);
            let { code, data } = await wiz.API.async("create", { data: JSON.stringify(pd) });
            $('#import-modal').modal("hide");
            if (code != 200) {
                return await $alert(data);
            }
            location.reload();
        }

        return obj;
    })();

    await workflow.search();
}
