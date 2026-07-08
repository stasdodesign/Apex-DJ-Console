import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import rawConfig from '../../../firebase-applet-config.json';

interface FirebaseAppletConfig {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

const fileConfig = rawConfig as FirebaseAppletConfig;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || fileConfig.projectId || '';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize Firebase Admin once to verify ID tokens
const apps = getApps();
const adminApp: App = apps.length 
  ? apps[0] 
  : initializeApp(projectId ? { projectId } : undefined);

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user: Check for valid Firebase ID Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await getAuth(adminApp).verifyIdToken(token);
    } catch (authError) {
      console.error('Authentication check failed:', authError);
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    // 2. Validate input and check for SSRF or scanning attempts
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'Bad Request: Missing image URL' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch (e) {
      return NextResponse.json({ error: 'Bad Request: Invalid URL format' }, { status: 400 });
    }

    // Strictly limit host to trusted Firebase Storage domain
    if (parsedUrl.hostname !== 'firebasestorage.googleapis.com') {
      return NextResponse.json({ error: 'Forbidden: Untrusted image host' }, { status: 403 });
    }

    // Verify the file path belongs to our own Firebase project to prevent other buckets abuse
    if (projectId && !parsedUrl.pathname.includes(projectId)) {
      return NextResponse.json({ error: 'Forbidden: Image must reside in your storage bucket' }, { status: 403 });
    }

    // 3. Prevent memory exhaustion: Check resource size & type via HEAD request
    const headResp = await fetch(imageUrl, { method: 'HEAD' });
    if (!headResp.ok) {
      return NextResponse.json({ error: 'Failed to access image resource' }, { status: 400 });
    }

    const contentType = headResp.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Resource is not an image' }, { status: 400 });
    }

    const contentLength = parseInt(headResp.headers.get('content-length') || '0', 10);
    const MAX_SIZE = 15 * 1024 * 1024; // 15MB maximum
    if (contentLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Image is too large (max 15MB)' }, { status: 400 });
    }

    // 4. Safely load image and invoke Gemini
    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) {
      return NextResponse.json({ error: 'Failed to retrieve image content' }, { status: 400 });
    }

    const arrayBuffer = await imageResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

    const prompt = "Analyze this image. It is an exploration or design concept from an AI portfolio. Generate a concise, professional 'alt' text description for screen readers and SEO. Respond with only the text.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]
    });

    return NextResponse.json({ altText: response.text?.trim() || "Design exploration" });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

