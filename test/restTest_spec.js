/**
 * Created by makere001c on 2/1617.
 */
var frisby = require('frisby');
var cloudmine = require('cloudmine');

frisby.globalSetup({
    request:{
        headers:{
            'Content-Type': 'application/json',
            'x-cloudmine-apikey':'0ac9bec7ea0a4d79a92a5e503f3c44b6',
            'x-cloudmine-sessiontoken':'jpS7gBJaS180z1ONrQ488kyBBu9b'
        }
    }
});


//1 Create a new user as an Admin
frisby.create('POST A USER AS AN ADMIN')
    .post('http://localhost:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user',
        {
            "username":"marcuhook",
            "email": "marcuhook@gmail.com",
            "password": "marcuhookonwrd",
            "first_name": "marcus",
            "last_name": "hook",
            "address1": "10 marcuhook blvd",
            "address2": "20 marcuhook drive",
            "city": "queens",
            "state": "ny",
            "partner_id": "marcuhook4456",
            "role": "MEMBER",
            "zip_code": "11201",
            "birthdate": "1977-10-10"
        },{ json: true })
    .expectStatus(201)
    .expectHeaderContains('content-type', 'application/json')
    .expectJSON({result: "User Profile created successfully"})
    .inspectJSON()
    .afterJSON(function () {
        //2 - Make a get call on previously posted data to get the same user
        frisby.create('GET THE USER - AFTER POST')
            .get('http://localhost:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user?search=email="marcuhook@gmail.com"')
            .expectBodyContains('marcuhook@gmail.com')
            .expectStatus(200)
            .inspectJSON()
            .toss();
    })
    .toss();
/*
 //.expectJSON({result: "User Profile created successfully"})

 {
 "result": {
 "message": "User Profile created successfully",
 "status": 201
 }
 }
 */


//Edit the user profile that we just posted
frisby.create('PUT - EDIT THE USER PROFILE')
//1 - Make a put call on same data/user to modify user
    .put('http://localhost:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user',
        {
            "username":"marcuhook",
            "email": "marcuhook@gmail.com",
            "password": "marcuhookonwrd",
            "first_name": "marcus",
            "last_name": "hook",
            "address1": "10 marcuhook blvd",
            "address2": "20 marcuhook drive",
            "city": "queens",
            "state": "ks",
            "partner_id": "marcuhook4456",
            "role": "MEMBER",
            "zip_code": "11201",
            "birthdate": "1977-10-10"
        },
        { json: true })
    .expectStatus(200)
    .expectJSON({result: "User Profile Updated"})
    .inspectJSON()
    .afterJSON(function(){
        //2 - Make a get call on previously modified data to get the same user to see modification
        frisby.create('GET AFTER PUT')
        // 'http://localhost:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user?search=email="cassandrabenson@gmail.com"'
            .get('http://localhost:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user?search=city="queens"')
            .expectBodyContains('ks')
            .expectStatus(200)
            .inspectJSON()
            .toss();
    })
    .toss();

/*
//   .expectJSON({result: "User Profile Updated"})

 {
 "result": {
 "message": "User Profile Updated",
 "status": 200
 }
 }
 */




// POST -  REQUEST TO  ADD AN EXISTING A USER VIA LDAP INTO CLOUDMINE
frisby.create('POST - REQUEST TO  ADD AN EXISTING A USER VIA LDAP INTO CLOUDMINE')
    .post('http://localhost:4545/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user',
        {
            "username":"marcuhook",
            "email": "marcuhook@gmail.com",
            "password": "marcuhookonwrd",
            "first_name": "marcus",
            "last_name": "hook",
            "address1": "10 marcuhook blvd",
            "address2": "20 marcuhook drive",
            "city": "queens",
            "state": "ks",
            "partner_id": "marcuhook4456",
            "role": "MEMBER",
            "zip_code": "11201",
            "birthdate": "1977-10-10"
        },
        { json: true })
    .expectJSON({result:"User profile already exist"})
    .expectStatus(409)
    //.expectStatus(200)
    .inspectJSON()
    .toss()





/*
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


*/


