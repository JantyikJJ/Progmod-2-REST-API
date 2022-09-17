const jwt = require("jsonwebtoken");
const utils = require("../modules/utils");

function loginUser(request, response) {
    const username = request.body.username;
    const password = request.body.password;

    if (utils.checkUsername(username) && utils.checkPassword(password)) {
        db.validateUser(username, password, result => {
            if (result) {
                response.status(200).json(utils.genTokens({
                    username: result.username,
                    admin: result.admin
                }, request.app));
            } else {
                response.status(401).json({
                    error: "Incorrect credentials."
                });
            }
        });
    } else {
        response.status(401).json({
            error: "Missing or incorrect credentials."
        });
    }
}
function getUsers(request, response) {
    if (request.user.admin) {
        const limit = Number(request.body.limit ?? 50);
        const page = Number(request.body.page ?? 0);
    
        db.getUsers(limit, page, users => {
            if (users) {
                response.status(200).json(users);
            } else {
                response.status(500).json({ 
                    error: "Database error."
                });
            }
        });
    } else {
        response.status(401).json({ 
            error: "Unauthorized."
        });
    }
}
function refreshToken(request, response) {
    app.refreshTokens = app.refreshTokens || [];
    const token = request.body.token;

    if (app.refreshTokens.includes(token)) {
        jwt.verify(token, process.env.JWT_REFRESH_SECRET, (error, user) => {
            app.refreshTokens = app.refreshTokens.filter(t => t != token);

            if (error) {
                response.status(401).json({
                    error: "Missing or invalid refresh token."
                });
            } else {
                response.status(200).json(utils.genTokens(user));
            }
        });
    } else {
        response.status(401).json({
            error: "Missing or invalid refresh token."
        });
    }
}
function logoutUser(request, response) {
    if (request.body.token && app.refreshTokens.includes(request.body.token)) {
        app.refreshTokens = app.refreshTokens.filter(t => t != request.body.token);
        response.status(200).json({
            status: "Success."
        });
    } else {
        response.status(401).json({
            error: "Unauthorized."
        });
    }
}
function createUser(request, response) {
    if (request.user.admin) {
        const username = request.body.username;
        const password = request.body.password;
        const firstname = request.body.firstname;
        const lastname = request.body.lastname;
        const admin = request.body.admin === "on";

        if (utils.checkUsername(username) && utils.checkPassword(password)) {
            app.db.createUser(username, password, firstname, lastname, admin, result => {
                switch (result) {
                    case -1:
                        response.status("500").json({
                            error: "Database error."
                        });
                        break;
                    case -2:
                        response.status("400").json({
                            error: "Username is taken."
                        });
                        break;
                    case 0:
                        response.status("200").json({
                            status: "Success."
                        });
                        break;
                }
            })
        } else {
            response.status(401).json({
                error: "Unauthorized."
            });
        }

    } else {
        response.status(401).json({
            error: "Unauthorized."
        });
    }
}
function deleteUser(request, response) {
    if (request.user.admin || request.user.username.toLowerCase() === request.body.target_user.toLowerCase()) {
        db.deleteUser(request.body.target_user, result => {
            if (result) {
                response.status(200).json({
                    status: "Success."
                });
            } else {
                response.status(500).json({
                    status: "Server error."
                });
            }
        });
    } else {
        response.status(401).json({
            error: "Unauthorized."
        });
    }
}
function updateUser(request, response) {
    if (request.user.admin || request.user.username.toLowerCase() === request.body.target_user.toLowerCase()) {
        const username = request.body.target_user;
        const password = request.body.password;
        const firstname = request.body.firstname;
        const lastname = request.body.lastname;
        const admin = request.body.admin === "on";

        if (!request.user.admin && admin) {
            response.status(401).json({
                error: "Unauthorized, you cannot make yourself admin."
            });
        } else {
            db.updateUser(username, password, firstname, lastname, admin, result => {
                if (result) {
                    response.status(200).json({
                        status: "Success."
                    });
                } else {
                    response.status(500).json({
                        error: "Server error."
                    });
                }
            });
        }
    } else {
        response.status(401).json({
            error: "Unauthorized."
        });
    }
}

module.exports = {
    init: app => {
        app.post("/user/login", loginUser);
        app.get("/user/get", getUsers);
        app.post("/user/refresh", refreshToken);
        app.get("/user/logout", utils.verifyToken, logoutUser);
        app.post("/user/create", utils.verifyToken, createUser);
        app.delete("/user/delete", utils.verifyToken, deleteUser);
        app.put("/user/update", utils.verifyToken, updateUser);
    }
}