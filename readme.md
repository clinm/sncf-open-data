# Overview
This project has several purposes: 
## Exploring open data
I really enjoy open data and all applications you can make with them. I discovered that SNCF is providing free access
to real time information on traffic and decided to give a shot at it.

## Learning NodeJS and other cool stuffs
Learning things become easier when you can apply them directly onto an exiting project !

## Statistics and such
My current study allows me to learn cool stuff in statistics, intelligent systems and I would like (one day) to apply
them on real time traffic with this project.

# Getting started
First of all, you need to make your own configuration file. There is a default configuration file available in the conf
directory. You just have to create a new **CONF.json** file from **CONF.json.default** and you update the credential.
## Credential
In order to access the SNCF API, a key is needed. Here are the procedure

- Register on [https://data.sncf.com/api](https://data.sncf.com/api(FR/EN)) to get your key
- Replace the KEY by your own private key

# Running
- Make sure to update the configuration file (see credential)
- npm test
- npm start

Go to [localhost:3000](localhost:3000)

# Features
## Station's filtering (/api/stop_areas)
Parameters available for PUT request
```javascript
{ 
    fields: { 
        departement: 'Moselle',     // Department
        commune: 'Metz',            // City
        segment_drg: 'a',           // (1)
        region: 'Lorraine',         // Region
        nombre_plateformes: '1',    // Platform's number
        intitule_gare: 'Metz Ville',// Station's title
        code_postal: '57000'        // Postal code
    },
    name: 'gare de Metz-Ville'      // Station's name
}
```


(1) segment_drg is a category. It can be either a, b or c (sometimes several at the same time in the data).
What it means:

- a: National
- b: Regional
- c: Local

You can find out more about fields definition and full data 
[here(FR)](https://ressources.data.sncf.com/explore/dataset/referentiel-gares-voyageurs/information/?disjunctive.nombre_plateformes).
All parameters can be Javascript Regex.

# What you can see
One example is available at [localhost:3000/stations](localhost:3000/stations) once the server is running. You can
filter the stations by using the form on the left. All inputs allows Regex expressions as defined 
[here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions).