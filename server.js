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
app.get('/searches/details/:path', getFishDetails);
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
        console.log('42 - GETTING FISH DATA FROM OUR DATABASE');
        return fishData;
      } else {
        console.log('45 - GETTING FISH DATA FROM API');
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

function getFishDetails(request, response){
  const url = `https://www.fishwatch.gov/api/species/${request.params.path}`;

  superagent.get(url)
    .then(results => {
      const fishInstances = results.body.map(detailFishResult=>{
        let fishFish = new Fish(detailFishResult);
        return fishFish;
      })
      return fishInstances;
    })
    .then(results => {
      console.log('111 - IN AREA TO RUN SUSTAINABILITY CHECK');
      let option = sustainabilityCheck(results[0]);
      return {fishData: results[0], option: option};
    })
    .then(totalData => {
      console.log('116 - IN AREA TO RENDER', totalData);
      response.render('searches/details', { fishBanana: totalData.fishData, optionBanana: totalData.option })
    })
    .catch(error => handleError(error, response));

}

function sustainabilityCheck(fishInfo){
  // console.log('123 - IN SUSTAINABILITY CHECK FUNCTION', fishInfo);
  let tick;
  const sustainableTalk = ['smart seafood choice', 'sustainably managed', 'responsibly harvested'];
  sustainableTalk.forEach(phrase => {
    if(fishInfo.quote.includes(phrase)){
      tick = true;
    }
  })
  if (tick === true){
    console.log('133 - TICK, INCLUDES PHRASES');
    let text = 'You have picked a sustainable and smart seafood choice! Here are some recipes:';
    let image = 'https://via.placeholder.com/150';
    return {text: text, image: image};
  } else {
    console.log('136 - TICK IS FALSE, DOES NOT INCLUDE PHRASE');
    let text = 'Unfortunately, this is not a smart seafood choice. Here are other fish that you may enjoy:';
    let image = 'https://via.placeholder.com/50';
    return {text: text, image: image};
  }
}

function findRecipes(fishInfo){ //Which recipe API to use?

}

function findAlt(fishInfo){ 
  
}

function handleError(error, response){
  console.error(error);
  response.status(500).send('Sorry, something went wrong')
}

// Constructor Function
function Fish(result){

  this.species_name = result['Species Name'] ? result['Species Name'] : 'No name information available';
  this.image_url = result['Species Illustration Photo'].src ? result['Species Illustration Photo'].src : 'No image available';
  this.path = result['Path'] ? result['Path'] : 'no path available' ;
  this.habitat = result['Habitat'] ? result['Habitat'] : 'no habitat information available' ;
  this.habitat_impacts = result['Habitat Impacts'] ? result['Habitat Impacts'] :'no habitat impact information available' ;
  this.location = result['Location'] ? result['Location'] :'no location information available' ;
  this.population = result['Population'] ? result['Population'] :'no population information available' ;
  this.scientific_name = result['Scientific Name'] ? result['Scientific Name'] :'no Scientific Name available' ;
  this.availability = result['Availability'] ? result['Availability'] :'no availability information available' ;
  // this.biology = result['Biology'] ? result['Biology'] :'no biology information available' ;
  this.quote = result['Quote'] ? result['Quote'] :'no information available' ;
  this.taste = result['Taste'] ? result['Taste'] :'no flavor information available' ;
  this.texture = result['Texture'] ? result['Texture'] :'no Texture information available' ;
  this.color = result['Color'] ? result['Color'] :'no color information available' ;
  this.physical_description = result['Physical Description'] ? result['Physical Description'] :'no physical description information available' ;
  this.source = result['Source'] ? result['Source'] :'no source information available' ;
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));
