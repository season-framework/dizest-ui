let wiz_controller = async ($sce, $scope, $alert, $loading, $render) => {
    await $loading.show();
    await $render(2000);
    await $loading.hide();
    $alert('test');
}