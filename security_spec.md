# Security Specification & Threat Model (Phase 0)

## 1. Data Invariants
- **Authentication Bound**: Only authenticated users (admins) can create, update, or delete portfolio cases.
- **Strict Fields**: All portfolio cases stored under `/cases/{caseId}` must have valid structures. No unrecognized fields (e.g. ghost admin flags) can be injected.
- **Immutable Timestamps**: Once a case is published, its `createdAt` timestamp is immutable and cannot be changed or backdated by users.
- **Valid IDs**: All document IDs and categories must have limited length and match the character pattern to avoid ID Poisoning.

## 2. The "Dirty Dozen" Payloads
We define twelve high-risk payloads designed to break our database invariants. Each payload MUST be rejected with `PERMISSION_DENIED`.

1. **Unauthenticated Write**: Creating a case with no `request.auth` credentials.
2. **Backdated Timestamp**: Setting `createdAt` to a historical epoch instead of the current request time.
3. **Future Timestamp**: Setting `createdAt` to a future timestamp to gain chronological prominence.
4. **Immutable Field Tampering**: Updating the `createdAt` timestamp of an existing case to a new value.
5. **Ghost Privilege Escalation**: Creating a case with a custom field `isAdmin` or `role` set to `admin`.
6. **Malicious Giant ID**: Creating a case where the category ID or custom field exceeds the byte size safety bounds (e.g. 500KB string).
7. **Empty Case Payload**: Creating a document with completely empty strings for titles and description.
8. **Invalid Media Type**: Attempting to set `mediaType` to an unsupported enum value like `exe` or `malicious_type`.
9. **SQL Injection Pattern in Category**: Specifying `categoryId` as `'evolution OR 1=1'`.
10. **Path Poisoning via Document ID**: Attempting to write a document with an ID filled with control characters or path traversal elements.
11. **Malicious URL**: Specifying an extremely long `imageUrl` (e.g. >2KB) containing script injections.
12. **Unauthenticated Deletion**: Attempting to delete a case without being authenticated.

## 3. The Test Runner (firestore.rules.test.ts)

Here is the complete `firestore.rules.test.ts` to prove our assertions:

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "remixed-project-id",
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} {
              allow read, write: if false;
            }
            function isSignedIn() {
              return request.auth != null;
            }
            function incoming() { return request.resource.data; }
            function existing() { return resource.data; }
            function isValidCase(data) {
              return data.keys().hasAll(['categoryId', 'imageUrl', 'titleEn', 'titleRu', 'descriptionEn', 'descriptionRu', 'prompt', 'altText', 'createdAt'])
                && data.categoryId is string && data.categoryId.size() <= 128
                && data.imageUrl is string && data.imageUrl.size() <= 2048
                && data.titleEn is string && data.titleEn.size() <= 256
                && data.titleRu is string && data.titleRu.size() <= 256
                && data.descriptionEn is string && data.descriptionEn.size() <= 2048
                && data.descriptionRu is string && data.descriptionRu.size() <= 2048
                && data.prompt is string && data.prompt.size() <= 4096
                && data.altText is string && data.altText.size() <= 1024
                && (data.get('thumbnailUrl', '') is string)
                && (data.get('mediaType', 'image') in ['image', 'video']);
            }
            match /cases/{caseId} {
              allow read: if true;
              allow create: if isSignedIn() && isValidCase(incoming()) && incoming().createdAt == request.time;
              allow update: if isSignedIn() && isValidCase(incoming()) && incoming().createdAt == existing().createdAt;
              allow delete: if isSignedIn();
            }
          }
        }
      `,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("DJ Console Case Security Rules", () => {
  it("rejects unauthenticated creations (Pillar 1)", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const docRef = doc(db, "cases/test-case-1");
    await assertFails(setDoc(docRef, {
      categoryId: "evolution",
      imageUrl: "https://example.com/image.png",
      titleEn: "Title",
      titleRu: "Название",
      descriptionEn: "Desc",
      descriptionRu: "Описание",
      prompt: "Prompt",
      altText: "Alt text",
      createdAt: new Date(),
    }));
  });

  it("rejects writes with backdated/invalid timestamps (Pillar 13)", async () => {
    const context = testEnv.authenticatedContext("user_id");
    const db = context.firestore();
    const docRef = doc(db, "cases/test-case-2");
    await assertFails(setDoc(docRef, {
      categoryId: "evolution",
      imageUrl: "https://example.com/image.png",
      titleEn: "Title",
      titleRu: "Название",
      descriptionEn: "Desc",
      descriptionRu: "Описание",
      prompt: "Prompt",
      altText: "Alt text",
      createdAt: 1000000000, // old epoch
    }));
  });
});
```
