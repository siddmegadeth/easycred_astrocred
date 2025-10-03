function loadModelFromMongo(modelName) {
    return new Promise(function(resolve, reject) {
        TensorFlowModel.findOne({ name: modelName }, function(err, doc) {
            if (err) reject(err);
            if (!doc) reject(new Error('Model not found'));

            // Convert Buffer to ArrayBuffer
            var weightData = doc.weightData.buffer.slice(
                doc.weightData.byteOffset,
                doc.weightData.byteOffset + doc.weightData.byteLength
            );

            resolve({
                modelTopology: doc.modelTopology,
                weightSpecs: doc.weightSpecs,
                weightData: weightData,
                format: doc.format,
                generatedBy: doc.generatedBy,
                version: doc.version,
                metadata: doc.metadata
            });
        });
    });
}

// function saveModelToMongo(artifacts, modelName, metadata) {
//     return new Promise(function(resolve, reject) {
//         // Convert weightData (ArrayBuffer) to Buffer
//         var weightDataBuffer = Buffer.from(artifacts.weightData);

//         var modelDoc = {
//             name: modelName,
//             modelTopology: artifacts.modelTopology,
//             weightSpecs: artifacts.weightSpecs,
//             weightData: weightDataBuffer,
//             format: artifacts.format,
//             generatedBy: artifacts.generatedBy,
//             version: artifacts.version,
//             metadata: metadata,
//             updatedAt: new Date()
//         };

//         TensorFlowModel.findOneAndUpdate({ name: modelName },
//             modelDoc, { upsert: true, new: true, setDefaultsOnInsert: true },
//             function(err, doc) {
//                 if (err) reject(err);
//                 else resolve({ modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts) });
//             }
//         );
//     });
// }






handler = module.exports = {
    load: function() {
        return loadModelFromMongo(modelName);
    }
};