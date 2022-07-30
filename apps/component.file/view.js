let wiz_controller = async ($scope, $render) => {
    $scope.func = null;

    $('#' + wiz.render_id + ' input').change(async () => {
        let fr = new FileReader();
        fr.onload = async () => {
            await $scope.func(fr);
        };
        fr.readAsText($('#' + wiz.render_id + ' input').prop('files')[0]);
    });

    wiz.bind("json", async (accept) => {
        $scope.accept = accept;
        await $render();

        $scope.func = async (fr) => {
            let data = fr.result;
            data = JSON.parse(data);
            wiz.response("json", data);
        }

        $('#' + wiz.render_id + ' input').click();
    });
}