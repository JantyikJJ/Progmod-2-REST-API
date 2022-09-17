const jwt = require("jsonwebtoken");

function loginUser(request, response) {

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