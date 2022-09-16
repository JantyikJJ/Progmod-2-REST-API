const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const env = require("dotenv")
const Logger = require("./logger.js");

env.config();

const app = express();
app.logger = new Logger(process.env.LOGFILE);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.logger.log("Initializing routes..");

fs.readdirSync("./routes").forEach(path => {
    const route = require("./routes/" + path);

    if (route.init) {
        route.init(app);
        app.logger.log(`- initialized route in ${path}!`);
    } else {
        app.logger.error(`Missing init method in file ${path}!`);
    }
});
app.logger.log("Routes initialized!");

app.listen(process.env.PORT, () => {
    app.logger.log(`RESTful API started on port ${process.env.PORT}!`);
});