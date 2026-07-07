import { auth, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface DiagnosticResult {
  step: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
}

export async function runStorageDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  console.log('%c=== STARTING FIREBASE STORAGE DIAGNOSTICS ===', 'color: #00F0FF; font-weight: bold; font-size: 14px;');

  // Step 1: Check Auth Status
  const currentUser = auth.currentUser;
  if (currentUser) {
    results.push({
      step: 'Authentication Check',
      status: 'SUCCESS',
      message: `User is authenticated. UID: ${currentUser.uid}, Email: ${currentUser.email || 'N/A'}`
    });
    console.log('✅ Auth Status: Authenticated', {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified
    });
  } else {
    results.push({
      step: 'Authentication Check',
      status: 'WARNING',
      message: 'No user is currently authenticated in Firebase Auth. Storage writes may be blocked by security rules.'
    });
    console.log('⚠️ Auth Status: NOT Authenticated. Please make sure you are logged in if your rules require authentication.');
  }

  // Step 2: Verify Config Bucket Name
  const bucketName = storage.app.options.storageBucket;
  results.push({
    step: 'Bucket Configuration Check',
    status: bucketName ? 'SUCCESS' : 'ERROR',
    message: bucketName 
      ? `Active storage bucket in configuration: "${bucketName}"`
      : 'Storage bucket is not defined in Firebase config.'
  });
  console.log(`ℹ️ Configured Storage Bucket: "${bucketName}"`);

  if (bucketName && bucketName.endsWith('.firebasestorage.app')) {
    results.push({
      step: 'Bucket Name Format Check',
      status: 'WARNING',
      message: `Your bucket ends with .firebasestorage.app. In some GCS regions, the actual underlying GCS resource is still named gs://${bucketName.replace('.firebasestorage.app', '.appspot.com')}. If CORS fails, try changing the suffix to .appspot.com.`
    });
    console.log('⚠️ Suffix Note: Using .firebasestorage.app bucket alias. The main GCS bucket resource for gsutil/gcloud is typically named without this alias (e.g. .appspot.com).');
  }

  // Step 3: Simulate CORS Preflight via standard OPTIONS request
  const testUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o`;
  results.push({
    step: 'Target Endpoint Verification',
    status: 'SUCCESS',
    message: `Firebase Storage API endpoint: ${testUrl}`
  });

  try {
    console.log(`🌐 Sending test OPTIONS preflight to: ${testUrl}...`);
    const preflightRes = await fetch(testUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-firebase-storage-version'
      }
    });

    const headers: Record<string, string> = {};
    preflightRes.headers.forEach((val, key) => {
      headers[key] = val;
    });

    results.push({
      step: 'CORS Preflight Test',
      status: preflightRes.ok || preflightRes.status === 200 ? 'SUCCESS' : 'ERROR',
      message: `Preflight OPTIONS returned status ${preflightRes.status} (${preflightRes.statusText})`,
      details: { headers }
    });

    console.log('📊 Preflight OPTIONS response headers:', headers);
  } catch (err: any) {
    results.push({
      step: 'CORS Preflight Test',
      status: 'ERROR',
      message: `Preflight failed with network error (CORS policy block). Error: ${err.message}`,
      details: err
    });
    console.error('❌ Preflight OPTIONS failed (CORS Blocked or Network Error):', err);
  }

  // Step 4: Perform a write test if user desires, or upload a tiny dummy file
  try {
    console.log('💾 Attempting to upload a tiny test file (diagnostic_test.txt)...');
    const dummyContent = new Blob(['diagnostic test'], { type: 'text/plain' });
    const dummyRef = ref(storage, `cases/diagnostic_test.txt`);
    
    await uploadBytes(dummyRef, dummyContent);
    const downloadUrl = await getDownloadURL(dummyRef);
    
    results.push({
      step: 'Write/Upload Test',
      status: 'SUCCESS',
      message: `Successfully uploaded file! Download URL: ${downloadUrl}`
    });
    console.log('✅ Write/Upload Test: SUCCESS!', downloadUrl);
  } catch (err: any) {
    let troubleshooting = '';
    if (err.code === 'storage/unauthorized') {
      troubleshooting = 'Firebase Storage Security Rules denied this request. Ensure you are signed in and your rules allow writing to the "cases/" path.';
    } else if (err.message && err.message.includes('CORS')) {
      troubleshooting = 'CORS policy blocked the upload. Make sure you have set CORS on the correct bucket.';
    } else {
      troubleshooting = 'General error. Check if Firebase Storage is actually enabled/activated in the Firebase Console (click "Get Started" in the Storage tab).';
    }

    results.push({
      step: 'Write/Upload Test',
      status: 'ERROR',
      message: `Upload failed: [${err.code || 'UNKNOWN'}] ${err.message}`,
      details: { error: err, troubleshooting }
    });
    console.error('❌ Write/Upload Test: FAILED', err);
    console.warn('💡 Troubleshooting Suggestion:', troubleshooting);
  }

  console.log('%c=== END OF FIREBASE STORAGE DIAGNOSTICS ===', 'color: #00F0FF; font-weight: bold; font-size: 14px;');
  return results;
}
