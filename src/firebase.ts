import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const googleProvider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => googleProvider.addScope(scope));
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Cached strictly in memory (never in localStorage or sessionStorage)
let cachedGmailAccessToken: string | null = null;

export const BOOTSTRAP_MAIN_ADMIN_EMAIL = 'ayushriva123@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (client is offline).');
    }
  }
}
void testConnection();

export type Role = 'MAIN_ADMIN' | 'ADMIN' | 'STUDENT';
export type Status = 'Pending' | 'In Progress' | 'Resolved';

export interface UserProfileDoc {
  uid: string;
  name: string;
  email: string;
  role: Role;
  authProvider: 'GOOGLE';
  studentId: string;
  department: string;
  inviteId?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface RoleInviteDoc {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  studentId: string;
  department: string;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ComplaintDoc {
  id: string;
  refCode: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  category: string;
  description: string;
  proofImage: string;
  status: Status;
  adminRemarks: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface EmailNotificationDoc {
  id: string;
  complaintId: string;
  refCode: string;
  studentUserId: string;
  recipientEmail: string;
  studentName: string;
  complaintTitle: string;
  triggeredStatus: 'In Progress' | 'Resolved';
  subject: string;
  bodyPreview: string;
  deliveryStatus: 'SENT' | 'FAILED' | 'PENDING_AUTH';
  gmailMessageId: string;
  errorMessage: string;
  triggeredByUid: string;
  createdAt?: Timestamp | null;
}

export function generateSafeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, '');
}

export function formatFirestoreDate(ts?: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Just now';
  return ts.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function clampStr(val: string | undefined | null, maxLen: number): string {
  return (val || '').trim().slice(0, maxLen);
}

export function hasGmailAccessToken(): boolean {
  return Boolean(cachedGmailAccessToken);
}

export async function signInWithGoogleFirebase(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    cachedGmailAccessToken = credential.accessToken;
  }
  return result.user;
}

export async function requestGmailSendAccess(): Promise<string> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Google did not return a Gmail sending access token.');
  }
  cachedGmailAccessToken = credential.accessToken;
  return cachedGmailAccessToken;
}

export async function signOutFirebase(): Promise<void> {
  cachedGmailAccessToken = null;
  await firebaseSignOut(auth);
}

export function subscribeAuth(cb: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedGmailAccessToken = null;
    }
    cb(user);
  });
}

/**
 * Ensures the signed-in Google user has a persisted `/users/{uid}` document.
 * Checks `/roleInvites` for Main-Admin pre-assigned roles before defaulting to STUDENT.
 */
export async function ensureUserProfile(fbUser: FirebaseUser): Promise<UserProfileDoc> {
  const uid = fbUser.uid;
  const userDocRef = doc(db, 'users', uid);
  const path = `users/${uid}`;

  try {
    const existingSnap = await getDoc(userDocRef);
    if (existingSnap.exists()) {
      return existingSnap.data() as UserProfileDoc;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const normalizedEmail = clampStr(fbUser.email?.toLowerCase(), 150);
  const fallbackName = normalizedEmail.split('@')[0] || 'QuickResolve User';
  const rawName = clampStr(fbUser.displayName || fallbackName, 100);
  const safeName = rawName.length >= 2 ? rawName : 'Campus User';

  let assignedRole: Role =
    normalizedEmail === BOOTSTRAP_MAIN_ADMIN_EMAIL ? 'MAIN_ADMIN' : 'STUDENT';
  let inviteId: string | undefined;
  let studentId = assignedRole === 'MAIN_ADMIN' ? 'MAIN-001' : '';
  let department = assignedRole === 'MAIN_ADMIN' ? 'Central Directorate' : '';

  if (assignedRole !== 'MAIN_ADMIN' && normalizedEmail) {
    const invitePath = 'roleInvites';
    try {
      const q = query(collection(db, invitePath), where('email', '==', normalizedEmail));
      const inviteSnaps = await getDocs(q);
      if (!inviteSnaps.empty) {
        const invite = inviteSnaps.docs[0].data() as RoleInviteDoc;
        inviteId = inviteSnaps.docs[0].id;
        assignedRole = invite.role;
        studentId = clampStr(invite.studentId, 50);
        department = clampStr(invite.department, 100);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, invitePath);
    }
  }

  const payload: Record<string, unknown> = {
    uid,
    name: safeName,
    email: normalizedEmail,
    role: assignedRole,
    authProvider: 'GOOGLE',
    studentId,
    department,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (inviteId) {
    payload.inviteId = inviteId;
  }

  try {
    await setDoc(userDocRef, payload);
    const createdSnap = await getDoc(userDocRef);
    if (createdSnap.exists()) {
      return createdSnap.data() as UserProfileDoc;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    uid,
    name: safeName,
    email: normalizedEmail,
    role: assignedRole,
    authProvider: 'GOOGLE',
    studentId,
    department,
    inviteId,
  };
}

export function subscribeOwnProfile(
  uid: string,
  onData: (profile: UserProfileDoc | null) => void,
  onErr: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      onData(snap.exists() ? (snap.data() as UserProfileDoc) : null);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onErr(wrapped as Error);
      }
    }
  );
}

export function subscribeAllUsers(
  onData: (users: UserProfileDoc[]) => void,
  onErr: (err: Error) => void
): Unsubscribe {
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as UserProfileDoc);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onErr(wrapped as Error);
      }
    }
  );
}

