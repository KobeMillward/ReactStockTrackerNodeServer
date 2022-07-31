var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const secretKey = "lLxATgrQig";

router.get('/symbols', function(req, res, next) {
    if (req.query.industry) {
        req.db.from('stocks').select('name','symbol','industry').where('industry','like',"%"+req.query.industry+"%").distinct('symbol')
        .then((rows) => {
            if (rows.length === 0) {
               return res.status(404).send({"error": true, "message": "Industry sector not found"});
            }
            res.status(200);
            res.send(rows);
        })
    } else if (!req.url.includes("?")) {
        req.db.from('stocks').select('name','symbol','industry').distinct('symbol')
        .then((rows) => {
            res.status(200);
            res.json(rows);
        })
        .catch((err) => {
            console.log(err);
            res.json({"error": true, "message": "Error executing MySQL Query"});
        })
    } else {
        res.status(400);
        res.send({"error":true, "message": "Invalid query parameter: only 'industry' is permitted"})
        return;
    }
});

router.get('/:symbol', function(req, res, next) {
    if (req.url.includes('?')) {
        res.status(400);
        res.send({"error": true, "message": "Date parameters only available on authenticated route /stocks/authed"})
    }
    req.db.from('stocks').select("*").where('symbol','=',req.params.symbol).andWhere("timestamp",'=','2020-03-24')
    .then((rows) => {
        if (rows.length === 0) {
            res.status(404);
            res.send({"error": true, "message": "No entry for symbol in stocks database"});
        }
        res.status(200);
        res.json(rows[0]);
    })
    .catch((err) => {
        console.log(err);
        res.json({"error": true, "message": "Error executing MySQL Query"});
    });
});

const authorize = (req, res, next) => {
    const authorization = req.headers.authorization
    let token = null;
    if (!authorization) {
        res.status(403);
        return res.send({"error": true, "message":"Authorization header not found"})
    }
    if (authorization && authorization.split(' ').length === 2){
        token = authorization.split(' ')[1];
        console.log("Token: ", token);
    } else {
        console.log("Unauthorizaed user");
        return;
    }
    try {
        const decoded = jwt.verify(token, secretKey);

        if (decoded.exp < Date.now()) {
            console.log("Token has expires");
            return;
        }
        next();
    } catch(err) {
        console.log("Token is not valid: ", err);
    }
}
router.get('/authed/:symbol', authorize, function(req,res,next) {
    if ((req.query.from && req.query.to) || !(req.url.includes('?'))) {
        if (Date.parse(req.query.from) > Date.parse(req.query.to) || Date.parse(req.query.from) < Date.parse("2019-11-06") || Date.parse(req.query.to) > Date.parse("2020-03-24")) {
            res.status(404);
            return res.send({"error":true, message:"No entries available for query symbol for selected date range"});
        }
        req.db.from('stocks').select('*').where('symbol','=',req.params.symbol).whereBetween('timestamp', [req.query.from, req.query.to])
        .then((rows) => {
            res.json(rows);
        })
        .catch((err) => {
            console.log(err);
            res.json({"error": true, "message": "error executing MySQL query"})
        })
    } else {
        res.status(400);
        res.send({"error": true, "message":"Parameters allowed are 'from' and 'to', example: /stocks/authed/AAL?from=2020-03-15"})
    }
});

module.exports = router;
