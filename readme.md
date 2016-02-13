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
## Credential
In order to access the SNCF API, a key is needed. Here are the procedure

- Register on [https://data.sncf.com/api](https://data.sncf.com/api) to get your key
- Create a new **CONF.json** from **CONF.empty.json**
- Replace the KEY by your own private key

# Running
- Make sure to update the configuration file (see credential)
- npm start

Go to [localhost:3000](localhost:3000)

# What you can see

- All stations at [localhost:3000/stations](localhost:3000/stations)