const Pool = require("pg").Pool;
const readline = require("readline");
const utils = require("../modules/utils");

module.exports = class Db {
    constructor(app) {
        this.app = app;
    }

    init(ready) {
        this.#connect();
        this.#ensureNecessities(ready);
    }

    getUsers(limit, page, callback) {
        this.pool.query(`SELECT COUNT(*) AS count FROM users`, (error, count) => {
            if (error) {
                callback(false);
            } else {
                this.pool.query(`SELECT * FROM users LIMIT $1 OFFSET $2`, [ limit, page * limit ], (error, result) => {
                    if (error) {
                        callback(false);
                    } else {
                        callback({
                            users: result.rows,
                            length: count.rows[0].count
                        });
                    }
                });
            }
        })
    }

    createUser(username, password, firstname, lastname, admin, callback) {
        this.pool.query(`SELECT * FROM users WHERE username = $1`, [username], (error, result) => {
            if (error) {
                this.app.logger.error("Db", error);
                callback(-1);
            } else {
                if (result.rowCount !== 0) {
                    callback(-2);
                } else {
                    const pwd = utils.hashPw(password);
                    this.pool.query(`INSERT INTO users (username, password, firstname, lastname, admin) VALUES ($1, $2, $3, $4, $5)`, [username, pwd, firstname, lastname, admin], (error, result) => {
                        if (error) {
                            this.app.logger.error("Db", error);
                            callback(-1);
                        } else {
                            callback(0);
                        }
                    });
                }
            }
        });
    }

    validateUser(username, password, callback) {
        this.pool.query(`SELECT * FROM users WHERE username = $1`, [ username ], (error, result) => {
            if (error || result.rowCount === 0 || !utils.comparePw(password, result.rows[0].password)) {
                callback(false);
            } else {
                callback({
                    username: result.rows[0].username,
                    admin: result.rows[0].admin
                });
            }
        });
    }

    updateUser(username, password, firstname, lastname, admin, callback) {
        let pwd = utils.hashPw(password);

        this.pool.query(`UPDATE users SET password = $1, firstname = $2, lastname = $3, admin = $4 WHERE username = $5`, [ pwd, firstname, lastname, admin, username ], (error, result) => {
            if (error) {
                callback(false);
            } else {
                callback(true);
            }
        });
    }

    deleteUser(username, callback) {
        this.pool.query(`DELETE FROM users WHERE username = $1`, [ username ], (error, result) => {
            if (error) {
                callback(false);
            } else {
                callback(true);
            }
        });
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

    #ensureNecessities(ready) {
        this.app.logger.log("Db", "Ensuring the precense of the tables...");
        this.pool.query(`CREATE TABLE IF NOT EXISTS users (
            ID SERIAL PRIMARY KEY,
            username VARCHAR(55) NOT NULL,
            password VARCHAR(72) NOT NULL,
            firstname VARCHAR(50),
            lastname VARCHAR(50),
            admin boolean
        )`, (error, results) => {
            if (error) {
                this.app.logger.error("Db", error);
            } else {
                this.app.logger.log("Db", "Tables ensured!");
                this.#ensureAdmin(ready);
            }
        });

    }

    #ensureAdmin(ready) {
        this.app.logger.log("Db", "Ensuring admin user...");
        this.pool.query(`SELECT * FROM users WHERE admin LIMIT 1`, async (error, results) => {
            if (error) {
                this.app.logger.error("Db", error);
            } else {
                if (results.rowCount === 0) {
                    const rl = readline.createInterface(process.stdin, process.stdout);
                    rl.questionAsync = (question) => {
                        return new Promise(resolve => {
                            rl.question(question, resolve);
                        });
                    }

                    rl.stdoutMuted = false;
                    rl._writeToOutput = function _writeToOutput(stringToWrite) {
                        if (rl.stdoutMuted) {
                            rl.output.write("\x1B[2K\x1B[200D" + rl.query + "[" + ((rl.line.length % 2 === 1) ? "=-" : "-=") + "]");
                        } else {
                            rl.output.write(stringToWrite);
                        }
                    };

                    const createAdmin = async () => {
                        rl.stdoutMuted = false;
                        let username = "";
                        while (!(username = utils.checkUsername(await rl.questionAsync("Username: "))));

                        rl.stdoutMuted = true;

                        let password = "";
                        while (!(password = utils.checkPassword(await rl.questionAsync("Password: "))));

                        this.createUser(username, password, "", "", true, async result => {
                            switch (result) {
                                case -1:
                                    this.app.logger.error("Db", "Error happened while checking username or inserting user data.");
                                    await createAdmin();
                                    break;
                                case -2:
                                    this.app.logger.error("Db", "Username is taken.");
                                    await createAdmin();
                                    break;
                                case 0:
                                    this.app.logger.log("Db", "Admin user created!");
                                    rl.close();
                                    ready();
                                    break;
                            }
                        })
                    }
                    await createAdmin();
                } else {
                    this.app.logger.log("Db", "Admin user exists!");
                    ready();
                }
            }
        })
    }
}