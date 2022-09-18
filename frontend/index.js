class Backend {
    /*static base = "https://apiprog.exmodify.com";*/
    static base = "http://localhost:45844";
    static data = null;

    static loggedIn() {
        if (window.localStorage.getItem("refresh") !== null) {
            Backend.data = JSON.parse(window.atob(window.localStorage.getItem("refresh").split('.')[1]))
            return true;
        }
        return false;
    }

    static async loginAsync(form) {
        const data = new FormData(form);
        if (data.get("username") && data.get("password")) {
            const response = await Backend.#requestAsync("/user/login", "POST", null, {
                username: data.get("username"),
                password: data.get("password")
            });
            console.log(response.status);
            if (response.status === 200) {
                const obj = await response.json();

                window.localStorage.setItem("refresh", obj.refresh);
                window.localStorage.setItem("access", obj.access);

                return true;
            } else {
                window.localStorage.removeItem("refresh");
                window.localStorage.removeItem("access");
            }
        }

        return false;
    }

    static async refreshAsync() {
        if (Backend.loggedIn()) {
            const response = await Backend.#requestAsync("/user/refresh", "POST", null, {
                token: window.localStorage.getItem("refresh")
            });
            if (response.status === 200) {
                const obj = await response.json();

                window.localStorage.setItem("refresh", obj.refresh);
                window.localStorage.setItem("access", obj.access);

                return true;
            } else {
                window.localStorage.removeItem("refresh");
                window.localStorage.removeItem("access");
            }
        }

        return false;
    }

    static async logoutAsync() {
        if (Backend.loggedIn()) {
            await Backend.#requestAsync("/user/logout", "POST", window.localStorage.getItem("access"), {
                token: window.localStorage.getItem("refresh")
            });
        }

        window.localStorage.removeItem("refresh");
        window.localStorage.removeItem("access");
        return true;
    }

    static async getUsersAsync() {
        if (Backend.loggedIn() && Backend.data.admin) {
            const response = await Backend.#requestAsync("/user/get", "GET", window.localStorage.getItem("access"));
            if (response.status === 200) {
                return await response.json();
            } 
        }

        return false;
    }

    static async createAsync(form) {
        const data = new FormData(form);
        if (data.get("username") && data.get("password")) {
            let firstname = data.get("firstname");
            let lastname = data.get("lastname");
            let admin = data.get("admin") === "on";

            if (!firstname) firstname = "";
            if (!lastname) lastname = "";

            const response = await Backend.#requestAsync("/user/create", "POST", window.localStorage.getItem("access"), {
                username: data.get("username"),
                password: data.get("password"),
                firstname: firstname,
                lastname: lastname,
                admin: admin
            });
            return response.status === 200;
        }

        return false;
    }

    static async deleteAsync(username) {
        if (Backend.loggedIn()) {
            const response = await Backend.#requestAsync("/user/delete", "DELETE", window.localStorage.getItem("access"), {
                "target_user": username
            });

            return response.status === 200;
        }

        return false;
    }

    static async updateAsync(form) {
        const data = new FormData(form);
        if (data.get("username") && data.get("password")) {
            let firstname = data.get("firstname");
            let lastname = data.get("lastname");
            let admin = data.get("admin") === "on";

            if (!firstname) firstname = "";
            if (!lastname) lastname = "";

            const response = await Backend.#requestAsync("/user/update", "PUT", window.localStorage.getItem("access"), {
                target_user: data.get("username"),
                password: data.get("password"),
                firstname: firstname,
                lastname: lastname,
                admin: admin
            });

            return response.status === 200;
        }

        return false;
    }

    static async #requestAsync(path, method, auth, content) {
        const init = { mode: 'cors' };
        if (method) {
            init.method = method;
        } else {
            init.method = "GET";
        }
        if (auth) {
            init.headers = {
                "Content-Type": "application/json",
                "Authorization": auth
            };
        } else {
            init.headers = {
                "Content-Type": "application/json"
            };
        }
        if (content) {
            if (typeof content === "string") {
                init.body = content;
            } else {
                init.body = JSON.stringify(content);
            }
        }
        const response = await fetch(Backend.base + path, init);
        response._originalJson = response.json;
        response.json = async () => {
            if (typeof response._jsonData === "undefined") {
                response._jsonData = await response._originalJson();
            }
            return response._jsonData;
        }
        const data = await response.json();

        if (data.error && data.error.includes("BAD_ACCESS_TOKEN")) {
            if (await Backend.refreshAsync()) {
                return Backend.#requestAsync(path, method, window.localStorage.getItem("access"), content);
            } else {
                Backend.logoutAsync();
            }
        }

        return response;
    }
}

