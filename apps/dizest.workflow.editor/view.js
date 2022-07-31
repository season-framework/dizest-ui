let wiz_controller = async ($sce, $scope, $render, $alert, $util, $loading, $file) => {
    await $loading.show();

    $scope.trustAsHtml = $sce.trustAsHtml;

    let API = async (fnname, data) => {
        if (!data) data = {};
        data['workflow_id'] = workflow.id;
        data['manager_id'] = workflow.manager_id;
        return await wiz.API.async(fnname, data);
    }

    window.options = $scope.options = (() => {
        let obj = {};

        obj.monaco = (language) => {
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

    window.menubar = $scope.menubar = (() => {
        let obj = {};
        obj.view = null;

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

        return obj;
    })();

    window.codeflow = $scope.codeflow = (() => {
        let obj = {};

        return obj;
    })();

    window.app = $scope.app = (() => {
        let obj = {};

        obj.monaco_opt = options.monaco('python');
        obj.markdown = options.monaco('markdown');

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
            // obj.data.description = obj.desc_editor.data.get();

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
            let res = await $alert('Are you sure to delete?');
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

        obj.info = async (app_id) => {
            let app = await obj.get(app_id);
            obj.selected = app;
            obj.desc_editable = false;
            await $render();
            if (!menubar.is('appinfo')) {
                await menubar.toggle('appinfo');
            }
        }

        obj.upload = {};

        obj.upload.logo = async () => {
            let file = await $file.image({ size: 128, limit: 1024 * 100 });
            obj.selected.logo = file;
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

        obj.run = async (flow_id) => {
            try {
                if (workflow.status[flow_id].status == 'running') return;
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
                    obj.selected = null;
                    app.selected = null;
                    await $render();
                    return;
                }

                if (obj.selected && obj.selected.id == item.id) {
                    return;
                }

                obj.selected = item;
                app.selected = await app.get(item.app_id);

                if (item) {
                    let drawflow_position = async () => {
                        if ($('#node-' + node_id).length == 0)
                            return false;
                        let x = $('#node-' + node_id).position().left;
                        let y = $('#node-' + node_id).position().top;
                        let canvas_x = workflow.drawflow.canvas_x;
                        let canvas_y = workflow.drawflow.canvas_y;
                        let zoom = workflow.drawflow.zoom;

                        let w = $('#drawflow').width() * zoom;
                        let h = $('#drawflow').height() * zoom;

                        let onx = false;
                        if (-canvas_x < x && x < -canvas_x + w) {
                            onx = true;
                        }

                        let ony = false;
                        if (-canvas_y < y && y < -canvas_y + h) {
                            ony = true;
                        }

                        if (!onx || !ony) {
                            workflow.drawflow.move({ canvas_x: -x + (w / 2.4), canvas_y: -y + (h / 2.4) });
                        }
                        return true;
                    }

                    if (uifrom == 'codeflow') {
                        let stat = await drawflow_position();
                        if (!stat) return;
                    }

                    let codeflow_position = async () => {
                        if ($('#codeflow-' + node_id).length == 0)
                            return false;

                        let y_start = $('.codeflow-body').scrollTop();
                        let y_end = y_start + $('.codeflow-body').height();

                        let y = $('#codeflow-' + node_id).position().top + y_start;
                        let y_h = y + $('#codeflow-' + node_id).height() + y_start;

                        // check on area
                        let checkstart = y_start < y && y < y_end;
                        let checkend = y_start < y_h && y_h < y_end;
                        if (!checkstart || !checkend) {
                            $('.codeflow-body').scrollTop(y - 180);
                        }
                    }

                    if (uifrom == 'drawflow') {
                        await codeflow_position();
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
            if (item.pug) actions.append('<div class="action-btn" onclick="node.display(\'' + nodeid + '\')"><i class="fa-solid fa-display"></i></div>');
            actions.append('<div class="action-btn" onclick="app.info(\'' + app_id + '\')"><i class="fa-solid fa-info"></i></div>');
            actions.append('<div class="action-btn" onclick="node.code(\'' + nodeid + '\')"><i class="fa-solid fa-code"></i></div>');
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
                    } else if (value.inputtype == 'memo') {
                        wrapper.append('<div class="value-data"><textarea rows=5 class="form-control form-control-sm" placeholder="' + value.description + '" df-' + variable_name + '></textarea></div>');
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

        obj.status = {};
        obj.debug = {};

        obj.manager_id = wiz.data.manager_id;
        obj.id = wiz.data.workflow_id;
        obj.data = {};
        obj.url = wiz.API.url("download/" + obj.id);

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

            await obj.status_init();

            await obj.refresh();
            await obj.update();
            await $render();
        }

        obj.add = async (app_id) => {
            await obj.update();
            await node.create(app_id);
            await obj.update();
        }

        obj.refresh = async () => {
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

        obj.save = async (hide_result) => {
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
        }

        return obj;
    })();

    window.kernel = $scope.kernel = (() => {
        let obj = {};

        obj.status = 'stop';
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
            let { code, data } = await API("start", { spec: obj.spec });
            if (code != 200) return await $alert(data);

            await $loading.show();
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

    window.socket = $scope.socket = (() => {
        let obj = {};
        obj.client = wiz.socket.get();
        obj.running_status = {};

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
            if (data.data == 'stop') {
                workflow.debug = {};
                workflow.status = {};
                await workflow.refresh();
            }

            if (data.data == 'error') {
                await workflow.status_init();
                await workflow.refresh();
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
            if (workflow.debug[flow_id]) workflow.debug[flow_id] = workflow.debug[flow_id] + '<br>' + data;
            else workflow.debug[flow_id] = data;
            await obj.log(flow_id);
            await $render();
        });

        return obj;
    })();

    window.shortcut = $scope.shortcut = (() => {
        let obj = {};
        obj.configuration = (monaco) => {
            if (!monaco) monaco = { KeyMod: {}, KeyCode: {} };
            return {
                'esc': {
                    key: 'Escape',
                    desc: 'esc',
                    fn: async () => {
                        menubar.view = null;
                        await $render();
                    }
                },
                'save': {
                    key: 'Ctrl KeyS',
                    desc: 'save',
                    monaco: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
                    fn: async () => {
                        await workflow.save();
                    }
                },
                'run': {
                    key: 'Shift Enter',
                    desc: 'run',
                    monaco: monaco.KeyMod.Shift | monaco.KeyCode.Enter,
                    fn: async () => {
                        await node.run(node.selected.id);
                    }
                }
            }
        };

        obj.bind = async () => {
            $(window).unbind();

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
            }

            season.shortcut(window, shortcut_opts);
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
}