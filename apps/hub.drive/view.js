let wiz_controller = async ($sce, $scope, $render, $alert, $util, $loading, $file) => {
    await $loading.show();

    let DRIVE_API = (() => {
        let obj = {};

        obj.url = (fnname) => {
            let url = wiz.API.url("drive_api/" + wiz.data.server_id + "/" + fnname);
            return url;
        }

        obj.call = async (fnname, data) => {
            let url = "drive_api/" + wiz.data.server_id + "/" + fnname;
            return await wiz.API.async(url, data);
        }

        return obj;
    })();

    window.drive = $scope.drive = (() => {
        let obj = {};

        obj.current = "";
        obj.files = [];
        obj.is_create = false;
        obj.create_name = '';
        obj.checked = [];
        obj.checked_all = false;

        obj.drop = {
            text: "Drop File Here!",
            ondrop: async (e, files) => {
                let fd = new FormData();
                let filepath = [];
                for (let i = 0; i < files.length; i++) {
                    fd.append('file[]', files[i]);
                    filepath.push(files[i].filepath);
                }
                fd.append("filepath", JSON.stringify(filepath));
                await drive.api.upload(fd);
            }
        };

        obj.toggle = async () => {
            leftmenu.toggle('drive');
            if (leftmenu.is('drive'))
                await obj.api.ls();
            await $render();
        }

        obj.check = async (file) => {
            if (!file) {
                let checkstatus = true;
                if (obj.checked.length > 0) {
                    checkstatus = false;
                    obj.checked = [];
                }

                for (let i = 0; i < obj.files.length; i++) {
                    obj.files[i].checked = checkstatus;
                    if (checkstatus)
                        obj.checked.push(obj.files[i].name);
                }

                obj.checked_all = checkstatus;
                await $render();
                return;
            }

            file.checked = !file.checked;
            if (file.checked && !obj.checked.includes(file.name)) {
                obj.checked.push(file.name);
            }
            if (!file.checked) {
                obj.checked.remove(file.name);
            }

            obj.checked_all = obj.checked.length > 0;
            await $render();
        }

        obj.create = async () => {
            obj.is_create = true;
            await $render();
        }

        obj.filesize = (value) => {
            if (!value) return "0B";
            let kb = value / 1024;
            if (kb < 1) return value + "B";
            let mb = kb / 1024;
            if (mb < 1) return Math.round(kb * 100) / 100 + "KB";
            let gb = mb / 1024;
            if (gb < 1) return Math.round(mb * 100) / 100 + "MB";
            return Math.round(gb * 100) / 100 + "GB";
        }

        obj.timer = (value) => {
            return moment(new Date(value * 1000)).format("YYYY-MM-DD HH:mm:ss");
        }

        obj.rename = async (file) => {
            file.rename = file.name;
            file.edit = true;
            await $render();
        }

        obj.upload = async () => {
            $('#file-uploader').click();
        }

        obj.click = async (file) => {
            if (file.type == 'folder') {
                await obj.cd(file.name);
                return;
            }
        }

        obj.cd = async (path) => {
            let root = obj.current.split("/");
            paths = path.split("/");
            for (let i = 0; i < paths.length; i++) {
                let fname = paths[i];
                if (!fname) continue;
                if (fname == '.') continue;
                if (fname == '..') root.pop();
                else root.push(fname);
            }
            obj.current = root.join("/");
            await obj.api.ls();
        }

        obj.api = {};

        obj.api.create = async () => {
            if (!obj.create_name || obj.create_name.length == 0) {
                obj.is_create = false;
                await $render();
                return;
            }

            let { code, data } = await DRIVE_API.call('create' + obj.current, { name: obj.create_name });
            if (code == 401) return await $alert('file name already exists');
            obj.create_name = '';
            obj.is_create = false;
            await obj.api.ls();
        }

        obj.api.download = (file) => {
            return DRIVE_API.url('download' + obj.current + "/" + encodeURIComponent(file.name));
        }

        obj.api.ls = async () => {
            let { code, data } = await DRIVE_API.call('ls' + obj.current);
            if (code != 200) return;
            data.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            data.sort((a, b) => {
                return b.type.localeCompare(a.type);
            });
            obj.files = data;
            obj.checked = [];
            obj.checked_all = false;
            await $render();
        }

        obj.api.rename = async (file) => {
            if (file.name == file.rename) {
                file.edit = false;
                await $render();
                return;
            }
            if (!file.rename || file.rename.length == 0) return await $alert('filename length must 1 chars');
            let fdata = angular.copy(file);
            let { code, data } = await DRIVE_API.call('rename' + obj.current, { name: fdata.name, rename: fdata.rename });
            if (code == 401) return await $alert('file name already exists');
            await obj.api.ls();
        }

        obj.api.remove = async (file, donotreload) => {
            let fdata = angular.copy(file);
            await DRIVE_API.call('remove' + obj.current, { name: fdata.name });
            if (!donotreload)
                await obj.api.ls();
        }

        obj.api.upload = async (fd) => {
            await $loading.show();

            let fn = (fd) => new Promise((resolve) => {
                let url = DRIVE_API.url('upload' + obj.current);
                $.ajax({
                    url: url,
                    type: 'POST',
                    data: fd,
                    cache: false,
                    contentType: false,
                    processData: false
                }).always(function (res) {
                    resolve(res);
                });
            });

            await fn(fd);
            await obj.api.ls();
            $('#file-uploader').val(null);
            await $loading.hide();
        }

        obj.api.remove_all = async () => {
            await $loading.show();
            for (let i = 0; i < obj.files.length; i++) {
                if (obj.checked.includes(obj.files[i].name)) {
                    await obj.api.remove(obj.files[i], true);
                }
            }
            await obj.api.ls();
            await $loading.hide();
        }

        return obj;
    })();

    document.getElementById('file-uploader').onchange = async () => {
        let fd = new FormData($('#file-form')[0]);
        await drive.api.upload(fd);
    };

    await drive.api.ls();
    await $loading.hide();
}