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

        return obj;
    })();
});