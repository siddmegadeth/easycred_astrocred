// models/tf-model-schema.js

// Schema for storing TensorFlow.js models
TFModelSchema = module.exports = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    modelType: {
        type: String,
        required: true,
        enum: ['default-predictor', 'fraud-detector', 'willful-classifier', 'risk-assessor']
    },
    modelTopology: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    weightSpecs: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    weightData: {
        type: Buffer, // Store binary weight data
        required: true
    },
    version: {
        type: String,
        default: '1.0.0'
    },
    accuracy: {
        type: Number,
        default: 0
    },
    trainingData: {
        samples: Number,
        features: Number,
        lastTrained: Date
    },
    metadata: {
        featureConfig: mongoose.Schema.Types.Mixed,
        inputShape: [Number],
        outputShape: [Number]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp before save
TFModelSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

TFModel = module.exports = mongoose.model('TFModel', TFModelSchema);