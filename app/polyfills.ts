import { Buffer } from "buffer";

// Standardize Buffer across the app
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Add any other global polyfills here