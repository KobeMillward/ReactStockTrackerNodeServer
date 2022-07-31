//Created by Kobe Millward-Wright (n10269746)
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const options = require('./knexfile.js');
const knex = require('knex')(options);
const swaggerUI = require('swagger-ui-express');
yaml = require('yamljs')
const swaggerDocument = yaml.load("./docs/swaggerStocks.yaml");
const helmet = require('helmet');
const cors = require('cors');

var userRouter = require('./routes/user');
var stocksRouter = require('./routes/stocks');

var app = express();


// view engine setup
app.use((req,res,next) => {
  req.db = knex;
  next();
})
app.use(helmet());
app.use(logger('dev'));
app.use(cors());
logger.token('req', (req, res) => JSON.stringify(req.headers));
logger.token('res', (req, res) => {
  const headers = {};
  res.getHeaderNames().map(h => headers[h] = res.getHeader(h));
  return JSON.stringify(headers);
})
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use('/stocks', stocksRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
