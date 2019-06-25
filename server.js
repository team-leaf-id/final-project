'use strict';

require('dotenv').config();

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Database Setup TODO: COMMENTED OUT UNTIL WE NEED DATABASES
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

  superagent.get(url)
    .then(results => getPlantDetails(results.body))
    // .then(results => response.render('searches/show', {results: results})) TODO: COMMENTED OUT FOR NOW, NOT RENDERING UNTIL I CAN FIGURE OUT EXACTLY IF THE CONSTRUCTOR FUNCTION ETC WORKS
    .catch(error => handleError(error, response));
}

function getPlantDetails(results){
  let plantArray = [];
  results.map(plant => {
    let url = `https://trefle.io//api/plants/${plant.id}?token=${process.env.PLANT_KEY}`;

    superagent.get(url)
      .then(results => new Plant(results.body))
      .then(plants => plantArray.push(plants));
  });
  console.log('PLANT ARRAY>>>>>>', plantArray); // TODO: THIS IS RETURNING AN EMPTY ARRAY. CAN ANYONE SEE WHY?
}

// Constructor Function
function Plant(result){
  this.common_name = result.common_name ? result.common_name : 'No common name available';
  this.scientific_name = result.scientific_name ? result.scientific_name : 'No id available';
  this.toxicity = result.main_species.specifications.toxicity? result.main_species.specifications.toxicity : 'Unknown';
  this.lifespan = result.main_species.specifications.lifespan? result.main_species.specifications.lifespan : 'Unknown';
  this.growth_period = result.main_species.specifications.growth_period? result.main_species.specifications.growth_period : 'Unknown';
}

function handleError(error, response){
  console.error(error);
  response.status(500).send('Sorry, something went wrong');
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));
