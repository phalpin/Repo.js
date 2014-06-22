Repo.js
=======
A little project to make your life storing collections in javascript a little easier!

Usage:

Like an array! push objects to it, make modifications to objects, etc.

Repo.js will keep track of your changes, call .save() to go to your callback for saving/updating/removing/etc!

Settings:
```javascript
var r = new Repo({
    indexBy: testIndex,                 //What key to index on
    createInBatch: batchCreate,         //Whether to fire back a collection of items or one item at a time
    updateInBatch: batchUpdate,         //Same, but for updates.
    deleteInBatch: batchDelete,         //Same, but for deletions
    saveMethod: function(item, mode){   //Method to fire upon calling .save()
        switch(mode){
            case Repo.mode.Create:
                break;
            case Repo.mode.Update:
                break;
            case Repo.mode.Delete:
                break;
        }
    }
});
```


In the Pipeline:

- [ ] Automated localStorage persistence
- [ ] Automated watches for modifications
- [ ] Routine polling for index updates
- [ ] WebWorker support for reindexing all repositories
- [ ] linq-style queries against the repository.