window.addEventListener("DOMContentLoaded", function() {
    const logout = this.document.querySelector(".logout");
    const login = this.document.querySelector("#login");
    const userdata = this.document.querySelector("#userdata");
    const usersDom = this.document.querySelector("#users");

    if (Backend.loggedIn()) {
        logout.addEventListener("click", function() {
            Backend.logoutAsync().then(() => {
                window.location.reload();
            });
        });
        login.remove();
        userdata.querySelector('#username').innerHTML = Backend.data.username;
        const updateUserTable = (users) => {
            let html = `
            <tr>
                <td>
                    Username
                </td>
                <td>
                    First name
                </td>
                <td>
                    Last name
                </td>
                <td>
                    Admin?
                </td>
            </tr>`;
            for (const user of users.users) {
                let admin = "no";
                if (user.admin) {
                    admin = "yes";
                }
                html += `
                <tr>
                    <td>
                        ${user.username}
                    </td>
                    <td>
                        ${user.firstname}
                    </td>
                    <td>
                        ${user.lastname}
                    </td>
                    <td>
                        ${admin}
                    </td>
                </tr>`;
            }
            usersDom.querySelector('#table table').innerHTML = html;
        };
        if (Backend.data.admin) {
            Backend.getUsersAsync().then(t => {
                if (t) {
                    updateUserTable(t);
                } else {
                    this.alert("Error.");
                }
            });

            usersDom.querySelector("#addform").addEventListener("submit", e => {
                e.preventDefault();
    
                Backend.createAsync(e.target).then(t => {
                    if (t) {
                        Backend.getUsersAsync().then(t => {
                            if (t) {
                                updateUserTable(t);
                            } else {
                                this.alert("Error.");
                            }
                        });
                    } else {
                        this.alert("Fail!");
                    }
                });
            });
            
            usersDom.querySelector("#editform").addEventListener("submit", e => {
                e.preventDefault();
    
                Backend.updateAsync(e.target).then(t => {
                    if (t) {
                        Backend.getUsersAsync().then(t => {
                            if (t) {
                                updateUserTable(t);
                            } else {
                                this.alert("Error.");
                            }
                        });
                    } else {
                        this.alert("Fail!");
                    }
                });
            });

            usersDom.querySelector("#deleteform").addEventListener("submit", e => {
                e.preventDefault();
    
                Backend.deleteAsync(new FormData(e.target).get("username")).then(t => {
                    if (t) {
                        Backend.getUsersAsync().then(t => {
                            if (t) {
                                updateUserTable(t);
                            } else {
                                this.alert("Error.");
                            }
                        });
                    } else {
                        this.alert("Fail!");
                    }
                });
            });
        } else {
            usersDom.remove();
        }
    } else {
        logout.remove();
        userdata.remove();
        usersDom.remove();
        login.querySelector("form").addEventListener("submit", e => {
            e.preventDefault();

            Backend.loginAsync(e.target).then(t => {
                if (t) {
                    this.alert("Logged in!");
                    window.location.reload();
                } else {
                    this.alert("Fail!");
                }
            });
        });
    }
});