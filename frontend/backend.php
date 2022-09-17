<?php

class Backend
{
    private $base = "http://localhost:45844";

    public function __construct($base = null)
    {
        if (isset($base)) {
            $this->base = $base;
        }
    }

    public function loggedIn()
    {
        return isset($_SESSION[""]);
    }

    public function login($username, $password)
    {
        $response = $this->request("/user/login", "POST", null, [
            "username" => $username,
            "password" => $password
        ]);
        if ($response["status"] == 200) {
            $_SESSION["access"] = $response["response"]["access"];
            $_SESSION["refresh"] = $response["response"]["refresh"];
            return true;
        }
        return false;
    }
    public function refresh()
    {
        if (isset($_SESSION["refresh"])) {
            $response = $this->request("/user/refresh", "POST", null, [
                "token" => $_SESSION["refresh"],
            ]);
            if ($response["status"] == 200) {
                $_SESSION["access"] = $response["response"]["access"];
                $_SESSION["refresh"] = $response["response"]["refresh"];
                return true;
            } else {
                return false;
            }
        }
        return false;
    }
    public function logout()
    {
        if (isset($_SESSION["refresh"])) {
            $response = $this->request("/user/logout", "GET", $_SESSION["refresh"]);
            return $response["status"] == 200;
        }
        return false;
    }
    public function create($username, $password, $firstname, $lastname, $admin)
    {
        if (isset($_SESSION["access"]) && $this->decode($_SESSION["access"])["admin"]) {
            $response = $this->request("/user/create", "POST", $_SESSION["access"], [
                "username" => $username,
                "password" => $password,
                "firstname" => $firstname,
                "lastname" => $lastname,
                "admin" => $admin ? "on" : "off"
            ]);
            return $response["status"] == 200;
        }
        return false;
    }
    public function delete($username)
    {
        if (isset($_SESSION["access"])) {
            $response = $this->request("/user/delete", "DELETE", $_SESSION["access"], [
                "target_user" => $username,
            ]);
            return $response["status"] == 200;
        }
        return false;
    }
    public function update($username, $password, $firstname, $lastname, $admin)
    {
        if (isset($_SESSION["access"])) {
            $response = $this->request("/user/update", "PUT", $_SESSION["access"], [
                "target_user" => $username,
                "password" => $password,
                "firstname" => $firstname,
                "lastname" => $lastname,
                "admin" => $admin ? "on" : "off"
            ]);
            return $response["status"] == 200;
        }
        return false;
    }

    private function request($path, $method, $auth = null, $content = null)
    {
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, $this->base . $path);
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, $method);

        $header = ["Content-Type: application/json"];
        if (isset($auth)) {
            $header[] = "Authorization: " . $auth;
        }

        if (isset($content)) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($content));
        }
        curl_setopt($curl, CURLOPT_HTTPHEADER, $header);

        $response = json_decode(curl_exec($curl));
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if (isset($response["error"]) && str_contains($response["error"], "BAD_ACCESS_TOKEN")) {
            if ($this->refresh()) {
                return $this->request($path, $method, $auth, $content);
            }
        }

        return [
            "status" => $status,
            "response" => $response
        ];
    }
    private function decode($token)
    {
        $payload = explode('.', $token)[1];
        $payload = str_replace('_', '/', str_replace('-', '+', $payload));
        return json_decode(base64_decode($payload));
    }
}
