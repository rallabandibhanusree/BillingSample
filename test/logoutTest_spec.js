/**
 * Created by makere001c on 2/16/17.
 */

/*
var frisby = require('frisby');
var cloudmine = require('cloudmine');

frisby.globalSetup({
    request:{
        headers:{
            'Content-Type': 'application/json',
            'x-cloudmine-apikey':'0ac9bec7ea0a4d79a92a5e503f3c44b6',
            'x-cloudmine-sessiontoken':'Bv7I5v2Ufzph1hL55OhfxH4ZMxB9'
        }
    }
});

//GET THE USER  ****Change Endpoint to reflect snippet in cloudmine - https://api.secure.cloudmine.me/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user
frisby.create('GET THE USER')
    .get('http://127.0.0.1:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user?search=cch_id="8a53a1dc-6f73-4bd9-8d8a-01cd0591c3eb"')
    // { headers: {
    //     'Content-Type': 'application/json',
    //     'x-cloudmine-apikey':'0ac9bec7ea0a4d79a92a5e503f3c44b6',
    //     'x-cloudmine-sessiontoken':''
    //
    // }},{json: true})
    .expectBodyContains('testCM9@cch.org')
    .expectStatus(200)
    .inspectJSON()
    .toss();

//LOG OUT THE USER
frisby.create('LOG OUT THE USER')
    .get('http://127.0.0.1:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/logout')
    .expectStatus(200)
    .expectJSON({ result: 'Logout successful' })
    .inspectJSON()
    .afterJSON(function () {
        ////GET THE USER WHILE ALREADY LOGGED OUT
        frisby.create('GET THE USER WHILE ALREADY LOGGED OUT')
            .get('http://127.0.0.1:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user?search=cch_id="8a53a1dc-6f73-4bd9-8d8a-01cd0591c3eb"')
            .expectJSON({ result: { '401': { errors: [ 'Unauthorized' ] } } })
            .expectStatus(400)
            .inspectJSON()
            .toss();
    })
    .toss()
*/