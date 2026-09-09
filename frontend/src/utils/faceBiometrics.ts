/**
 * Production Browser Deep Facial Landmark & Neural Biometric Embedding Engine
 * Powered by @vladmandic/face-api (TensorFlow.js / faceRecognitionNet)
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

// Application verification threshold for this faceRecognitionNet pipeline.
// Threshold should be validated against production camera conditions.
export const MAX_EUCLIDEAN_DISTANCE = 0.60;
export const MATCH_THRESHOLD = 75.0; // Mathematically synchronized: distance <= 0.60 <=> matchScore >= 75.0%

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
 * Extracts a 128-dimensional deep face embedding
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

  if (
    descriptorArray.length !== 128 ||
    descriptorArray.some((v) => !Number.isFinite(v))
  ) {
    return {
      faceCount: 1,
      descriptor: null,
      landmarksFound: true,
      boundingBox: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
      message: 'Invalid 128-D face descriptor generated',
    };
  }

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
export async function extractFaceDescriptor(
  canvas: HTMLCanvasElement,
  video?: HTMLVideoElement | null
): Promise<FaceDetectionResult> {
  const target = (video && video.readyState >= 2) ? video : canvas;
  return extractFaceEmbedding(target);
}

// Backward-compatible alias
export const extractFacialLandmarkDescriptor = extractFaceDescriptor;

/**
 * Calculates Euclidean Distance between two 128-D face embeddings.
 *
 * Application decision threshold:
 * - <= 0.40: strong match
 * - 0.40 - 0.60: acceptable / verified range
 * - > 0.60: rejected by application threshold
 *
 * NOTE:
 * The 0.60 value is an application verification threshold,
 * not a mathematical guarantee of identity.
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
 * Calculates a calibrated Biometric Match Score percentage directly from Euclidean Distance.
 * 
 * Calibration properties:
 * - Distance = 0.00 -> 100.0% Match Score
 * - Distance <= 0.60 (application cutoff) -> >= 75.0% Match Score (MATCH)
 * - Distance > 0.60 -> < 75.0% Match Score (REJECTED)
 * - Distance >= 1.00 -> 0.0% Match Score
 * 
 * Piecewise linear formulation guarantees that:
 * distance <= MAX_EUCLIDEAN_DISTANCE (0.60) <=> matchScore >= MATCH_THRESHOLD (75.0%)
 */
export function calculateConfidenceFromDistance(distance: number): number {
  if (distance <= 0) return 100.0;
  if (distance >= 1.0) return 0.0;

  let score: number;
  if (distance <= MAX_EUCLIDEAN_DISTANCE) {
    // Maps [0, 0.60] to [100.0%, 75.0%]
    score = 100.0 - (distance / MAX_EUCLIDEAN_DISTANCE) * (100.0 - MATCH_THRESHOLD);
  } else {
    // Maps (0.60, 1.0] to (75.0%, 0.0%]
    score = MATCH_THRESHOLD - ((distance - MAX_EUCLIDEAN_DISTANCE) / (1.0 - MAX_EUCLIDEAN_DISTANCE)) * MATCH_THRESHOLD;
  }
  return parseFloat(Math.max(0, Math.min(100, score)).toFixed(1));
}

/**
 * Calculates a calibrated Biometric Match Score percentage between two 128-D face embeddings.
 * Derived directly from Euclidean distance so the displayed score and verification rule are 100% synchronized.
 */
export function calculateSimilarityPercentage(descA: number[], descB: number[]): number {
  if (!descA || !descB || descA.length !== descB.length || descA.length === 0) {
    return 0;
  }
  const distance = calculateEuclideanDistance(descA, descB);
  return calculateConfidenceFromDistance(distance);
}

