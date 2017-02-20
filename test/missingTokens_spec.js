/**
 * Created by makere001c on 2/16/17.
 */
/**
 * Mikaila Akeredolu
 * API Test Cases
 * Comcast Connected Health 2017
 * **/


/*
var frisby = require('frisby');
var cloudmine = require('cloudmine');

//A GET REQUEST WITH A MISSING or INVALID API KEY GET/ MISSING API KEY
frisby.create('')
    .get('https://api.secure.cloudmine.me/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user?search=cch_id="05f2d2a9-cff7-4e73-8348-43d22abfb430"',
        { headers: {
            'Content-Type': 'application/json',
            'x-cloudmine-apikey':'3f4e0ff4d78a8fINVALI1DKEY',
            'x-cloudmine-sessiontoken':'nT11qznF2Lv2iaewaAf213FK9UgW'
        }},{json: true})
    .expectJSON({ errors: [ 'API Key invalid' ] })
    .expectStatus(401)
    .inspectJSON()
    .toss()




//A GET REQUEST WITH MISSING SESSION TOKEN
frisby.create('GET/ MISSING SESSION TOKEN')
    .get('https://api.secure.cloudmine.me/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user?search=cch_id="05f2d2a9-cff7-4e73-8348-43d22abfb430"',
        { headers: {
            'Content-Type': 'application/json',
            'x-cloudmine-apikey':'0ac9bec7ea0a4d79a92a5e503f3c44b6',
            'x-cloudmine-sessiontoken':''

        }},{json: true})
    .expectJSON({result: "access_token is missing from the session"})
    .expectStatus(200)  //postman returning 200
    .inspectJSON()
    .toss()



// //A GET REQUEST WITH A MISSING SESSION TOKEN
// frisby.create('GET/ MISSING SESSION TOKEN')
// .get('http://127.0.0.1:4545/v1/app/fd94599ddd8ee64831989b5df47bdd68/run/user?search=cch_id="55afaa16-5eec-4ae0-b9b9-77ca53a1697f"',
// { headers: {
// 'Content-Type': 'application/json',
// 'x-cloudmine-apikey':'3f4e0ff4d78a466b8f2a465431a0bfa9',
// 'x-cloudmine-sessiontoken':''
//
// }},{json: true})
// .expectJSON({result:"access_token is missing from the session"})
// .expectStatus(400)
// .inspectJSON()
// .toss()


 */