export function subscribeRoleInvites(
  onData: (invites: RoleInviteDoc[]) => void,
  onErr: (err: Error) => void
): Unsubscribe {
  const path = 'roleInvites';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as RoleInviteDoc);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onErr(wrapped as Error);
      }
    }
  );
}

export function subscribeComplaints(
  isAdminUser: boolean,
  uid: string,
  onData: (complaints: ComplaintDoc[]) => void,
  onErr: (err: Error) => void
): Unsubscribe {
  const path = 'complaints';
  const ref = isAdminUser
    ? collection(db, path)
    : query(collection(db, path), where('userId', '==', uid));

  return onSnapshot(
    ref,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as ComplaintDoc);
      list.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onErr(wrapped as Error);
      }
    }
  );
}

export function subscribeEmailNotifications(
  isAdminUser: boolean,
  uid: string,
  onData: (notifications: EmailNotificationDoc[]) => void,
  onErr: (err: Error) => void
): Unsubscribe {
  const path = 'emailNotifications';
  const ref = isAdminUser
    ? collection(db, path)
    : query(collection(db, path), where('studentUserId', '==', uid));

  return onSnapshot(
    ref,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as EmailNotificationDoc);
      list.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onErr(wrapped as Error);
      }
    }
  );
}

function utf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function encodeBase64Url(input: string): string {
  return utf8ToBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function escapeHtmlForEmail(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildComplaintEmailSubject(refCode: string, title: string, status: 'In Progress' | 'Resolved'): string {
  const raw = `[QuickResolve ${refCode}] Complaint "${title}" updated to ${status}`;
  return clampStr(raw, 200);
}

function buildComplaintEmailHtml(params: {
  studentName: string;
  refCode: string;
  title: string;
  category: string;
  status: 'In Progress' | 'Resolved';
  adminRemarks: string;
}): string {
  const badgeColor = params.status === 'Resolved' ? '#15803D' : '#1D4ED8';
  const badgeBg = params.status === 'Resolved' ? '#DCFCE7' : '#DBEAFE';
  const safeRemarks = params.adminRemarks
    ? escapeHtmlForEmail(params.adminRemarks)
    : 'Our campus administration team is actively handling your complaint.';

  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;color:#0F172A;">',
    '  <div style="background:#0B1F4D;color:#FFFFFF;padding:20px 24px;">',
    '    <h2 style="margin:0;font-size:20px;">QuickResolve Campus Grievance Update</h2>',
    '    <p style="margin:4px 0 0;font-size:13px;color:#CBD5E1;">Student Complaint Management System</p>',
    '  </div>',
    '  <div style="padding:24px;background:#FFFFFF;">',
    `    <p style="margin:0 0 14px;font-size:15px;">Hello <strong>${escapeHtmlForEmail(params.studentName)}</strong>,</p>`,
    `    <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:#334155;">Your campus complaint has been updated by the administration team.</p>`,
    '    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin-bottom:18px;">',
    `      <div style="font-size:12px;color:#64748B;margin-bottom:6px;">Reference ID: <strong>${escapeHtmlForEmail(params.refCode)}</strong> &bull; Category: <strong>${escapeHtmlForEmail(params.category)}</strong></div>`,
    `      <div style="font-size:16px;font-weight:700;margin-bottom:10px;">${escapeHtmlForEmail(params.title)}</div>`,
    `      <div>Status: <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:${badgeBg};color:${badgeColor};">${escapeHtmlForEmail(params.status)}</span></div>`,
    '    </div>',
    '    <div style="margin-bottom:18px;">',
    '      <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:6px;">Administration Remarks</div>',
    `      <div style="background:#F8FAFC;border-left:4px solid #1D4ED8;padding:12px 14px;font-size:14px;color:#1E293B;">${safeRemarks}</div>`,
    '    </div>',
    '    <p style="margin:0;font-size:13px;color:#64748B;">Sign in to your QuickResolve student dashboard anytime to view full details.</p>',
    '  </div>',
    '</div>',
  ].join('\r\n');
}

async function dispatchGmailMessage(params: {
  accessToken: string;
  toEmail: string;
  subject: string;
  htmlBody: string;
}): Promise<string> {
  const mime = [
    `To: ${params.toEmail}`,
    `Subject: =?UTF-8?B?${utf8ToBase64(params.subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    params.htmlBody,
  ].join('\r\n');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodeBase64Url(mime),
    }),
  });

  if (!res.ok) {
    let errText = `Gmail API error (${res.status})`;
    try {
      const errJson = (await res.json()) as { error?: { message?: string } };
      if (errJson?.error?.message) {
        errText = errJson.error.message;
      }
    } catch {
      // ignore non-json error body
    }
    if (res.status === 401) {
      cachedGmailAccessToken = null;
    }
    throw new Error(errText);
  }

  const data = (await res.json()) as { id?: string };
  return data.id || 'sent';
}

export async function createComplaintInFirestore(input: {
  user: UserProfileDoc;
  title: string;
  category: string;
  description: string;
  proofImage: string;
}): Promise<void> {
  const id = generateSafeId('cmp');
  const refCode = `QR-${id.slice(-4).toUpperCase()}`;
  const path = `complaints/${id}`;

  const payload = {
    id,
    refCode,
    userId: input.user.uid,
    studentName: clampStr(input.user.name, 100),
    studentEmail: clampStr(input.user.email, 150),
    title: clampStr(input.title, 150),
    category: input.category,
    description: clampStr(input.description, 2000),
    proofImage: input.proofImage.slice(0, 650000),
    status: 'Pending',
    adminRemarks: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'complaints', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateComplaintStatusInFirestore(
  complaintId: string,
  status: Status,
  adminRemarks: string
): Promise<void> {
  const path = `complaints/${complaintId}`;
  try {
    await updateDoc(doc(db, 'complaints', complaintId), {
      status,
      adminRemarks: clampStr(adminRemarks, 1000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Triggers an email notification via Gmail to the student whenever their
 * complaint status is updated to 'Resolved' or 'In Progress', and records the
 * dispatch status in Firestore `/emailNotifications`.
 */
export async function triggerComplaintStatusEmailNotification(input: {
  complaint: ComplaintDoc;
  newStatus: Status;
  adminRemarks: string;
  triggeredByUid: string;
  promptAuthIfNeeded?: boolean;
}): Promise<EmailNotificationDoc | null> {
  if (input.newStatus !== 'Resolved' && input.newStatus !== 'In Progress') {
    return null;
  }

  const triggeredStatus = input.newStatus;
  const id = generateSafeId('ntf');
  const path = `emailNotifications/${id}`;
  const subject = buildComplaintEmailSubject(
    input.complaint.refCode,
    input.complaint.title,
    triggeredStatus
  );
  const rawPreview = `Status updated to ${triggeredStatus} for "${input.complaint.title}" (${input.complaint.refCode}). ${
    input.adminRemarks ? `Remarks: ${input.adminRemarks}` : 'Please check your QuickResolve portal for details.'
  }`;
  const bodyPreview = clampStr(rawPreview, 1000);
  const htmlBody = buildComplaintEmailHtml({
    studentName: input.complaint.studentName,
    refCode: input.complaint.refCode,
    title: input.complaint.title,
    category: input.complaint.category,
    status: triggeredStatus,
    adminRemarks: input.adminRemarks,
  });

  let deliveryStatus: 'SENT' | 'FAILED' | 'PENDING_AUTH' = 'PENDING_AUTH';
  let gmailMessageId = '';
  let errorMessage = '';

  try {
    let token = cachedGmailAccessToken;
    if (!token && input.promptAuthIfNeeded) {
      token = await requestGmailSendAccess();
    }

    if (!token) {
      deliveryStatus = 'PENDING_AUTH';
      errorMessage = 'Gmail authorization needed in this session to dispatch email.';
    } else {
      gmailMessageId = clampStr(
        await dispatchGmailMessage({
          accessToken: token,
          toEmail: input.complaint.studentEmail,
          subject,
          htmlBody,
        }),
        128
      );
      deliveryStatus = 'SENT';
    }
  } catch (err) {
    deliveryStatus = 'FAILED';
    errorMessage = clampStr(err instanceof Error ? err.message : String(err), 500);
  }

  const recordPayload = {
    id,
    complaintId: input.complaint.id,
    refCode: clampStr(input.complaint.refCode, 20),
    studentUserId: input.complaint.userId,
    recipientEmail: clampStr(input.complaint.studentEmail, 150),
    studentName: clampStr(input.complaint.studentName, 100),
    complaintTitle: clampStr(input.complaint.title, 150),
    triggeredStatus,
    subject,
    bodyPreview: bodyPreview.length >= 10 ? bodyPreview : 'Status notification updated.',
    deliveryStatus,
    gmailMessageId,
    errorMessage,
    triggeredByUid: input.triggeredByUid,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'emailNotifications', id), recordPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    id,
    complaintId: input.complaint.id,
    refCode: recordPayload.refCode,
    studentUserId: input.complaint.userId,
    recipientEmail: recordPayload.recipientEmail,
    studentName: recordPayload.studentName,
    complaintTitle: recordPayload.complaintTitle,
    triggeredStatus,
    subject,
    bodyPreview: recordPayload.bodyPreview,
    deliveryStatus,
    gmailMessageId,
    errorMessage,
    triggeredByUid: input.triggeredByUid,
  };
}

export async function retryEmailNotificationInFirestore(
  notification: EmailNotificationDoc,
  complaint?: ComplaintDoc
): Promise<'SENT' | 'FAILED'> {
  const path = `emailNotifications/${notification.id}`;
  let token = cachedGmailAccessToken;
  if (!token) {
    token = await requestGmailSendAccess();
  }

  const htmlBody = buildComplaintEmailHtml({
    studentName: notification.studentName,
    refCode: notification.refCode,
    title: notification.complaintTitle,
    category: complaint?.category || 'Campus Grievance',
    status: notification.triggeredStatus,
    adminRemarks: complaint?.adminRemarks || notification.bodyPreview,
  });

  let deliveryStatus: 'SENT' | 'FAILED' = 'FAILED';
  let gmailMessageId = '';
  let errorMessage = '';

  try {
    gmailMessageId = clampStr(
      await dispatchGmailMessage({
        accessToken: token,
        toEmail: notification.recipientEmail,
        subject: notification.subject,
        htmlBody,
      }),
      128
    );
    deliveryStatus = 'SENT';
  } catch (err) {
    deliveryStatus = 'FAILED';
    errorMessage = clampStr(err instanceof Error ? err.message : String(err), 500);
  }

  try {
    await updateDoc(doc(db, 'emailNotifications', notification.id), {
      deliveryStatus,
      gmailMessageId,
      errorMessage,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  return deliveryStatus;
}

export async function deleteComplaintInFirestore(complaintId: string): Promise<void> {
  const path = `complaints/${complaintId}`;
  try {
    await deleteDoc(doc(db, 'complaints', complaintId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateOwnProfileInFirestore(
  uid: string,
  name: string,
  studentId: string,
  department: string
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      name: clampStr(name, 100),
      studentId: clampStr(studentId, 50),
      department: clampStr(department, 100),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createRoleInviteInFirestore(input: {
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  studentId: string;
  department: string;
  createdByUid: string;
}): Promise<void> {
  const id = generateSafeId('inv');
  const path = `roleInvites/${id}`;
  try {
    await setDoc(doc(db, 'roleInvites', id), {
      id,
      name: clampStr(input.name, 100),
      email: clampStr(input.email.toLowerCase(), 150),
      role: input.role,
      studentId: clampStr(input.studentId, 50),
      department: clampStr(input.department, 100),
      createdBy: input.createdByUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserRoleInFirestore(
  uid: string,
  role: 'ADMIN' | 'STUDENT'
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateInviteRoleInFirestore(
  inviteId: string,
  role: 'ADMIN' | 'STUDENT'
): Promise<void> {
  const path = `roleInvites/${inviteId}`;
  try {
    await updateDoc(doc(db, 'roleInvites', inviteId), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteUserInFirestore(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteInviteInFirestore(inviteId: string): Promise<void> {
  const path = `roleInvites/${inviteId}`;
  try {
    await deleteDoc(doc(db, 'roleInvites', inviteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
