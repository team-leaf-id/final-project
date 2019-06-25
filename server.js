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
  const url = `https://www.fishwatch.gov/api/species`;

  superagent.get(url)
    .then(results => {
      results.body.map(fish => {
        let species_name = fish['Species Name'].toLowerCase();
        let aliases = fish['Species Aliases'].split('<a href="/species-aliases/');
        let path = fish['Path'].slice(9);
        const insertSQL = `INSERT INTO fish (species_name, species_aliases, path) VALUES
        ('${species_name}', '${aliases}', '${path}');`;
        return client.query(insertSQL);
      })
    })
    .catch(error => handleError(error, response));
}

function searchFish(request, response){
  // const url = `https://www.fishwatch.gov/api/species`;
  // console.log('THIS IS THE REQUEST', request.body.search);
  let searchQuery = request.body.search.toLowerCase();
  const SQL = `SELECT path FROM fish WHERE species_name LIKE '%${searchQuery}%';`;
  return client.query(SQL).then(results => console.log('RESULTS!!!!!', results.rows));
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

// Constructor Function
// function Fish(result){
//   this.location = result.object.location ? result.object.location : 'No common name available';
//   this.id = result.id ? result.id : 'No id available';
//   this.link = result.link? result.link : 'No link available';
// }

function handleError(error, response){
  console.error(error);
  response.status(500).send('Sorry, something went wrong')
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));
