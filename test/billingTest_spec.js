/**
 * Created by bralla200 on 4/26/2017.
 */

var cloudmine = require('cloudmine');
var frisby = require('frisby');

frisby.globalSetup({
    request:{
        headers:{
            'Content-Type': 'application/json',
            'x-cloudmine-apikey':'0ac9bec7ea0a4d79a92a5e503f3c44b6',
            'x-cloudmine-sessiontoken':'CjIgiP9SdaueQBga0mfX7dUOvowK'
        }
    }
});


// post a billing event object for a user.
// after post get a Billing object with cch_id of user.
frisby.create('POST BILLING EVENT')
    .post('http://localhost:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/billing',
        {
    "tenant_id": "AHC",
    "cch_id": "bfc50459-3e91-4e9a-8624-11bb469bf7f4",
    "event_type": "login",
    "event_details":
    {
        "name": "login",
        "details": "success"
    }

        },{ json: true })
    .expectStatus(201)
    .expectHeaderContains('content-type', 'application/json')
    .inspectJSON()
    .afterJSON(function(){
        frisby.create('GET AFTER POST')
            .get('http://localhost:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/billing?cch_id=02c5a573-d5f5-4454-b395-be7fc6868b4f')
            .expectStatus(200)
            .inspectJSON()
            .toss();
    })
    .toss();


