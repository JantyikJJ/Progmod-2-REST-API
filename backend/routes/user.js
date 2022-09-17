const jwt = require("jsonwebtoken");
const utils = require("../modules/utils");

function loginUser(request, response) {
    const username = request.body.username;
    const password = request.body.password;

    if (utils.checkUsername(username) && utils.checkPassword(password)) {
        app.db.query(`SELECT * FROM users WHERE username = $1`, [ username ], (error, result) => {
            if (error) {
                response.status(500).json({
                    error: "DB Error."
                });
            } else if (result.rowCount === 0) {
                response.status(401).json({
                    error: "Username not found."
                });
            } else {
                if (utils.comparePw(password, result.rows[0].password)) {
                        
                } else {
                    response.status(401).json({
                        error: "Incorrect password."
                    });
                }
            }
        });
    } else {
        response.status(401).json({
            error: "Missing or incorrect credentials."
        });
    }
}
function createUser(request, response) {

}
function deleteUser(request, response) {

}
function updateUser(request, response) {

}

module.exports = {
    init: app => {
        app.post("/user/login", loginUser);
        app.post("/user/create", createUser);
        app.delete("/user/delete", deleteUser);
        app.put("/user/update", updateUser);
    }
}