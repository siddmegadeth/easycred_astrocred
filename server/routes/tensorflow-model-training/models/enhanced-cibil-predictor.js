
function EnhancedCIBILPredictor() {
    this.modelSaver = new MongoDBModelSaver();
    this.models = {
        defaultPredictor: null,
        fraudDetector: null,
        willfulClassifier: null
    };
    this.isInitialized = false;
}

/**
 * Initialize all models from MongoDB
 */
EnhancedCIBILPredictor.prototype.initialize = function() {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var loadPromises = [
            self.loadModel('default-predictor-v1'),
            self.loadModel('fraud-detector-v1'),
            self.loadModel('willful-classifier-v1')
        ];
        
        Promise.all(loadPromises)
            .then(function(results) {
                self.models.defaultPredictor = results[0];
                self.models.fraudDetector = results[1];
                self.models.willfulClassifier = results[2];
                self.isInitialized = true;
                resolve(self);
            })
            .catch(function(error) {
                console.warn('Some models failed to load, creating new ones:', error);
                self.createDefaultModels()
                    .then(function() {
                        self.isInitialized = true;
                        resolve(self);
                    })
                    .catch(reject);
            });
    });
};

/**
 * Create default models if they don't exist
 */
EnhancedCIBILPredictor.prototype.createDefaultModels = function() {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        try {
            // Create default predictor model
            var defaultModel = self.createDefaultPredictorModel();
            self.models.defaultPredictor = defaultModel;
            
            // Create fraud detector model
            var fraudModel = self.createFraudDetectorModel();
            self.models.fraudDetector = fraudModel;
            
            // Create willful classifier model
            var willfulModel = self.createWillfulClassifierModel();
            self.models.willfulClassifier = willfulModel;
            
            // Save all models to MongoDB
            var savePromises = [
                self.modelSaver.saveModel(defaultModel, 'default-predictor-v1', 'default-predictor', {
                    inputShape: [45],
                    outputShape: [1],
                    featureConfig: {}
                }),
                self.modelSaver.saveModel(fraudModel, 'fraud-detector-v1', 'fraud-detector', {
                    inputShape: [45],
                    outputShape: [45],
                    featureConfig: {}
                }),
                self.modelSaver.saveModel(willfulModel, 'willful-classifier-v1', 'willful-classifier', {
                    inputShape: [35],
                    outputShape: [3],
                    featureConfig: {}
                })
            ];
            
            Promise.all(savePromises)
                .then(resolve)
                .catch(function(saveError) {
                    console.warn('Models created but save failed:', saveError);
                    resolve(); // Still resolve as models are created
                });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Load a specific model
 */
EnhancedCIBILPredictor.prototype.loadModel = function(modelName) {
    return this.modelSaver.loadModel(modelName);
};

/**
 * Create default predictor model architecture
 */
EnhancedCIBILPredictor.prototype.createDefaultPredictorModel = function() {
    var model = tf.sequential();
    
    model.add(tf.layers.dense({
        inputShape: [45],
        units: 128,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    
    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });
    
    return model;
};

/**
 * Predict default probability for CIBIL data
 */
EnhancedCIBILPredictor.prototype.predictDefault = function(cibilData) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        if (!self.isInitialized) {
            reject(new Error('Predictor not initialized. Call initialize() first.'));
            return;
        }
        
        try {
            // Extract features (using your existing feature extraction logic)
            var features = self.extractFeatures(cibilData);
            var tensor = tf.tensor2d([features], [1, 45]);
            
            var prediction = self.models.defaultPredictor.predict(tensor);
            var probability = prediction.dataSync()[0];
            
            tensor.dispose();
            prediction.dispose();
            
            resolve({
                probability: probability,
                riskLevel: self.getRiskLevel(probability),
                confidence: self.calculateConfidence(probability)
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Extract features from CIBIL data (integrate with your existing system)
 */
EnhancedCIBILPredictor.prototype.extractFeatures = function(cibilData) {
    // This should integrate with your existing credit score feature extraction
    var features = [];
    var report = cibilData.data.credit_report[0];
    
    // Basic features (expand based on your existing logic)
    features.push(parseInt(cibilData.data.credit_score) / 900); // Normalize score
    
    // Account-based features
    features.push(report.accounts.length / 20); // Normalize account count
    features.push(this.calculateCreditUtilization(report.accounts));
    features.push(this.calculateDelinquencyRate(report.accounts));
    
    // Pad with zeros if needed (should have 45 features total)
    while (features.length < 45) {
        features.push(0);
    }
    
    return features.slice(0, 45);
};

/**
 * Train model with new data and save to MongoDB
 */
EnhancedCIBILPredictor.prototype.retrainModel = function(trainingData, labels, modelName) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        self.loadModel(modelName)
            .then(function(model) {
                var xs = tf.tensor2d(trainingData);
                var ys = tf.tensor2d(labels);
                
                return model.fit(xs, ys, {
                    epochs: 10,
                    batchSize: 32,
                    validationSplit: 0.2
                })
                .then(function(history) {
                    xs.dispose();
                    ys.dispose();
                    
                    // Save updated model
                    return self.modelSaver.saveModel(model, modelName, 
                        self.getModelType(modelName), {
                            trainingData: {
                                samples: trainingData.length,
                                features: trainingData[0].length,
                                lastTrained: new Date()
                            },
                            accuracy: history.history.acc[history.history.acc.length - 1]
                        });
                })
                .then(function() {
                    // Update cached model
                    self.models[modelName] = model;
                    resolve({ success: true, message: 'Model retrained successfully' });
                });
            })
            .catch(reject);
    });
};

/**
 * Utility methods
 */
EnhancedCIBILPredictor.prototype.getRiskLevel = function(probability) {
    if (probability < 0.2) return 'LOW';
    if (probability < 0.5) return 'MEDIUM';
    if (probability < 0.8) return 'HIGH';
    return 'VERY_HIGH';
};

EnhancedCIBILPredictor.prototype.calculateConfidence = function(probability) {
    // Confidence is highest when probability is near 0 or 1
    return 1 - Math.abs(probability - 0.5) * 2;
};

EnhancedCIBILPredictor.prototype.getModelType = function(modelName) {
    var typeMap = {
        'default-predictor': 'default-predictor',
        'fraud-detector': 'fraud-detector',
        'willful-classifier': 'willful-classifier'
    };
    
    for (var key in typeMap) {
        if (modelName.includes(key)) {
            return typeMap[key];
        }
    }
    return 'unknown';
};

module.exports = EnhancedCIBILPredictor;