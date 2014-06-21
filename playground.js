/**
 * Created by phalpin on 6/20/14.
 */
var r = new Repository({
    indexBy: "id",
    createInBatch: true,
    updateInBatch: true,
    deleteInBatch: true,
    saveMethod: function(item, mode){
        switch(mode){
            case Repository.mode.Create:
                break;
            case Repository.mode.Update:
                break;
            case Repository.mode.Delete:
                break;
        }
    }
});

var observationId = r.observe(function(i, mode){
    switch(mode){
        case Repository.mode.Added:
            console.info("Added ", i, " to the repository.");
            break;
        case Repository.mode.Removed:
            console.info("Removed ", i, " from the repository.");
            break;
    }
});



for(var i=0; i<50; i++){
    r.push(new item(i));
}

//r.save();

function item(num){
    return{
        id: num,
        name: "Test Object " + num
    }
}