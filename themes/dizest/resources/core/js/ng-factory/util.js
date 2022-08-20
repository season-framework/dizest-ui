app.factory('$util', () => {
    return (() => {
        let obj = {};

        obj.random = (stringLength) => {
            const fchars = 'abcdefghiklmnopqrstuvwxyz';
            const chars = '0123456789abcdefghiklmnopqrstuvwxyz';
            if (!stringLength) stringLength = 16;
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

        obj.filesize = (value) => {
            if (!value) return "0B";
            let kb = value / 1024;
            if (kb < 1) return value + "B";
            let mb = kb / 1024;
            if (mb < 1) return Math.round(kb * 100) / 100 + "KB";
            let gb = mb / 1024;
            if (gb < 1) return Math.round(mb * 100) / 100 + "MB";
            let tb = gb / 1024;
            if (tb < 1) return Math.round(gb * 100) / 100 + "GB";
            return Math.round(tb * 100) / 100 + "TB";
        }

        return obj;
    })();
});