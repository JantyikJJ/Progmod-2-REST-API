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
            request.app.refreshTokens = request.app.refreshTokens.filter(t => t !== token);

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
        request.app.refreshTokens = request.app.refreshTokens.filter(t => t !== request.body.token);
        
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
        /**
         * @openapi
         * /user/login:
         *   post:
         *     tag: Auth
         *     description: Login user with username and password
         *     parameters:
         *       - in: body
         *         name: username
         *         required: true
         *         description: Username
         *         schema:
         *           type: string
         *           example: admin
         *       - in: body
         *         name: password
         *         required: true
         *         description: User's plain password
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Returns a JWT token containing the username and whether the user is an admin or not.
         *       401:
         *         description: Error reason in a JSON object
         */
        app.post("/user/login", loginUser);

        /**
         * @openapi
         * /user/refresh:
         *   post:
         *     tag: Auth
         *     description: Refreshes JWT token
         *     parameters:
         *       - in: body
         *         name: token
         *         required: true,
         *         description: JWT token
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Sends refreshed JWT token.
         *       401:
         *         description: JSON object with an error parameter
         */
        app.post("/user/refresh", refreshToken);

        /**
         * @openapi
         * /user/logout:
         *   post:
         *     tag: Auth
         *     description: Logs out user
         *     parameters:
         *       - in: header
         *         name: Authorization
         *         required: true,
         *         description: User's JWT token
         *         schema:
         *           type: string
         *       - in: body
         *         name: token
         *         required: true,
         *         description: User's JWT token
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Returns a mysterious string.
         *       403:
         *         description: JSON object with 'error' parameter containing the error.
         *       401:
         *         description: JSON object with 'error' parameter containing the error.
         */
        app.post("/user/logout", utils.verifyToken, logoutUser);

        /**
         * @openapi
         * /user/get:
         *   get:
         *     tag: Admin
         *     description: Gets users.
         *     parameters:
         *       - in: header
         *         name: Authorization
         *         required: true,
         *         description: User's JWT token
         *         schema:
         *           type: string
         *       - in: query
         *         name: limit
         *         required: false
         *         description: Limit of how many users should be fetched. Default is 50.
         *         schema:
         *           type: integer
         *       - in: query
         *         name: page
         *         required: false
         *         description: Paginate user list by limit, first page is 0, which is the default.
         *         schema:
         *           type: integer
         *     responses:
         *       200:
         *         description: Sends refreshed JWT token.
         *       500:
         *         description: Database error happened.
         *       403:
         *         description: JSON object with 'error' parameter containing the error.
         *       401:
         *         description: JSON object with 'error' parameter containing the error.
         */
        app.get("/user/get", utils.verifyToken, getUsers);

        /**
         * @openapi
         * /user/create:
         *   post:
         *     tag: Admin
         *     description: Create a new user
         *     parameters:
         *       - in: header
         *         name: Authorization
         *         required: true,
         *         description: User's JWT token
         *         schema:
         *           type: string
         *       - in: body
         *         name: username
         *         required: true
         *         description: Login username of the new user
         *         schema:
         *           type: string
         *       - in: body
         *         name: password
         *         required: true
         *         description: Password of the new user
         *         schema:
         *           type: string
         *       - in: body
         *         name: firstname
         *         required: true
         *         description: First name of the new user
         *         schema:
         *           type: string
         *       - in: body
         *         name: lastname
         *         required: true
         *         description: Last name of the new user
         *         schema:
         *           type: string
         *       - in: body
         *         name: admin
         *         required: true
         *         description: Whether new user should be admin or not
         *         schema:
         *           type: boolean
         *           example: false
         *     responses:
         *       200:
         *         description: Sends a JSON object with a 'status' parameter saying 'Success'.
         *       500:
         *         description: Database error happened.
         *       400:
         *         description: Username taken.
         *       403:
         *         description: JSON object with 'error' parameter containing the error.
         *       401:
         *         description: JSON object with 'error' parameter containing the error.
         */
        app.post("/user/create", utils.verifyToken, createUser);

        /**
         * @openapi
         * /user/delete:
         *   delete:
         *     tag: Account
         *     description: Deletes user. Admin can delete anyone, generic users can only delete their accounts.
         *     parameters:
         *       - in: header
         *         name: Authorization
         *         required: true,
         *         description: User's JWT token
         *         schema:
         *           type: string
         *       - in: body
         *         name: target_user
         *         required: true
         *         description: The user to be deleted
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Sends a JSON object with a 'status' parameter saying 'Success'.
         *       500:
         *         description: Database error happened.
         *       403:
         *         description: JSON object with 'error' parameter containing the error.
         *       401:
         *         description: JSON object with 'error' parameter containing the error.
         */
        app.delete("/user/delete", utils.verifyToken, deleteUser);

        /**
         * @openapi
         * /user/update:
         *   put:
         *     tag: Account
         *     description: Updates an account. Admins can update any user, generic users can only update themselves.
         *     parameters:
         *       - in: header
         *         name: Authorization
         *         required: true,
         *         description: User's JWT token
         *         schema:
         *           type: string
         *       - in: body
         *         name: target_user
         *         required: true
         *         description: The username of the user to be updated
         *         schema:
         *           type: string
         *       - in: body
         *         name: password
         *         required: true
         *         description: Updated password of the user
         *         schema:
         *           type: string
         *       - in: body
         *         name: firstname
         *         required: true
         *         description: Updated first name of the user
         *         schema:
         *           type: string
         *       - in: body
         *         name: lastname
         *         required: true
         *         description: Updated last name of the user
         *         schema:
         *           type: string
         *       - in: body
         *         name: admin
         *         required: true
         *         description: Updated admin status of the user. Of course, generic users can't make themselves admin.
         *         schema:
         *           type: boolean
         *           example: false
         *     responses:
         *       200:
         *         description: Sends a JSON object with a 'status' parameter saying 'Success'.
         *       500:
         *         description: Database error happened.
         *       400:
         *         description: Username taken.
         *       403:
         *         description: JSON object with 'error' parameter containing the error.
         *       401:
         *         description: JSON object with 'error' parameter containing the error.
         */
        app.put("/user/update", utils.verifyToken, updateUser);
    }
}