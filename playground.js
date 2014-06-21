/**
 * Created by phalpin on 6/20/14.
 */
var r = new Repo({
    indexBy: "test.id",
    createInBatch: true,
    updateInBatch: true,
    deleteInBatch: true,
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



for(var i=0; i<50; i++){
    r.push(new Item(i));
}

function Item(num){
    return{
        test: {
            id: num
        },
        name: "Test Object " + num
    }
}