const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const env = require("dotenv");
const cors = require("cors");

const Logger = require("./modules/logger.js");
const Db = require("./modules/db.js");

env.config();

const app = express();
app.logger = new Logger(process.env.LOGFILE);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.logger.log("Main", "Initializing routes..");

fs.readdirSync("./routes").forEach(path => {
    const route = require("./routes/" + path);

    if (route.init) {
        route.init(app);
        app.logger.log("Main", `- initialized route in ${path}!`);
    } else {
        app.logger.error("Main", `Missing init method in file ${path}!`);
    }
});
app.logger.log("Main", "Routes initialized!");

app.db = new Db(app);
app.db.init(() => {
    app.logger.log("Db", "Database ready!");
    
    app.listen(process.env.PORT, () => {
        app.logger.log("Main", `RESTful API started on port ${process.env.PORT}!`);
    });
});