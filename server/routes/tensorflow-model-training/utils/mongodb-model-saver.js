// utils/mongodb-model-saver.js
function MongoDBModelSaver() {
    this.modelCache = {};
}

/**
 * Save TensorFlow.js model to MongoDB
 */
MongoDBModelSaver.prototype.saveModel = function(model, modelName, modelType, metadata) {
    return new Promise(function(resolve, reject) {
        // Convert model to JSON format
        model.save('file:///tmp/' + modelName)
            .then(function() {
                // Read the saved model files
                var fs = require('fs');
                var path = require('path');
                
                var modelJsonPath = path.join('/tmp', modelName, 'model.json');
                var weightPath = path.join('/tmp', modelName, 'weights.bin');
                
                // Read model topology
                var modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
                
                // Read weight data as buffer
                var weightData = fs.readFileSync(weightPath);
                
                // Prepare model document
                var modelDoc = {
                    name: modelName,
                    modelType: modelType,
                    modelTopology: modelJson.modelTopology,
                    weightSpecs: modelJson.weightsManifest[0].weights,
                    weightData: weightData,
                    metadata: metadata || {},
                    trainingData: metadata.trainingData || {}
                };
                
                // Save to MongoDB (upsert)
                TFModel.findOneAndUpdate(
                    { name: modelName },
                    modelDoc,
                    { upsert: true, new: true }
                )
                .then(function(savedModel) {
                    // Clean up temporary files
                    try {
                        fs.unlinkSync(modelJsonPath);
                        fs.unlinkSync(weightPath);
                        fs.rmdirSync(path.join('/tmp', modelName));
                    } catch (cleanupError) {
                        console.warn('Could not clean up temp files:', cleanupError);
                    }
                    
                    resolve(savedModel);
                })
                .catch(function(dbError) {
                    reject(dbError);
                });
            })
            .catch(function(saveError) {
                reject(saveError);
            });
    });
};

/**
 * Load TensorFlow.js model from MongoDB
 */
MongoDBModelSaver.prototype.loadModel = function(modelName) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        // Check cache first
        if (self.modelCache[modelName]) {
            resolve(self.modelCache[modelName]);
            return;
        }
        
        TFModel.findOne({ name: modelName })
            .then(function(modelDoc) {
                if (!modelDoc) {
                    reject(new Error('Model not found: ' + modelName));
                    return;
                }
                
                // Create temporary directory for model files
                var fs = require('fs');
                var path = require('path');
                var os = require('os');
                
                var tempDir = path.join(os.tmpdir(), 'tfjs-models', modelName);
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                // Reconstruct model.json
                var modelJson = {
                    modelTopology: modelDoc.modelTopology,
                    weightsManifest: [{
                        weights: modelDoc.weightSpecs
                    }]
                };
                
                var modelJsonPath = path.join(tempDir, 'model.json');
                fs.writeFileSync(modelJsonPath, JSON.stringify(modelJson));
                
                // Write weight data
                var weightPath = path.join(tempDir, 'weights.bin');
                fs.writeFileSync(weightPath, modelDoc.weightData);
                
                // Load model using TensorFlow.js
                tf.loadLayersModel('file://' + modelJsonPath)
                    .then(function(model) {
                        // Cache the loaded model
                        self.modelCache[modelName] = model;
                        
                        // Clean up temp files after a delay
                        setTimeout(function() {
                            try {
                                fs.unlinkSync(modelJsonPath);
                                fs.unlinkSync(weightPath);
                                fs.rmdirSync(tempDir);
                            } catch (cleanupError) {
                                console.warn('Cleanup error:', cleanupError);
                            }
                        }, 5000);
                        
                        resolve(model);
                    })
                    .catch(function(loadError) {
                        reject(loadError);
                    });
            })
            .catch(function(dbError) {
                reject(dbError);
            });
    });
};

/**
 * Get all available models
 */
MongoDBModelSaver.prototype.listModels = function() {
    return TFModel.find({}, 'name modelType version accuracy updatedAt').exec();
};

/**
 * Delete model from MongoDB
 */
MongoDBModelSaver.prototype.deleteModel = function(modelName) {
    var self = this;
    
    return TFModel.findOneAndDelete({ name: modelName })
        .then(function() {
            // Remove from cache
            delete self.modelCache[modelName];
            return true;
        });
};

module.exports = MongoDBModelSaver;