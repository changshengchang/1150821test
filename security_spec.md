# Security Spec

## 1. Data Invariants

- A survey response must be created by a verified user.
- The `userId` and `userEmail` must match the authenticated user.
- Responses cannot be modified or deleted once submitted (append-only).
- The `signatureData` must be a valid base64 PNG string.
- `createdAt` must be exactly the server timestamp.

## 2. "Dirty Dozen" Payloads

1. Unauthenticated creation: Try to create without logging in.
2. Spoofed UID: Authenticated as User A, try to set `userId` to User B's UID.
3. Spoofed Email: Authenticated as User A, try to set `userEmail` to admin@example.com.
4. Update Attempt: Try to update an existing response.
5. Delete Attempt: Try to delete an existing response.
6. Missing Required Field: Create without `signatureData`.
7. Type Poisoning: Set `score` to a string instead of a number.
8. Size Poisoning: Set `signatureData` to a > 100KB string (well, canvas might be long, so limit to 500KB or some reasonable upper bound length).
9. Missing Timestamp: Try to create with a client-supplied timestamp string instead of server timestamp.
10. Unverified Email: Create while having `email_verified == false`.
11. Read Attempt (Privacy): Try to list `/survey_responses/` as a normal user (should deny or only allow listing own). For safety, we only allow create.
12. Shadow Field: Try to add `isAdmin` to the payload.

## 3. Test Runner
We will generate `firestore.rules.test.ts` to test these.
