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
app.get('/', renderHomePage);
app.post('/searches', searchForPlants);
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

// Helper function
function renderHomePage(request, response){
  response.render('pages/index');
}

function searchForPlants(request, response){
  let url = `http://trefle.io/api/plants/?token=${process.env.PLANT_KEY}&q=${request.body.search}`;

  // console.log('request: ', request.body);
  // console.log('URL: ', url);

  superagent.get(url)
    // .then(apiResponse => {
    //   console.log('RESPONSE BODY', apiResponse.body);
    //   apiResponse.body.map(plantResult => {
    //     // console.log('RESPONSE', apiResponse);
    //     let plantArray = new Plant(plantResult);
    //     return plantArray;
    //   })})
    .then(results => {
      console.log('RESPONSE BODY>>>>>>>>>>>>', results.body);
      response.render('searches/show', {results: results.body})})
    .catch(error => handleError(error, response));
}

// Constructor Function
function Plant(result){
  this.common_name = result.common_name ? result.common_name : 'No common name available';
  this.id = result.id ? result.id : 'No id available';
  this.link = result.link? result.link : 'No link available';
}

function handleError(error, response){
  console.error(error);
  response.status(500).send('Sorry, something went wrong')
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));
