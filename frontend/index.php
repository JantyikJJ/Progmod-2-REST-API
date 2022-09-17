<?php

session_start();

require("backend.php");

$backend = new Backend();

if ($backend->loggedIn()) {
    
}