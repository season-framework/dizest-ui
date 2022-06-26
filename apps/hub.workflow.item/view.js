let wiz_controller = async ($sce, $scope, $timeout) => {
    let _$timeout = $timeout;
    $timeout = (timestamp) => new Promise((resolve) => _$timeout(resolve, timestamp));

    let ansi_up = new AnsiUp();

    let random = () => {
        const fchars = 'abcdefghiklmnopqrstuvwxyz';
        const chars = '0123456789abcdefghiklmnopqrstuvwxyz';
        const stringLength = 16;
        let randomstring = '';
        for (let i = 0; i < stringLength; i++) {
            let rnum = null;
            if (i === 0) {
                rnum = Math.floor(Math.random() * fchars.length);
                randomstring += fchars.substring(rnum, rnum + 1);
            } else {
                rnum = Math.floor(Math.random() * chars.length);
                randomstring += chars.substring(rnum, rnum + 1);
            }
        }

        return randomstring;
    }

    let alert = async (message) => {
        await wiz.connect("component.modal")
            .data({
                title: "Alert",
                message: message,
                btn_action: "Close",
                btn_class: "btn-primary"
            })
            .event("modal-show");
    }

    let monaco_option = (language) => {
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

            // let shortcuts = $scope.shortcut.configuration(window.monaco);
            // for (let shortcutname in shortcuts) {
            //     let monacokey = shortcuts[shortcutname].monaco;
            //     let fn = shortcuts[shortcutname].fn;
            //     if (!monacokey) continue;

            //     editor.addCommand(monacokey, async () => {
            //         await fn();
            //         await $scope.shortcut.bind();
            //     });
            // }
        }

        return opt;
    }

    $scope.sortableOptions = {
        stop: async () => {
            try {
                for (let i = 0; i < $scope.node.data.length; i++) {
                    let flow = $scope.node.data[i];
                    $scope.workflow.data.flow[flow.id].order = i + 1;
                }
            } catch (e) {
                console.log(e);
            }
        }
    };

    $scope.loader = (() => {
        let obj = {};
        obj.display = false;

        obj.show = async () => {
            obj.display = true;
            await $timeout();
        }

        obj.hide = async () => {
            obj.display = false;
            await $timeout();
        }

        return obj;
    })();

    $scope.view = null;

    window.info = $scope.info = (() => {
        let obj = {};

        obj.toggle = async () => {
            if ($scope.view == 'info') {
                $scope.view = '';
            } else {
                $scope.view = 'info';
            }
            await $timeout();
        }

        return obj;
    })();

    window.uimode = $scope.uimode = (() => {
        let obj = {};
        obj.toggle = async () => {
            if ($scope.view == 'uimode') {
                $scope.view = '';
            } else {
                $scope.view = 'uimode';
            }
            await $timeout();
        }

        return obj;
    })();

    window.codeflow = $scope.codeflow = (() => {
        let obj = {};
        obj.display = false;

        obj.toggle = async () => {
            if ($scope.view == 'codeflow') {
                $scope.view = '';
            } else {
                $scope.view = 'codeflow';
            }
            await $timeout();
        }

        return obj;
    })();

    window.app = $scope.app = (() => {
        let obj = {};

        obj.monaco_opt = monaco_option('python');

        obj.struct = {
            title: 'new app',
            version: '1.0.0',
            description: '',
            visibility: 'private',
            mode: 'code',
            cdn: { js: [], css: [] },
            inputs: [],
            outputs: [],
            code: '',
            sample: '',
            api: '',
            pug: '',
            js: '',
            css: '',
            logo: '',
            featured: ''
        };

        obj.data = [];

        obj.load = async () => {
            obj.data = [];
            let apps = $scope.workflow.data.apps;
            for (let app_id in apps) {
                obj.data.push(apps[app_id]);
            }
            await $timeout();
        }

        obj.get = async (app_id) => {
            let apps = $scope.workflow.data.apps;
            if (apps[app_id])
                return apps[app_id];
            if (app_id)
                return null;

            app_id = random();
            while (apps[app_id])
                app_id = random();

            let newdata = angular.copy(obj.struct);
            newdata.id = app_id;

            $scope.workflow.data.apps[app_id] = newdata;
            await obj.load();

            return newdata;
        }

        obj.search = async () => {
            for (let i = 0; i < obj.data.length; i++) {
                obj.data[i].hidden = true;
            }
        }

        obj.validate = async (app_id) => {
            // $scope.app.data.description = $scope.app.desc_editor.data.get();
            let data = angular.copy(await obj.get(app_id));

            if (!data.title || data.title.length == 0) {
                await alert("App title is not filled.");
                return;
            }

            if (!data.version || data.version.length == 0) {
                await alert("App Version is not filled.");
                return;
            }

            let checker = {};
            for (let i = 0; i < data.inputs.length; i++) {
                if (!data.inputs[i].name || data.inputs[i].name.length == 0) {
                    await alert("Input name must be filled");
                    return;
                }

                if (data.inputs[i].name.includes(" ")) {
                    await alert("Input name only allow alphabet and digits.");
                    return;
                }

                if (data.inputs[i].name.match(/[^a-z0-9_]/gi)) {
                    await alert("Input name only allow alphabet and digits.");
                    return;
                }

                if (checker[data.inputs[i].name]) {
                    await alert("Input name must be unique.");
                    return;
                }

                checker[data.inputs[i].name] = true;
            }

            checker = {};
            for (let i = 0; i < data.outputs.length; i++) {
                if (!data.outputs[i].name || data.outputs[i].name.length == 0) {
                    await alert("Output name must be filled");
                    return;
                }

                if (data.outputs[i].name.includes(" ")) {
                    await alert("Output name only allow alphabet and digits.");
                    return;
                }

                if (data.outputs[i].name.match(/[^a-z0-9_]/gi)) {
                    await alert("Output name only allow alphabet and digits.");
                    return;
                }

                if (checker[data.outputs[i].name]) {
                    await alert("Output name must be unique.");
                    return;
                }

                checker[data.outputs[i].name] = true;
            }

            return true;
        }

        obj.delete = async (app_id) => {
            let res = await wiz.connect("component.modal")
                .data({
                    title: "Delete App",
                    message: 'Are you sure to delete?',
                    btn_close: 'Cancel',
                    btn_action: "Delete",
                    btn_class: "btn-danger"
                })
                .event("modal-show");
            if (!res) return;
            delete $scope.workflow.data.apps[app_id];
            await $scope.workflow.update();
            await obj.load();
        }

        return obj;
    })();

    window.node = $scope.node = (() => {
        let obj = {};

        obj.data = [];
        obj.selected = null;
        obj.last_timestamp = new Date().getTime();

        obj.run = async (flow_id) => {
            $("#node-" + flow_id + " .debug-message").remove();
            $scope.workflow.debug[flow_id] = "";
            await $scope.workflow.save(false);
            await wiz.API.async("run", { workflow_id: $scope.workflow.data.id, flow_id: flow_id });
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
            for (let key in $scope.workflow.data.flow) {
                if (!$scope.workflow.data.flow[key].order) {
                    $scope.workflow.data.flow[key].order = new Date().getTime();
                }
                obj.data.push($scope.workflow.data.flow[key]);
            }

            obj.data.sort((a, b) => {
                return a.order - b.order;
            });

            await $timeout();
        }

        obj.select = async (node_id) => {
            let item = await $scope.node.get(node_id);
            let diff = new Date().getTime() - obj.last_timestamp;
            obj.last_timestamp = new Date().getTime();

            if (diff > 100) {
                obj.selected = item;

                if (item) {
                    let drawflow_position = async () => {
                        if ($('#node-' + node_id).length == 0)
                            return false;
                        let x = $('#node-' + node_id).position().left;
                        let y = $('#node-' + node_id).position().top;
                        let canvas_x = $scope.workflow.drawflow.canvas_x;
                        let canvas_y = $scope.workflow.drawflow.canvas_y;
                        let zoom = $scope.workflow.drawflow.zoom;

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
                            $scope.workflow.drawflow.move({ canvas_x: -x + (w / 2.4), canvas_y: -y + (h / 2.4) });
                        }
                        return true;
                    }

                    let stat = await drawflow_position();
                    if (!stat) return;

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

                    await codeflow_position();
                }

            }
            await $timeout();
        }

        obj.create = async (app_id, pos_x, pos_y, nodeid, data, isdrop) => {
            let drawflow = $scope.workflow.drawflow;

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

            let item = await $scope.app.get(app_id);
            if (!item)
                return false;
            if (!nodeid)
                nodeid = item.id + "-" + new Date().getTime();

            let container = $("<div class='card-header'></div>");
            container.append('<div class="avatar-area avatar-area-sm mr-2"><div class="avatar-container"><span class="avatar" style="background-image: url(' + item.logo + ')"></span></div></div>')
            container.append('<h2 class="card-title" style="line-height: 1;">' + item.title + '<br/><small class="text-white" style="font-size: 10px; font-weight: 100; font-family: \'wiz-r\'">' + item.version + '</small></h2>');
            container.append('<div class="ml-auto"></div>');
            container.append('<button class="btn btn-sm btn-white" onclick="node.delete(\'' + nodeid + '\')"><i class="fa-solid fa-xmark"></i></button>');
            let html = container.prop('outerHTML');

            let actions = $('<div class="card-body actions d-flex p-0"></div>');
            actions.append('<span class="finish-indicator status-indicator"></span>')
            actions.append('<span class="pending-indicator status-indicator status-yellow status-indicator-animated"><span class="status-indicator-circle"><span class="status-indicator-circle"></span><span class="status-indicator-circle"></span><span class="status-indicator-circle"></span></span>')
            if (item.mode == 'ui') actions.append('<div class="action-btn" onclick="node.display(\'' + nodeid + '\')"><i class="fa-solid fa-display"></i></div>');
            actions.append('<div class="action-btn" onclick="app.info(\'' + app_id + '\')"><i class="fa-solid fa-info"></i></div>');
            actions.append('<div class="action-btn" onclick="app.code(\'' + app_id + '\')"><i class="fa-solid fa-code"></i></div>');
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
            $scope.workflow.drawflow.removeNodeId('node-' + nodeid);
            await $scope.workflow.update();
        }

        return obj;
    })();

    window.workflow = $scope.workflow = (() => {
        let obj = {};

        obj.status = {};
        obj.debug = {};

        obj.data = {
            title: '',
            version: '',
            visibility: 'private',
            updatepolicy: 'auto',
            logo: '',
            featured: '',
            description: '',
            apps: {},
            flow: {}
        };

        if (wiz.data.workflow) {
            obj.data = wiz.data.workflow;
            obj.url = wiz.API.url("download/" + wiz.data.workflow.id);
        }

        obj.add = async (app_id) => {
            await obj.update();
            await $scope.node.create(app_id);
            await obj.update();
        }

        obj.init = async () => {
            await obj.refresh();
            await obj.update();
        }

        obj.refresh = async () => {
            obj.clear = true;
            await $timeout();
            obj.clear = false;
            await $timeout();

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
                    await $scope.node.create(app_id, item.pos_x, item.pos_y, item.id, item.data);
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
                    await $scope.node.select();
                    return;
                }

                await $scope.node.select(target.substring(5));
            });

            if ($scope.node.selected) {
                await $scope.node.select($scope.node.selected.id);
            }


            for (let flow_id in obj.debug) {
                await $scope.socket.log(flow_id);

            }

            for (let flow_id in obj.data.flow)
                socket.emit("status", { workflow_id: obj.data.id, flow_id: flow_id });
        }

        obj.update = async () => {
            let data = angular.copy(obj.data);

            let checker = true;
            for (let key in data.apps)
                checker = await $scope.app.validate(key);
            if (!checker) return;

            await $scope.app.load();

            let flows = obj.drawflow.export().drawflow.Home.data;

            for (let flow_id in flows) {
                delete flows[flow_id].html;
                let app_id = flow_id.split("-")[0];
                flows[flow_id]['app_id'] = app_id;
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
                if (data.flow[flow_id] && data.flow[flow_id].order) flows[flow_id].order = data.flow[flow_id].order;
                else flows[flow_id].order = new Date().getTime();
                if (data.flow[flow_id] && data.flow[flow_id].inactive) flows[flow_id].inactive = data.flow[flow_id].inactive;
            }

            data.flow = flows;

            obj.data = data;

            await $scope.node.build();
            await obj.refresh();

            await $timeout();

            return data;
        }

        obj.save = async (hide_result) => {
            let data = await $scope.workflow.update();

            if (!data.title || data.title.length == 0) {
                await alert("Workflow title is not filled.");
                $('#offcanvas-workflow-info').offcanvas('show');
                return;
            }

            if (!data.version || data.version.length == 0) {
                await alert("Workflow Version is not filled.");
                $('#offcanvas-workflow-info').offcanvas('show');
                return;
            }

            let res = null;
            if (data.id) {
                res = await wiz.API.async("update", { data: JSON.stringify(data) });
                if (res.code == 200 && !hide_result) toastr.success("Saved");
                else toastr.error("Error");
            } else {
                res = await wiz.API.async("create", { data: JSON.stringify(data) });
                if (res.code == 200) {
                    let wpid = res.data;
                    location.href = "/hub/workflow/item/" + wpid;
                } else {
                    toastr.error("Error");
                }
            }
        }

        obj.init();
        return obj;
    })();

    // event controller
    window.allowDrop = async (ev) => {
        ev.preventDefault();
    }
    window.drag = async (ev) => {
        if (ev.type === "touchstart") {
            mobile_item_selec = ev.target.closest(".drag-drawflow").getAttribute('data-node');
        } else {
            ev.dataTransfer.setData("node", ev.target.getAttribute('data-node'));
        }
    }
    window.drop = async (ev) => {
        if (ev.type === "touchend") {
            let parentdrawflow = document.elementFromPoint(mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY).closest("#drawflow");
            if (parentdrawflow != null) {
                $scope.node.create(mobile_item_selec, mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY, null, null, true);
            }
            mobile_item_selec = '';
        } else {
            ev.preventDefault();
            let data = ev.dataTransfer.getData("node");
            $scope.node.create(data, ev.clientX, ev.clientY, null, null, true);
        }

        await $scope.workflow.update();
    }

    // socket bind
    let socket = wiz.socket.get();
    if ($scope.workflow.data.id) {
        let wpid = $scope.workflow.data.id;
        $scope.socket = {};
        $scope.socket.running_status = {};
        $scope.socket.log = async (flow_id) => {
            let node_id = '#node-' + flow_id;
            $(node_id + " .debug-message").remove();
            let data = $scope.workflow.debug[flow_id];
            if (data) {
                $(node_id).append('<div class="debug-message">' + data + '</div>');
                let element = $(node_id + " .debug-message")[0];
                if (!element) return;
                element.scrollTop = element.scrollHeight - element.clientHeight;
            }


        };

        socket.on("log", async (res) => {
            let data = res.data;
            data = data.replace(/\n/gim, '<br>');
            if ($scope.workflow.debug[res.flow_id]) $scope.workflow.debug[res.flow_id] = $scope.workflow.debug[res.flow_id] + data;
            else $scope.workflow.debug[res.flow_id] = data;
            await $scope.socket.log(res.flow_id);
            await $timeout();
        });

        socket.on("connect", function (data) {
            socket.emit("join", wpid);
        });

        socket.on("wpstatus", async (data) => {
            $scope.workflow.running = data;
            await $timeout();
        });

        socket.on("status", async (data) => {
            if (!data.flow_id) return;
            $scope.socket.running_status = data;
            let node_id = '#node-' + data.flow_id;
            $(node_id + " .error-message").remove();
            if (data.code == 2)
                $(node_id).append('<div class="error-message p-3 pt-2 pb-2 bg-red-lt">' + data.message + '</div>')
            if (data.code == 1)
                $(node_id).append('<div class="error-message p-3 pt-2 pb-2 bg-red-lt">Run the previous app first</div>')
            $scope.workflow.status[data.flow_id] = data;
            $('.flow-' + data.flow_id + ' .finish-indicator').text('[' + data.index + ']');
            await $timeout();
        });

        socket.on("stop", async () => {
            $scope.socket.running_status = {};
            $scope.workflow.status = {};
            $("#drawflow .error-message").remove();
            await $timeout();
        });
    }

    // load data
    await $scope.app.load();
}