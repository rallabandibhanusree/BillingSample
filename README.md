
# Table of Contents
- [REST Apis layer](#rest-api-layer)


# REST Apis layer

Following are the REST endpoint for this app.

## /user
    # POST

    This would create user in cloudmine.  If user exist, it would update the profile if needed.
```Example: curl -X POST  -H 'content-type:application/json' -d '{"email":"Harvinder_singh7@comcast.com","password":"Welcome123","first_name":"harvinder","last_name":"singh","address1":"123ddsd","address2":"124sdfdfsdfs","city":"bordentow","state":"nj","partner_id":"123456jsdhfhuisfih","zip_code":"08505","birthdate":"1988-04-15"}' -H 'x-cloudmine-apikey:{YOUR_KEY or MASTER_KEY}'  localhost:4545/v1/app/${APP_ID}/run/user```

    # GET

    This would return user object depending upon the search criteria.

    - Node: Make sure format of search is like 'last_name="singh" or first_name="harvinder"', single quotes outside and value in double quotes otherwise it would throw an error.

```Example: curl -X GET  -H 'content-type:application/json' -H 'x-cloudmine-apikey:{YOUR_KEY or MASTER_KEY}'  localhost:4545/v1/app/${APP_ID}/run/user?search='last_name="singh"'```

```Example: curl -X GET  -H 'content-type:application/json' -H 'x-cloudmine-apikey:{YOUR_KEY or MASTER_KEY}'  localhost:4545/v1/app/${APP_ID}/run/user?cch_id="4b06fb15-89b3-46cc-b347-0eae472b1d44"```

```Example: curl -X GET  -H 'search:last_name="singh"' -H 'content-type:application/json' -H 'x-cloudmine-apikey:{YOUR_KEY or MASTER_KEY}'  localhost:4545/v1/app/${APP_ID}/run/user```

```Example: curl -X GET  -H 'cch_id:"4b06fb15-89b3-46cc-b347-0eae472b1d44"' -H 'content-type:application/json' -H 'x-cloudmine-apikey:{YOUR_KEY or MASTER_KEY}'  localhost:4545/v1/app/${APP_ID}/run/user```

    # PUT

    This would create user in cloudmine.  If user exist, it would update the profile if needed.

```Example: curl -X PUT  -H 'content-type:application/json' -d '{"first_name":"harvinder","last_name":"singh","address1":"123ddsd","address2":"124sdfdfsdfs","city":"bordentow","state":"nj","partner_id":"123456jsdhfhuisfih","zip_code":"08505","birthdate":"1988-04-15"}' -H 'x-cloudmine-apikey:{YOUR_KEY or MASTER_KEY}'  localhost:4545/v1/app/${APP_ID}/run/user```


## Create a zip file to deploy to cloudmine

``` zip -r app_v8.zip UserAccount/ -x *.git* -x *node_modules* -x *.idea* -x *.cm* -x *.log* ```# CMLDAPUserAccountTests

``` app_version=$(git describe --abbrev=0 --tags); cat release_template.json > release.json; sed -ie "s/{GIT_COMMIT}/$(git log --format="%H" -n 1)/g; s/{APP_VERSION}/${app_version}/g;" release.json; zip -r ../${app_version}.zip . -x *.git* -x *node_modules* -x *.idea* -x *.cm* -x *.log* ```
