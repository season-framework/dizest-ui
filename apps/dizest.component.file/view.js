let wiz_controller = async ($scope, $render, $alert) => {
    let resizer = (file, width, quality) => new Promise((resolve) => {
        if (!quality) quality = 0.8;
        if (!width) width = 64;

        let photo = function (file, maxSize, callback) {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function (readerEvent) {
                resize(readerEvent.target.result, maxSize, callback);
            };
        }

        let resize = function (dataURL, maxSize, callback) {
            let image = new Image();

            image.onload = function () {
                let canvas = document.createElement('canvas'),
                    width = image.width,
                    height = image.height;
                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                output(canvas, callback);
            };

            image.onerror = function () {
                return;
            };

            image.src = dataURL;
        };

        let output = function (canvas, callback) {
            let blob = canvas.toDataURL('image/png', quality);
            callback(blob);
        }

        photo(file, width, (blob) => {
            resolve(blob);
        });
    });

    const FILE_INPUT_ID = '#' + wiz.render_id + ' input';

    let func = null;

    $('#' + wiz.render_id + ' input').change(async () => {
        await func();
    });

    wiz.bind("json", async (accept) => {
        $scope.accept = accept;
        await $render();

        func = async () => {
            let fr = new FileReader();
            fr.onload = async () => {
                let data = fr.result;
                data = JSON.parse(data);
                wiz.response("json", data);
            };
            fr.readAsText($(FILE_INPUT_ID).prop('files')[0]);
        }

        $(FILE_INPUT_ID).click();
    });

    wiz.bind("image", async (opts) => {
        if (!opts) opts = {};
        $scope.accept = 'image/*';
        await $render();

        func = async () => {
            let file = document.querySelector(FILE_INPUT_ID).files[0];
            if(!opts.size) opts.size = 512;
            if(!opts.quality) opts.quality = 0.8;
            file = await resizer(file, opts.size, opts.quality);
            $(FILE_INPUT_ID).val(null);

            if (opts.limit) {
                if (file.length > opts.limit) {
                    await $alert("Exceeded maximum file size");
                    wiz.response("image", null);
                }
            }

            wiz.response("image", file);
        }

        $(FILE_INPUT_ID).click();
    });
}