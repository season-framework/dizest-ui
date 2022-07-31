app.factory('$alert', () => {
    return async (message, option = { btn_class: "btn-danger", btn_action: '확인', btn_close: '닫기', title: "Alert" }) => {
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