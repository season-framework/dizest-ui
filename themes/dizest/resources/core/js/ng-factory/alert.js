app.factory('$alert', () => {
    return async (message, option = {}) => {
        if (!option.btn_class) option.btn_class = "btn-danger";
        if (!option.btn_action) option.btn_action = "Confirm";
        if (!option.btn_close) option.btn_close = "Close";
        if (!option.title) option.title = "Alert";

        let wiz = window.season_wiz.load()
        let res = await wiz.connect("dizest.component.modal")
            .data({
                message: message,
                ...option
            })
            .event("modal-show");
        return res;
    }
});