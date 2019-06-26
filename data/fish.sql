DROP TABLE IF EXISTS fish;

CREATE TABLE fish(
    id SERIAL PRIMARY KEY,
    species_name VARCHAR(255),
    species_aliases text,
    image_url VARCHAR(255),
    path VARCHAR(255),
    taste VARCHAR(255),
    texture VARCHAR(255)
);