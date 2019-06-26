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
app.post('/searches', searchFish);
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

// Helper function
function renderHomePage(request, response){
  getFish(request, response);
  response.render('pages/index');
}

function getFish(request, response){
  return getFishFromDB()
    .then(fishData => {
      if (fishData.length > 1 ){
        console.log('GETTING FISH DATA FROM OUR DATABASE');
        return fishData;
      } else {
        console.log('GETTING FISH DATA FROM API');
        return getFishFromAPI(request, response);
      }
    });
}

function getFishFromDB(){
  let SQL = `SELECT * FROM fish;`;
  return client.query(SQL)
    .then(results => {
      if(results.rows){
        return results.rows;
      } else {
        return undefined;
      }
    });
}

function getFishFromAPI(request, response){
  const url = `https://www.fishwatch.gov/api/species`;

  superagent.get(url)
    .then(results => {
      results.body.map(fish => {
        let regex = /(<a href="\/species-aliases\/|typeof="skos:Concept" property="rdfs:label skos:prefLabel" datatype="">|<\/a>|, +|"| )/gmi;
        let species_name = fish['Species Name'].toLowerCase();
        let aliases = fish['Species Aliases'].split(regex);
        let filteredAliases = aliases.filter(str => !str.match(regex) && str.length > 1);
        let image_url = fish['Species Illustration Photo'].src;
        let path = fish['Path'].slice(9);

        const SQL = `INSERT INTO fish (species_name, species_aliases, image_url, path) VALUES
        ('${species_name}', '${filteredAliases}', '${image_url}', '${path}');`;
        return client.query(SQL);
      })
    })
    .catch(error => handleError(error, response));
}

function searchFish(request, response){
  let searchQuery = request.body.search.toLowerCase();
  const SQL = `SELECT DISTINCT * FROM fish WHERE species_name LIKE '%${searchQuery}%' OR species_aliases LIKE '%${searchQuery}%';`;
  return client.query(SQL)
    .then(results => {
      if (results.rows.length < 1){
        let error = [{species_name: 'Sorry! No results available. Please search again!'}];
        response.render('searches/show', {results: error});
      } else {
        response.render('searches/show', {results: results.rows});
      }
    })
    .catch(error => handleError(error, response));
}

function sustainabilityCheck(fishInfo){
  const sustainableTalk = ['smart seafood choice', 'sustainably managed']; //Can this be an array?
  if(fishInfo.quote.includes(sustainableTalk)){
    let marker = 'canSustain.jpg'; //Get image from Yoshi
    let text = 'This fish is sustainable and a smart seafood choice! Here are some recipes:';
    let recipes = findRecipes(fishInfo);
    return marker, text, recipes;
  } else {
    let marker = 'notSustain.jpg';
    let text = 'This fish is not a smart seafood choice. Here are other fish that you may enjoy:';
    let alt = findAlt(fishInfo);
    return marker, text, alt;
  }
}

function findRecipes(fishInfo){ //Which recipe API to use?

}

function findAlt(fishInfo){ 
  
}

// Constructor Function
function Fish(result){

  this.species_name = result['Species Name'] ? result['Species Name'] : 'No name information available';

}

function handleError(error, response){
  console.error(error);
  response.status(500).send('Sorry, something went wrong')
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));
