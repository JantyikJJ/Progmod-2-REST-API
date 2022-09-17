const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = {
    checkUsername: function(username) {
        if (username && username.trim() !== "" && /[a-zA-Z0-9]*/.test(username))
            return username;
        return false;
    },
    checkPassword: function(password) {
        if (password && password.trim() !== "" && password.length > 7)
            return password;
        return false;
    },
    hashPw: function(password) {
        return bcrypt.hashSync(password, 10);
    },
    comparePw: function(password, hashed) {
        return bcrypt.compareSync(password, hashed)
    },
    genTokens: function(user, app) {
        const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_REFRESH });
        app.refreshTokens = app.refreshTokens || [];
        app.refreshTokens.push(refreshToken);

        return {
            access: jwt.sign(user, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_REFRESH }),
            refresh: refreshToken
        };
    },
    verifyToken: function(request, response, next) {
        if (request.headers["Authorization"]) {
            const token = request.headers["Authorization"].split(" ")[1];
    
            if (token === null) {
                response.status(401).json({
                    error: "BAD_ACCESS_TOKEN"
                });
            } else {
                jwt.verify(token, process.env.JWT_ACCESS_SECRET, (error, user) => {
                    if (error) {
                        response.status(403).json({
                            error: "BAD_ACCESS_TOKEN"
                        });
                    } else {
                        request.user = user;
                        next();
                    }
                })
            }
        } else {
            response.status(401).json({
                error: "BAD_ACCESS_TOKEN"
            });
        }
    }
}