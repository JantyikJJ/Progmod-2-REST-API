const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const refreshTokens = [];

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
    genTokens: function(user) {
        const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_REFRESH });
        refreshTokens.push(refreshToken);

        return {
            access: jwt.sign(user, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_REFRESH }),
            refresh: refreshToken
        };
    },
    refreshAccess: function(token) {
        
    }
}