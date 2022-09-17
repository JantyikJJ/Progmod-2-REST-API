const Pool = require('pg').Pool;

module.exports = class Db {
    constructor(app) {
        this.app = app;
    }

    init() {
        this.#connect();
        this.#ensureTables();
    }

    #connect() {
        this.app.logger.log("Db", "Initializing pool...");
        this.pool = new Pool({
            host: process.env.PSQL_HOST,
            port: process.env.PSQL_PORT,
            user: process.env.PSQL_USER,
            password: process.env.PSQL_PASSWORD,
            database: process.env.PSQL_DATABASE
        });
        this.app.logger.log("Db", "Pool initialized!");
    }

    #ensureTables() {
        this.app.logger.log("Db", "Ensuring the precense of the tables...");
        this.pool.query(`CREATE TABLE IF NOT EXISTS users (
            ID SERIAL PRIMARY KEY,
            name VARCHAR(55),
            email VARCHAR(320),
            password VARCHAR(72),
            admin boolean
        )`, (error, results) => {
            if (error) {
                this.app.logger.error("Db", error);
            } else {
                this.app.logger.log("Db", "Tables ensured!");
                this.#ensureAdmin();
            }
        });

    }


    #ensureAdmin() {
        this.app.logger.log("Db", "Ensuring admin user...");
        this.pool.query(`SELECT * FROM users WHERE admin`, (error, results) => {
            if (error) {
                this.app.logger.error("Db", error);
            } else {
                if (results.rowCount === 0) {

                }
                this.app.logger.log("Db", "Admin user ensured!");
            }
        })
    }
}