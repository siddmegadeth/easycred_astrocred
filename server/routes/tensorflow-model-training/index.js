(function() {

    require("./utils/index");
    require("./models/index");
    require("./services/index");

    require("./load-model");
})();




//     // Initialize the service
//     var analysisService = new CreditAnalysisService();

//     analysisService.initialize()
//         .then(function() {
//             console.log('Service ready for analysis');

//             // Example: Analyze CIBIL data
//             var cibilData = require('./sample-cibil-data.json');

//             analysisService.analyzeWithPredictions(cibilData)
//                 .then(function(result) {
//                     console.log('Analysis Result:', JSON.stringify(result, null, 2));

//                     // Save result to database or send to client
//                     saveAnalysisResult(result);
//                 })
//                 .catch(function(error) {
//                     console.error('Analysis failed:', error);
//                 });
//         })
//         .catch(function(error) {
//             console.error('Service initialization failed:', error);
//         });
// });

// function saveAnalysisResult(result) {
//     // Your existing result saving logic
//     console.log('Saving analysis result...');
// }