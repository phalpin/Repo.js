/**
 * Created by phalpin on 6/20/14.
 */


var
    testName = "TestRepo",
    objAmount = 5000,
    testIndex = "test.id",
    batchCreate = true,
    batchUpdate = true,
    batchDelete = true
;

var r = new Repo({
    name: testName,
    indexBy: testIndex,
    useLocalStorage: true,
    createInBatch: batchCreate,
    updateInBatch: batchUpdate,
    deleteInBatch: batchDelete,
    saveMethod: function(item, mode){
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
r.observe(function(i, mode){
    switch(mode){
        case Repo.mode.Added:
            //console.log("Added", i, "to the repository.");
            break;
        case Repo.mode.Removed:
            console.log("Removed", i, "from the repository.");
            break;
    }
});

if(r.length === 0){
    for(var i=0; i<objAmount; i++){
        r.push(new Item(i));
    }
}


function Item(num){
    return{
        test: {
            id: num
        },
        name: "Test Object " + num,
        deep:{
            key:{
                find:{
                    target:{
                        val: {
                            will:{
                                be:{
                                    something:{
                                        like: num
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}


runSpeedTests("Indexed Find", r, 'find', [25]);
runSpeedTests("Non-indexed Find", r, 'find', ["name", "Test Object 25"]);


runSpeedTests("Indexed Multi-Find", r, 'find', [[25,26,27,28,29,30]]);
runSpeedTests("Non-Indexed Multi-Find", r, 'find', ["name", ["Test Object 25", "Test Object 26", "Test Object 27", "Test Object 28", "Test Object 29", "Test Object 30"]]);


runSpeedTests("Deep Key Non-Indexed Find", r, 'find', ["deep.key.find.target.val.will.be.something.like", 25]);
runSpeedTests("Deep Key Non-Indexed Multi-Find", r, 'find', ["deep.key.find.target.val.will.be.something.like", [25,26,27,28,29,30]]);

runSpeedTests("Reindex of Repo", r, 'reindex', []);

runSpeedTests("Persistence to localStorage", r, 'persist', []);


var s = new Repo({
    name: testName,
    useLocalStorage: true
});


localStorage.clear();