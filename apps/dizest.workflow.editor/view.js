let wiz_controller = async ($sce, $scope, $render, $alert, $util, $loading, $file) => {
    await $loading.show();

    $scope.trustAsHtml = $sce.trustAsHtml;

    let API = async (fnname, data) => {
        if (!data) data = {};
        data['workflow_id'] = workflow.id;
        data['manager_id'] = workflow.manager_id;
        data['db'] = wiz.data.db;
        return await wiz.API.async(fnname, data);
    }

    let DRIVE_API = (() => {
        let obj = {};

        obj.url = (fnname) => {
            let url = wiz.API.url("drive_api/" + wiz.data.db + "/" + workflow.manager_id + "/" + workflow.id + "/" + fnname);
            return url;
        }

        obj.call = async (fnname, data) => {
            if (kernel.is('running')) return {};
            let url = "drive_api/" + wiz.data.db + "/" + workflow.manager_id + "/" + workflow.id + "/" + fnname;
            return await wiz.API.async(url, data);
        }

        return obj;
    })();

    window.options = $scope.options = (() => {
        let obj = {};
        obj.editor = {};

        obj.monaco = (language, editor_id) => {
            let opt = {
                value: '',
                language: language,
                theme: "vs",
                fontSize: 14,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                lineNumbers: 'off',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                glyphMargin: false,
                scrollbar: {
                    vertical: "hidden",
                    handleMouseWheel: false,
                },
                minimap: {
                    enabled: false
                }
            };

            opt.onLoad = async (editor) => {
                let monaco_auto_height = async () => {
                    const LINE_HEIGHT = 21;
                    const el = editor._domElement;
                    let counter = editor.getModel().getLineCount();
                    let height = counter * LINE_HEIGHT;
                    if (height < 105) height = 105;
                    el.style.height = height + 'px';
                    editor.layout();
                }

                await monaco_auto_height();

                editor.onDidChangeModelDecorations(monaco_auto_height);

                let shortcuts = shortcut.configuration(window.monaco);
                for (let shortcutname in shortcuts) {
                    let monacokey = shortcuts[shortcutname].monaco;
                    let fn = shortcuts[shortcutname].fn;
                    if (!monacokey) continue;

                    editor.addCommand(monacokey, async () => {
                        await fn();
                        await shortcut.bind();
                    });
                }

                if (editor_id) {
                    obj.editor[editor_id] = editor;
                }
            }

            return opt;
        }

        obj.monaco_code = (language) => {
            let opt = {
                value: '',
                language: language,
                theme: "vs",
                fontSize: 14,
                automaticLayout: true,
                minimap: {
                    enabled: false
                }
            };

            opt.onLoad = async (editor) => {
                let shortcuts = shortcut.configuration(window.monaco);
                for (let shortcutname in shortcuts) {
                    let monacokey = shortcuts[shortcutname].monaco;
                    let fn = shortcuts[shortcutname].fn;
                    if (!monacokey) continue;

                    editor.addCommand(monacokey, async () => {
                        await fn();
                        await shortcut.bind();
                    });
                }
            }

            return opt;
        }

        obj.sortableOptions = {
            stop: async () => {
                try {
                    for (let i = 0; i < node.data.length; i++) {
                        let flow = node.data[i];
                        workflow.data.flow[flow.id].order = i + 1;
                    }
                } catch (e) {
                }
            }
        };

        return obj;
    })();

    window.leftmenu = $scope.leftmenu = (() => {
        let obj = {};
        obj.view = 'app';

        obj.is = (view) => {
            return obj.view == view;
        }

        obj.toggle = async (view) => {
            if (obj.view == view) {
                obj.view = '';
            } else {
                obj.view = view;
            }
            await $render();
        }

        obj.btn_class = (view) => {
            if (view == obj.view) return 'btn-primary';
            return 'btn-white';
        }

        return obj;
    })();

    window.menubar = $scope.menubar = (() => {
        let obj = {};
        obj.view = null;

        obj.is = (view) => {
            return obj.view == view;
        }

        obj.toggle = async (view) => {
            if (obj.view == 'uimode') uimode.close();
            if (obj.view == view) {
                obj.view = '';
            } else {
                obj.view = view;
            }
            await $render();
        }

        obj.btn_class = (view) => {
            if (view == obj.view) return 'btn-primary';
            return 'btn-white';
        }

        return obj;
    })();

    window.info = $scope.info = (() => {
        let obj = {};

        obj.upload = {};

        obj.upload.logo = async () => {
            let file = await $file.image({ size: 128, limit: 1024 * 100 });
            workflow.data.logo = file;
            await $render();
        }

        obj.upload.featured = async () => {
            let file = await $file.image({ size: 512, limit: 1024 * 1024 });
            workflow.data.featured = file;
            await $render();
        }

        return obj;
    })();

    window.uimode = $scope.uimode = (() => {
        let obj = {};

        obj.iframe = false;
        obj.iframe_loaded = false;

        obj.render = async () => {
            if (!node.selected) return;
            if (!menubar.is('uimode')) return;
            let url = wiz.API.url("render/" + wiz.data.db + "/" + workflow.manager_id + "/" + workflow.id + "/" + node.selected.id);

            obj.iframe_loaded = false;
            obj.iframe = false;
            await $render();

            obj.iframe = true;
            await $render();

            $('#uimode-iframe').attr('src', url);
            $('#uimode-iframe').on('load', async () => {
                obj.iframe_loaded = true;
                await $render();
            });
        }

        obj.maximized = false;

        obj.maximize = async (maximized) => {
            if (maximized) {
                obj.maximized = true;
                await workflow.hide();
            } else {
                obj.maximized = false;
                if (obj.activetab.length == 0)
                    await workflow.show();
            }
            await $render();
        }

        obj.select = async (flow_id) => {
            if (flow_id) await node.select(flow_id);
            if (!menubar.is('uimode'))
                await menubar.toggle('uimode');
            await obj.render();
            await $render();
        }

        obj.sortable = { handle: '.uimode-codeselect' };

        obj.loaded = false;

        obj.activetab = [];
        obj.tab = {};

        let tab_builder = (mode, lang, display) => {
            let self = {};

            self.mode = mode;
            self.lang = lang;
            self.name = display ? display : mode;
            self.active = false;
            self.close = async () => {
                obj.activetab.remove(self.mode);
                self.active = false;
                obj.loaded = false;
                if (obj.activetab.length == 0)
                    await workflow.show();
                await $render();
                obj.loaded = true;
                await $render();
            }

            self.open = async () => {
                if (obj.activetab.includes(self.mode)) return;
                obj.activetab.push(self.mode);
                self.active = true;
                obj.loaded = false;
                await workflow.hide();
                await $render();
                obj.loaded = true;
                await $render();
            }

            return self;
        };

        obj.tab.head = tab_builder('head', 'pug', 'head (pug)');
        obj.tab.pug = tab_builder('pug', 'pug', 'body (pug)');
        obj.tab.js = tab_builder('js', 'javascript');
        obj.tab.css = tab_builder('css', 'scss', 'scss');
        obj.tab.api = tab_builder('api', 'python');

        obj.close = async () => {
            for (let key in obj.tab) {
                await obj.tab[key].close();
            }
            await workflow.show();
        }

        return obj;
    })();

    window.codeflow = $scope.codeflow = (() => {
        let obj = {};

        return obj;
    })();

    window.app = $scope.app = (() => {
        let obj = {};

        obj.struct = {
            title: 'new app',
            version: '1.0.0',
            description: '',
            cdn: { js: [], css: [] },
            inputs: [],
            outputs: [],
            code: '',
            api: '',
            pug: '',
            js: '',
            css: '',
            logo: ''
        };

        obj.data = [];
        obj.ishide = {};

        obj.load = async () => {
            obj.data = [];
            let apps = workflow.data.apps;
            for (let app_id in apps) {
                obj.data.push(apps[app_id]);
            }
            await $render();
        }

        obj.showdown = (text) => {
            let converter = new showdown.Converter();
            html = converter.makeHtml(text);
            html = $scope.trustAsHtml(html);
            return html;
        }

        obj.get = async (app_id) => {
            let apps = workflow.data.apps;
            if (apps[app_id])
                return apps[app_id];
            if (app_id)
                return null;

            app_id = $util.random();
            while (apps[app_id])
                app_id = $util.random();

            let newdata = angular.copy(obj.struct);
            newdata.id = app_id;

            workflow.data.apps[app_id] = newdata;
            await obj.load();

            return newdata;
        }

        obj.search = async (text) => {
            text = text.toLowerCase();
            for (let i = 0; i < obj.data.length; i++) {
                let isshow = [];
                try {
                    isshow.push(obj.data[i].title.toLowerCase().includes(text));
                } catch (e) {
                    isshow.push(true);
                }

                try {
                    isshow.push(obj.data[i].description.toLowerCase().includes(text));
                } catch (e) {
                    isshow.push(false);
                }
                obj.ishide[obj.data[i].id] = !(isshow[0] || isshow[1]);
            }

            await $render();
        }

        obj.validate = async (app_id) => {
            let data = angular.copy(await obj.get(app_id));

            if (!data.title || data.title.length == 0) {
                await $alert("App title is not filled.");
                return;
            }

            if (!data.version || data.version.length == 0) {
                await $alert("App Version is not filled.");
                return;
            }

            let checker = {};
            for (let i = 0; i < data.inputs.length; i++) {
                if (!data.inputs[i].name || data.inputs[i].name.length == 0) {
                    await $alert("Input name must be filled");
                    return;
                }

                if (data.inputs[i].name.includes(" ")) {
                    await $alert("Input name only allow alphabet and digits.");
                    return;
                }

                if (data.inputs[i].name.match(/[^a-z0-9_]/gi)) {
                    await $alert("Input name only allow alphabet and digits.");
                    return;
                }

                if (checker[data.inputs[i].name]) {
                    await $alert("Input name must be unique.");
                    return;
                }

                checker[data.inputs[i].name] = true;
            }

            checker = {};
            for (let i = 0; i < data.outputs.length; i++) {
                if (!data.outputs[i].name || data.outputs[i].name.length == 0) {
                    await $alert("Output name must be filled");
                    return;
                }

                if (data.outputs[i].name.includes(" ")) {
                    await $alert("Output name only allow alphabet and digits.");
                    return;
                }

                if (data.outputs[i].name.match(/[^a-z0-9_]/gi)) {
                    await $alert("Output name only allow alphabet and digits.");
                    return;
                }

                if (checker[data.outputs[i].name]) {
                    await $alert("Output name must be unique.");
                    return;
                }

                checker[data.outputs[i].name] = true;
            }

            return true;
        }

        obj.delete = async (app_id) => {
            let res = await $alert('Are you sure to delete?', { btn_action: 'Delete', btn_close: "Cancel" });
            if (!res) return;

            for (let flow_id in workflow.data.flow) {
                let app_id_check = workflow.data.flow[flow_id].app_id;
                if (app_id == app_id_check) {
                    await node.delete(flow_id);
                }
            }

            delete workflow.data.apps[app_id];
            await workflow.update();
            await obj.load();
        }

        obj.info = async () => {
            obj.desc_editable = false;
            await $render();
            if (!menubar.is('appinfo')) {
                await menubar.toggle('appinfo');
            }
        }

        obj.upload = {};

        obj.upload.logo = async () => {
            let file = await $file.image({ size: 128, limit: 1024 * 100 });
            workflow.data.apps[node.selected.app_id].logo = file;
            await $render();
        }

        return obj;
    })();

    window.node = $scope.node = (() => {
        let obj = {};

        obj.data = [];
        obj.selected = null;
        obj.last_timestamp = new Date().getTime();
        obj.editable = {}

        obj.next = async () => {
            let find = 0;
            if (obj.selected) {
                for (let i = 0; i < obj.data.length; i++) {
                    if (obj.data[i].id == obj.selected.id) {
                        find = i;
                        break;
                    }
                }
                find = find + 1;
            }

            if (!obj.data[find]) return;
            await obj.select(obj.data[find].id, 'all');
        }

        obj.prev = async () => {
            let find = 0;
            if (obj.selected) {
                for (let i = 0; i < obj.data.length; i++) {
                    if (obj.data[i].id == obj.selected.id) {
                        find = i;
                        break;
                    }
                }
                find = find - 1;
            }

            if (!obj.data[find]) return;
            await obj.select(obj.data[find].id, 'all');
        }

        obj.run = async (flow_id) => {
            if (!flow_id) return;
            try {
                if (workflow.status[flow_id].status == 'running') {
                    return;
                }
            } catch (e) {
            }

            await $loading.show();
            $("#node-" + flow_id + " .debug-message").remove();
            workflow.debug[flow_id] = "";
            await workflow.save(true);
            let { code, data } = await API("run", { flow_id: flow_id });
            await $loading.hide();
            if (code != 200)
                await $alert(data);
        }

        obj.stop = async () => {
            await API("stop");
        }

        obj.get = async (node_id) => {
            for (let i = 0; i < obj.data.length; i++) {
                if (obj.data[i].id == node_id) {
                    return obj.data[i];
                }
            }
            return null;
        }

        obj.build = async () => {
            obj.data = [];
            for (let key in workflow.data.flow) {
                if (!workflow.data.flow[key].order) {
                    workflow.data.flow[key].order = new Date().getTime();
                }
                obj.data.push(workflow.data.flow[key]);
            }

            obj.data.sort((a, b) => {
                return a.order - b.order;
            });

            await $render();
        }

        obj.code = async (node_id) => {
            if (!node_id) return;
            if (!menubar.is('codeflow')) {
                await menubar.toggle('codeflow');
                await $render(1000);
                obj.selected = null;
            }
            await obj.select(node_id, 'drawflow');
        }

        obj.select = async (node_id, uifrom) => {
            let item = await obj.get(node_id);
            let diff = new Date().getTime() - obj.last_timestamp;
            obj.last_timestamp = new Date().getTime();

            if (diff > 100) {
                if (!node_id) {
                    if (menubar.is("uimode")) {
                        await uimode.close();
                        menubar.view = null;
                    }

                    obj.selected = null;
                    await $render();
                    return;
                }

                if (obj.selected && obj.selected.id == item.id) {
                    return;
                }

                obj.selected = item;

                if (menubar.is("uimode"))
                    await uimode.render();

                await $render();

                if (item) {
                    let drawflow_position = async () => {
                        if ($('#node-' + node_id).length == 0)
                            return false;
                        let x = $('#node-' + node_id).position().left;
                        let y = $('#node-' + node_id).position().top;
                        let zoom = workflow.drawflow.zoom;

                        let w = $('#drawflow').width() * zoom;
                        let h = $('#drawflow').height() * zoom;

                        let tx = Math.round(-x + (w / 2.4));
                        let ty = Math.round(-y + (h / 4));

                        workflow.drawflow.move({ canvas_x: tx, canvas_y: ty });
                        return true;
                    }

                    if (uifrom == 'codeflow' || uifrom == 'all') {
                        await drawflow_position();
                    }

                    let codeflow_position = async () => {
                        if ($('#codeflow-' + node_id).length == 0)
                            return false;

                        let y_start = $('.codeflow-body').scrollTop();
                        let y_end = y_start + $('.codeflow-body').height();

                        let y = $('#codeflow-' + node_id).position().top + y_start;
                        let y_h = y + $('#codeflow-' + node_id).height() + y_start;

                        let checkstart = y_start < y && y < y_end;
                        let checkend = y_start < y_h && y_h < y_end;
                        if (!checkstart || !checkend) {
                            $('.codeflow-body').scrollTop(y - $('#codeflow-' + node_id + ' .codeflow-desc').height() - $('#codeflow-' + node_id + ' .codeflow-header').height());
                        }
                    }

                    if (uifrom == 'drawflow' || uifrom == 'all') {
                        await codeflow_position();
                    }

                    try {
                        options.editor['codeflow-' + node_id].focus();
                    } catch (e) {
                    }
                }

            }
            await $render();
        }

        obj.create = async (app_id, pos_x, pos_y, nodeid, data, isdrop, flow) => {
            let drawflow = workflow.drawflow;

            if (!data) data = {};
            if (drawflow.editor_mode === 'fixed') {
                return false;
            }

            let pos = new DOMMatrixReadOnly(drawflow.precanvas.style.transform);
            if (!pos_x) {
                pos_x = -pos.m41 + 24
            } else if (isdrop) {
                pos_x = pos_x * (drawflow.precanvas.clientWidth / (drawflow.precanvas.clientWidth * drawflow.zoom)) - (drawflow.precanvas.getBoundingClientRect().x * (drawflow.precanvas.clientWidth / (drawflow.precanvas.clientWidth * drawflow.zoom)));
            }

            if (!pos_y) {
                pos_y = -pos.m42 + 24
            } else if (isdrop) {
                pos_y = pos_y * (drawflow.precanvas.clientHeight / (drawflow.precanvas.clientHeight * drawflow.zoom)) - (drawflow.precanvas.getBoundingClientRect().y * (drawflow.precanvas.clientHeight / (drawflow.precanvas.clientHeight * drawflow.zoom)));
            }

            let item = await app.get(app_id);
            if (!item)
                return false;
            if (!nodeid)
                nodeid = item.id + "-" + new Date().getTime();

            let container = $("<div class='card-header'></div>");
            if (flow && flow.inactive) container = $("<div class='card-header bg-blue-lt'></div>");

            let logo = item.logo ? 'url(' + item.logo + ')' : '#fff';
            container.append('<div class="avatar-area avatar-area-sm mr-2"><div class="avatar-container"><span class="avatar" style="background-image: ' + logo + ';"></span></div></div>')
            container.append('<h2 class="card-title" style="line-height: 1;">' + item.title + '<br/><small class="text-white" style="font-size: 10px; font-weight: 100; font-family: \'wiz-r\'">' + item.version + '</small></h2>');
            container.append('<div class="ml-auto"></div>');
            container.append('<button class="btn btn-sm btn-white" onclick="node.delete(\'' + nodeid + '\')"><i class="fa-solid fa-xmark"></i></button>');
            let html = container.prop('outerHTML');

            let actions = $('<div class="card-body actions d-flex p-0"></div>');
            actions.append('<span class="finish-indicator status-indicator"></span>')
            actions.append('<span class="pending-indicator status-indicator status-yellow status-indicator-animated"><span class="status-indicator-circle"><span class="status-indicator-circle"></span><span class="status-indicator-circle"></span><span class="status-indicator-circle"></span></span>')
            actions.append('<div class="action-btn" onclick="app.info(\'' + app_id + '\')"><i class="fa-solid fa-info"></i></div>');
            actions.append('<div class="action-btn" onclick="node.code(\'' + nodeid + '\')"><i class="fa-solid fa-code"></i></div>');
            actions.append('<div class="action-btn" onclick="uimode.select(\'' + nodeid + '\')"><i class="fa-solid fa-display"></i></div>');
            actions.append('<div class="action-btn action-btn-play" onclick="node.run(\'' + nodeid + '\')"><i class="fa-solid fa-play"></i></div>');
            actions.append('<div class="action-btn action-btn-stop" onclick="node.stop(\'' + nodeid + '\')"><i class="fa-solid fa-stop"></i></div>');
            html = html + actions.prop('outerHTML');

            html = html + '<div class="progress progress-sm" style="border-radius: 0;"><div class="progress-bar bg-primary progress-bar-indeterminate"></div></div>';

            let value_container = $("<div class='card-body value-container p-0'></div>");
            let value_counter = 0;
            value_container.append('<div class="value-header">Variables</div>');
            for (let i = 0; i < item.inputs.length; i++) {
                let value = item.inputs[i];
                if (value.type == 'variable') {
                    let variable_name = value.name;
                    let wrapper = $("<div class='value-wrapper'></div>");
                    wrapper.append('<div class="value-title">' + variable_name + '</div>');

                    if (value.inputtype == 'number') {
                        wrapper.append('<div class="value-data"><input type="number" class="form-control form-control-sm" placeholder="' + value.description + '" df-' + variable_name + '/></div>');
                    } else if (value.inputtype == 'date') {
                        wrapper.append('<div class="value-data"><input type="date" class="form-control form-control-sm" placeholder="' + value.description + '" df-' + variable_name + '/></div>');
                    } else if (value.inputtype == 'password') {
                        wrapper.append('<div class="value-data"><input type="password" class="form-control form-control-sm" placeholder="' + value.description + '" df-' + variable_name + '/></div>');
                    } else if (value.inputtype == 'list') {
                        let vals = value.description;
                        vals = vals.replace(/\n/gim, "").split(",");
                        let opts = "";
                        for (let j = 0; j < vals.length; j++) {
                            vals[j] = vals[j].split(":");
                            let listkey = vals[j][0].trim();
                            let listval = listkey;
                            if (vals[j].length > 1) {
                                listval = vals[j][1].trim();
                            }
                            opts = opts + "<option value='" + listval + "'>" + listkey + "</option>"
                        }

                        opts = '<div class="value-data"><select class="form-select form-select-sm" df-' + variable_name + '>' + opts + "</select></div>";
                        wrapper.append(opts);
                    } else {
                        wrapper.append('<div class="value-data"><input class="form-control form-control-sm" placeholder="' + value.description + '" df-' + variable_name + '/></div>');
                    }

                    value_container.append(wrapper);
                    value_counter++;
                }
            }

            if (value_counter > 0)
                html = html + value_container.prop('outerHTML');

            let inputs = [];
            for (let i = 0; i < item.inputs.length; i++) {
                let value = item.inputs[i];
                if (value.type == 'output') {
                    inputs.push("input-" + value.name);
                }
            }

            let outputs = [];
            for (let i = 0; i < item.outputs.length; i++) {
                let value = item.outputs[i];
                outputs.push("output-" + value.name);
            }

            drawflow.addNode(nodeid, item.title, inputs, outputs, pos_x, pos_y,
                "flow-" + nodeid + ' ' + nodeid + ' ' + item.id + ' ' + item.mode,
                data,
                html
            );

            return true;
        }

        obj.delete = async (nodeid) => {
            obj.selected = null;
            workflow.drawflow.removeNodeId('node-' + nodeid);
            await workflow.update();
        }

        return obj;
    })();

    window.workflow = $scope.workflow = (() => {
        let obj = {};

        obj.display = true;

        obj.status = {};
        obj.debug = {};

        obj.manager_id = wiz.data.manager_id;
        obj.id = wiz.data.workflow_id;
        obj.data = {};
        obj.url = wiz.API.url("download/" + obj.id);

        obj.hide = async () => {
            obj.display = false;
            await $render();
        }

        obj.show = async () => {
            if (obj.display) return;
            obj.display = true;
            await obj.refresh();
        }

        obj.status_init = async () => {
            let res = await API("flow_status");
            obj.status = res.data.status;
            for (let flow_id in res.data.log) {
                let logdata = res.data.log[flow_id];
                obj.debug[flow_id] = logdata.replace(/\n/gim, '<br>');
                await socket.log(flow_id);
            }
        }

        obj.init = async () => {
            let res = await API("data");
            obj.data = res.data;
            obj.data.language = 'python';

            await obj.status_init();

            await obj.refresh();
            await obj.update();
            await $render();
        }

        obj.run = async () => {
            try {
                if (obj.status[flow_id].status == 'running') {
                    return;
                }
            } catch (e) {
            }

            await $loading.show();
            $(".drawflow-node .debug-message").remove();
            obj.debug = {};
            await obj.save(true);
            let { code, data } = await API("run");
            await $loading.hide();
            if (code != 200)
                await $alert(data);
        }

        obj.add = async (app_id) => {
            await obj.update();
            await node.create(app_id);
            await obj.update();
        }

        obj.refresh = async () => {
            if (!obj.display) return;
            obj.clear = true;
            await $render();
            obj.clear = false;
            await $render();

            let position = {};
            if (obj.drawflow) {
                position = {
                    canvas_x: obj.drawflow.canvas_x,
                    canvas_y: obj.drawflow.canvas_y,
                    pos_x: obj.drawflow.pos_x,
                    pos_y: obj.drawflow.pos_y,
                    mouse_x: obj.drawflow.mouse_x,
                    mouse_y: obj.drawflow.mouse_y,
                    zoom: obj.drawflow.zoom,
                    zoom_last_value: obj.drawflow.zoom_last_value
                };
            }

            obj.drawflow = new Drawflow(document.getElementById("drawflow"));

            obj.drawflow.reroute = true;
            obj.drawflow.reroute_fix_curvature = true;
            obj.drawflow.force_first_input = false;
            obj.drawflow.start();

            obj.drawflow.move(position);

            if (obj.data.flow) {
                let flowdata = obj.data.flow;
                for (let key in flowdata) {
                    let item = flowdata[key];
                    let inputs = [];
                    for (let inputkey in item.inputs) inputs.push(inputkey);
                    let outputs = [];
                    for (let outputkey in item.outputs) outputs.push(outputkey);
                    let app_id = item.id.split("-")[0];
                    await node.create(app_id, item.pos_x, item.pos_y, item.id, item.data, null, item);
                }

                for (let key in flowdata) {
                    let item = flowdata[key];
                    let id_input = item.id;
                    for (let input_class in item.inputs) {
                        let conn = item.inputs[input_class].connections;
                        for (let i = 0; i < conn.length; i++) {
                            let id_output = conn[i].node;
                            let output_class = conn[i].input;
                            try {
                                obj.drawflow.addConnection(id_output, id_input, "output-" + output_class, "input-" + input_class);
                            } catch (e) {
                            }
                        }
                    }

                    let id_output = item.id;
                    for (let output_class in item.outputs) {
                        let conn = item.outputs[output_class].connections;
                        for (let i = 0; i < conn.length; i++) {
                            id_input = conn[i].node;
                            let input_class = conn[i].output;
                            try {
                                obj.drawflow.addConnection(id_output, id_input, "output-" + output_class, "input-" + input_class);
                            } catch (e) {
                            }
                        }
                    }
                }
            }

            obj.drawflow.bind('click', async (type, target) => {
                if (type != 'node') {
                    await node.select(null, 'drawflow');
                    return;
                }

                await node.select(target.substring(5), 'drawflow');
            });

            try {
                if (node.selected) {
                    await node.select(node.selected.id);
                }
            } catch (e) {
            }

            for (let flow_id in obj.debug) {
                await socket.log(flow_id);

            }

            for (let flow_id in workflow.status) {
                let fdata = workflow.status[flow_id];
                $('#node-' + flow_id + ' .finish-indicator').text('[' + fdata.index + ']');
            }
        }

        obj.update = async (donot_node_reload) => {
            let data = angular.copy(obj.data);

            let checker = true;
            for (let key in data.apps)
                checker = await app.validate(key);
            if (!checker) return;

            await app.load();

            let flows = obj.drawflow.export().drawflow.Home.data;

            let orders = {};
            for (let i = 0; i < node.data.length; i++) {
                orders[node.data[i].id] = i + 1;
                data.flow[node.data[i].id].description = node.data[i].description;
            }

            for (let flow_id in flows) {
                delete flows[flow_id].html;
                let app_id = flow_id.split("-")[0];
                flows[flow_id]['app_id'] = app_id;

                try {
                    flows[flow_id]['description'] = data.flow[flow_id].description;
                } catch (e) {
                    flows[flow_id]['description'] = '';
                }

                let outputs = {};
                for (let key in flows[flow_id].outputs) {
                    let item = flows[flow_id].outputs[key];
                    for (let i = 0; i < item.connections.length; i++)
                        item.connections[i].output = item.connections[i].output.substring(6);
                    outputs[key.substring(7)] = item
                }
                flows[flow_id].outputs = outputs;

                let inputs = {};
                for (let key in flows[flow_id].inputs) {
                    let item = flows[flow_id].inputs[key];
                    for (let i = 0; i < item.connections.length; i++)
                        item.connections[i].input = item.connections[i].input.substring(7);
                    inputs[key.substring(6)] = item
                }
                flows[flow_id].inputs = inputs;

                try {
                    if (orders[flow_id]) {
                        flows[flow_id].order = orders[flow_id];
                    } else if (data.flow[flow_id].order) {
                        flows[flow_id].order = data.flow[flow_id].order;
                    } else {
                        flows[flow_id].order = new Date().getTime();
                    }
                } catch (e) {
                    flows[flow_id].order = new Date().getTime();
                }

                if (data.flow[flow_id] && data.flow[flow_id].inactive) flows[flow_id].inactive = data.flow[flow_id].inactive;
            }

            data.flow = flows;

            obj.data = data;
            if (!donot_node_reload)
                await node.build();

            await obj.refresh();
            await $render();

            return data;
        }

        obj.download = async () => {
            let data = await obj.update(true);
            await $file.download(data, data.title + ".dwp");
        }

        obj.save = async (hide_result) => {
            let tiemstamp = new Date().getTime();
            if (kernel.is("running")) return;

            let data = await obj.update(true);
            if (!data.title || data.title.length == 0) {
                await $alert("Workflow title is not filled.");
                $('#offcanvas-workflow-info').offcanvas('show');
                return;
            }

            if (!data.version || data.version.length == 0) {
                await $alert("Workflow Version is not filled.");
                $('#offcanvas-workflow-info').offcanvas('show');
                return;
            }

            let res = null;
            res = await API("update", { data: JSON.stringify(data) });
            if (res.code == 200 && !hide_result) toastr.success("Saved");
            else if (res.code != 200) toastr.error("Error");

            await uimode.render();

            obj.last_updated = new Date().getTime();
        }

        obj.delete = async () => {
            let res = await $alert('Are you sure to delete?', { btn_action: 'Delete', btn_close: "Cancel" });
            if (!res) return;
            await $loading.show();
            await API("delete");
            location.href = wiz.data.url;
        }

        return obj;
    })();

    window.kernel = $scope.kernel = (() => {
        let obj = {};

        obj.status = null;
        obj.spec = null;

        obj.init = async () => {
            let kernelspecs = await API("kernelspecs");
            kernelspecs = kernelspecs.data;
            obj.specs = kernelspecs;

            let { code, data } = await API("status");
            if (code != 200) return;

            obj.status = data.status;
            obj.spec = data.spec;

            await $render();
        }

        obj.status_class = () => {
            if (obj.status == 'stop') return 'status-secondary';
            if (obj.status == 'running') return 'status-primary';
            return 'status-yellow';
        }

        obj.is = (status) => {
            if (obj.status == status) return true;
            return false;
        }

        obj.select = async (spec) => {
            obj.spec = spec;
            await $render();
        }

        obj.kill = async () => {
            await API("kill");
            await $render();
        }

        obj.start = async () => {
            obj.status = null;
            await $render();
            await $loading.show();
            let { code, data } = await API("start", { spec: obj.spec.name });
            if (code != 200) {
                await $loading.hide();
                await $alert(data);
                obj.status = 'stop';
                await $render();
                return;
            }
            await $render();
        }

        obj.stop = async () => {
            await API("stop");
        }

        obj.restart = async () => {
            await $loading.show();
            await API("restart");
            await $loading.hide();
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
            if (leftmenu.is('drive')) {
                await obj.api.ls();
            }
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

    window.socket = $scope.socket = (() => {
        let obj = {};
        obj.client = wiz.socket.get();
        obj.running_status = {};
        obj.timestamp = new Date().getTime();

        obj.log = async (flow_id) => {
            let node_id = '#node-' + flow_id;
            $(node_id + " .debug-message").remove();
            let data = workflow.debug[flow_id];
            if (data) {
                $(node_id).append('<div class="debug-message">' + data + '</div>');
                let element = $(node_id + " .debug-message")[0];
                if (!element) return;
                element.scrollTop = element.scrollHeight - element.clientHeight;
            }
        };

        obj.client.on("connect", async () => {
            socket.client.emit("join", workflow.manager_id + '-' + workflow.id);
        });

        obj.client.on("kernel.status", async (data) => {
            let timestamp = new Date().getTime();
            obj.timestamp = timestamp * 1;

            if (data.data == 'stop') {
                workflow.debug = {};
                workflow.status = {};
                await workflow.refresh();
            }

            if (data.data == 'error') {
                await workflow.status_init();
                await workflow.refresh();
            }

            if (data.data == 'ready') {
                await $render(1000);
                if (timestamp < obj.timestamp) {
                    return;
                }
            }

            kernel.status = data.data;
            await $render();
            await $loading.hide();
        });

        obj.client.on("flow.status", async (message) => {
            let { flow_id, data } = message;
            if (!workflow.status[flow_id]) workflow.status[flow_id] = { flow_id: flow_id };
            workflow.status[flow_id].status = data;
            await $render();
        });

        obj.client.on("flow.index", async (message) => {
            let { flow_id, data } = message;
            if (!workflow.status[flow_id]) workflow.status[flow_id] = { flow_id: flow_id };
            workflow.status[flow_id].index = data;
            $('#node-' + flow_id + ' .finish-indicator').text('[' + data + ']');
        });

        obj.client.on("flow.log", async (message) => {
            let { flow_id, data } = message;
            data = data.replace(/\n/gim, '<br>');
            if (workflow.debug[flow_id]) workflow.debug[flow_id] = workflow.debug[flow_id] + data;
            else workflow.debug[flow_id] = data;
            let d = workflow.debug[flow_id].split("<br>");
            workflow.debug[flow_id] = d.splice(d.length - 51 > 0 ? d.length - 51 : 0).join("<br>");
            await obj.log(flow_id);
            await $render();
        });

        let Style = {
            base: [
                "color: #fff",
                "background-color: #444",
                "padding: 2px 4px",
                "border-radius: 2px"
            ],
            warning: [
                "color: #eee",
                "background-color: red"
            ],
            success: [
                "background-color: green"
            ]
        }

        obj.client.on("flow.api", async (message) => {
            let { flow_id, data } = message;
            let html_decode = (input) => {
                let doc = new DOMParser().parseFromString(input, "text/html");
                return doc.documentElement.textContent;
            }

            data = html_decode(data);

            let style = Style.base.join(';') + ';';
            style += Style.success.join(';');
            console.log(`%cdizest.py`, style, data);
        });

        return obj;
    })();

    window.shortcut = $scope.shortcut = (() => {
        let obj = {};
        obj.configuration = (monaco) => {
            if (!monaco) monaco = { KeyMod: {}, KeyCode: {} };
            return {
                'save': {
                    key: 'ctrl+s,command+s',
                    desc: 'save workflow',
                    monaco: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
                    fn: async () => {
                        await workflow.save();
                    }
                },
                'run': {
                    key: 'shift+enter',
                    desc: 'run selected app',
                    monaco: monaco.KeyMod.Shift | monaco.KeyCode.Enter,
                    fn: async () => {
                        if (node.selected) {
                            await node.run(node.selected.id);
                        }
                    }
                },
                'esc': {
                    key: 'esc',
                    desc: 'unselect and close menu',
                    fn: async () => {
                        if (['uimode'].includes(menubar.view))
                            return;

                        if (node.selected) {
                            node.selected = null;
                            if (!['codeflow', 'appinfo'].includes(menubar.view))
                                menubar.view = null;
                        } else {
                            menubar.view = null;
                        }

                        await $render();
                    }
                },
                'next': {
                    key: 'tab,pagedown',
                    desc: 'move to next app',
                    monaco: monaco.KeyCode.PageDown,
                    fn: async () => {
                        await node.next();
                    }
                },
                'prev': {
                    key: 'shift+tab,pageup',
                    desc: 'move to previous app',
                    monaco: monaco.KeyCode.PageUp,
                    fn: async () => {
                        await node.prev();
                    }
                }
            }
        };

        obj.bind = async () => {
            hotkeys.unbind();

            let shortcut_opts = {};
            let shortcuts = obj.configuration(window.monaco);
            obj.list = angular.copy(shortcuts);

            for (let key in shortcuts) {
                let keycode = shortcuts[key].key;
                let fn = shortcuts[key].fn;
                if (!keycode) continue;
                shortcut_opts[keycode] = async (ev) => {
                    ev.preventDefault();
                    await fn();
                };

                hotkeys(keycode, () => {
                    fn();
                    return false;
                });
            }
        }

        return obj;
    })();

    window.dragdrop = $scope.dragdrop = (() => {
        let obj = {};

        obj.allowDrop = async (ev) => {
            ev.preventDefault();
        }

        obj.drag = async (ev) => {
            if (ev.type === "touchstart") {
                mobile_item_selec = ev.target.closest(".drag-drawflow").getAttribute('data-node');
            } else {
                ev.dataTransfer.setData("node", ev.target.getAttribute('data-node'));
            }
        }

        obj.drop = async (ev) => {
            if (ev.type === "touchend") {
                let parentdrawflow = document.elementFromPoint(mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY).closest("#drawflow");
                if (parentdrawflow != null) {
                    node.create(mobile_item_selec, mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY, null, null, true);
                }
                mobile_item_selec = '';
            } else {
                ev.preventDefault();
                let data = ev.dataTransfer.getData("node");
                if (!data) return;
                node.create(data, ev.clientX, ev.clientY, null, null, true);
            }

            await workflow.update();
        }

        return obj;
    })();

    // load data
    await workflow.init();
    await kernel.init();
    await app.load();
    await shortcut.bind();

    await $loading.hide();

    document.getElementById('file-uploader').onchange = async () => {
        let fd = new FormData($('#file-form')[0]);
        await drive.api.upload(fd);
    };
}