/*


//1 Create a new user as an Admin
frisby.create('POST A USER AS AN ADMIN')
    .post('https://api.secure.cloudmine.me/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user',
        {
            "username":"jimmyjazz",
            "email": "jimmyjazz@gmail.com",
            "password": "jimmyjazzpword",
            "first_name": "Jimmy",
            "last_name": "Jazz",
            "address1": "jimmyjazz blvd",
            "address2": "jimmyjazz drive",
            "city": "Harlem",
            "state": "NY",
            "partner_id": "kimbjimmyjazz1902",
            "zip_code": "19707",
            "birthdate": "1978-11-21"
        },{ json: true })
    .expectStatus(201)
    .expectHeaderContains('content-type', 'application/json')
    .expectJSON({result: "User Profile created successfully"})
    .inspectJSON()
    .afterJSON(function () {
        //2 - Make a get call on previously posted data to get the same user
        frisby.create('GET THE USER - AFTER POST')
            .get('https://api.secure.cloudmine.me/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user?search=email="jimmyjazz@gmail.com"')
            .expectBodyContains('jimmyjazz@gmail.com')
            .expectStatus(200)
            // .inspectJSON()
            .toss();
    })
    .toss();

//Edit the user profile that we just posted
frisby.create('PUT - EDIT THE USER PROFILE')
//1 - Make a put call on same data/user to modify user
    .put('https://api.secure.cloudmine.me/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user',
        {
            "username":"jimmyjazz",
            "email": "jimmyjazz@gmail.com",
            "password": "jimmyjazzpword",
            "first_name": "Jimmy",
            "last_name": "Jazz",
            "address1": "jimmyjazz blvd",
            "address2": "jimmyjazz drive",
            "city": "Harlem",
            "state": "NY",
            "partner_id": "kimbjimmyjazz1902",
            "zip_code": "19707",
            "birthdate": "1978-11-21"
        },
        { json: true })
    .expectStatus(200)
    .expectJSON({result: "User Profile Updated"})
    .inspectJSON()
    .afterJSON(function(){
        //2 - Make a get call on previously modified data to get the same user to see modification
        frisby.create('GET AFTER PUT')
            .get('https://api.secure.cloudmine.me/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user?search=city="Philadelphia"')
            .expectBodyContains('Philadelphia')
            .expectStatus(200)
            .inspectJSON()
            .toss();
    })
    .toss();


// POST -  REQUEST TO  ADD AN EXISTING A USER VIA LDAP INTO CLOUDMINE
frisby.create('POST - REQUEST TO  ADD AN EXISTING A USER VIA LDAP INTO CLOUDMINE')
    .post('https://api.secure.cloudmine.me/v1/app/96fc95210061884d1aab3e4204ff3a1e/run/user',
        {
            "username":"jimmyjazz",
            "email": "jimmyjazz@gmail.com",
            "password": "jimmyjazzpword",
            "first_name": "Jimmy",
            "last_name": "Jazz",
            "address1": "jimmyjazz blvd",
            "address2": "jimmyjazz drive",
            "city": "Harlem",
            "state": "NY",
            "partner_id": "kimbjimmyjazz1902",
            "zip_code": "19707",
            "birthdate": "1978-11-21"
        },
        { json: true })
    .expectJSON({result:"User profile already exist"})
    //.expectStatus(409)
    .expectStatus(200)
    .inspectJSON()
    .toss()





/*

 // Functions to help generate user profilenpm start

 function randomEmail(){
 var chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
 var string = '';
 for(var ii=0; ii<15; ii++){
 string += chars[Math.floor(Math.random() * chars.length)];
 return string + '@domain.com';
 }

 }
 var testEmail = randomEmail()

 function randomPwrd(){
 var chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
 var string = '';
 for(var ii=0; ii<15; ii++){
 string += chars[Math.floor(Math.random() * chars.length)];
 return string + 'pd';
 }

 }
 var password = randomPwrd()


 function randomaddress(){
 var chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
 var string = '';
 for(var ii=0; ii<15; ii++){
 string += chars[Math.floor(Math.random() * chars.length)];
 return string + 'street';
 }

 }
 var testAddy = randomaddress()


 function randomaUserName(){
 var chars = 'abcdefghijklmnopqrstuvwxyz';
 var string = '';
 for(var ii=0; ii<15; ii++){
 string += chars[Math.floor(Math.random() * chars.length)];
 return string + randomfirstName();
 }

 }
 var testUsername = randomaUserName()

 function randomaPartnerID(){
 var chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
 var string = '';
 for(var ii=0; ii<15; ii++){
 string += chars[Math.floor(Math.random() * chars.length)];
 return string + '007';
 }

 }
 var testPartnerID = randomaPartnerID()

 function randomfirstName(){
 var chars = 'abcdefghijklmnopqrstuvwxyz';
 var string = '';
 for(var ii=0; ii<15; ii++){
 string += chars[Math.floor(Math.random() * chars.length)];
 return string + 'sr';
 }

 }
 var firstname = randomfirstName()


 */
