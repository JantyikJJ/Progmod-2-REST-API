const fs = require("fs")

function n(num) {
    return num.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping:false })
}

module.exports = class Logger {
    constructor(filename) {
        this.initFile(filename);
    }

    initFile(filename) {
        if (this.file) {
            fs.closeSync(this.file);
        }
        this.file = undefined;
        if (filename && filename.trim() != "") {
            this.file = fs.openSync(filename.trim(), "w");
        }
    }

    log(...msg) {
        this.#innerLog(console.log, "Info", msg);
    }
    rq(type, ...msg) {
        this.#innerLog(console.log, type, msg);
    }
    error(...msg) {
        this.#innerLog(console.error, "Error", msg);
    }

    #innerLog(channel, severity, ...msg) {
        const time = new Date();
        
        let compiledMsg = `[${time.getFullYear()}/${n(time.getMonth())}/${n(time.getDay())} `
                        + `${n(time.getHours())}:${n(time.getMinutes())}:${n(time.getSeconds())}] [${severity}] ${msg.join(" ")}`;
        channel(compiledMsg);
        if (this.file) {
            fs.writeSync(this.file, compiledMsg);
        }
    }
}