

// Function to save model artifacts to MongoDB
function saveModelToMongo(artifacts, modelName, metadata) {
    return new Promise(function(resolve, reject) {
        var weightDataBuffer = Buffer.from(artifacts.weightData);

        var modelDoc = {
            name: modelName,
            modelTopology: artifacts.modelTopology,
            weightSpecs: artifacts.weightSpecs,
            weightData: weightDataBuffer,
            format: artifacts.format,
            generatedBy: artifacts.generatedBy,
            version: artifacts.version,
            metadata: metadata,
            updatedAt: new Date()
        };

        TensorFlowModel.findOneAndUpdate({ name: modelName },
            modelDoc, { upsert: true, new: true, setDefaultsOnInsert: true },
            function(err, doc) {
                if (err) return reject(err);
                resolve({ modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts) });
            }
        );
    });
}

// Function to load model artifacts from MongoDB
function loadModelFromMongo(modelName) {
    return new Promise(function(resolve, reject) {
        TensorFlowModel.findOne({ name: modelName }, function(err, doc) {
            if (err) return reject(err);
            if (!doc) return reject(new Error('Model not found: ' + modelName));

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

// Define the ModelManager
function ModelManager() {}

// Save a model to MongoDB
ModelManager.prototype.saveModel = function(model, modelName, metadata) {
    return model.save(tf.io.withSaveHandler(function(artifacts) {
        return saveModelToMongo(artifacts, modelName, metadata);
    }));
};

// Load a model from MongoDB
ModelManager.prototype.loadModel = function(modelName) {
    return tf.loadLayersModel(tf.io.fromMemory({
        modelTopology: null, // We'll provide it in the load function
        weightSpecs: null,
        weightData: null,
        load: function() {
            return loadModelFromMongo(modelName);
        }
    }));
};

// Alternatively, we can use a custom IOHandler for loading
// But note: tf.loadLayersModel expects an IOHandler that has a `load` method.
// We can also do:
ModelManager.prototype.loadModel2 = function(modelName) {
    var handler = {
        load: function() {
            return loadModelFromMongo(modelName);
        }
    };
    return tf.loadLayersModel(handler);
};


ModelManager.prototype.loadModel = function(modelName) {
  var handler = {
    load: function() {
      return loadModelFromMongo(modelName);
    }
  };
  return tf.loadLayersModel(handler);
};

// Export the ModelManager and the Mongoose model
module.exports = {
    ModelManager: ModelManager,
    TensorFlowModel: TensorFlowModel
};