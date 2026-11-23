# QuickResolve Firestore Security Specification

## 1. Data Invariants
1. **Identity Integrity**: A `UserProfile` document at `/users/{userId}` can only be created when `userId == request.auth.uid`, `email == request.auth.token.email`, and `request.auth.token.email_verified == true`.
2. **No Self-Assigned Privileges**: A user registering themselves can only assign `role == "STUDENT"`, unless their verified email is the bootstrapped Main Admin (`ayushriva123@gmail.com`) or they reference a verified `RoleInvite` document at `/roleInvites/{inviteId}` whose `email == request.auth.token.email` and `role == incoming().role`.
3. **Main Admin Exclusivity**: Only `MAIN_ADMIN` can create, update, or delete `/roleInvites/{inviteId}`, reassign roles (`ADMIN` / `STUDENT`) on `/users/{userId}`, or delete non-Main-Admin user profiles.
4. **Complaint Ownership & Mandatory Proof**: A `Complaint` at `/complaints/{complaintId}` must have `userId == request.auth.uid`, `status == "Pending"`, `adminRemarks == ""`, and a valid `proofImage` string (`10..650000` chars) on creation.
5. **Admin Resolution Control**: Only `ADMIN` or `MAIN_ADMIN` can modify `status`, `adminRemarks`, and `updatedAt` or delete complaints.
6. **PII Isolation**: User emails and profiles in `/users` and `/roleInvites` are readable only by the document owner or authorized administrators (`ADMIN` / `MAIN_ADMIN`).
7. **Temporal Integrity & Immutability**: `createdAt` and `updatedAt` must equal `request.time` on creation; `createdAt`, `userId`, `studentEmail`, and `uid` remain immutable on update.
8. **Notification Integrity & Ownership**: Only `ADMIN` or `MAIN_ADMIN` can create or retry `/emailNotifications/{notificationId}` records; `complaintId` must reference an existing complaint whose `userId` and `studentEmail` strictly match `studentUserId` and `recipientEmail`. Students can only read their own notifications (`studentUserId == request.auth.uid`).

## 2. Adversarial Payloads ("Dirty Dozen+") Tested Against Rules
1. Unauthenticated read/write on `/users/{userId}` -> `PERMISSION_DENIED`
2. Unverified email (`email_verified: false`) attempting write on `/users/{userId}` -> `PERMISSION_DENIED`
3. Student attempting self-elevation (`role: "ADMIN"` or `"MAIN_ADMIN"`) on `/users/{uid}` create -> `PERMISSION_DENIED`
4. Student attempting `role` update on their own `/users/{uid}` doc -> `PERMISSION_DENIED`
5. Shadow/ghost field injection (`isVerified: true`) on `/users/{uid}` or `/complaints/{id}` -> `PERMISSION_DENIED`
6. Oversized document ID (`150` chars or invalid characters) on `/complaints/{id}` -> `PERMISSION_DENIED`
7. Student creating a complaint with `userId` set to another student's UID -> `PERMISSION_DENIED`
8. Student creating a complaint pre-marked `status: "Resolved"` or empty `proofImage` -> `PERMISSION_DENIED`
9. Student updating `status` or `adminRemarks` on their own complaint -> `PERMISSION_DENIED`
10. Regular `ADMIN` (non-`MAIN_ADMIN`) creating or modifying `/roleInvites/{id}` or changing another user's role -> `PERMISSION_DENIED`
11. Client-forged `createdAt` timestamp not equal to `request.time` -> `PERMISSION_DENIED`
12. Blanket `list` scraping of `/users`, `/complaints`, or `/emailNotifications` by a student -> `PERMISSION_DENIED`
13. Student attempting to create an `/emailNotifications/{id}` record -> `PERMISSION_DENIED`
14. Admin creating an `/emailNotifications/{id}` record with `recipientEmail` mismatched from the referenced complaint's `studentEmail` -> `PERMISSION_DENIED`
15. Admin creating an `/emailNotifications/{id}` record for `triggeredStatus: "Pending"` -> `PERMISSION_DENIED`
