'use strict';

require('dotenv').config();

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Database Setup
// const client = new pg.Cient(process.env.DATABASE_URL);
// client.connect();
// client.on('error', err => console.error(err));

// Application Middleware
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
app.get('/', runTest);
app.get('/test', runTest);

// Helper function
function runTest(request, response){
  console.log('hello');
  response.render('pages/index');
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));
