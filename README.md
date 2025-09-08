
# EASYCRED ASTROCRED  CHECKOUT SYSTEM

- Install [Nodejs](https://nodejs.org/en)
- Install [Git](https://git-scm.com/)
- Create an Account On [Mongo Atlas](https://www.mongodb.com/atlas/database)
- Create Database Instance On Mongo Atlas 
- clone the App by performing `git clone <repo name>`
- open cmd line
- perform `npm install`
- in  `.env` file substitute the correct value 
- from command line type `node server`
- open browser and open http://localhost:5001
- App Is Running 


TOP Level Structure Conventions
============================

> Top Level Folder structure options and naming conventions

### A typical top-level directory layout

    .
    ├── server                 # Contains all required depdendency such as npm,express  modules and business logic
    ├── views                  # Contains basic UI output
    ├── node_modules           # pre requisite folder for npms
    └── README.md              # README.md file for start information 
    └── .env                   # ENV file. Each Developer would have own setup of values for ENV File. ENV is not commited to Git
    └── .gitignore             # ignore unwanted files
    └── package.json           # Contains npms specific config information
    └── server.js              # Entry Point For App


> Use short lowercase camel casing names at least for the top-level files and folders except
> `LICENSE`, `README.md`


Sub Folder Structure Conventions
============================

> Folder structure options and naming conventions for pricing projects

### A sub-level directory layout

    server
    ├── init                   # Contains all required depdendency such as npm,express middleware globally accessible
    ├── modules                # Contains all modules/components which would contain all module based logic
    ├── routes                 # List of all routes mapped to modules 
    ├── schema                 # All Mongo schema (Contains Schema based on Mongo Mongoose ODM)
    ├── migration              # Migration from ODBC to Mongo
    ├── test                   # Test
     ── socket                 # Socket Implementation
    └── data                   # contain JSON files such as swagger.json etc
    └── app.js                 # Contain Access for all module/config files to be accessible across the project  
    └── cluster-start.js       # Start/Boot Code 
    └── boot-config.js         # Boot Configuration


# CIBIL Financial Health Analyzer

A Node.js application that analyzes CIBIL credit data and provides easy-to-understand letter grade assessments (A+ to D) along with actionable recommendations.

## Features

- CIBIL data analysis and grading system
- Letter grade classification (A+ to D)
- Default risk identification
- Personalized improvement recommendations
- RESTful API for integration
- MongoDB data storage

## Installation

1. Extract the downloaded ZIP file
2. Navigate to the project directory
3. Run `npm install` to install dependencies
4. Ensure MongoDB is running on your system
5. Run `npm start` to start the server

## API Endpoints

- `POST /api/cibil/upload` - Upload CIBIL data for analysis
- `GET /api/cibil/analysis/:client_id` - Get analysis for a specific client
- `GET /api/cibil/clients/grades` - Get all clients with their grades

## Usage

1. Start the server with `npm start`
2. Use the API endpoints to upload and analyze CIBIL data
3. The system will return letter grades and recommendations

## Future Enhancements

This project is designed to be extended with additional features as requirements evolve.

## Authors
[siddharth chandra](https://github.com/siddmegadeth)
