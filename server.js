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
        let filteredAliases = aliases.filter(str => !str.match(regex));
        let image_url = fish['Species Illustration Photo'].src;
        let path = fish['Path'].slice(9);

        const SQL = `INSERT INTO fish (species_name, species_aliases, image_url, path) VALUES
        ('${species_name}', '${filteredAliases}', '${image_url}', '${path}');`;
        console.log('ALIAS', filteredAliases); // TODO: REGEX TIDY UP HERE
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

// function searchFish(request, response){
//   // const url = `https://www.fishwatch.gov/api/species`;
//   let searchQuery = request.body.search.toLowerCase();
//   const SQL = `SELECT path FROM fish WHERE species_name LIKE '%${searchQuery}%' OR species_aliases LIKE '${searchQuery}';`;
//   return client.query(SQL)
//     .then(results => {
//       let fishArray = [];
//       results.rows.forEach(row => {
//         getFishDetails(row.path)
//           .then(fishfish => {
//             console.log('FISH', fishfish);
//             fishArray.push(fishfish);
//           });
//       })
//       return fishArray;
//     })
//     .then(results => response.render('searches/show', {results: results}))
//     .catch(error => handleError(error, response));
// }

function getFishDetails(request, response){
  // console.log('request.............', request.params.path);
  // let SQL =`SELECT path FROM fish WHERE id = ${request.params.id};`;
  const url = `https://www.fishwatch.gov/api/species/${request.params.path}`;


  superagent.get(url)
    .then(results => {
      // console.log('RESULT!!!!!', results.body);
      const fishInstances = results.body.map(detailFishResult=>{
        let fishFish = new Fish(detailFishResult);
        return fishFish;
      })
      // console.log('INSTANCES....', fishInstances);
      return fishInstances;
    }).then(results => {
      console.log('RESULTS!!!!!!!', results[0].location);
      return response.render('searches/details', { fishBanana: results[0] })})
    // }).then(results => response.send(results))
    .catch(error => handleError(error, response));

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
  this.biology = result['Biology'] ? result['Biology'] :'no biology information available' ;
  this.quote = result['Quote'] ? result['Quote'] :'no information available' ;
  this.taste = result['Taste'] ? result['Taste'] :'no flavor information available' ;
  this.texture = result['Texture'] ? result['Texture'] :'no Texture information available' ;
  this.color = result['Color'] ? result['Color'] :'no color information available' ;
  this.physical_description = result['Physical Description'] ? result['Physical Description'] :'no physical description information available' ;
  this.source = result['Source'] ? result['Source'] :'no source information available' ;
}

// function getLocation(query, client, superagent) {
//   return getStoredLocation(query, client).then(location => {
//     if (location) {

//       return location;
//     } else {
//       return getLocationFromApi(query, client, superagent);
//     }
//   });
// }

// function getStoredLocation(query, client) {
//   const sql = `SELECT * FROM locations WHERE search_query='${query}'`;

//   return client.query(sql).then(results => results.rows[0]);
// }

// function createSearch(request, response) {
//   let url = 'https://www.googleapis.com/books/v1/volumes?q=';

//   if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
//   if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

//   superagent.get(url)
//     .then(apiResponse => apiResponse.body.items.map(bookResult =>{

//       let bookArr = new Book(bookResult.volumeInfo);
//       console.log(bookArr);
//       return bookArr;
//     })

//     )
//     .then(results => response.render('pages/searches/show', { results: results }))
//     .catch(err => handleError(err, response));
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


function handleError(error, response){
  console.error(error);
  response.status(500).send('Sorry, something went wrong')
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));
