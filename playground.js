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


runSpeedTests("Deep Key Non-Indexed Find", r, 'find', ["deep.key.find.target.val.will.be.something.like", 26]);



function runSpeedTests(name, obj, func, args){
    var runs = 20;
    var start, elapsed, output;
    var times = [];

    var time = {
        Average: 0,
        Max: 0,
        Min: 0
    };


    function calculateTimes(){
        var totalTime = 0;

        //Time
        for(var i=0; i<runs; i++){
            totalTime += times[i];
        }
        time.Average = totalTime / runs;
        time.Max = Math.max.apply(Math,times);
        time.Min = Math.min.apply(Math, times);
    }

    function runTests(){
        for(var i=0; i<runs; i++){
            start = new Date();
            output = obj[func].apply(obj, args);
            elapsed = new Date() - start;
            times.push(elapsed);
        }

    }



    runTests();
    calculateTimes();

    console.log("Speed Test: " + name);
    console.log("Result:", output);
    console.log("Time Statistics (ms):", time);
    console.log("");
}
/*
start = new Date();
console.log("Find Non-Indexed Test: ", r.find("name", "Test Object 25"));
elapsed = new Date() - start;
console.log("Time taken: ", elapsed);


start = new Date();
console.log("Find Test: ", r.find(25));
elapsed = new Date() - start;
console.log("Time taken: ", elapsed);
*/