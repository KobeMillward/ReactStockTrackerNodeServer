var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/register', function(req, res, next) {
    const email = req.body.email;
    const password= req.body.password;
    if (!email || !password) {
        res.status(400).json({"error": true, "message": "Missing username or password"})
        return;
    }
    const queryUsers = req.db.from("users").select("*").where("email","=",email);
    queryUsers
        .then((users) => {
            if (users.length > 0) {
                console.log("User already exists");
                res.json({"error": true, "message": "User already exists"});
                return;
            }
            const saltRounds = 10;
            const hash = bcrypt.hashSync(password, saltRounds);
            return req.db.from("users").insert({"email":email, "password":hash});
        })
        .then(() => {
            console.log("User successfully created");
            res.status(201).json({success: "true", message: "User created"});
        })
        .catch((err) => {
            res.status(500).json({message: "Database error - user not created"});
            console.log(err);
        })
});

router.post('/login', function(req, res, next) {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
        res.status(400).json({"error": true, "message": "Request body invalid - email and password are required"})
        return;
    }
    const queryUsers = req.db.from("users").select("*").where("email","=",email);
    queryUsers
        .then((users) => {
            if (users.length === 0) {
                res.status(401);
                res.send({"error": true, "message": "Incorrect email or password"})
                return;
            }
            const user = users[0];
            return bcrypt.compare(password, user.password);
        })
        .then((match) => {
            if (!match) {
                res.status(401);
                res.send({"error":true, "message": "Incorrect email or password"});
                return;
            }
            
            const secretKey = "lLxATgrQig";
            const expires_in = 60 * 60 * 24;
            const exp = Date.now() + expires_in * 1000;
            const token = jwt.sign({ email, exp}, secretKey)
            res.json({token_type: "Bearer", token, expires_in})
        })
        .catch((err) => {
            console.log(err)
        })
}); 

module.exports = router;