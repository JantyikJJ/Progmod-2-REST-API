const jwt = require("jsonwebtoken");
const utils = require("../modules/utils");

function loginUser(request, response) {
    const username = request.body.username;
    const password = request.body.password;

    if (utils.checkUsername(username) && utils.checkPassword(password)) {
        request.app.db.validateUser(username, password, result => {
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
        const limit = Number(request.query.limit ?? 50);
        const page = Number(request.query.page ?? 0);
    
        request.app.db.getUsers(limit, page, users => {
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
    request.app.refreshTokens = request.app.refreshTokens || [];
    const token = request.body.token;

    if (request.app.refreshTokens.includes(token)) {
        jwt.verify(token, process.env.JWT_REFRESH_SECRET, (error, user) => {
            request.app.refreshTokens = request.app.refreshTokens.filter(t => t != token);

            if (error) {
                response.status(401).json({
                    error: "Missing or invalid refresh token."
                });
            } else {
                response.status(200).json(utils.genTokens({
                    username: user.username,
                    admin: user.admin
                }, request.app));
            }
        });
    } else {
        response.status(401).json({
            error: "Missing or invalid refresh token."
        });
    }
}
function logoutUser(request, response) {
    request.app.refreshTokens = request.app.refreshTokens || [];

    if (request.body.token && request.app.refreshTokens.includes(request.body.token)) {
        request.app.refreshTokens = request.app.refreshTokens.filter(t => t != request.body.token);
        
    }
    response.status(200).json({
        status: "Success."
    });
}
function createUser(request, response) {
    if (request.user.admin) {
        const username = request.body.username;
        const password = request.body.password;
        const firstname = request.body.firstname;
        const lastname = request.body.lastname;
        const admin = request.body.admin;

        if (utils.checkUsername(username) && utils.checkPassword(password)) {
            request.app.db.createUser(username, password, firstname, lastname, admin, result => {
                switch (result) {
                    case -1:
                        response.status(500).json({
                            error: "Database error."
                        });
                        break;
                    case -2:
                        response.status(400).json({
                            error: "Username is taken."
                        });
                        break;
                    case 0:
                        response.status(200).json({
                            status: "Success."
                        });
                        break;
                }
            })
        } else {
            response.status(401).json({
                error: "Bad username or password."
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
        request.app.db.deleteUser(request.body.target_user, result => {
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
        const admin = request.body.admin;

        if (!request.user.admin && admin) {
            response.status(401).json({
                error: "Unauthorized, you cannot make yourself admin."
            });
        } else {
            request.app.db.updateUser(username, password, firstname, lastname, admin, result => {
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
        app.post("/user/refresh", refreshToken);
        app.get("/user/get", utils.verifyToken, getUsers);
        app.post("/user/logout", utils.verifyToken, logoutUser);
        app.post("/user/create", utils.verifyToken, createUser);
        app.delete("/user/delete", utils.verifyToken, deleteUser);
        app.put("/user/update", utils.verifyToken, updateUser);
    }
}