import * as tf from "@tensorflow/tfjs";
import Jimp from "jimp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Adjust this path if you place ai-models/ somewhere other than server/ai-models/
const MODEL_DIR = path.join(__dirname, "..", "ai-models", "waste-classifier");

// Must exactly match the class_indices order printed during training
// (Colab notebook, Step 4). Do not reorder without re-checking that output.
const CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"];

const CONFIDENCE_THRESHOLD = 0.4; // below this, report is flagged needsReview

let modelInstance = null;

/**
 * Plain @tensorflow/tfjs has no built-in local-disk model loader (that
 * normally comes from tfjs-node, whose native binary is broken on Windows).
 * This custom IOHandler reads model.json + weight shards directly via fs.
 */
function createNodeIOHandler(modelDir) {
  return {
    async load() {
      const modelJSON = JSON.parse(
        fs.readFileSync(path.join(modelDir, "model.json"), "utf8")
      );

      let weightSpecs = [];
      const buffers = [];
      for (const group of modelJSON.weightsManifest) {
        weightSpecs = weightSpecs.concat(group.weights);
        for (const shardPath of group.paths) {
          buffers.push(fs.readFileSync(path.join(modelDir, shardPath)));
        }
      }

      const concatenated = Buffer.concat(buffers);
      const weightData = concatenated.buffer.slice(
        concatenated.byteOffset,
        concatenated.byteOffset + concatenated.byteLength
      );

      return {
        modelTopology: modelJSON.modelTopology,
        weightSpecs,
        weightData,
        format: modelJSON.format,
        generatedBy: modelJSON.generatedBy,
        convertedBy: modelJSON.convertedBy,
      };
    },
  };
}

async function getModel() {
  if (!modelInstance) {
    console.log("Loading fine-tuned waste classifier (Phase 2 model)...");
    modelInstance = await tf.loadLayersModel(createNodeIOHandler(MODEL_DIR));
    console.log("Waste classifier ready.");
  }
  return modelInstance;
}

async function bufferToTensor(imageBuffer) {
  const image = await Jimp.read(imageBuffer);
  image.resize(224, 224);

  const { data } = image.bitmap; // RGBA
  const floatData = new Float32Array(224 * 224 * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    floatData[j] = data[i] / 255;
    floatData[j + 1] = data[i + 1] / 255;
    floatData[j + 2] = data[i + 2] / 255;
  }

  return tf.tensor4d(floatData, [1, 224, 224, 3]);
}

/**
 * Classifies an image buffer. Returns:
 * { wasteType, confidence, needsReview, allPredictions }
 * needsReview is true when confidence falls below CONFIDENCE_THRESHOLD —
 * the controller saves the report either way, just flags it for admin
 * follow-up rather than trusting a low-confidence guess blindly.
 */
export async function classifyWaste(imageBuffer) {
  const model = await getModel();
  const inputTensor = await bufferToTensor(imageBuffer);

  try {
    const predictionTensor = model.predict(inputTensor);
    const probabilities = await predictionTensor.data();
    predictionTensor.dispose();

    const allPredictions = CLASSES.map((label, i) => ({
      wasteType: label,
      confidence: probabilities[i],
    })).sort((a, b) => b.confidence - a.confidence);

    const top = allPredictions[0];

    return {
      wasteType: top.wasteType,
      confidence: top.confidence,
      needsReview: top.confidence < CONFIDENCE_THRESHOLD,
      allPredictions,
    };
  } finally {
    inputTensor.dispose();
  }
}
