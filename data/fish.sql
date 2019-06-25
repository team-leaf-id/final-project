DROP TABLE IF EXISTS fish;

CREATE TABLE fish(
    id SERIAL PRIMARY KEY,
    species_name VARCHAR(255),
    species_aliases text,
    path VARCHAR(255)
);

INSERT INTO fish (species_name, species_aliases, path) VALUES (
    'trout',
    'salmon',
    '/profiles/salmon'
);