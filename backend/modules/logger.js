const fs = require("fs")

function n(num) {
    return num.toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping:false })
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
            this.file = fs.openSync(filename.trim(), 'w');
        }
    }

    log(module, ...msg) {
        this.#innerLog(console.log, module, "Info", msg);
    }
    error(module, ...msg) {
        this.#innerLog(console.error, module, "Error", msg);
    }

    #innerLog(channel, module, severity, ...msg) {
        const time = new Date();
        
        let compiledMsg = `[${time.getFullYear()}/${n(time.getMonth())}/${n(time.getDay())} `
                        + `${n(time.getHours())}:${n(time.getMinutes())}:${n(time.getSeconds())}] [${module}] [${severity}] ${msg.join(" ")}`;
        channel(compiledMsg);
        if (this.file) {
            fs.writeSync(this.file, compiledMsg);
        }
    }
}