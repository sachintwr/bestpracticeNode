// index.js
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

require('@babel/register');
require('./app/server');