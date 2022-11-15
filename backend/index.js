const express = require("express");
const bodyParser = require("body-parser");
const env = require("dotenv");
const cors = require("cors");
const fs = require("fs");

const Logger = require("./modules/logger.js");
const Db = require("./modules/db.js");

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express')

const routes = fs.readdirSync("./routes").map(t => './routes/' + t);

env.config();

const app = express();
app.logger = new Logger(process.env.LOGFILE);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.logger.log("Main", "Initializing routes..");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Progmod assessment",
            version: "1.0.0",
            description:
                "Basic CRUD API",
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
            contact: {
                name: "Jantyik János József",
                email: "exmodify@gamma.ttk.pte.hu",
            },
        },
        servers: [
            {
                url: "https://progapi.exmodify.com",
            },
        ],
    },
    apis: ["./routes/user.js"],
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(options)));

app.logger.log("Main", "Doc route initialized!");

routes.forEach(path => {
    const route = require(path);

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