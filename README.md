# Normanate

## How to build

### First time

Make sure you have node.js installed (use nvm!) Also make sure you have bower and grunt installed, if you haven't already.

    $ npm install -g bower
    $ npm install -g grunt-cli

Make sure to install mongodb as well, and that mongo is running on the default port. The app will yell at you if it isn't.

Then clone the repository, and run

    $ npm install
    $ bower install

to install all the dependencies. `npm` for server-side dependencies, and `bower` for client-side dependencies.

### Seeding the database

To install the etymology database, run

    $ node seed

in the base folder. This only has to be done once, and if you want to rewrite the database for whatever reason.

The seed script now also works with the production database! It takes the following command line arguments:
    --mongo: the URI of the mongo instance to seed. Defaults to the localhost test database
    -f: flag to read the --mongo information from a file

Example:

    $ node seed --mongo mongodb://localhost:27017/test
    $ node seed --mongo -f mongodata.txt

### Running the program

The app is built using a weird Frankenstein hybrid of LESS and SASS at the moment for CSS, and Browserify for Javascript. A lot of it is handled in-app, but we use grunt to deal with any and all preprocessing.

Use

    grunt serve

to run the app. And

    grunt test --force

to run the linter and all of our mocha tests. The linter will yell at us, so the force is needed to keep going.

Anytime you pull from the github repository, you'll probably have to run
    
    $ npm install
    $ bower install

again to update dependencies.

