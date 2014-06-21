//region Repository Class
//Methodology Adapted from http://www.bennadel.com/blog/2292-extending-javascript-arrays-while-keeping-native-bracket-notation-functionality.htm
window.Repository = (function(){

    //region Debug
    var debug = true & (window.console != null);

    var logging = function(){
        this.warn = function(){
            console.warn("Repository.js: ", arguments);
        }

        this.info = function(){
            if(debug === true){
                console.info("Repository.js: ", arguments);
            }
        }

        this.log = function(){
            if(debug === true){
                console.log("Repository.js: ", arguments);
            }
        }

        this.error = function(){
            console.error("Repository.js: ", arguments);
        }


        return this;
    };
    var logger = new logging();
    //endregion


    //region Constructor
    function Repository(settings){

        var repo = Object.create( Array.prototype );

        //region Settings removal from Array Instantiation
        var shift = [].shift;
        var args = arguments;
        if(args.length > 0) shift.apply(args);
        //endregion


        repo = (Array.apply(repo, args) || repo);

        //Reassign push to _push, maintain compatibility.
        repo._push = repo.push;

        //region Instance Properties
        repo.added = [];
        repo.modified = [];
        repo.deleted = [];
        repo.indexed = {};
        repo.observers = {};

        repo.settings = settings || {
            indexBy:null,
            saveMethod:function(item, saveMode, repoRequesting){
                console.info("No Save Method Specified!");
                console.info("Item: ", item, "SaveMode: ", saveMode, "repoRequesting: ", repoRequesting);
                switch(saveMode){
                    case Repository.mode.Create:
                        return true;
                        break;
                    case Repository.mode.Update:
                        break;
                    case Repository.mode.Delete:
                        break;
                }
            },
            createInBatch: false,
            updateInBatch: false,
            deleteInBatch: false
        };
        //endregion

        // Add all the class methods to the repo.
        Repository.injectClassMethods(repo);

        // Return the new repo object.
        return(repo);

    }
    //endregion


    //region Static Methods
    Repository.injectClassMethods = function(repo){

        // Loop over all the prototype methods and add them to the new repo.
        for (var method in Repository.prototype){
            // Make sure this is a local method.
            if (Repository.prototype.hasOwnProperty(method)){

                // Add the method to the repo.
                repo[method] = Repository.prototype[method];

            }

        }

        // Return the updated repo.
        return(repo);

    };


    // I create a new repo from the given array.
    Repository.fromArray = function( array ){

        // Create a new repo.
        var repo = Repository.apply( null, array );

        // Return the new repo.
        return(repo);

    };


    // I determine if the given object is an array.
    Repository.isArray = function( value ){

        // Get it's stringified version.
        var stringValue = Object.prototype.toString.call( value );

        // Check to see if the string represtnation denotes array.
        return( stringValue.toLowerCase() === "[object array]" );

    };
    //endregion


    //region Enumerables
    Repository.mode = {};
    Repository.mode.Create = 0;
    Repository.mode.Read = 1;
    Repository.mode.Update = 2;
    Repository.mode.Delete = 3;
    Repository.mode.Added = 4;
    Repository.mode.Removed = 5;
    //endregion


    //region "Private" Methods
    function privateMethods(){
        return{
            //Notifies observers that a change has been made.
            notifyObservers: function(obs, item, mode){
                for(var o in obs){
                    obs[o](item, mode);
                }
            },

            /**
             * Moves objects out of the saved/modified/etc lists.
             * @param collection
             * @param settings
             * @param mode
             * @param inBatch
             */
            moveOut: function(collection, settings, mode, inBatch){
                if(inBatch === true){
                    var result = settings.saveMethod(collection, mode, this) || [];

                    //TODO: Fix this - this won't work within a loop like this, first splice and we're screwed.
                    for(var i=0; i<result.length; i++){
                        collection.splice(result[i], 1);
                    }
                }
                else{

                    //TODO: Fix this as well.
                    for(var i=0; i<collection.length; i++){
                        if(settings.saveMethod(collection[i], mode, this)){
                            collection.splice(i, 1);
                        }
                    }
                }
            },

            //From SlavikMe: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
            /**
             * Creates a guid
             * @returns {*}
             */
            createGuid: function(){
                function _p8(s) {
                    var p = (Math.random().toString(16)+"000000000").substr(2,8);
                    return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
                }
                return _p8() + _p8(true) + _p8(true) + _p8();
            }
        }
    }
    //endregion


    //region "Public" Methods
    Repository.prototype = {
        /**
         * Method to use good ol' push.
         * @returns {Repository}
         */
        push: function( value ){
            logger.info("Push Request: ", arguments);

            var p = privateMethods();


            for (var i=0; i<arguments.length; i++){
                var arg = arguments[i];

                //Handle arrays and such.
                switch(Repository.isArray(arg)){
                    case true:
                        for(var j=0; j<arg.length; j++){
                            this._push(arg[j]);
                            this.added.push(arg[j]);
                            p.notifyObservers(this.observers, arg[j], Repository.mode.Added);
                        }
                        break;
                    case false:
                    default:
                        this._push(arg);
                        this.added.push(arg);
                        p.notifyObservers(this.observers, arg, Repository.mode.Added);
                        break;
                }
            }

            logger.info("Added State: ", this.added);

            return( this );
        },

        /**
         * Method to save the current repository.
         * Applies all changes - Adds, Modifications, Deletions.
         */
        save: function(){
            var p = privateMethods();

            if(this.settings.saveMethod != null){
                //Added Items
                p.moveOut(this.added, this.settings, Repository.mode.Create, this.settings.createInBatch);
                //Modified Items
                p.moveOut(this.modified, this.settings, Repository.mode.Update, this.settings.updateInBatch);
                //Deleted Items
                p.moveOut(this.deleted, this.settings, Repository.mode.Delete, this.settings.deleteInBatch);
            }
            else{
                logger.error("No save method specified - allocate a method to me.settings.saveMethod.");
            }
        },

        /**
         * Method to observe this repository for changes.
         * @param callback
         * @returns {*}
         */
        observe: function(callback){
            var p = privateMethods();

            var guid = p.createGuid();
            this.observers[guid] = callback;
            return guid;
        },


        /**
         * Method to modify an item within the Repository. Stopgap for the moment til observe is a proper thing.
         * @param item Item to modify.
         * @param callback Function to modify it with.
         */
        modify: function(item, callback){
            callback(item);
            this.modified.push(item);
        }
    };
    //endregion


    // Return the repo constructor.
    return(Repository);


}).call( {} );
//endregion