/**
 * Created by makere001c on 4/6/17.
 */
//Description: responseTimeLogger(function, callback) - Runs a function and calculates the response time 
// Parameters: //  delegateFunction - Should be a function that returns a promise 
//  callback - Should be a function that accepts parameters (1) a duration time in milliseconds and (2) a status eg: (success || failed) //Sample use - auto invoke -   responseTimer.responseTimeLogger(delegateFunction, callback)();

module.exports={
    responseTimeLogger: function (handlerFunction, callback) {
        return function() {
            var myPromise = new Promise(function (resolve, reject) {
                var startTimeinMillisecs = new Date().getTime();
                var delegatePromise = handlerFunction.apply(this, arguments);
                delegatePromise.then(function () {
                    resolve.apply(arguments);
                    if(callback){
                        callback(new Date().getTime() - startTimeinMillisecs, 'success');
                    }
                }, function () {
                    reject.apply(arguments);
                    if(callback){
                        callback(new Date().getTime() - startTimeinMillisecs, 'failed');
                    }
                })
            });
            return myPromise;

        }

    }
};