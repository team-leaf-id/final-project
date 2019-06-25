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
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// Application Middleware
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
app.get('/', renderHomePage);
app.post('/searches', getFish);
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

// Helper function
function renderHomePage(request, response){
  getFish(request, response);
  response.render('pages/index');
}

function getFish(request, response){
  const url = `https://www.fishwatch.gov/api/species`;

  superagent.get(url)
    .then(results => {
      results.body.map(fish => {
        const insertSQL = `INSERT INTO fish (species_name, species_aliases, path) VALUES
        ('${fish['Species Name']}', '${fish['Species Aliases']}', '${fish['Path']}');`;
        return client.query(insertSQL);
      })
    })
    .catch(error => handleError(error, response));
}

// function cacheWeather(weather, client, locationId) {
//   // the time this function was called
//   let createdAt = new Date().valueOf();

//   const insertSQL = `INSERT INTO weathers (forecast, time, created_at, location_id) VALUES 
//     ('${weather.forecast}', '${weather.time}', ${createdAt}, ${locationId});`;
//   return client.query(insertSQL).then(results => {
//     return results;
//   });
// }

// function getFish(request, response){
//   let url = `https://www.fishwatch.gov/api/species`;

//   // console.log('request: ', request.body);
//   // console.log('URL: ', url);

//   superagent.get(url)
//     // .then(apiResponse => {
//     //   console.log('RESPONSE BODY', apiResponse.body);
//     //   apiResponse.body.map(plantResult => {
//     //     // console.log('RESPONSE', apiResponse);
//     //     let plantArray = new Plant(plantResult);
//     //     return plantArray;
//     //   })})
//     .then(results => {
//       console.log('RESPONSE BODY>>>>>>>>>>>>', results.body);
//       response.render('searches/show', {results: results.body})})
//     .catch(error => handleError(error, response));

// }

// Constructor Function
function Fish(result){
  this.species_name = result.object.location ? result.object.location : 'No common name available';
  this.id = result.id ? result.id : 'No id available';
  this.link = result.link? result.link : 'No link available';
}

function handleError(error, response){
  console.error(error);
  response.status(500).send('Sorry, something went wrong')
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));
