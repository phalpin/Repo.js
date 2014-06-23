Repo.js
=======
A little project to make your life storing collections in javascript a little easier!

Usage:

Like an array! push objects to it, make modifications to objects, etc.

Repo.js will keep track of your changes, call .save() to go to your callback for saving/updating/removing/etc!

Settings:
```javascript
var r = new Repo({
    indexBy: "id",                      //What key to index on
    createInBatch: true,                //Whether to fire back a collection of items or one item at a time
    updateInBatch: false,               //Same, but for updates.
    deleteInBatch: false,               //Same, but for deletions
    saveMethod: function(item, mode){   //Method to fire upon calling .save()
        switch(mode){
            case Repo.mode.Create:
                //Creation Logic
                break;
            case Repo.mode.Update:
                //Update Logic
                break;
            case Repo.mode.Delete:
                //Deletion Logic
                break;
        }
    }
});
```


In the Pipeline:

- [X] [~~Automated localStorage persistence~~](https://github.com/phalpin/Repo.js/commit/4c8cf2d7d1315e93d092a0a4116840b77b6f8d3b)
- [ ] Extension to forEach to indicate saved/edited metadata in addition to key -> value
- [ ] Automated watches for modifications
- [ ] Routine polling for index updates
- [ ] WebWorker support for reindexing all repositories
- [ ] linq-style queries against the repository.
