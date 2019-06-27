# final-project

FISH FACE -- AN APP 

# Project Name

**Authors**: JOANNA ARROYO, RAVEN ROBERTSON, JOSH NEBE
**Version**: 1.0.0 

## Overview
Unsustainable extraction of marine resources and physical alterations and destruction of marine and coastal habitats have contributed to the threat of our maine resources which reduces the OCeans ability to provide crucial ecosystem services. The deterioration of coastal and marine ecosystems and habitats is negatively affecting human well-being worldwide. We decided to create Fish Face so that the public has an easy to access and understand tool about the sustainablity of salt water fish so that people can make a more educated choice when choosing which sea creatures to consume. Our app also works as a type of salt water fish encyclopedia, providing information on 109 different fish.

## Getting Started
We installed the following NPM packages to run our app: Nodemon, express, dotenv, pg,ejs and superagent. 

## Architecture
All of the pages that are being displayed to the user are .ejs files. Our app was built using HTML, Javascript, JQuery, SQL, CSS and REGEX. 
We request the entire database of fish from fishwatch.gov upon startup of the app. All the fish get stored into our local PSQL table and render initial search results from our postgres data base. When getting details about one particular fish a second request is made to fishwatch for individual fish details. Once on the details page the user can make an API request to edamam to find recipes matching the type of fish they are looking at. 
We're using regex to filter the text bing displayed to the user. 

## Change Log


## Credits and Collaborations
 We have keys to request recipes from developer.edamam.com and we are getting out fish data from an API provided by https://www.fishwatch.gov.
<!-- COLORS PROVIDED BY COLORS.CO -->


##COLOR PALETTE:

<!-- DARK SEAWEED: #79B791
METALLIC SEAWEED: #187795
ISABELLINE: #EAEDEA
CHARCOAL: #383F51
INDIPENDENCE:#3C4F78 
LOGO WHITE: #DADAD9
-->