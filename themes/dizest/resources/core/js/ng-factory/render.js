app.factory('$render', ($timeout) => {
    return (timestamp) => new Promise((resolve) => $timeout(resolve, timestamp));
});