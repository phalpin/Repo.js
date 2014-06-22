//region Repo Class
//Methodology Adapted from http://www.bennadel.com/blog/2292-extending-javascript-arrays-while-keeping-native-bracket-notation-functionality.htm
window.Repo = (function(){

    //region Debug
    var debug = true & (window.console != null);

    var logging = function(){
        this.warn = function(){
            console.warn("Repo.js: ", arguments);
        };

        this.info = function(){
            if(debug === true){
                console.info("Repo.js: ", arguments);
            }
        };

        this.log = function(){
            if(debug === true){
                console.log("Repo.js: ", arguments);
            }
        };

        this.error = function(){
            console.error("Repo.js: ", arguments);
        };


        return this;
    };
    var logger = new logging();
    //endregion

    var defaultSettings = {
        name: null,
        useLocalStorage: false,
        indexBy:null,
        saveMethod:function(item, saveMode, repoRequesting){
            console.info("No Save Method Specified!");
            console.info("Item: ", item, "SaveMode: ", saveMode, "repoRequesting: ", repoRequesting);
        },
        createInBatch: false,
        updateInBatch: false,
        deleteInBatch: false
    };


    //region Constructor
    function Repo(settings, skip){

        var stg = settings;
        var skp = skip;

        var shouldSkip = skp === true;

        //region Preload Methodology (if localStorage support is opted)
        if(stg != null){
            if(stg.name != null){
                if(stg.useLocalStorage === true){
                    if(skip !== true){
                        var res = Repo.loadFromLocalStorage(settings.name);
                        if(res != null){
                            if(res.indexed != null && res.added != null){
                                return res;
                            }
                        }
                    }
                }
            }
        }
        //endregion

        var repo = Object.create( Array.prototype );

        //region Settings removal from Array Instantiation
        var shift = [].shift;
        var args = arguments;
        if(args.length > 0) shift.apply(args);
        if(shouldSkip === true){
            shift.apply(args);
        }
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

        repo.settings = stg || defaultSettings;
        //endregion

        // Add all the class methods to the repo.
        Repo.injectClassMethods(repo);

        // Return the new repo object.
        return(repo);

    }
    //endregion


    //region Static Methods
    Repo.injectClassMethods = function(repo){

        // Loop over all the prototype methods and add them to the new repo.
        for (var method in Repo.prototype){
            // Make sure this is a local method.
            if (Repo.prototype.hasOwnProperty(method)){

                // Add the method to the repo.
                repo[method] = Repo.prototype[method];

            }

        }

        // Return the updated repo.
        return(repo);
    };


    /**
     * Creates a new repository from a given array.
     * @param array Array to convert into a repository.
     * @returns {*}
     */
    Repo.fromArray = function(array){
        var repo = new Repo(null, true);
        for(var i=0;i<array.length;i++){
            repo._push(array[i]);
        }
        return(repo);
    };


    /**
     * Determines whether an object is an array.
     * @param value item to check.
     * @returns {boolean}
     */
    Repo.isArray = function(value){

        // Get it's stringified version.
        var stringValue = Object.prototype.toString.call( value );

        // Check to see if the string represtnation denotes array.
        return( stringValue.toLowerCase() === "[object array]" );

    };

    /**
     * Returns the version of Repo.js
     * @returns {string}
     */
    Repo.version = function(){
        return "Repo.js v0.1 - https://github.com/phalpin/Repo.js";
    };

    /**
     * Loads a repo from localstorage.
     * @param name Name to check for.
     * @returns {*}
     */
    Repo.loadFromLocalStorage = function(name){
        if(localStorage != null){
            var key = priv.getLocalStorageKey(name);
            var res = localStorage.getItem(key);
            if(res != null){
                return priv.fromLocalStorageString(res);
            }
            else{
                logger.warn("Repo not found: " + name, "Key Used: " + key);
            }

            return null;
        }
    };

    //endregion


    //region Enumerables
    Repo.mode = {};
    Repo.mode.Create = 0;
    Repo.mode.Read = 1;
    Repo.mode.Update = 2;
    Repo.mode.Delete = 3;
    Repo.mode.Added = 4;
    Repo.mode.Removed = 5;
    //endregion


    //region "Private" Methods
    var priv = {
        /**
         * Notifies observers that a change has been made to the repository.
         * @param obs Observers array to alert.
         * @param item Item changed
         * @param mode Mode to alert (Repo.mode.Added, Repo.mode.Removed, etc.)
         */
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
        },

        /**
         * Returns whether or not a property is a supported index type.
         * @param item item to check
         */
        isPropertySupportedIndexType: function(item){
            var retVal = true;
            var supportedTypes = ["string", "number"];

            for(var i in supportedTypes){
                retVal |= typeof item === supportedTypes[i];
            }
            return !!(retVal & (item != null));
        },

        /**
         * Checks whether an item has a property to index by!
         * @param item Item to check
         * @param indexBy Property to check (supports "person.details.id")
         * @returns {boolean}
         */
        checkObjectHasIndex: function(item, indexBy){
            var path = indexBy.split('.');
            var depth = item;
            for(var i=0; i<path.length; i++){
                if(depth[path[i]] == null) return false;
                depth = depth[path[i]];
            }

            if(this.isPropertySupportedIndexType(depth) === true){
                return depth;
            }
        },

        /**
         * Checks an item, and if it has a valid property to index, add it to the index.
         * @param item Item to check & add
         * @param indexObject Index string to check for.
         * @param settings Settings object to read from (for indexBy)
         */
        checkAndAddToIndex: function(item, indexObject, settings){
            if(settings != null){
                if(settings.indexBy != null){
                    var index = this.checkObjectHasIndex(item, settings.indexBy);
                    if(index !== false){
                        if(Repo.isArray(indexObject[index])){
                            indexObject[index].push(item);
                        }
                        else if(indexObject[index] != null){
                            var arr = [];
                            arr.push(indexObject[index])
                            arr.push(item);
                            indexObject[index] = arr;
                        }
                        else{
                            indexObject[index] = item;
                        }
                    }
                }
            }
        },

        /**
         * Gets the value of key on a particular object.
         * @param item Item to get value from
         * @param key Path to follow: (item.info.metadata.id, or just id)
         * @returns {*} Either null or the value at the key.
         */
        getValueAtKey: function(item, key){
            var keypath = key.split('.');
            var depth = item;

            for(var i = 0; i<keypath.length; i++){
                if(depth[keypath[i]] != null){
                    depth = depth[keypath[i]];
                }
                else{
                    return null;
                }
            }

            return depth;
        },

        /**
         * Finds an item by a particular key & value in a collection.
         * @param key Key to check for (item.info.metadata.id supported)
         * @param value Value to look for.
         * @param collection Collection to check in.
         * @returns {Array} results for the search.
         */
        findInCollection: function(key, value, collection){
            var result = [];

            for(var i in collection){
                if(this.getValueAtKey(collection[i], key) === value){
                    result.push(collection[i]);
                }
            }

            return result;
        },

        /**
         * Finds an item by a particular value in an object.
         * @param value
         * @param obj
         * @param settings
         * @returns {*}
         */
        findInObject: function(value, obj, settings){
            if(settings.indexBy != null){
                return obj[value];
            }
            else{
                return null;
            }
        },

        /**
         * Formats the key to use for this repo for localStorage.
         * @param name name of the repo
         * @returns {string}
         */
        getLocalStorageKey: function(name){
            return 'repo-' + document.domain + '-' + name;
        },

        /**
         * Saves a repo to local storage.
         * @param repo Repo to save.
         */
        saveToLocalStorage: function(repo){
            if(localStorage != null){
                if(repo.settings != null){
                    if(repo.settings.useLocalStorage === true){
                        if(repo.settings.name != null){
                            var key = this.getLocalStorageKey(repo.settings.name);
                            localStorage.setItem(key, this.toLocalStorageObject(repo));;
                            logger.info("Saved repo to localStorage with key " + key);
                        }
                        else{
                            logger.warn("Repository requires a name to persist to localStorage!");
                        }
                    }
                }
            }
            else{

            }
        },

        /**
         * Creates a localStorage compatible string for this repo.
         * @param repo Repo to create localStorage compatible string from
         * @returns {*}
         */
        toLocalStorageObject: function(repo){
            var resultObj = {};
            var items = [];

            //Get the repo prototyped items.
            resultObj.added = repo.added;
            resultObj.modified = repo.modified;
            resultObj.deleted = repo.deleted;
            resultObj.indexed = repo.indexed;

            //Get the actual items in the repo.
            items = items.concat(repo);
            resultObj.items = items;
            return JSON.stringify(resultObj);
        },

        /**
         * Parses a string from localStorage to get a compatible object for it, returns a fully formatted repo.
         * @param str string from localStorage to parse.
         * @returns {*}
         */
        fromLocalStorageString: function(str){
            var obj = JSON.parse(str);
            var ret = Repo.fromArray(obj.items);
            ret.added = obj.added;
            ret.modified = obj.modified;
            ret.deleted = obj.deleted;
            ret.indexed = obj.indexed;
            return ret;
        }
    };
    //endregion


    //region TODO: Figure out a proper pseudo-threading strategy - gonna have to split up into separate segments as the repos get large
    function Thread(ref, func){
        this.start = function(){
            setTimeout(func.apply(ref), 0);
        }
    }
    //endregion


    //region "Public" Methods
    Repo.prototype = {
        /**
         * Method to use good ol' push.
         * @returns {Repo}
         */
        push: function( value ){
            logger.info("Push Request: ", arguments);
            for (var i=0; i<arguments.length; i++){
                var arg = arguments[i];

                //Handle arrays and such.
                switch(Repo.isArray(arg)){
                    case true:
                        for(var j=0; j<arg.length; j++){
                            this._push(arg[j]);
                            this.added.push(arg[j]);
                            priv.checkAndAddToIndex(arg[j], this.indexed, this.settings);
                            priv.notifyObservers(this.observers, arg[j], Repo.mode.Added);
                        }
                        break;
                    case false:
                    default:
                        this._push(arg);
                        this.added.push(arg);
                        priv.checkAndAddToIndex(arg, this.indexed, this.settings);
                        priv.notifyObservers(this.observers, arg, Repo.mode.Added);
                        break;
                }
            }

            logger.info("Added State: ", this.added);

            return(this);
        },

        /**
         * Method to save the current repository.
         * Applies all changes - Adds, Modifications, Deletions.
         */
        save: function(){
            if(this.settings.saveMethod != null){
                //Added Items
                priv.moveOut(this.added, this.settings, Repo.mode.Create, this.settings.createInBatch);
                //Modified Items
                priv.moveOut(this.modified, this.settings, Repo.mode.Update, this.settings.updateInBatch);
                //Deleted Items
                priv.moveOut(this.deleted, this.settings, Repo.mode.Delete, this.settings.deleteInBatch);
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
            var guid = priv.createGuid();
            this.observers[guid] = callback;
            return guid;
        },

        /**
         * Method to modify an item within the Repo. Stopgap for the moment til observe is a proper thing.
         * @param item Item to modify.
         * @param callback Function to modify it with.
         */
        modify: function(item, callback){
            callback(item);
            this.modified.push(item);
        },

        /**
         * Method to find an object in the repo - one or two arguments; if two, specify the key. If one, we will search based on indexBy
         * @param key Key to search on
         * @param value Value to look for.
         */
        find: function(key, value){

            if(arguments.length === 2){
                if(Repo.isArray(value)){
                    var results = [];
                    //TODO: Change this up, make a union function to reduce duplicates
                    for(var i=0; i<value.length; i++){
                        results = results.concat(priv.findInCollection(key, value[i], this));
                    }
                    return results;
                }
                else{
                    return priv.findInCollection(key, value, this);
                }

            }
            else if (arguments.length === 1){
                if(this.settings != null){
                    if(this.settings.indexBy != null){
                        if(Repo.isArray(key)){
                            var results = [];
                            for(var i=0; i<key.length; i++){
                                results.push(priv.findInObject(key[i], this.indexed, this.settings));
                            }
                            return results;
                        }
                        else{
                            return priv.findInObject(key, this.indexed, this.settings);
                        }

                    }
                }
            }
            else{
                logger.error("You must provide either an index to search on and a value, or use the settings' indexBy parameter.");
            }
        },

        /**
         * Reindexes this Repo.
         */
        reindex: function(){
            this.indexed = {};
            for(var i=0; i<this.length; i++){
                /*
                var t = new Thread(this, function(){
                    priv.checkAndAddToIndex(this[i], this.indexed, this.settings);
                });
                t.start();
                */
                priv.checkAndAddToIndex(this[i], this.indexed, this.settings);

            }
        },

        /**
         * Persists the repo in localStorage (maybe set up SQLite in the future?)
         */
        persist: function(){
            priv.saveToLocalStorage(this);
        }
    };
    //endregion


    // Return the repo constructor.
    return(Repo);


}).call( {} );
//endregion