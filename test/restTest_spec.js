var frisby = require('frisby');
frisby.create('Ensure we can search')
    .get('http://localhost:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user?search=username="3TEST"',
        {headers: {'Content-Type': 'application/json', 'x-cloudmine-apikey':'0ac9bec7ea0a4d79a92a5e503f3c44b6', 'x-cloudmine-sessiontoken':'s5eAxFhWxiNWn6fvOAauuYil8Tx8'}})
    .expectStatus(200).expectJSON({ result:
    { 'profile_05f2d2a9-cff7-4e73-8348-43d22abfb430':
    { username: '3TEST',
        status: 'Active',
        last_name: 'singh',
        address1: '123dds',
        address2: '124sdfdfsdfs',
        partner_id: '3',
        city: 'bordentow',
        first_name: 'harvinder',
        birthdate: '1988-04-15',
        state: 'ny',
        email: '3@comcast.com',
        zip_code: '08506',
        cch_id: '05f2d2a9-cff7-4e73-8348-43d22abfb430',
        __class__: 'user',
        __access__: '7419eea68b1d4502834029fb601e616a' } } }
)
    //.retry(5, 1000)
    .afterJSON(function(obj){
        //console.log(obj.result)
        //frisby.create("check").inspectJSON(obj);
        var keys = Object.keys(obj.result);

        expect(obj.result[keys[0]].username === '3TEST').toBe(true);
    })
    .inspectJSON()
    .toss()
