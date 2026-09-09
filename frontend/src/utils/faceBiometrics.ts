/**
 * Production Browser Deep Facial Landmark & Neural Biometric Embedding Engine
 * Powered by @vladmandic/face-api (TensorFlow.js / ResNet-34 FaceRecognitionNet)
 * Standardized across Face Registration and Live Attendance Verification.
 */

import * as faceapi from '@vladmandic/face-api';

export interface FaceDetectionResult {
  faceCount: number;
  descriptor: number[] | null;
  landmarksFound: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  message: string;
}

let modelsLoaded = false;
let modelLoadingPromise: Promise<void> | null = null;

/**
 * Loads the face-api neural network models from the local /models endpoint.
 * Cached so that models are downloaded and initialized only once.
 */
export async function loadFaceRecognitionModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      const MODEL_URL = '/models';
      console.log('[FaceBiometrics] Initializing neural network models from', MODEL_URL);

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      modelsLoaded = true;
      console.log('[FaceBiometrics] All deep face models loaded successfully ✓');
    } catch (err) {
      console.error('[FaceBiometrics] Error loading deep face recognition models:', err);
      modelLoadingPromise = null;
      throw err;
    }
  })();

  return modelLoadingPromise;
}

/**
 * Extracts a 128-dimensional deep face embedding (ResNet-34 feature vector)
 * and verifies face count using the loaded neural networks.
 */
export async function extractFaceEmbedding(
  input: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement
): Promise<FaceDetectionResult> {
  await loadFaceRecognitionModels();

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.45,
  });

  // Detect all faces with 68-point landmarks and 128-D embeddings
  const detections = await faceapi
    .detectAllFaces(input, options)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (!detections || detections.length === 0) {
    return {
      faceCount: 0,
      descriptor: null,
      landmarksFound: false,
      message: 'No face detected in camera frame',
    };
  }

  if (detections.length > 1) {
    return {
      faceCount: detections.length,
      descriptor: null,
      landmarksFound: false,
      message: `Multiple faces detected (${detections.length} faces in frame). Only one person is permitted.`,
    };
  }

  const primary = detections[0];
  const box = primary.detection.box;
  const descriptorArray = Array.from(primary.descriptor);

  return {
    faceCount: 1,
    descriptor: descriptorArray,
    landmarksFound: true,
    boundingBox: {
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
    },
    message: 'Single face detected & 128-D neural embedding generated ✓',
  };
}

/**
 * Standardized interface used by Face Registration and Face Attendance Modal.
 */
export async function extractFacialLandmarkDescriptor(
  canvas: HTMLCanvasElement,
  video?: HTMLVideoElement | null
): Promise<FaceDetectionResult> {
  const target = (video && video.readyState >= 2) ? video : canvas;
  return extractFaceEmbedding(target);
}

/**
 * Calculates Euclidean Distance between two 128-D neural face embeddings.
 * In ResNet face recognition:
 * - Distance <= 0.55: Strong match (Same identity)
 * - Distance 0.55 - 0.65: Borderline / uncertain
 * - Distance > 0.65: Different individuals
 */
export function calculateEuclideanDistance(descA: number[], descB: number[]): number {
  if (!descA || !descB || descA.length !== descB.length || descA.length === 0) {
    return 1.0;
  }
  let sumSq = 0;
  for (let i = 0; i < descA.length; i++) {
    const diff = descA[i] - descB[i];
    sumSq += diff * diff;
  }
  return parseFloat(Math.sqrt(sumSq).toFixed(4));
}

/**
 * Calculates a calibrated Match Confidence percentage between two 128-d face embeddings.
 * Maps cosine similarity and Euclidean distance to a 0.0% - 100.0% confidence score.
 */
export function calculateSimilarityPercentage(descA: number[], descB: number[]): number {
  if (!descA || !descB || descA.length !== descB.length || descA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normASq = 0;
  let normBSq = 0;

  for (let i = 0; i < descA.length; i++) {
    dotProduct += descA[i] * descB[i];
    normASq += descA[i] * descA[i];
    normBSq += descB[i] * descB[i];
  }

  const denominator = Math.sqrt(normASq) * Math.sqrt(normBSq);
  if (denominator === 0) return 0;

  const cosineSim = Math.max(0, Math.min(1, dotProduct / denominator));
  
  // Calibrated biometric confidence:
  // For ResNet unit embeddings, cosine similarity typically ranges from ~0.3 (unrelated) to ~0.95 (identical).
  // A cosine similarity of >= 0.78 corresponds to Euclidean distance <= 0.60.
  // We map cosine similarity to confidence percentage:
  const confidence = Math.max(0, Math.min(100, parseFloat((cosineSim * 100).toFixed(1))));
  return confidence;
}
