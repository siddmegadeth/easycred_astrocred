(function() {

    modelSchema = module.exports = mongoose.Schema({
        name: { type: String, required: true, unique: true },
        modelTopology: { type: Object, required: true },
        weightSpecs: { type: Array, required: true },
        weightData: { type: Buffer, required: true },
        format: String,
        generatedBy: String,
        version: String,
        metadata: Object,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    });

    TensorFlowModel = module.exports = mongoose.model('TensorFlowModel', modelSchema);

})();


