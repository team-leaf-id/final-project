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
        let regexTT = /(<p>|<\/p>|\\n|<span>|<\/span>|&nbsp|;)/gmi;
        let species_name = fish['Species Name'].toLowerCase();
        let aliases = fish['Species Aliases'].split(regex);
        let filteredAliases = aliases.filter(str => !str.match(regex) && str.length > 1);
        let image_url = fish['Species Illustration Photo'].src;
        let path = fish['Path'].slice(9);
        let taste = 'No taste available';
        if(fish['Taste']){
          taste = fish['Taste'].replace(regexTT, '');
        }
        let texture = 'No texture available';
        if(fish['Texture']){
          texture = fish['Texture'].replace(regexTT, '');
        }
        const SQL = `INSERT INTO fish (species_name, species_aliases, image_url, path, taste, texture) VALUES
        ('${species_name}', '${filteredAliases}', '${image_url}', '${path}', '${taste}', '${texture}');`;
        return client.query(SQL).catch(error => console.log('ERROR HERE', error));
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
  let regex = /<ul>\s<li>|<li>|<\/li>| <\/ul>|<p>|<\/p>|&[a-z][a-z][a-z][a-z];|\/n|&[a-z][a-z][a-z][a-z];<\/li><\/ul>|<ul>\s<li>|\s<\/ul>|<em>|<\/em>/gmi;
  console.log('110 - IN GET FISH DETAILS FUNCTION, PATH IS:', request.params.path);
  superagent.get(url)
    .then(results => {
      const fishInstances = results.body.map(detailFishResult=>{
        let fishFish = new Fish(detailFishResult);
        for (const detail in fishFish) {
          fishFish[detail] = fishFish[detail].replace(regex, '');
        }
        return fishFish;
      })
      return fishInstances;
    })
    .then(results => {
      console.log('125 - IN AREA TO RUN SUSTAINABILITY CHECK');
      return sustainabilityCheck(results[0]).then(sustainabilityInfo => {
        return {fishData: results[0], option: sustainabilityInfo};
      });
    })
    .then(totalData => {
      console.log('131 - IN AREA TO RENDER, OPTIONS ARE:', totalData.option);
      response.render('searches/details', { fishBanana: totalData.fishData, optionBanana: totalData.option });
    })
    .catch(error => handleError(error, response));
}

function sustainabilityCheck(fishInfo){
  console.log('138 - IN SUSTAINABILITY CHECK FUNCTION');
  let tick;
  const sustainableTalk = ['smart seafood choice', 'sustainably managed', 'responsibly harvested'];
  sustainableTalk.forEach(phrase => {
    if(fishInfo.quote.includes(phrase)){
      tick = true;
    }
  })
  if (tick === true){
    console.log('147 - TICK SUSTAINABLE, INCLUDES PHRASES');
    let text = 'You have picked a sustainable and smart seafood choice!';
    let image = 'https://via.placeholder.com/150'; //TODO: Yoshi's images will go here
    return findRecipes(fishInfo, text, image);
  } else {
    console.log('152 - TICK IS FALSE, NOT SUSTAINABLE, DOES NOT INCLUDE PHRASE');
    let text = 'Unfortunately, this is not a smart seafood choice.';
    let phrase = 'Check out these other fish:';
    let image = 'https://via.placeholder.com/50'; //TODO: Yoshi's image will go here
    return findAlt(fishInfo, text, phrase, image);
  }
}

function findRecipes(fishInfo, text, image){
  let searchFish = fishInfo.path.replace('_', '-').slice(10);
  console.log('162 - FIND RECIPE FUNCTION, SEARCH FISH:', searchFish);
  let url = `https://api.edamam.com/search?q=${searchFish}&app_id=${process.env.RECIPE_ID}&app_key=${process.env.RECIPE_KEY}`;

  return superagent.get(url)
    .then(results => organizeRecipe(results))
    .then(organizedResults => {
      let phrase;
      if (organizedResults.length < 1){
        phrase = 'Unfortunately, we couldn\'t find any recipes at this time. Try searching for another fish!';
      } else {
        phrase = 'Here are some recipes we found:';
      }
      return {text: text, image: image, phrase: phrase, data: organizedResults};
    })
}

function organizeRecipe(results){
  let recipes = JSON.parse(results.text);
  let organizedRecipes = [];
  for(let i = 0; i < recipes.hits.length; i++){
    organizedRecipes.push({
      name: recipes.hits[i].recipe.label,
      path: recipes.hits[i].recipe.url
    });
  }
  return organizedRecipes;
}

function findAlt(fishInfo, text, phrase, image){
  let keywords = findTasteTextureKeywords(fishInfo);
  console.log('166 - IN ALT FUNCTION, KEYWORDS:', keywords);

  const SQL = `SELECT DISTINCT species_name, path FROM fish WHERE taste LIKE '%${keywords.taste[0]}%' AND texture LIKE '%${keywords.texture[0]}%';`;

  return client.query(SQL)
    .then(results => organizeResults(results))
    .then(finalResults => {
      console.log('192 - FINAL RESULTS', finalResults);
      return {text: text, image: image, phrase: phrase, data: finalResults};
    })
}

function organizeResults(results){
  let finalResults = [];
  for (let i = 0; i < results.rows.length; i++){
    finalResults.push({
      name: results.rows[i].species_name,
      path: `/searches/details${results.rows[i].path}`
    });
  }
  return finalResults;
}

function findTasteTextureKeywords(fishInfo){
  let tasteRegex = /(sweet|delicate|oil|mild|rich|nutty)/gmi;
  let textureRegex = /(semi-firm|lean|moist|soft|flaky|firm|tender)/gmi;
  let taste = fishInfo.taste.match(tasteRegex);
  let texture = fishInfo.texture.match(textureRegex);
  return {taste: taste, texture: texture};
}

function handleError(error, response){
  console.error(error);
  response.status(500).send('Sorry, something went wrong')
}

// Constructor Function
function Fish(result){
  let httpRegex = /^(https:\/\/)?g/


  this.species_name = result['Species Name'] ? result['Species Name'] : 'No name information available';
  this.image_url = result['Species Illustration Photo'].src ? result['Species Illustration Photo'].src.replace(httpRegex, 'https') : 'No image available';
  this.path = result['Path'] ? result['Path'] : 'no path available' ;
  this.habitat = result['Habitat'] ? result['Habitat'] : 'no habitat information available' ;
  this.habitat_impacts = result['Habitat Impacts'] ? result['Habitat Impacts'] :'no habitat impact information available' ;
  this.location = result['Location'] ? result['Location'] :'no location information available' ;
  this.population = result['Population'] ? result['Population'] :'no population information available' ;
  this.scientific_name = result['Scientific Name'] ? result['Scientific Name'] :'no Scientific Name available' ;
  this.availability = result['Availability'] ? result['Availability'] :'no availability information available' ;
  this.quote = result['Quote'] ? result['Quote'] :'no information available' ;
  this.taste = result['Taste'] ? result['Taste'] :'no flavor information available' ;
  this.texture = result['Texture'] ? result['Texture'] :'no Texture information available' ;
  this.color = result['Color'] ? result['Color'] :'no color information available' ;
  this.physical_description = result['Physical Description'] ? result['Physical Description'] :'no physical description information available' ;
  this.source = result['Source'] ? result['Source'] :'no source information available' ;
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));
