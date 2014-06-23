function runSpeedTests(name, runs, func){
    var start, elapsed, output;
    var times = [];

    var time = {
        Average: 0,
        Max: 0,
        Min: 0
    };

    if(arguments.length == 2){
        func = runs;
        runs = 20;
    }


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
            output = func();
            elapsed = new Date() - start;
            times.push(elapsed);
        }

    }



    runTests();
    calculateTimes();

    console.log("Speed Test: " + name);
    console.log("Result:", output);
    console.log("Time Statistics (ms) [Avg:" +time.Average+ "] [Min:" +time.Min+ "] [Max:" +time.Max +"]");
    console.log("");
}

