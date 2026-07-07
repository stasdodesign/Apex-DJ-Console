export default function firebaseLoader({ src, width, quality }) {
  if (src.includes('firebasestorage.googleapis.com')) {
    return src;
  }
  return src;
}
