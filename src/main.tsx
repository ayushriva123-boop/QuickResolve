import './index.css';
import type { Unsubscribe } from 'firebase/firestore';
import {
  BOOTSTRAP_MAIN_ADMIN_EMAIL,
  createComplaintInFirestore,
  createRoleInviteInFirestore,
  deleteComplaintInFirestore,
  deleteInviteInFirestore,
  deleteUserInFirestore,
  ensureUserProfile,
  formatFirestoreDate,
  hasGmailAccessToken,
  requestGmailSendAccess,
  retryEmailNotificationInFirestore,
  signInWithGoogleFirebase,
  signOutFirebase,
  subscribeAllUsers,
  subscribeAuth,
  subscribeComplaints,
  subscribeEmailNotifications,
  subscribeOwnProfile,
  subscribeRoleInvites,
  triggerComplaintStatusEmailNotification,
  updateComplaintStatusInFirestore,
  updateInviteRoleInFirestore,
  updateOwnProfileInFirestore,
  updateUserRoleInFirestore,
  type ComplaintDoc,
  type EmailNotificationDoc,
  type Role,
  type RoleInviteDoc,
  type Status,
  type UserProfileDoc,
} from './firebase';

declare global {
  interface Window {
    bootstrap?: {
      Modal: {
        getOrCreateInstance: (el: Element) => { show: () => void; hide: () => void };
      };
      Offcanvas: {
        getInstance: (el: Element) => { hide: () => void } | null;
      };
    };
  }
}

type PageKey =
  | 'landing'
  | 'login'
  | 'register'
  | 'team'
  | 'terms'
  | 'privacy'
  | 'student-dashboard'
  | 'submit-complaint'
  | 'my-complaints'
  | 'admin-dashboard'
  | 'manage-complaints'
  | 'manage-students'
  | 'manage-users'
  | 'profile';

type TeamRoleFilter = 'all' | 'lead' | 'ideation' | 'testing' | 'uiux';

interface TeamMember {
  id: string;
  order: string;
  name: string;
  roleTitle: string;
  responsibilityTag: string;
  filterKey: Exclude<TeamRoleFilter, 'all'>;
  photo: string;
  bio: string;
  roleSummary: string;
  contributions: string[];
  socials: {
    label: string;
    icon: string;
    href: string;
    external: boolean;
  }[];
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'ayush',
    order: '01',
    name: 'Ayush Shrivastava',
    roleTitle: 'Lead & Full-Stack Developer',
    responsibilityTag: 'The Lead and Developer',
    filterKey: 'lead',
    photo: '/src/assets/images/team_ayush_shrivastava_1795449672454.jpg',
    bio: 'Led the end-to-end engineering of QuickResolve, turning student grievance challenges into a secure, real-time cloud platform.',
    roleSummary:
      'Owned core architecture, full-stack development, Firebase Authentication & Firestore persistence, Main Admin governance, and automated Gmail status notifications.',
    contributions: [
      'Architected role-based access control across Main Admin, Admin, and Student portals',
      'Built persistent Firestore data workflows with mandatory proof-image compression',
      'Implemented automated Gmail notifications when complaints move to In Progress or Resolved',
    ],
    socials: [
      {
        label: 'Email Ayush',
        icon: 'bi-envelope-fill',
        href: 'mailto:ayushriva123@gmail.com',
        external: false,
      },
      {
        label: 'GitHub',
        icon: 'bi-github',
        href: 'https://github.com/search?q=Ayush+Shrivastava',
        external: true,
      },
      {
        label: 'LinkedIn',
        icon: 'bi-linkedin',
        href: 'https://www.linkedin.com/search/results/all/?keywords=Ayush+Shrivastava',
        external: true,
      },
    ],
  },
  {
    id: 'saksham',
    order: '02',
    name: 'Saksham Agarwal',
    roleTitle: 'Ideation & Product Strategy',
    responsibilityTag: 'Ideate',
    filterKey: 'ideation',
    photo: '/src/assets/images/team_saksham_agarwal_1795449673006.jpg',
    bio: 'Originator of the core QuickResolve idea, shaping student-first grievance flows and transparent campus resolution stages.',
    roleSummary:
      'Defined the foundational product concept, mapped campus departments, and structured the end-to-end complaint lifecycle for maximum accountability.',
    contributions: [
      'Conceived the transparent Pending -> In Progress -> Resolved campus workflow',
      'Structured complaint categories across Hostel, IT, Academics, and Infrastructure',
      'Shaped student-centric feedback loops and priority visibility',
    ],
    socials: [
      {
        label: 'LinkedIn',
        icon: 'bi-linkedin',
        href: 'https://www.linkedin.com/search/results/all/?keywords=Saksham+Agarwal',
        external: true,
      },
      {
        label: 'GitHub',
        icon: 'bi-github',
        href: 'https://github.com/search?q=Saksham+Agarwal',
        external: true,
      },
    ],
  },
  {
    id: 'raghav',
    order: '03',
    name: 'Raghav Ji',
    roleTitle: 'Testing Accuracy & QA Lead',
    responsibilityTag: 'Testing Accuracy',
    filterKey: 'testing',
    photo: '/src/assets/images/team_raghav_ji_1795449672242.jpg',
    bio: 'Ensured every complaint submission, role transition, and data rule behaves with precision across real campus edge cases.',
    roleSummary:
      'Executed thorough end-to-end verification of authentication, database persistence, search/filter accuracy, proof validation, and notification triggers.',
    contributions: [
      'Validated multi-role access boundaries across Student, Admin, and Main Admin accounts',
      'Tested proof image format limits, form validation, and live Firestore state persistence',
      'Verified status update tracking and email notification trigger accuracy',
    ],
    socials: [
      {
        label: 'LinkedIn',
        icon: 'bi-linkedin',
        href: 'https://www.linkedin.com/search/results/all/?keywords=Raghav+Ji',
        external: true,
      },
      {
        label: 'GitHub',
        icon: 'bi-github',
        href: 'https://github.com/search?q=Raghav+Ji',
        external: true,
      },
    ],
  },
  {
    id: 'harsha',
    order: '04',
    name: 'Harsha Kanna',
    roleTitle: 'UI/UX Review & Experience Design',
    responsibilityTag: 'Checking UI/UX',
    filterKey: 'uiux',
    photo: '/src/assets/images/team_harsha_kanna_1795449672743.jpg',
    bio: 'Championed clean usability, responsive layout ergonomics, and visual clarity so every student can report concerns effortlessly.',
    roleSummary:
      'Audited interface hierarchy, mobile responsiveness, color contrast, modal clarity, and intuitive dashboard navigation across every screen.',
    contributions: [
      'Reviewed desktop and mobile layouts for effortless grievance submission',
      'Refined visual hierarchy, readable typography, and dashboard card balance',
      'Verified intuitive status cues, detail modals, and clear confirmation flows',
    ],
    socials: [
      {
        label: 'LinkedIn',
        icon: 'bi-linkedin',
        href: 'https://www.linkedin.com/search/results/all/?keywords=Harsha+Kanna',
        external: true,
      },
      {
        label: 'GitHub',
        icon: 'bi-github',
        href: 'https://github.com/search?q=Harsha+Kanna',
        external: true,
      },
    ],
  },
];

const CATEGORIES = [
  'Hostel & Accommodation',
  'IT & Network',
  'Academics & Faculty',
  'Library & Labs',
  'Canteen & Hygiene',
  'Infrastructure & Maintenance',
  'Transport',
  'Administration',
  'Other',
];

const LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" width="36" height="36">
  <rect width="48" height="48" rx="12" fill="#0F2557"/>
  <path d="M24 8L38 13.5V23.5C38 32.1 32.05 38.85 24 41C15.95 38.85 10 32.1 10 23.5V13.5L24 8Z" fill="#1D4ED8" stroke="#93C5FD" stroke-width="2"/>
  <path d="M18.5 24.5L22.2 28.2L30 20.2" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

let pendingUploadDataUrl = '';
let unsubProfile: Unsubscribe | null = null;
let unsubComplaints: Unsubscribe | null = null;
let unsubUsers: Unsubscribe | null = null;
let unsubInvites: Unsubscribe | null = null;
let unsubNotifications: Unsubscribe | null = null;

const initialHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '').toLowerCase() : '';
const initialPage: PageKey =
  initialHash === 'terms'
    ? 'terms'
    : initialHash === 'privacy'
      ? 'privacy'
      : initialHash === 'team'
        ? 'team'
        : 'landing';

const state: {
  authReady: boolean;
  authBusy: boolean;
  page: PageKey;
  teamFilter: TeamRoleFilter;
  currentUser: UserProfileDoc | null;
  flash: { type: 'success' | 'danger' | 'info' | 'warning'; text: string } | null;
  studentSearch: string;
  studentStatusFilter: string;
  adminSearch: string;
  adminStatusFilter: string;
  users: UserProfileDoc[];
  roleInvites: RoleInviteDoc[];
  complaints: ComplaintDoc[];
  emailNotifications: EmailNotificationDoc[];
} = {
  authReady: false,
  authBusy: false,
  page: initialPage,
  teamFilter: 'all',
  currentUser: null,
  flash: null,
  studentSearch: '',
  studentStatusFilter: 'ALL',
  adminSearch: '',
  adminStatusFilter: 'ALL',
  users: [],
  roleInvites: [],
  complaints: [],
  emailNotifications: [],
};

function clearDataListeners(): void {
  if (unsubProfile) {
    unsubProfile();
    unsubProfile = null;
  }
  if (unsubComplaints) {
    unsubComplaints();
    unsubComplaints = null;
  }
  if (unsubUsers) {
    unsubUsers();
    unsubUsers = null;
  }
  if (unsubInvites) {
    unsubInvites();
    unsubInvites = null;
  }
  if (unsubNotifications) {
    unsubNotifications();
    unsubNotifications = null;
  }
}

function esc(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'QR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function statusBadge(status: Status): string {
  if (status === 'Resolved') return '<span class="badge-status badge-status-resolved">Resolved</span>';
  if (status === 'In Progress') return '<span class="badge-status badge-status-progress">In Progress</span>';
  return '<span class="badge-status badge-status-pending">Pending</span>';
}

function proofBadge(hasProof: boolean): string {
  if (hasProof) {
    return '<span class="badge bg-primary-subtle text-primary"><i class="bi bi-image me-1"></i>Attached</span>';
  }
  return '<span class="text-muted small">&mdash;</span>';
}

function notifDeliveryBadge(status: EmailNotificationDoc['deliveryStatus']): string {
  if (status === 'SENT') {
    return '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-envelope-check-fill me-1"></i>Sent</span>';
  }
  if (status === 'PENDING_AUTH') {
    return '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"><i class="bi bi-envelope-exclamation me-1"></i>Needs Gmail Auth</span>';
  }
  return '<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-envelope-x-fill me-1"></i>Failed</span>';
}

function isMainAdmin(u: UserProfileDoc | null): boolean {
  return u?.role === 'MAIN_ADMIN';
}

function isAdminOrMain(u: UserProfileDoc | null): boolean {
  return u?.role === 'ADMIN' || u?.role === 'MAIN_ADMIN';
}

function roleLabel(role: Role): string {
  return role === 'MAIN_ADMIN' ? 'MAIN ADMIN' : role;
}

function roleBadge(role: Role): string {
  if (role === 'MAIN_ADMIN') return '<span class="badge-status badge-role-main">MAIN ADMIN</span>';
  if (role === 'ADMIN') return '<span class="badge-status badge-role-admin">ADMIN</span>';
  return '<span class="badge-status badge-role-student">STUDENT</span>';
}

function defaultDashboardFor(user: UserProfileDoc): PageKey {
  if (isMainAdmin(user)) return 'manage-users';
  if (isAdminOrMain(user)) return 'admin-dashboard';
  return 'student-dashboard';
}

function readableError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message) as { error?: string };
      if (parsed.error) return parsed.error;
    } catch {
      return err.message;
    }
  }
  return fallback;
}

function compressProofImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) {
        reject(new Error('Invalid image file.'));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported image format.'));
      img.onload = () => {
        const maxSide = 1024;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to process image in browser.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let compressed = canvas.toDataURL('image/jpeg', 0.78);
        if (compressed.length > 580000) {
          compressed = canvas.toDataURL('image/jpeg', 0.55);
        }
        if (compressed.length > 640000) {
          reject(new Error('Compressed proof image is still too large. Please upload a smaller photo.'));
          return;
        }
        resolve(compressed);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function googleButtonHtml(label: string): string {
  const disabledAttr = state.authBusy ? 'disabled' : '';
  return `
    <button type="button" class="gsi-material-button mb-3" data-google-signin ${disabledAttr}>
      <div class="gsi-material-button-state"></div>
      <div class="gsi-material-button-content-wrapper">
        <div class="gsi-material-button-icon">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="display: block;">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
        </div>
        <span class="gsi-material-button-contents">${state.authBusy ? 'Signing in...' : esc(label)}</span>
      </div>
    </button>
  `;
}

function navigate(page: PageKey, flash: typeof state.flash = null): void {
  const protectedPages: PageKey[] = [
    'student-dashboard',
    'submit-complaint',
    'my-complaints',
    'admin-dashboard',
    'manage-complaints',
    'manage-students',
    'manage-users',
    'profile',
  ];

  if (protectedPages.includes(page) && !state.currentUser) {
    state.page = 'login';
    state.flash = {
      type: 'info',
      text: 'Please sign in with Google to continue. All data is saved permanently in Firebase.',
    };
    render();
    return;
  }

  if (page === 'manage-users' && !isMainAdmin(state.currentUser)) {
    state.page = defaultDashboardFor(state.currentUser!);
    state.flash = { type: 'warning', text: 'Only the Main Admin can access User & Role Management.' };
    render();
    return;
  }

  if (
    (page === 'admin-dashboard' || page === 'manage-complaints' || page === 'manage-students') &&
    !isAdminOrMain(state.currentUser)
  ) {
    state.page = 'student-dashboard';
    state.flash = { type: 'warning', text: 'Administrator access is required for that section.' };
    render();
    return;
  }

  pendingUploadDataUrl = '';
  state.page = page;
  state.flash = flash;
  if (typeof window !== 'undefined') {
    if (page === 'terms' || page === 'privacy' || page === 'team') {
      window.history.replaceState(null, '', `#${page}`);
    } else if (
      window.location.hash === '#terms' ||
      window.location.hash === '#privacy' ||
      window.location.hash === '#team'
    ) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
  render();
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

function attachDataListeners(user: UserProfileDoc): void {
  clearDataListeners();

  const onSnapshotError = (err: Error) => {
    state.flash = { type: 'danger', text: readableError(err, 'Firestore permission or sync error.') };
    render();
  };

  unsubProfile = subscribeOwnProfile(
    user.uid,
    (fresh) => {
      if (!fresh) return;
      const roleChanged = state.currentUser && state.currentUser.role !== fresh.role;
      state.currentUser = fresh;
      if (roleChanged) {
        attachDataListeners(fresh);
        navigate(defaultDashboardFor(fresh), {
          type: 'info',
          text: `Your role has been updated to ${roleLabel(fresh.role)}.`,
        });
        return;
      }
      render();
    },
    onSnapshotError
  );

  unsubComplaints = subscribeComplaints(
    isAdminOrMain(user),
    user.uid,
    (list) => {
      state.complaints = list;
      render();
    },
    onSnapshotError
  );

  unsubNotifications = subscribeEmailNotifications(
    isAdminOrMain(user),
    user.uid,
    (list) => {
      state.emailNotifications = list;
      render();
    },
    onSnapshotError
  );

  if (isAdminOrMain(user)) {
    unsubUsers = subscribeAllUsers((list) => {
      state.users = list;
      render();
    }, onSnapshotError);
  } else {
    state.users = [user];
  }

  if (isMainAdmin(user)) {
    unsubInvites = subscribeRoleInvites((list) => {
      state.roleInvites = list;
      render();
    }, onSnapshotError);
  } else {
    state.roleInvites = [];
  }
}

function initFirebaseSessionSync(): void {
  subscribeAuth(async (fbUser) => {
    if (!fbUser) {
      clearDataListeners();
      state.authReady = true;
      state.currentUser = null;
      state.users = [];
      state.roleInvites = [];
      state.complaints = [];
      state.emailNotifications = [];
      if (
        state.page !== 'landing' &&
        state.page !== 'login' &&
        state.page !== 'register' &&
        state.page !== 'team' &&
        state.page !== 'terms' &&
        state.page !== 'privacy'
      ) {
        state.page = 'landing';
      }
      render();
      return;
    }

    try {
      const profile = await ensureUserProfile(fbUser);
      state.currentUser = profile;
      state.authReady = true;
      attachDataListeners(profile);
      if (state.page === 'login' || state.page === 'register' || state.page === 'landing') {
        state.page = defaultDashboardFor(profile);
      }
      render();
    } catch (err) {
      state.authReady = true;
      state.flash = { type: 'danger', text: readableError(err, 'Unable to load Firebase user profile.') };
      render();
    }
  });
}

function renderPreviewStrip(): string {
  const p = state.page;
  const user = state.currentUser;
  return `
    <div class="preview-strip py-2 px-2 px-md-3">
      <div class="container-fluid px-1 px-md-2 d-flex align-items-center justify-content-md-end">
        <div class="preview-strip-scroll">
          <button type="button" class="btn btn-preview ${p === 'landing' ? 'active' : ''}" data-nav="landing">Landing</button>
          ${
            !user
              ? `
            <button type="button" class="btn btn-preview ${p === 'login' ? 'active' : ''}" data-nav="login">Login</button>
            <button type="button" class="btn btn-preview ${p === 'register' ? 'active' : ''}" data-nav="register">Register</button>
          `
              : ''
          }
          <button type="button" class="btn btn-preview ${p.startsWith('student') || p === 'submit-complaint' || p === 'my-complaints' ? 'active' : ''}" data-nav="student-dashboard">Student Portal</button>
          ${
            !user || isAdminOrMain(user)
              ? `<button type="button" class="btn btn-preview ${p === 'admin-dashboard' || p === 'manage-complaints' || p === 'manage-students' ? 'active' : ''}" data-nav="admin-dashboard">Admin Portal</button>`
              : ''
          }
          ${
            !user || isMainAdmin(user)
              ? `<button type="button" class="btn btn-preview ${p === 'manage-users' ? 'active' : ''}" data-nav="manage-users">Main Admin</button>`
              : ''
          }
          <button type="button" class="btn btn-preview ${p === 'team' ? 'active' : ''}" data-nav="team">Team</button>
          <button type="button" class="btn btn-preview ${p === 'terms' ? 'active' : ''}" data-nav="terms">T&amp;C</button>
          <button type="button" class="btn btn-preview ${p === 'privacy' ? 'active' : ''}" data-nav="privacy">Privacy</button>
        </div>
      </div>
    </div>
  `;
}

function renderLanding(): string {
  const user = state.currentUser;
  return `
    <nav class="navbar navbar-expand-lg landing-navbar sticky-top py-3">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark text-nowrap" href="#" data-nav="landing">
          ${LOGO_SVG}
          <span class="fs-5">QuickResolve</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#landingNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="landingNav">
          <ul class="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3">
            <li class="nav-item"><a class="nav-link fw-medium text-nowrap" href="#features">Features</a></li>
            <li class="nav-item"><a class="nav-link fw-medium text-nowrap" href="#how-it-works">How It Works</a></li>
            <li class="nav-item"><a class="nav-link fw-medium text-nowrap" href="#roles">Portals</a></li>
            <li class="nav-item"><a class="nav-link fw-medium text-nowrap" href="#team" data-nav="team">Our Team</a></li>
          </ul>
          <div class="d-flex align-items-center gap-2">
            ${
              user
                ? `<button type="button" class="btn btn-navy text-nowrap" data-nav="${defaultDashboardFor(user)}">Open Dashboard</button>`
                : `
              <button type="button" class="btn btn-outline-navy text-nowrap" data-nav="login">Sign In</button>
              <button type="button" class="btn btn-navy text-nowrap" data-nav="register">Student Register</button>
            `
            }
          </div>
        </div>
      </div>
    </nav>

    <section class="hero-section py-5">
      <div class="container hero-content py-4 py-lg-5">
        <div class="row align-items-center g-5">
          <div class="col-lg-6 qr-animate-in" style="--qr-stagger: 0;">
            <div class="hero-eyebrow mb-4">
              <i class="bi bi-shield-check"></i>
              <span>Campus Grievance &amp; Resolution Platform</span>
            </div>
            <h1 class="display-4 fw-bold lh-sm mb-3 headline-balance" style="font-size: clamp(1.9rem, 4.2vw, 3.25rem);">Your Voice Matters. We Make It Happen.</h1>
            <p class="lead text-white-50 mb-4" style="max-width: 540px;">
              Report campus issues, track resolutions, and help create a better campus experience.
            </p>
            <div class="d-flex flex-column flex-sm-row flex-wrap gap-3 mb-4">
              <button type="button" class="btn btn-light btn-lg fw-semibold px-4 text-primary" data-nav="${user ? 'submit-complaint' : 'login'}">
                <i class="bi bi-plus-circle-fill me-2"></i>Submit a Complaint
              </button>
              <button type="button" class="btn btn-outline-light btn-lg fw-semibold px-4" data-nav="${user ? defaultDashboardFor(user) : 'login'}">
                ${user ? 'Go to Dashboard' : 'Sign In with Google'}
              </button>
            </div>
            <div class="d-flex flex-wrap gap-4 pt-2 text-white-50 small">
              <span><i class="bi bi-check-circle-fill text-info me-1"></i>Cloud-Saved Data (Firestore)</span>
              <span><i class="bi bi-check-circle-fill text-info me-1"></i>Role-Based Access Control</span>
              <span><i class="bi bi-check-circle-fill text-info me-1"></i>Photo Proof Attachments</span>
            </div>
          </div>

          <div class="col-lg-6 qr-animate-hero" style="--qr-stagger: 1;">
            <div class="hero-preview-card p-4">
              <div class="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <div>
                  <div class="fw-bold text-dark">Persistent Resolution Workflow</div>
                  <div class="text-muted small">Main Admin, Admin &amp; Student portals synced live</div>
                </div>
                <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold">
                  QuickResolve Portal
                </span>
              </div>
              <div class="d-flex flex-column gap-3">
                <div class="hero-step-card p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3">
                  <div>
                    <div class="fw-semibold text-dark small">1. Main Admin Creates IDs &amp; Assigns Roles</div>
                    <div class="text-muted" style="font-size: 0.78rem;">Assign ADMIN or STUDENT roles permanently in Firestore</div>
                  </div>
                  <span class="badge-status badge-role-main">MAIN ADMIN</span>
                </div>
                <div class="hero-step-card p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3">
                  <div>
                    <div class="fw-semibold text-dark small">2. Student Submits Complaint + Proof Photo</div>
                    <div class="text-muted" style="font-size: 0.78rem;">Mandatory photo evidence stored securely</div>
                  </div>
                  <span class="badge-status badge-status-pending">Pending</span>
                </div>
                <div class="hero-step-card p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3">
                  <div>
                    <div class="fw-semibold text-dark small">3. Admin Reviews Proof &amp; Resolves Issue</div>
                    <div class="text-muted" style="font-size: 0.78rem;">Real-time status &amp; remarks updates saved across sessions</div>
                  </div>
                  <span class="badge-status badge-status-resolved">Resolved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="py-5 bg-white border-bottom">
      <div class="container py-4">
        <div class="text-center mb-5">
          <span class="text-primary fw-bold small text-uppercase">Platform Capabilities</span>
          <h2 class="fw-bold mt-2">Built for Transparency &amp; Speed</h2>
          <p class="text-muted mx-auto" style="max-width: 600px;">
            Every campus concern, photo proof, and assigned role is saved persistently so no changes are ever lost.
          </p>
        </div>
        <div class="row g-4">
          <div class="col-md-4 qr-animate-in" style="--qr-stagger: 0;">
            <div class="feature-card">
              <div class="icon-tile icon-tile-navy mb-3"><i class="bi bi-person-badge-fill"></i></div>
              <h5 class="fw-bold">Main Admin Role Control</h5>
              <p class="text-muted mb-0">Main Admin pre-registers user emails, assigns ADMIN or STUDENT roles, and updates permissions anytime.</p>
            </div>
          </div>
          <div class="col-md-4 qr-animate-in" style="--qr-stagger: 1;">
            <div class="feature-card">
              <div class="icon-tile icon-tile-navy mb-3"><i class="bi bi-camera-fill"></i></div>
              <h5 class="fw-bold">Verified Photo Proof</h5>
              <p class="text-muted mb-0">Students attach image evidence directly with each complaint so campus teams can verify issues rapidly.</p>
            </div>
          </div>
          <div class="col-md-4 qr-animate-in" style="--qr-stagger: 2;">
            <div class="feature-card">
              <div class="icon-tile icon-tile-navy mb-3"><i class="bi bi-cloud-check-fill"></i></div>
              <h5 class="fw-bold">Persistent Firebase Storage</h5>
              <p class="text-muted mb-0">All users, roles, complaints, proof photos, and status updates remain saved across refreshes and devices.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="py-5">
      <div class="container py-4">
        <div class="text-center mb-5">
          <span class="text-primary fw-bold small text-uppercase">Workflow</span>
          <h2 class="fw-bold mt-2">How QuickResolve Works</h2>
        </div>
        <div class="row g-4">
          <div class="col-md-4 qr-animate-in" style="--qr-stagger: 0;">
            <div class="saas-card p-4 h-100">
              <div class="fw-bold text-primary mb-2">Step 01</div>
              <h5 class="fw-bold">Sign In with Google</h5>
              <p class="text-muted mb-0">Authenticate securely with Google. Pre-invited emails automatically receive their Main-Admin-assigned role.</p>
            </div>
          </div>
          <div class="col-md-4 qr-animate-in" style="--qr-stagger: 1;">
            <div class="saas-card p-4 h-100">
              <div class="fw-bold text-primary mb-2">Step 02</div>
              <h5 class="fw-bold">Submit with Photo Proof</h5>
              <p class="text-muted mb-0">Describe the campus issue, select a category, and attach a clear proof photo before submitting.</p>
            </div>
          </div>
          <div class="col-md-4 qr-animate-in" style="--qr-stagger: 2;">
            <div class="saas-card p-4 h-100">
              <div class="fw-bold text-primary mb-2">Step 03</div>
              <h5 class="fw-bold">Track Until Resolved</h5>
              <p class="text-muted mb-0">Admins inspect proof images, post remarks, and update status to In Progress or Resolved in real time.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="roles" class="py-5 bg-white border-top">
      <div class="container py-4">
        <div class="row g-4">
          <div class="col-lg-6">
            <div class="saas-card p-4 h-100">
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="icon-tile icon-tile-navy"><i class="bi bi-mortarboard-fill"></i></div>
                <div>
                  <h4 class="fw-bold mb-0">Student Portal</h4>
                  <div class="text-muted small">Submit, attach proof &amp; monitor grievances</div>
                </div>
              </div>
              <ul class="list-unstyled text-muted d-flex flex-column gap-2 mb-4">
                <li><i class="bi bi-check2 text-primary me-2"></i>Personal complaint dashboard &amp; summary metrics</li>
                <li><i class="bi bi-check2 text-primary me-2"></i>Upload photo proof (JPG/PNG/WEBP/GIF) with every report</li>
                <li><i class="bi bi-check2 text-primary me-2"></i>Searchable complaint history &amp; live status updates</li>
              </ul>
              <button type="button" class="btn btn-navy" data-nav="student-dashboard">Open Student Portal</button>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="saas-card p-4 h-100">
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="icon-tile icon-tile-navy"><i class="bi bi-building-gear"></i></div>
                <div>
                  <h4 class="fw-bold mb-0">Admin &amp; Main Admin Portal</h4>
                  <div class="text-muted small">Manage roles, IDs &amp; campus resolutions</div>
                </div>
              </div>
              <ul class="list-unstyled text-muted d-flex flex-column gap-2 mb-4">
                <li><i class="bi bi-check2 text-primary me-2"></i>Main Admin creates user IDs &amp; assigns ADMIN / STUDENT roles</li>
                <li><i class="bi bi-check2 text-primary me-2"></i>Inspect uploaded complaint proof images securely</li>
                <li><i class="bi bi-check2 text-primary me-2"></i>Status updates (Pending / In Progress / Resolved) + student directory</li>
              </ul>
              <button type="button" class="btn btn-outline-navy" data-nav="admin-dashboard">Open Admin Portal</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="py-4 text-muted small border-top bg-light">
      <div class="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
        <div>
          &copy; 2026 QuickResolve &mdash; Student Complaint Management System. Cloud-persisted with Firebase Firestore.
        </div>
        <div class="d-flex flex-wrap align-items-center gap-3">
          <a href="#team" class="text-decoration-none text-muted fw-medium" data-nav="team">The People Behind the Idea</a>
          <span class="text-secondary">&bull;</span>
          <a href="#terms" class="text-decoration-none text-muted fw-medium" data-nav="terms">Terms &amp; Conditions</a>
          <span class="text-secondary">&bull;</span>
          <a href="#privacy" class="text-decoration-none text-muted fw-medium" data-nav="privacy">Privacy Policy</a>
        </div>
      </div>
    </footer>
  `;
}

function renderFlash(): string {
  if (!state.flash) return '';
  return `
    <div class="alert alert-${state.flash.type} alert-dismissible fade show small qr-alert-animate" role="alert">
      ${esc(state.flash.text)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}

function renderAuthScreen(isRegister: boolean): string {
  return `
    <div class="auth-wrapper row g-0">
      <div class="col-lg-5 d-none d-lg-flex auth-brand-panel">
        <div class="qr-animate-in" style="--qr-stagger: 0;">
          <a href="#" class="d-inline-flex align-items-center gap-2 text-white text-decoration-none mb-5" data-nav="landing">
            ${LOGO_SVG}
            <span class="fs-4 fw-bold">QuickResolve</span>
          </a>
          <h2 class="display-6 fw-bold mb-3">${isRegister ? 'Join Your Campus Resolution Hub' : 'Your Voice Matters. We Make It Happen.'}</h2>
          <p class="text-white-50 fs-6">
            Sign in with Google to submit campus issues with photo proof, track resolution progress in real time, or manage roles and grievances.
          </p>
        </div>
        <div class="p-3 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10 qr-animate-in" style="--qr-stagger: 1;">
          <div class="small fw-semibold text-white mb-1"><i class="bi bi-cloud-check-fill me-1"></i> Persistent Cloud Sync</div>
          <div class="small text-white-50">
            All accounts, Main Admin role assignments, and complaints are permanently saved in Firebase Firestore.
          </div>
        </div>
      </div>

      <div class="col-lg-7 auth-form-panel">
        <div class="auth-card qr-animate-hero" style="--qr-stagger: 0;">
          <h3 class="fw-bold mb-1">${isRegister ? 'Student & Staff Registration' : 'Welcome back'}</h3>
          <p class="text-muted small mb-4">
            ${
              isRegister
                ? 'Continue with Google to activate your QuickResolve account. Pre-assigned roles from the Main Admin are applied automatically.'
                : 'Sign in securely with your Google account.'
            }
          </p>
          ${renderFlash()}

          ${googleButtonHtml(isRegister ? 'Continue with Google' : 'Sign in with Google')}

          <div class="demo-box mt-3 mb-3">
            <div class="fw-bold text-dark mb-1"><i class="bi bi-shield-lock me-1"></i> Role Access Info</div>
            <div class="text-muted">
              <strong>Main Admin:</strong> <code>${esc(BOOTSTRAP_MAIN_ADMIN_EMAIL)}</code><br />
              Other Google accounts start as <strong>STUDENT</strong> or inherit the <strong>ADMIN</strong> / <strong>STUDENT</strong> role created by the Main Admin.
            </div>
          </div>

          <div class="text-center small text-muted mb-2">
            By signing in, you agree to our
            <a href="#terms" class="text-decoration-none fw-semibold" data-nav="terms">Terms &amp; Conditions</a>
            and
            <a href="#privacy" class="text-decoration-none fw-semibold" data-nav="privacy">Privacy Policy</a>.
          </div>

          <div class="text-center small text-muted">
            <a href="#" class="text-decoration-none text-muted" data-nav="landing">Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLegalShell(activeTab: 'terms' | 'privacy', title: string, subtitle: string, sectionsHtml: string): string {
  const user = state.currentUser;
  return `
    <nav class="navbar navbar-expand-lg landing-navbar sticky-top py-3">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark text-nowrap" href="#" data-nav="landing">
          ${LOGO_SVG}
          <span class="fs-5">QuickResolve</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#legalNav" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="legalNav">
          <div class="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 ms-lg-auto pt-3 pt-lg-0">
            <a href="#team" class="btn btn-sm btn-light border text-nowrap" data-nav="team">Our Team</a>
            <a href="#terms" class="btn btn-sm text-nowrap ${activeTab === 'terms' ? 'btn-navy' : 'btn-outline-navy'}" data-nav="terms">Terms &amp; Conditions</a>
            <a href="#privacy" class="btn btn-sm text-nowrap ${activeTab === 'privacy' ? 'btn-navy' : 'btn-outline-navy'}" data-nav="privacy">Privacy Policy</a>
            ${
              user
                ? `<button type="button" class="btn btn-sm btn-light border text-nowrap" data-nav="${defaultDashboardFor(user)}">Dashboard</button>`
                : `<button type="button" class="btn btn-sm btn-light border text-nowrap" data-nav="landing">Back to Home</button>`
            }
          </div>
        </div>
      </div>
    </nav>

    <section class="py-5" style="background: linear-gradient(135deg, #0B1F4D 0%, #1B3F91 100%); color: #FFFFFF;">
      <div class="container py-2">
        <span class="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 px-3 py-2 rounded-pill mb-3">
          <i class="bi bi-shield-check me-1"></i> Legal &amp; Governance
        </span>
        <h1 class="fw-bold mb-2">${esc(title)}</h1>
        <p class="text-white-50 mb-0" style="max-width: 680px;">${esc(subtitle)}</p>
        <div class="small text-white-50 mt-3">Effective Date: November 23, 2026 &bull; QuickResolve Campus Grievance Portal</div>
      </div>
    </section>

    <section class="py-5">
      <div class="container" style="max-width: 920px;">
        <div class="saas-card p-4 p-md-5">
          ${sectionsHtml}
        </div>
      </div>
    </section>

    <footer class="py-4 text-muted small border-top bg-light">
      <div class="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
        <div>
          &copy; 2026 QuickResolve &mdash; Student Complaint Management System.
        </div>
        <div class="d-flex align-items-center gap-3">
          <a href="#terms" class="text-decoration-none text-muted fw-medium" data-nav="terms">Terms &amp; Conditions</a>
          <span class="text-secondary">&bull;</span>
          <a href="#privacy" class="text-decoration-none text-muted fw-medium" data-nav="privacy">Privacy Policy</a>
          <span class="text-secondary">&bull;</span>
          <a href="#" class="text-decoration-none text-muted fw-medium" data-nav="landing">Home</a>
        </div>
      </div>
    </footer>
  `;
}

function renderTermsPage(): string {
  const sections = `
    <div class="d-flex flex-column gap-4">
      <div>
        <h4 class="fw-bold text-dark mb-2">1. Acceptance of Terms</h4>
        <p class="text-muted mb-0">
          By accessing or signing in to <strong>QuickResolve</strong> (Student Complaint Management System), you agree to be bound by these Terms &amp; Conditions and applicable campus code-of-conduct policies. If you do not agree with these terms, please discontinue use of the platform.
        </p>
      </div>

      <div>
        <h4 class="fw-bold text-dark mb-2">2. Accounts, Google Sign-In &amp; Role Hierarchy</h4>
        <p class="text-muted mb-2">
          QuickResolve authenticates users via verified Google accounts. Access permissions are governed by three roles:
        </p>
        <ul class="text-muted mb-0 d-flex flex-column gap-1">
          <li><strong>Student:</strong> May submit campus complaints with proof images, view personal grievance history, and update personal profile details.</li>
          <li><strong>Administrator (ADMIN):</strong> Assigned by the Main Admin to review submitted complaints, inspect proof images, update status (Pending, In Progress, Resolved), post administrative remarks, and trigger student status email notifications.</li>
          <li><strong>Main Administrator (MAIN_ADMIN):</strong> Manages user ID creation, role assignments (ADMIN or STUDENT), and account removal across the portal.</li>
        </ul>
      </div>

      <div>
        <h4 class="fw-bold text-dark mb-2">3. Complaint Submissions &amp; Proof Image Guidelines</h4>
        <p class="text-muted mb-2">
          When filing a complaint, you represent and warrant that:
        </p>
        <ul class="text-muted mb-0 d-flex flex-column gap-1">
          <li>All submitted titles, descriptions, locations, and categories are truthful and accurate to the best of your knowledge.</li>
          <li>Uploaded proof images (JPG, PNG, WEBP, or GIF) directly depict the reported campus issue and do not violate individual privacy, contain explicit/offensive content, or infringe third-party rights.</li>
          <li>You will not submit spam, duplicate automated reports, abusive language, or intentionally fabricated grievances.</li>
        </ul>
      </div>

      <div>
        <h4 class="fw-bold text-dark mb-2">4. Resolution Workflow &amp; Notifications</h4>
        <p class="text-muted mb-0">
          Submission of a complaint records it for administrative review under the <strong>Pending</strong> status. While campus teams strive to investigate and resolve issues promptly, QuickResolve does not guarantee specific resolution timelines. When an administrator updates a status to <strong>In Progress</strong> or <strong>Resolved</strong>, an automated status notification email may be dispatched via Gmail to your registered email address.
        </p>
      </div>

      <div>
        <h4 class="fw-bold text-dark mb-2">5. Prohibited Conduct &amp; Account Termination</h4>
        <p class="text-muted mb-0">
          Any attempt to bypass role-based security controls, tamper with other users' complaint records, inject malicious payloads, or misuse administrative privileges may result in immediate revocation of access by the Main Administrator and disciplinary review under institutional policies.
        </p>
      </div>

      <div>
        <h4 class="fw-bold text-dark mb-2">6. Contact &amp; Administration</h4>
        <p class="text-muted mb-0">
          For questions regarding these Terms &amp; Conditions or role provisioning, contact the Main Administrator at
          <a href="mailto:${esc(BOOTSTRAP_MAIN_ADMIN_EMAIL)}" class="fw-semibold text-decoration-none">${esc(BOOTSTRAP_MAIN_ADMIN_EMAIL)}</a>.
        </p>
      </div>
    </div>
  `;

  return renderLegalShell(
    'terms',
    'Terms & Conditions',
    'Rules and responsibilities for students and campus administrators using the QuickResolve grievance portal.',
    sections
  );
}

function renderPrivacyPage(): string {
  const sections = `
    <div class="d-flex flex-column gap-4">
      <div>
        <h4 class="fw-bold text-dark mb-2">1. Information We Collect</h4>
        <p class="text-muted mb-2">
          QuickResolve collects only the information necessary to operate campus grievance intake, role verification, and resolution tracking:
        </p>
        <ul class="text-muted mb-0 d-flex flex-column gap-1">
          <li><strong>Account Information:</strong> Your display name, verified Google email address, user UID, assigned role, and optional Student/Staff ID and department.</li>
          <li><strong>Complaint Data:</strong> Complaint titles, categories, descriptions, status history, administrative remarks, and compressed photo proof attachments uploaded by you.</li>
          <li><strong>Notification Logs:</strong> Audit records of status emails triggered when a complaint moves to <em>In Progress</em> or <em>Resolved</em> (recipient email, subject, timestamp, and delivery status).</li>
        </ul>
      </div>

      <div>
        <h4 class="fw-bold text-dark mb-2">2. How We Use Your Data</h4>
        <ul class="text-muted mb-0 d-flex flex-column gap-1">
          <li>To authenticate your identity securely using Google Sign-In and enforce role-based access control.</li>
          <li>To route campus maintenance, academic, hostel, IT, or facility issues to authorized campus administrators.</li>
          <li>To send email updates to the submitting student via Gmail API (with explicit administrator authorization) when complaint status changes to <strong>In Progress</strong> or <strong>Resolved</strong>.</li>
        </ul>
      </div>

      <div>
        <h4 class="fw-bold text-dark mb-2">3. Cloud Storage, Token Handling &amp; Security</h4>
        <p class="text-muted mb-2">
          All persistent application records (user profiles, pre-assigned roles, complaints, proof photos, and notification logs) are stored in <strong>Google Cloud Firebase Firestore</strong> protected by strict server-enforced Firestore Security Rules:
        </p>
        <ul class="text-muted mb-0 d-flex flex-column gap-1">
          <li>Proof photos are resized and compressed locally in your browser before storage.</li>
          <li>Gmail sending OAuth access tokens are held <strong>strictly in browser memory</strong> during the active session and automatically cleared upon sign-out &mdash; never written to localStorage or sessionStorage.</li>
          <li>Students can only read their own profiles, complaints, and email notification logs. Only authorized campus administrators can review submitted complaints to resolve issues.</li>
        </ul>
      </div>

      <div>
        <h4 class="fw-bold text-dark mb-2">4. Data Sharing &amp; Third-Party Services</h4>
        <p class="text-muted mb-0">
          QuickResolve does not sell, rent, or trade your personal information to third parties. Data is processed exclusively through Google Firebase Authentication, Cloud Firestore, and the Gmail API (solely to deliver your complaint status updates).
        </p>
      </div>

      <div>
        <h4 class="fw-bold text-dark mb-2">5. Your Rights &amp; Data Deletion</h4>
        <p class="text-muted mb-0">
          You may update your display name, Student/Staff ID, and department anytime from the <strong>My Profile</strong> page. To request removal of an account or correction of closed complaint records, please contact the Main Administrator.
        </p>
      </div>

      <div>
        <h4 class="fw-bold text-dark mb-2">6. Privacy Contact</h4>
        <p class="text-muted mb-0">
          For privacy inquiries or data removal requests, email the Main Administrator at
          <a href="mailto:${esc(BOOTSTRAP_MAIN_ADMIN_EMAIL)}" class="fw-semibold text-decoration-none">${esc(BOOTSTRAP_MAIN_ADMIN_EMAIL)}</a>.
        </p>
      </div>
    </div>
  `;

  return renderLegalShell(
    'privacy',
    'Privacy Policy',
    'How QuickResolve collects, secures, and uses student and staff data across Firebase and Gmail notifications.',
    sections
  );
}

function renderTeamPage(): string {
  const user = state.currentUser;
  const activeFilter = state.teamFilter;
  const visibleMembers =
    activeFilter === 'all'
      ? TEAM_MEMBERS
      : TEAM_MEMBERS.filter((m) => m.filterKey === activeFilter);

  const filterOptions: { key: TeamRoleFilter; label: string }[] = [
    { key: 'all', label: 'All Members (4)' },
    { key: 'lead', label: 'Lead & Developer' },
    { key: 'ideation', label: 'Ideation' },
    { key: 'testing', label: 'Testing Accuracy' },
    { key: 'uiux', label: 'Checking UI/UX' },
  ];

  return `
    <nav class="navbar navbar-expand-lg landing-navbar sticky-top py-3">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark text-nowrap" href="#" data-nav="landing">
          ${LOGO_SVG}
          <span class="fs-5">QuickResolve</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#teamNav" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="teamNav">
          <ul class="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3 pt-2 pt-lg-0">
            <li class="nav-item"><a href="#" class="nav-link fw-medium text-muted text-nowrap" data-nav="landing">Home</a></li>
            <li class="nav-item"><a href="#team" class="nav-link fw-semibold text-primary text-nowrap" data-nav="team">Our Team</a></li>
            <li class="nav-item"><a href="#terms" class="nav-link fw-medium text-muted text-nowrap" data-nav="terms">Terms</a></li>
            <li class="nav-item"><a href="#privacy" class="nav-link fw-medium text-muted text-nowrap" data-nav="privacy">Privacy</a></li>
          </ul>
          <div class="d-flex align-items-center gap-2 pt-2 pt-lg-0">
            ${
              user
                ? `<button type="button" class="btn btn-navy btn-sm text-nowrap" data-nav="${defaultDashboardFor(user)}">Open Dashboard</button>`
                : `<button type="button" class="btn btn-navy btn-sm text-nowrap" data-nav="login">Sign In</button>`
            }
          </div>
        </div>
      </div>
    </nav>

    <section class="hero-section py-5">
      <div class="container hero-content py-4">
        <div class="row align-items-stretch g-4 g-lg-5">
          <div class="col-lg-7 d-flex flex-column justify-content-center team-reveal" style="--stagger: 0;">
            <div class="small fw-semibold text-info mb-3">Founders &amp; Core Team &middot; QuickResolve</div>
            <h1 class="display-4 fw-bold lh-sm headline-balance mb-3" style="font-size: clamp(2.15rem, 4vw, 3.45rem);">
              The People Behind the Idea
            </h1>
            <p class="lead text-white-50 mb-4" style="max-width: 580px;">
              Meet the builders, thinkers, testers, and experience reviewers turning everyday student concerns into structured, accountable campus resolutions.
            </p>
            <div class="d-flex flex-wrap align-items-center gap-3">
              <button type="button" class="btn btn-light fw-semibold text-primary px-4 py-2 text-nowrap" data-nav="${user ? defaultDashboardFor(user) : 'login'}">
                Explore QuickResolve
              </button>
              <a href="#our-roles" class="btn btn-outline-light fw-semibold px-4 py-2 text-nowrap">View Our Roles</a>
            </div>
          </div>

          <div class="col-lg-5 d-flex team-reveal" style="--stagger: 1;">
            <div class="w-100 rounded-4 p-4 p-lg-5 d-flex flex-column justify-content-between"
                 style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.18);">
              <div>
                <div class="small fw-semibold text-info mb-2">01. The Vision</div>
                <h3 class="h4 fw-bold text-white mb-3 headline-balance">Every Student Concern Heard &amp; Tracked</h3>
                <p class="text-white-50 mb-0" style="line-height: 1.7;">
                  To create a transparent, efficient, and student-friendly complaint management system where every student&apos;s concern is heard, tracked, and resolved without unnecessary delays.
                </p>
              </div>
              <div class="pt-4 mt-4 border-top border-white border-opacity-10 d-flex align-items-center justify-content-between small text-white-50">
                <span>Core Team</span>
                <span class="fw-semibold text-white tabular-nums">4 Members &middot; 1 Shared Goal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-5 bg-white border-bottom">
      <div class="container py-3">
        <div class="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4 team-reveal" style="--stagger: 1;">
          <div>
            <div class="text-primary fw-semibold small mb-1">The People Behind It</div>
            <h2 class="fw-bold mb-1 headline-balance">Founders &amp; Core Team</h2>
            <p class="text-muted mb-0">Filter by discipline or open any profile card to explore full contributions.</p>
          </div>
          <div class="team-filter-group" role="tablist" aria-label="Filter team members by role">
            ${filterOptions
              .map(
                (opt) => `
                  <button type="button"
                    class="team-filter-btn ${activeFilter === opt.key ? 'active' : ''}"
                    data-team-filter="${opt.key}">
                    ${esc(opt.label)}
                  </button>
                `
              )
              .join('')}
          </div>
        </div>

        <div class="row g-4">
          ${visibleMembers
            .map(
              (m, idx) => `
              <div class="col-12 col-sm-6 col-xl-3 team-reveal" style="--stagger: ${idx + 1};">
                <article class="team-card">
                  <div class="team-photo-frame">
                    <img
                      src="${esc(m.photo)}"
                      alt="${esc(m.name)} — ${esc(m.roleTitle)}"
                      class="team-photo-img"
                      referrerpolicy="no-referrer"
                      data-team-img="${esc(m.id)}"
                    />
                    <div class="team-photo-fallback" data-team-fallback="${esc(m.id)}">
                      <div class="fs-2 fw-bold mb-1">${initials(m.name)}</div>
                      <div class="small text-white-50">${esc(m.roleTitle)}</div>
                    </div>
                  </div>

                  <div class="p-4 d-flex flex-column flex-grow-1">
                    <div class="small text-primary fw-semibold mb-1">
                      ${esc(m.order)} &middot; ${esc(m.roleTitle)}
                    </div>
                    <h3 class="h5 fw-bold text-dark mb-2">${esc(m.name)}</h3>
                    <p class="text-muted small mb-3" style="line-height: 1.6;">${esc(m.bio)}</p>

                    <div class="pt-3 mt-auto border-top">
                      <div class="small fw-semibold text-dark mb-2">Key Contributions</div>
                      <ul class="list-unstyled small text-muted d-flex flex-column gap-1 mb-3">
                        ${m.contributions
                          .slice(0, 2)
                          .map((c) => `<li>&ndash; ${esc(c)}</li>`)
                          .join('')}
                      </ul>

                      <div class="d-flex align-items-center justify-content-between gap-2 pt-2">
                        <div class="d-flex align-items-center gap-2">
                          ${m.socials
                            .map(
                              (s) => `
                                <a href="${esc(s.href)}"
                                   class="team-social-link"
                                   aria-label="${esc(m.name)} ${esc(s.label)}"
                                   title="${esc(s.label)}"
                                   ${s.external ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                                  <i class="bi ${esc(s.icon)}"></i>
                                </a>
                              `
                            )
                            .join('')}
                        </div>
                        <button type="button"
                          class="btn btn-sm btn-outline-navy text-nowrap"
                          data-open-member="${esc(m.id)}">
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            `
            )
            .join('')}
        </div>
      </div>
    </section>

    <section id="our-roles" class="py-5">
      <div class="container py-3">
        <div class="mb-4 team-reveal" style="--stagger: 1;">
          <div class="text-primary fw-semibold small mb-1">Responsibility Matrix</div>
          <h2 class="fw-bold mb-2 headline-balance">02. Our Roles</h2>
          <p class="text-muted mb-0" style="max-width: 640px;">
            Every stage of QuickResolve &mdash; from initial concept and engineering to accuracy testing and interface review &mdash; is owned by a dedicated team member.
          </p>
        </div>

        <div class="row g-4">
          ${TEAM_MEMBERS.map(
            (m, idx) => `
              <div class="col-md-6 team-reveal" style="--stagger: ${idx + 1};">
                <div class="team-role-row d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <span class="small fw-semibold text-primary">${esc(m.order)}. ${esc(m.responsibilityTag)}</span>
                      <span class="small text-muted">${esc(m.roleTitle)}</span>
                    </div>
                    <h3 class="h5 fw-bold text-dark mb-2">${esc(m.name)}</h3>
                    <p class="text-muted small mb-3" style="line-height: 1.65;">${esc(m.roleSummary)}</p>
                  </div>
                  <div class="pt-3 border-top d-flex align-items-center justify-content-between">
                    <span class="small text-muted">${m.contributions.length} core deliverables</span>
                    <button type="button" class="btn btn-sm btn-light border text-nowrap" data-open-member="${esc(m.id)}">
                      Read Full Contributions
                    </button>
                  </div>
                </div>
              </div>
            `
          ).join('')}
        </div>
      </div>
    </section>

    <section class="py-5 bg-white border-top">
      <div class="container py-3">
        <div class="rounded-4 p-4 p-md-5 text-white team-reveal"
             style="background: linear-gradient(135deg, #071538 0%, #0B1F4D 60%, #1B3F91 100%); --stagger: 1;">
          <div class="row align-items-center g-4">
            <div class="col-lg-8">
              <div class="small fw-semibold text-info mb-2">03. Our Mission</div>
              <h2 class="fw-bold mb-3 headline-balance">Transparency, Accountability, and Timely Resolutions</h2>
              <p class="text-white-50 mb-0 fs-6" style="line-height: 1.75; max-width: 720px;">
                To simplify the complaint resolution process by providing students with an easy-to-use platform to raise concerns, enabling administrators to manage issues efficiently, and ensuring transparency, accountability, and timely resolutions.
              </p>
            </div>
            <div class="col-lg-4 d-flex flex-lg-column align-items-start align-items-lg-end justify-content-lg-center gap-3">
              <button type="button" class="btn btn-light btn-lg fw-semibold text-primary px-4 text-nowrap" data-nav="${user ? defaultDashboardFor(user) : 'login'}">
                ${user ? 'Open Your Portal' : 'Get Started'}
              </button>
              <a href="#" class="text-white-50 small text-decoration-none" data-nav="landing">Return to Overview &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="py-4 text-muted small border-top bg-light">
      <div class="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
        <div>
          &copy; 2026 QuickResolve &mdash; Student Complaint Management System.
        </div>
        <div class="d-flex flex-wrap align-items-center gap-3">
          <a href="#" class="text-decoration-none text-muted fw-medium" data-nav="landing">Home</a>
          <span class="text-secondary">&bull;</span>
          <a href="#team" class="text-decoration-none text-muted fw-medium" data-nav="team">Our Team</a>
          <span class="text-secondary">&bull;</span>
          <a href="#terms" class="text-decoration-none text-muted fw-medium" data-nav="terms">Terms &amp; Conditions</a>
          <span class="text-secondary">&bull;</span>
          <a href="#privacy" class="text-decoration-none text-muted fw-medium" data-nav="privacy">Privacy Policy</a>
        </div>
      </div>
    </footer>
  `;
}

function renderSidebarLinks(user: UserProfileDoc): string {
  const p = state.page;
  if (isAdminOrMain(user)) {
    const mainAdminLink = isMainAdmin(user)
      ? `<li><a href="#" class="sidebar-link ${p === 'manage-users' ? 'active' : ''}" data-nav="manage-users"><i class="bi bi-person-badge-fill"></i><span>User &amp; Role Management</span></a></li>`
      : '';
    return `
      ${mainAdminLink}
      <li><a href="#" class="sidebar-link ${p === 'admin-dashboard' ? 'active' : ''}" data-nav="admin-dashboard"><i class="bi bi-grid-1x2-fill"></i><span>Dashboard</span></a></li>
      <li><a href="#" class="sidebar-link ${p === 'manage-complaints' ? 'active' : ''}" data-nav="manage-complaints"><i class="bi bi-kanban-fill"></i><span>Manage Complaints</span></a></li>
      <li><a href="#" class="sidebar-link ${p === 'manage-students' ? 'active' : ''}" data-nav="manage-students"><i class="bi bi-people-fill"></i><span>Registered Students</span></a></li>
      ${
        isMainAdmin(user)
          ? `
        <li class="mt-2 pt-2 border-top border-light border-opacity-10">
          <a href="#" class="sidebar-link ${p === 'submit-complaint' ? 'active' : ''}" data-nav="submit-complaint"><i class="bi bi-plus-circle-fill"></i><span>Submit Complaint</span></a>
        </li>`
          : ''
      }
      <li class="mt-2 pt-2 border-top border-light border-opacity-10">
        <a href="#" class="sidebar-link ${p === 'profile' ? 'active' : ''}" data-nav="profile"><i class="bi bi-person-gear"></i><span>My Profile</span></a>
      </li>
    `;
  }
  return `
    <li><a href="#" class="sidebar-link ${p === 'student-dashboard' ? 'active' : ''}" data-nav="student-dashboard"><i class="bi bi-grid-1x2-fill"></i><span>Dashboard</span></a></li>
    <li><a href="#" class="sidebar-link ${p === 'submit-complaint' ? 'active' : ''}" data-nav="submit-complaint"><i class="bi bi-plus-circle-fill"></i><span>Submit Complaint</span></a></li>
    <li><a href="#" class="sidebar-link ${p === 'my-complaints' ? 'active' : ''}" data-nav="my-complaints"><i class="bi bi-journal-text"></i><span>My Complaints</span></a></li>
    <li class="mt-3 pt-2 border-top border-light border-opacity-10">
      <a href="#" class="sidebar-link ${p === 'profile' ? 'active' : ''}" data-nav="profile"><i class="bi bi-person-gear"></i><span>My Profile</span></a>
    </li>
  `;
}

function renderMobileBottomNav(user: UserProfileDoc): string {
  const p = state.page;
  const items: { page: PageKey; icon: string; label: string }[] = isMainAdmin(user)
    ? [
        { page: 'admin-dashboard', icon: 'bi-grid-1x2-fill', label: 'Overview' },
        { page: 'manage-complaints', icon: 'bi-kanban-fill', label: 'Complaints' },
        { page: 'manage-users', icon: 'bi-person-badge-fill', label: 'Users' },
        { page: 'profile', icon: 'bi-person-gear', label: 'Profile' },
      ]
    : isAdminOrMain(user)
      ? [
          { page: 'admin-dashboard', icon: 'bi-grid-1x2-fill', label: 'Overview' },
          { page: 'manage-complaints', icon: 'bi-kanban-fill', label: 'Complaints' },
          { page: 'manage-students', icon: 'bi-people-fill', label: 'Students' },
          { page: 'profile', icon: 'bi-person-gear', label: 'Profile' },
        ]
      : [
          { page: 'student-dashboard', icon: 'bi-grid-1x2-fill', label: 'Home' },
          { page: 'submit-complaint', icon: 'bi-plus-circle-fill', label: 'Submit' },
          { page: 'my-complaints', icon: 'bi-journal-text', label: 'History' },
          { page: 'profile', icon: 'bi-person-gear', label: 'Profile' },
        ];

  return `
    <nav class="mobile-bottom-nav" aria-label="Mobile quick navigation">
      ${items
        .map(
          (item) => `
            <button type="button" class="mobile-bottom-nav-btn ${p === item.page ? 'active' : ''}" data-nav="${item.page}">
              <i class="bi ${item.icon}"></i>
              <span>${item.label}</span>
            </button>
          `
        )
        .join('')}
    </nav>
  `;
}

function renderDashboardShell(title: string, subtitle: string, bodyHtml: string): string {
  const user = state.currentUser!;
  const links = renderSidebarLinks(user);
  const sectionLabel = isMainAdmin(user)
    ? 'Main Administration'
    : isAdminOrMain(user)
      ? 'Administration'
      : 'Student Workspace';
  return `
    <div class="app-shell">
      <aside class="app-sidebar">
        <a href="#" class="sidebar-brand" data-nav="landing">
          ${LOGO_SVG}
          <div>
            <div class="fw-bold fs-6 lh-sm">QuickResolve</div>
            <div class="small text-white-50" style="font-size: 0.72rem;">Campus Grievance Portal</div>
          </div>
        </a>
        <div class="sidebar-section-label">${sectionLabel}</div>
        <ul class="sidebar-nav">${links}</ul>
        <div class="sidebar-footer">
          <div class="d-flex align-items-center gap-2 mb-3">
            <div class="user-avatar bg-primary">${initials(user.name)}</div>
            <div class="min-w-0">
              <div class="fw-semibold text-white text-truncate small">${esc(user.name)}</div>
              <div class="text-white-50 text-truncate" style="font-size: 0.74rem;">${esc(roleLabel(user.role))}</div>
            </div>
          </div>
          <button type="button" id="btnSignOut" class="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center gap-2">
            <i class="bi bi-box-arrow-right"></i><span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div class="offcanvas offcanvas-start mobile-sidebar" tabindex="-1" id="mobileSidebar">
        <div class="offcanvas-header border-bottom border-light border-opacity-10">
          <div class="d-flex align-items-center gap-2">${LOGO_SVG}<span class="fw-bold">QuickResolve</span></div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
        </div>
        <div class="offcanvas-body d-flex flex-column p-3">
          <ul class="list-unstyled flex-grow-1 mb-3">${links}</ul>
          <button type="button" id="btnSignOutMobile" class="btn btn-outline-light btn-sm w-100">
            <i class="bi bi-box-arrow-right me-1"></i> Sign Out
          </button>
        </div>
      </div>

      <div class="app-main">
        <header class="app-topbar">
          <div class="d-flex align-items-center gap-2 gap-md-3 min-w-0">
            <button class="btn btn-outline-secondary d-lg-none btn-sm flex-shrink-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar" aria-label="Open menu">
              <i class="bi bi-list fs-5"></i>
            </button>
            <div class="min-w-0">
              <h1 class="h5 mb-0 fw-bold text-dark text-truncate">${esc(title)}</h1>
              <div class="text-muted small d-none d-sm-block text-truncate">${esc(subtitle)}</div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2 gap-md-3 flex-shrink-0">
            ${
              user.role === 'STUDENT' || isMainAdmin(user)
                ? `<button type="button" class="btn btn-navy btn-sm d-none d-md-inline-flex align-items-center gap-1" data-nav="submit-complaint"><i class="bi bi-plus-lg"></i><span>New Complaint</span></button>`
                : ''
            }
            <a href="#" data-nav="profile" class="d-flex align-items-center gap-2 text-decoration-none text-dark">
              <div class="user-avatar">${initials(user.name)}</div>
              <div class="d-none d-sm-block text-start">
                <div class="fw-semibold small lh-sm">${esc(user.name)}</div>
                <div class="text-muted" style="font-size: 0.72rem;">${esc(user.email)}</div>
              </div>
            </a>
          </div>
        </header>
        <main class="app-content">
          ${renderFlash()}
          ${bodyHtml}
        </main>
        ${renderMobileBottomNav(user)}
      </div>
    </div>
  `;
}

function filterStudentComplaints(userId: string, query: string, statusFilter = 'ALL'): ComplaintDoc[] {
  const q = query.trim().toLowerCase();
  return state.complaints.filter((c) => {
    if (c.userId !== userId) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (q) {
      const searchable = `${c.refCode} ${c.title} ${c.category} ${c.description} ${c.status} ${c.adminRemarks || ''}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });
}

function getStudentDashboardDisplayData(userId: string) {
  const mine = state.complaints.filter((c) => c.userId === userId);
  const q = state.studentSearch.trim();
  const hasQuery = q.length > 0;
  const matching = hasQuery ? filterStudentComplaints(userId, q, 'ALL') : mine;
  const rows = hasQuery ? matching : mine.slice(0, 5);
  return { mine, q, hasQuery, matching, rows };
}

function renderStudentDashboardMeta(totalMine: number, matchCount: number, hasQuery: boolean): string {
  if (hasQuery) {
    return `${matchCount} ${matchCount === 1 ? 'complaint' : 'complaints'} found matching your search`;
  }
  if (totalMine === 0) {
    return 'Your latest submitted campus grievances (saved in Firestore)';
  }
  if (totalMine > 5) {
    return `Showing latest 5 of ${totalMine} complaints &bull; Search to filter full history`;
  }
  return 'Your latest submitted campus grievances (saved in Firestore)';
}

function renderStudentDashboardRows(rows: ComplaintDoc[], totalMine: number, query: string): string {
  if (totalMine === 0) {
    return '<tr class="qr-row-animate" style="--qr-row: 0;"><td colspan="7" class="text-center py-5 text-muted">No complaints submitted yet. Click Submit Complaint to file your first issue.</td></tr>';
  }
  if (rows.length === 0) {
    return `<tr class="qr-row-animate" style="--qr-row: 0;"><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-search me-2"></i>No complaints matching &ldquo;${esc(query)}&rdquo;. Try another title or keyword.</td></tr>`;
  }
  return rows
    .map(
      (c, idx) => `
        <tr class="qr-row-animate" style="--qr-row: ${Math.min(idx, 8)};">
          <td class="fw-semibold text-muted">${esc(c.refCode)}</td>
          <td style="max-width: 300px;">
            <div class="fw-semibold text-dark text-truncate">${esc(c.title)}</div>
            <div class="text-muted small text-truncate">${esc(c.description)}</div>
          </td>
          <td>${esc(c.category)}</td>
          <td>${proofBadge(Boolean(c.proofImage))}</td>
          <td>${statusBadge(c.status)}</td>
          <td class="text-muted small">${esc(formatFirestoreDate(c.createdAt))}</td>
          <td class="text-end">
            <button type="button" class="btn btn-sm btn-light border" data-open-detail="${esc(c.id)}">
              <i class="bi bi-eye me-1"></i>Details
            </button>
          </td>
        </tr>`
    )
    .join('');
}

function renderStudentDashboardMobileCards(rows: ComplaintDoc[], totalMine: number, query: string): string {
  if (totalMine === 0) {
    return '<div class="text-center py-4 px-3 text-muted small qr-row-animate">No complaints submitted yet. Tap Submit Complaint to file your first issue.</div>';
  }
  if (rows.length === 0) {
    return `<div class="text-center py-4 px-3 text-muted small qr-row-animate"><i class="bi bi-search me-2"></i>No complaints matching &ldquo;${esc(query)}&rdquo;.</div>`;
  }
  return rows
    .map(
      (c, idx) => `
        <div class="mobile-complaint-card qr-row-animate" style="--qr-row: ${Math.min(idx, 8)};">
          <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span class="small fw-semibold text-muted tabular-nums">${esc(c.refCode)} &middot; ${esc(c.category)}</span>
            ${statusBadge(c.status)}
          </div>
          <div class="fw-bold text-dark mb-1">${esc(c.title)}</div>
          <div class="text-muted small mb-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${esc(c.description)}
          </div>
          <div class="d-flex align-items-center justify-content-between gap-2 pt-2 border-top">
            <div class="d-flex align-items-center gap-2 small text-muted">
              ${proofBadge(Boolean(c.proofImage))}
              <span>${esc(formatFirestoreDate(c.createdAt))}</span>
            </div>
            <button type="button" class="btn btn-sm btn-outline-navy" data-open-detail="${esc(c.id)}">
              <i class="bi bi-eye me-1"></i>Details
            </button>
          </div>
        </div>`
    )
    .join('');
}

function renderStudentDashboard(): string {
  const user = state.currentUser!;
  const { mine, q, hasQuery, matching, rows } = getStudentDashboardDisplayData(user.uid);
  const pending = mine.filter((c) => c.status === 'Pending').length;
  const inProg = mine.filter((c) => c.status === 'In Progress').length;
  const resolved = mine.filter((c) => c.status === 'Resolved').length;

  const body = `
    <div class="saas-card p-3 p-md-4 mb-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 qr-animate-in"
         style="--qr-stagger: 0; background: linear-gradient(120deg, #0B1F4D 0%, #1B3F91 100%); color: #fff;">
      <div>
        <h4 class="fw-bold mb-1">Welcome back, ${esc(user.name)}!</h4>
        <p class="text-white-50 mb-0 small">Track your submitted complaints or report a new campus issue with photo proof.</p>
      </div>
      <div class="d-flex flex-wrap gap-2 flex-shrink-0">
        <button type="button" class="btn btn-light fw-semibold text-primary flex-grow-1 flex-sm-grow-0" data-nav="submit-complaint">
          <i class="bi bi-plus-circle-fill me-1"></i> Submit Complaint
        </button>
        <button type="button" class="btn btn-outline-light fw-semibold flex-grow-1 flex-sm-grow-0" data-nav="my-complaints">View All</button>
      </div>
    </div>

    <div class="row g-3 g-md-4 mb-4">
      <div class="col-6 col-xl-3 qr-animate-in" style="--qr-stagger: 1;"><div class="stat-card"><div class="stat-label mb-2">Total Submitted</div><div class="stat-value tabular-nums">${mine.length}</div></div></div>
      <div class="col-6 col-xl-3 qr-animate-in" style="--qr-stagger: 2;"><div class="stat-card"><div class="stat-label mb-2">Pending</div><div class="stat-value tabular-nums">${pending}</div></div></div>
      <div class="col-6 col-xl-3 qr-animate-in" style="--qr-stagger: 3;"><div class="stat-card"><div class="stat-label mb-2">In Progress</div><div class="stat-value tabular-nums">${inProg}</div></div></div>
      <div class="col-6 col-xl-3 qr-animate-in" style="--qr-stagger: 4;"><div class="stat-card"><div class="stat-label mb-2">Resolved</div><div class="stat-value tabular-nums">${resolved}</div></div></div>
    </div>

    <div class="saas-card overflow-hidden qr-animate-in" style="--qr-stagger: 3;">
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 p-3 p-md-4 border-bottom">
        <div>
          <h5 class="fw-bold mb-0">Complaint History</h5>
          <div id="studentDashResultMeta" class="text-muted small">${renderStudentDashboardMeta(mine.length, matching.length, hasQuery)}</div>
        </div>
        <div class="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
          <form id="studentDashSearchForm" class="input-group qr-search-group flex-grow-1" style="width: 100%; min-width: 0; max-width: 340px;">
            <span class="input-group-text bg-white border-end-0 text-muted">
              <i class="bi bi-search"></i>
            </span>
            <input
              type="text"
              class="form-control border-start-0 ${hasQuery ? 'border-end-0' : ''}"
              id="studentDashSearchInput"
              value="${esc(state.studentSearch)}"
              placeholder="Search by title or keyword..."
              aria-label="Search complaints by title or keyword"
            />
            <button
              type="button"
              id="btnClearStudentDashSearch"
              class="btn btn-outline-secondary border-start-0 ${hasQuery ? '' : 'd-none'}"
              title="Clear search"
              aria-label="Clear search"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </form>
          <button type="button" class="btn btn-sm btn-outline-navy flex-shrink-0 py-2 px-3" data-nav="my-complaints">Full History</button>
        </div>
      </div>

      <div class="d-md-none p-3 d-flex flex-column gap-3" id="studentDashMobileList">
        ${renderStudentDashboardMobileCards(rows, mine.length, q)}
      </div>

      <div class="table-responsive d-none d-md-block">
        <table class="table table-modern mb-0">
          <thead>
            <tr><th>ID</th><th>Title</th><th>Category</th><th>Proof</th><th>Status</th><th>Submitted</th><th class="text-end">Action</th></tr>
          </thead>
          <tbody id="studentDashTableBody">
            ${renderStudentDashboardRows(rows, mine.length, q)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return renderDashboardShell('Student Dashboard', 'Overview of your campus complaints and resolution progress', body);
}

function renderSubmitComplaint(): string {
  const body = `
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="saas-card p-4">
          <h5 class="fw-bold mb-1">Complaint Details &amp; Proof</h5>
          <p class="text-muted small mb-4">All fields marked with <span class="text-danger">*</span> are required. Saved permanently to Firestore.</p>
          <form id="submitComplaintForm" class="needs-validation" novalidate>
            <div class="mb-3">
              <label for="cTitle" class="form-label">Complaint Title <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="cTitle" placeholder="e.g. Broken AC unit in Computer Lab 3" minlength="5" maxlength="150" required />
            </div>
            <div class="mb-3">
              <label for="cCategory" class="form-label">Category <span class="text-danger">*</span></label>
              <select class="form-select" id="cCategory" required>
                <option value="">Select a category...</option>
                ${CATEGORIES.map((cat) => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('')}
              </select>
            </div>
            <div class="mb-3">
              <label for="cDescription" class="form-label">Detailed Description <span class="text-danger">*</span></label>
              <textarea class="form-control" id="cDescription" rows="5" minlength="15" maxlength="2000"
                        placeholder="Include exact location (building/room/hostel), when the issue started, and how it affects students..." required></textarea>
            </div>

            <div class="mb-4 p-3 rounded-3 border bg-light">
              <label for="cProofImage" class="form-label d-flex align-items-center gap-2">
                <i class="bi bi-camera-fill text-primary"></i>
                <span>Upload Proof Image <span class="text-danger">*</span></span>
              </label>
              <input type="file" class="form-control" id="cProofImage" accept="image/jpeg,image/png,image/webp,image/gif" required />
              <div class="form-text">Attach a clear photo showing the campus issue (JPG, PNG, WEBP, or GIF &bull; auto-optimized for cloud storage).</div>
              <div id="cProofError" class="alert alert-danger py-2 px-3 small mt-2 mb-0 d-none"></div>
              <div id="cProofPreviewWrap" class="mt-3 p-3 bg-white rounded-3 border text-center d-none">
                <div class="small fw-semibold text-muted mb-2">Selected Proof: <span id="cProofFileName" class="text-dark"></span></div>
                <img id="cProofPreviewImg" alt="Proof Preview" class="img-fluid rounded-2" style="max-height: 240px; object-fit: contain;" />
              </div>
            </div>

            <div class="d-flex flex-wrap gap-2">
              <button type="submit" id="btnSubmitComplaint" class="btn btn-navy px-4"><i class="bi bi-send-fill me-2"></i>Submit Complaint</button>
              <button type="button" class="btn btn-light border px-4" data-nav="student-dashboard">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="saas-card p-4 mb-3">
          <h6 class="fw-bold mb-3"><i class="bi bi-lightbulb text-warning me-2"></i>Tips for Faster Resolution</h6>
          <ul class="small text-muted d-flex flex-column gap-2 ps-3 mb-0">
            <li>Specify the exact building, floor, lab, or hostel room number.</li>
            <li>Attach a clear, well-lit photo so maintenance or IT teams can verify the issue immediately.</li>
            <li>Choose the closest category so it reaches the right campus department.</li>
          </ul>
        </div>
        <div class="saas-card p-4">
          <h6 class="fw-bold mb-2"><i class="bi bi-shield-check text-primary me-2"></i>Privacy &amp; Persistence</h6>
          <p class="small text-muted mb-0">Your complaint and proof photo are stored safely in Firebase Firestore and visible only to you and authorized campus administrators.</p>
        </div>
      </div>
    </div>
  `;
  return renderDashboardShell('Submit a Complaint', 'Describe the campus issue and attach a clear photo as proof', body);
}

function renderMyComplaints(): string {
  const user = state.currentUser!;
  const filtered = filterStudentComplaints(user.uid, state.studentSearch, state.studentStatusFilter);

  const body = `
    <div class="saas-card p-3 mb-4 qr-animate-in" style="--qr-stagger: 0;">
      <form id="studentFilterForm" class="row g-2 align-items-center">
        <div class="col-md-6">
          <input type="text" class="form-control" id="studentSearchInput" value="${esc(state.studentSearch)}" placeholder="Search by title, category, or keywords..." />
        </div>
        <div class="col-md-3">
          <select id="studentStatusSelect" class="form-select">
            <option value="ALL" ${state.studentStatusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
            <option value="Pending" ${state.studentStatusFilter === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="In Progress" ${state.studentStatusFilter === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Resolved" ${state.studentStatusFilter === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </div>
        <div class="col-md-3 d-flex gap-2">
          <button type="submit" class="btn btn-navy flex-grow-1">Apply Filter</button>
          <button type="button" id="btnResetStudentFilter" class="btn btn-light border">Reset</button>
        </div>
      </form>
    </div>

    <div class="saas-card overflow-hidden qr-animate-in" style="--qr-stagger: 1;">
      <div class="d-flex align-items-center justify-content-between p-3 p-md-4 border-bottom">
        <h5 class="fw-bold mb-0">Complaint History</h5>
        <button type="button" class="btn btn-sm btn-navy" data-nav="submit-complaint"><i class="bi bi-plus-lg me-1"></i> New Complaint</button>
      </div>
      <div class="d-md-none p-3 d-flex flex-column gap-3">
        ${
          filtered.length === 0
            ? '<div class="text-center py-4 text-muted small">No matching complaints found.</div>'
            : filtered
                .map(
                  (c, idx) => `
                  <div class="mobile-complaint-card qr-row-animate" style="--qr-row: ${Math.min(idx, 8)};">
                    <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <span class="small fw-semibold text-muted tabular-nums">${esc(c.refCode)} &middot; ${esc(c.category)}</span>
                      ${statusBadge(c.status)}
                    </div>
                    <div class="fw-bold text-dark mb-1">${esc(c.title)}</div>
                    <div class="text-muted small mb-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      ${esc(c.description)}
                    </div>
                    <div class="d-flex align-items-center justify-content-between gap-2 pt-2 border-top">
                      <div class="d-flex align-items-center gap-2 small text-muted">
                        ${proofBadge(Boolean(c.proofImage))}
                        <span>${esc(formatFirestoreDate(c.updatedAt))}</span>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-navy" data-open-detail="${esc(c.id)}">
                        <i class="bi bi-eye me-1"></i>View
                      </button>
                    </div>
                  </div>`
                )
                .join('')
        }
      </div>
      <div class="table-responsive d-none d-md-block">
        <table class="table table-modern mb-0">
          <thead>
            <tr><th>Ref ID</th><th>Title &amp; Description</th><th>Category</th><th>Proof</th><th>Status</th><th>Updated</th><th class="text-end">Details</th></tr>
          </thead>
          <tbody>
            ${
              filtered.length === 0
                ? '<tr><td colspan="7" class="text-center py-5 text-muted">No matching complaints found.</td></tr>'
                : filtered
                    .map(
                      (c, idx) => `
                  <tr class="qr-row-animate" style="--qr-row: ${Math.min(idx, 8)};">
                    <td class="fw-semibold text-muted">${esc(c.refCode)}</td>
                    <td style="max-width:320px;">
                      <div class="fw-semibold text-dark text-truncate">${esc(c.title)}</div>
                      <div class="text-muted small text-truncate">${esc(c.description)}</div>
                    </td>
                    <td>${esc(c.category)}</td>
                    <td>${proofBadge(Boolean(c.proofImage))}</td>
                    <td>${statusBadge(c.status)}</td>
                    <td class="text-muted small">${esc(formatFirestoreDate(c.updatedAt))}</td>
                    <td class="text-end">
                      <button type="button" class="btn btn-sm btn-outline-navy" data-open-detail="${esc(c.id)}">
                        <i class="bi bi-eye me-1"></i>View
                      </button>
                    </td>
                  </tr>`
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>

    ${renderEmailNotificationsPanel(false)}
  `;

  return renderDashboardShell('My Complaints', 'Search, filter, and track every grievance you have submitted', body);
}

function renderEmailNotificationsPanel(isAdminView: boolean): string {
  const list = isAdminView
    ? state.emailNotifications
    : state.emailNotifications.filter((n) => n.studentUserId === state.currentUser?.uid);
  const gmailReady = hasGmailAccessToken();

  return `
    <div class="saas-card overflow-hidden mt-4">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 p-4 border-bottom">
        <div>
          <h5 class="fw-bold mb-0"><i class="bi bi-envelope-paper-fill text-primary me-2"></i>Email Notification Log</h5>
          <div class="text-muted small">
            Automatic Gmail notifications triggered when complaints are updated to <strong>In Progress</strong> or <strong>Resolved</strong>.
          </div>
        </div>
        ${
          isAdminView
            ? gmailReady
              ? '<span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-semibold"><i class="bi bi-check-circle-fill me-1"></i>Gmail Connected</span>'
              : '<button type="button" id="btnConnectGmail" class="btn btn-sm btn-outline-navy"><i class="bi bi-google me-1"></i>Authorize Gmail Sending</button>'
            : ''
        }
      </div>
      <div class="table-responsive">
        <table class="table table-modern mb-0">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Recipient</th>
              <th>Status Trigger</th>
              <th>Subject</th>
              <th>Delivery</th>
              <th>Date</th>
              ${isAdminView ? '<th class="text-end">Action</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${
              list.length === 0
                ? `<tr><td colspan="${isAdminView ? 7 : 6}" class="text-center py-4 text-muted">No status email notifications triggered yet.</td></tr>`
                : list
                    .slice(0, 15)
                    .map(
                      (n) => `
                  <tr>
                    <td class="fw-semibold text-muted">${esc(n.refCode)}</td>
                    <td>
                      <div class="fw-medium small">${esc(n.studentName)}</div>
                      <div class="text-muted" style="font-size:0.75rem;">${esc(n.recipientEmail)}</div>
                    </td>
                    <td>${statusBadge(n.triggeredStatus)}</td>
                    <td style="max-width:280px;">
                      <div class="small fw-medium text-truncate">${esc(n.subject)}</div>
                      ${n.errorMessage ? `<div class="text-danger" style="font-size:0.74rem;">${esc(n.errorMessage)}</div>` : ''}
                    </td>
                    <td>${notifDeliveryBadge(n.deliveryStatus)}</td>
                    <td class="text-muted small">${esc(formatFirestoreDate(n.createdAt))}</td>
                    ${
                      isAdminView
                        ? `<td class="text-end">${
                            n.deliveryStatus !== 'SENT'
                              ? `<button type="button" class="btn btn-sm btn-outline-primary" data-open-retry-notif="${esc(n.id)}"><i class="bi bi-send me-1"></i>Send</button>`
                              : '<span class="text-muted small">&mdash;</span>'
                          }</td>`
                        : ''
                    }
                  </tr>`
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminDashboard(): string {
  const total = state.complaints.length;
  const pending = state.complaints.filter((c) => c.status === 'Pending').length;
  const inProg = state.complaints.filter((c) => c.status === 'In Progress').length;
  const resolved = state.complaints.filter((c) => c.status === 'Resolved').length;
  const withProof = state.complaints.filter((c) => Boolean(c.proofImage)).length;
  const studentCount = state.users.filter((u) => u.role === 'STUDENT').length;

  const catCounts = new Map<string, number>();
  state.complaints.forEach((c) => catCounts.set(c.category, (catCounts.get(c.category) || 0) + 1));

  const body = `
    <div class="row g-3 g-md-4 mb-4">
      <div class="col-6 col-lg-4 col-xl-2 qr-animate-in" style="--qr-stagger: 0;"><div class="stat-card"><div class="stat-label mb-2">Total Complaints</div><div class="stat-value tabular-nums">${total}</div></div></div>
      <div class="col-6 col-lg-4 col-xl-2 qr-animate-in" style="--qr-stagger: 1;"><div class="stat-card"><div class="stat-label mb-2 text-warning-emphasis">Pending</div><div class="stat-value tabular-nums text-warning-emphasis">${pending}</div></div></div>
      <div class="col-6 col-lg-4 col-xl-2 qr-animate-in" style="--qr-stagger: 2;"><div class="stat-card"><div class="stat-label mb-2 text-primary">In Progress</div><div class="stat-value tabular-nums text-primary">${inProg}</div></div></div>
      <div class="col-6 col-lg-4 col-xl-2 qr-animate-in" style="--qr-stagger: 3;"><div class="stat-card"><div class="stat-label mb-2 text-success">Resolved</div><div class="stat-value tabular-nums text-success">${resolved}</div></div></div>
      <div class="col-6 col-lg-4 col-xl-2 qr-animate-in" style="--qr-stagger: 4;"><div class="stat-card"><div class="stat-label mb-2">With Proof</div><div class="stat-value tabular-nums">${withProof}</div></div></div>
      <div class="col-6 col-lg-4 col-xl-2 qr-animate-in" style="--qr-stagger: 5;"><div class="stat-card"><div class="stat-label mb-2">Students</div><div class="stat-value tabular-nums">${studentCount}</div></div></div>
    </div>

    <div class="row g-4">
      <div class="col-xl-8 qr-animate-in" style="--qr-stagger: 2;">
        <div class="saas-card overflow-hidden h-100">
          <div class="d-flex align-items-center justify-content-between p-4 border-bottom">
            <div>
              <h5 class="fw-bold mb-0">Latest Student Submissions</h5>
              <div class="text-muted small">Click View to inspect proof images or jump to Manage Complaints</div>
            </div>
            <button type="button" class="btn btn-sm btn-navy" data-nav="manage-complaints">Manage All</button>
          </div>
          <div class="table-responsive">
            <table class="table table-modern mb-0">
              <thead><tr><th>ID</th><th>Complaint</th><th>Student</th><th>Proof</th><th>Status</th><th class="text-end">View</th></tr></thead>
              <tbody>
                ${
                  state.complaints.length === 0
                    ? '<tr><td colspan="6" class="text-center py-5 text-muted">No complaints recorded yet.</td></tr>'
                    : state.complaints
                        .slice(0, 6)
                        .map(
                          (c, idx) => `
                        <tr class="qr-row-animate" style="--qr-row: ${idx};">
                          <td class="fw-semibold text-muted">${esc(c.refCode)}</td>
                          <td><div class="fw-semibold text-dark">${esc(c.title)}</div><div class="text-muted small">${esc(c.category)}</div></td>
                          <td><div class="small fw-medium">${esc(c.studentName)}</div><div class="text-muted" style="font-size:0.75rem;">${esc(c.studentEmail)}</div></td>
                          <td>${proofBadge(Boolean(c.proofImage))}</td>
                          <td>${statusBadge(c.status)}</td>
                          <td class="text-end"><button type="button" class="btn btn-sm btn-light border" data-open-detail="${esc(c.id)}"><i class="bi bi-eye"></i></button></td>
                        </tr>`
                        )
                        .join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-xl-4 qr-animate-in" style="--qr-stagger: 3;">
        <div class="saas-card p-4 h-100">
          <h5 class="fw-bold mb-1">By Category</h5>
          <p class="text-muted small mb-4">Distribution across campus departments</p>
          <div class="d-flex flex-column gap-3">
            ${
              catCounts.size === 0
                ? '<div class="text-muted small">No categories to display yet.</div>'
                : Array.from(catCounts.entries())
                    .map(([cat, cnt]) => {
                      const pct = total > 0 ? Math.round((cnt * 100) / total) : 0;
                      return `
                        <div>
                          <div class="d-flex justify-content-between small mb-1">
                            <span class="fw-semibold text-dark">${esc(cat)}</span>
                            <span class="text-muted tabular-nums">${cnt}</span>
                          </div>
                          <div class="progress" style="height: 8px; border-radius: 999px;">
                            <div class="progress-bar bg-primary" style="width: ${pct}%;"></div>
                          </div>
                        </div>
                      `;
                    })
                    .join('')
            }
          </div>
          <hr class="my-4" />
          <div class="d-grid gap-2">
            <button type="button" class="btn btn-outline-navy btn-sm" data-nav="manage-complaints">Review All Complaints</button>
            <button type="button" class="btn btn-light border btn-sm" data-nav="manage-students">View Registered Students</button>
          </div>
        </div>
      </div>
    </div>
  `;

  return renderDashboardShell('Administrator Dashboard', 'Campus-wide grievance telemetry, proof verification & resolution metrics', body);
}

function renderManageComplaints(): string {
  const q = state.adminSearch.trim().toLowerCase();
  const filtered = state.complaints.filter((c) => {
    if (state.adminStatusFilter !== 'ALL' && c.status !== state.adminStatusFilter) return false;
    if (q) {
      const hay = `${c.refCode} ${c.title} ${c.category} ${c.description} ${c.studentName} ${c.studentEmail}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const body = `
    <div class="saas-card p-3 mb-4">
      <form id="adminFilterForm" class="row g-2 align-items-center">
        <div class="col-lg-6">
          <input type="text" class="form-control" id="adminSearchInput" value="${esc(state.adminSearch)}" placeholder="Search ID, title, student name or email..." />
        </div>
        <div class="col-sm-6 col-lg-3">
          <select id="adminStatusSelect" class="form-select">
            <option value="ALL" ${state.adminStatusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
            <option value="Pending" ${state.adminStatusFilter === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="In Progress" ${state.adminStatusFilter === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Resolved" ${state.adminStatusFilter === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </div>
        <div class="col-lg-3 d-flex gap-2">
          <button type="submit" class="btn btn-navy flex-grow-1">Filter</button>
          <button type="button" id="btnResetAdminFilter" class="btn btn-light border">Reset</button>
        </div>
      </form>
    </div>

    <div class="saas-card overflow-hidden qr-animate-in" style="--qr-stagger: 1;">
      <div class="d-md-none p-3 d-flex flex-column gap-3">
        ${
          filtered.length === 0
            ? '<div class="text-center py-4 text-muted small">No complaints match your current search or filter criteria.</div>'
            : filtered
                .map(
                  (c, idx) => `
                  <div class="mobile-complaint-card qr-row-animate" style="--qr-row: ${Math.min(idx, 8)};">
                    <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <span class="small fw-semibold text-muted tabular-nums">${esc(c.refCode)} &middot; ${esc(c.category)}</span>
                      ${statusBadge(c.status)}
                    </div>
                    <div class="fw-bold text-dark mb-1">${esc(c.title)}</div>
                    <div class="small text-muted mb-2">${esc(c.studentName)} &middot; ${esc(c.studentEmail)}</div>
                    <div class="d-flex align-items-center justify-content-between gap-2 pt-2 border-top">
                      <div class="d-flex align-items-center gap-2 small text-muted">
                        ${proofBadge(Boolean(c.proofImage))}
                        <span>${esc(formatFirestoreDate(c.createdAt))}</span>
                      </div>
                      <div class="d-flex gap-1">
                        <button type="button" class="btn btn-sm btn-light border" data-open-detail="${esc(c.id)}" title="View Details & Proof"><i class="bi bi-eye"></i></button>
                        <button type="button" class="btn btn-sm btn-outline-primary" data-open-status="${esc(c.id)}" title="Update Status"><i class="bi bi-pencil-square"></i></button>
                        <button type="button" class="btn btn-sm btn-outline-danger" data-open-delete="${esc(c.id)}" title="Delete"><i class="bi bi-trash3"></i></button>
                      </div>
                    </div>
                  </div>`
                )
                .join('')
        }
      </div>
      <div class="table-responsive d-none d-md-block">
        <table class="table table-modern mb-0">
          <thead>
            <tr><th>Ref</th><th>Complaint &amp; Category</th><th>Student</th><th>Proof</th><th>Status</th><th>Submitted</th><th class="text-end">Actions</th></tr>
          </thead>
          <tbody>
            ${
              filtered.length === 0
                ? '<tr><td colspan="7" class="text-center py-5 text-muted">No complaints match your current search or filter criteria.</td></tr>'
                : filtered
                    .map(
                      (c, idx) => `
                        <tr class="qr-row-animate" style="--qr-row: ${Math.min(idx, 8)};">
                          <td class="fw-semibold text-muted">${esc(c.refCode)}</td>
                          <td style="max-width:280px;"><div class="fw-semibold text-dark text-truncate">${esc(c.title)}</div><div class="text-muted small">${esc(c.category)}</div></td>
                          <td><div class="fw-medium small">${esc(c.studentName)}</div><div class="text-muted" style="font-size:0.75rem;">${esc(c.studentEmail)}</div></td>
                          <td>${proofBadge(Boolean(c.proofImage))}</td>
                          <td>${statusBadge(c.status)}</td>
                          <td class="text-muted small">${esc(formatFirestoreDate(c.createdAt))}</td>
                          <td class="text-end text-nowrap">
                            <button type="button" class="btn btn-sm btn-light border me-1" data-open-detail="${esc(c.id)}" title="View Details & Proof"><i class="bi bi-eye"></i></button>
                            <button type="button" class="btn btn-sm btn-outline-primary me-1" data-open-status="${esc(c.id)}" title="Update Status"><i class="bi bi-pencil-square"></i></button>
                            <button type="button" class="btn btn-sm btn-outline-danger" data-open-delete="${esc(c.id)}" title="Delete"><i class="bi bi-trash3"></i></button>
                          </td>
                        </tr>`
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>

    ${renderEmailNotificationsPanel(true)}
  `;

  return renderDashboardShell('Manage Complaints', 'Search, filter, inspect proof images, update resolution status, and notify students', body);
}

function renderManageStudents(): string {
  const students = state.users.filter((u) => u.role === 'STUDENT');
  const body = `
    <div class="saas-card overflow-hidden">
      <div class="d-flex align-items-center justify-content-between p-4 border-bottom">
        <div>
          <h5 class="fw-bold mb-0">Student Accounts</h5>
          <div class="text-muted small">All active student profiles stored in Firebase Firestore</div>
        </div>
        <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold">Total: ${students.length}</span>
      </div>
      <div class="table-responsive">
        <table class="table table-modern mb-0">
          <thead><tr><th>Student</th><th>Student ID</th><th>Department</th><th>Total Complaints</th><th>Open Cases</th><th>Joined</th></tr></thead>
          <tbody>
            ${
              students.length === 0
                ? '<tr><td colspan="6" class="text-center py-5 text-muted">No student accounts have signed in yet.</td></tr>'
                : students
                    .map((s) => {
                      const mine = state.complaints.filter((c) => c.userId === s.uid);
                      const open = mine.filter((c) => c.status !== 'Resolved').length;
                      return `
                        <tr>
                          <td>
                            <div class="d-flex align-items-center gap-2">
                              <div class="user-avatar" style="width:34px;height:34px;font-size:0.78rem;">${initials(s.name)}</div>
                              <div><div class="fw-semibold text-dark">${esc(s.name)}</div><div class="text-muted small">${esc(s.email)}</div></div>
                            </div>
                          </td>
                          <td>${esc(s.studentId || '—')}</td>
                          <td>${esc(s.department || '—')}</td>
                          <td class="fw-semibold tabular-nums">${mine.length}</td>
                          <td>${open > 0 ? `<span class="badge-status badge-status-pending">${open} Open</span>` : '<span class="badge-status badge-status-resolved">0 Open</span>'}</td>
                          <td class="text-muted small">${esc(formatFirestoreDate(s.createdAt))}</td>
                        </tr>
                      `;
                    })
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
  return renderDashboardShell('Registered Students', 'Directory of student accounts and their grievance activity', body);
}

function renderManageUsers(): string {
  const signedInEmails = new Set(state.users.map((u) => u.email.toLowerCase()));
  const pendingInvites = state.roleInvites.filter((inv) => !signedInEmails.has(inv.email.toLowerCase()));

  const totalAccounts = state.users.length + pendingInvites.length;
  const admins =
    state.users.filter((u) => u.role === 'ADMIN').length +
    pendingInvites.filter((i) => i.role === 'ADMIN').length;
  const students =
    state.users.filter((u) => u.role === 'STUDENT').length +
    pendingInvites.filter((i) => i.role === 'STUDENT').length;

  const body = `
    <div class="row g-3 g-md-4 mb-4">
      <div class="col-6 col-lg-3"><div class="stat-card"><div class="stat-label mb-2">Total Accounts &amp; IDs</div><div class="stat-value tabular-nums">${totalAccounts}</div></div></div>
      <div class="col-6 col-lg-3"><div class="stat-card"><div class="stat-label mb-2 text-primary">Assigned Admins</div><div class="stat-value tabular-nums text-primary">${admins}</div></div></div>
      <div class="col-6 col-lg-3"><div class="stat-card"><div class="stat-label mb-2 text-success">Students</div><div class="stat-value tabular-nums text-success">${students}</div></div></div>
      <div class="col-6 col-lg-3"><div class="stat-card"><div class="stat-label mb-2">Pending First Login</div><div class="stat-value tabular-nums">${pendingInvites.length}</div></div></div>
    </div>

    <div class="saas-card p-4 mb-4">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h5 class="fw-bold mb-0"><i class="bi bi-person-plus-fill text-primary me-2"></i>Create User ID &amp; Assign Role</h5>
          <div class="text-muted small">Pre-create an email ID and assign ADMIN or STUDENT. Saved permanently in Firebase; applied automatically on Google Sign-In.</div>
        </div>
        <span class="badge badge-role-main px-3 py-2 rounded-pill fw-semibold">Main Admin Exclusive</span>
      </div>

      <form id="mainAdminCreateUserForm" class="row g-3 needs-validation" novalidate>
        <div class="col-md-4">
          <label for="maNewName" class="form-label">Full Name <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="maNewName" placeholder="e.g. Prof. Rajesh Verma" minlength="2" maxlength="100" required />
        </div>
        <div class="col-md-4">
          <label for="maNewEmail" class="form-label">Google Email Address <span class="text-danger">*</span></label>
          <input type="email" class="form-control" id="maNewEmail" placeholder="name@gmail.com" maxlength="150" required />
        </div>
        <div class="col-md-4">
          <label for="maNewRole" class="form-label">Assign Role <span class="text-danger">*</span></label>
          <select class="form-select" id="maNewRole" required>
            <option value="STUDENT">STUDENT</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div class="col-md-4">
          <label for="maNewSid" class="form-label">Student / Staff ID</label>
          <input type="text" class="form-control" id="maNewSid" placeholder="e.g. ADM-102 or CS2026-05" maxlength="50" />
        </div>
        <div class="col-md-6">
          <label for="maNewDept" class="form-label">Department</label>
          <input type="text" class="form-control" id="maNewDept" placeholder="e.g. Hostel Affairs / Computer Science" maxlength="100" />
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <button type="submit" class="btn btn-navy w-100"><i class="bi bi-check2-circle me-1"></i> Create ID</button>
        </div>
      </form>
    </div>

    <div class="saas-card overflow-hidden">
      <div class="d-flex align-items-center justify-content-between p-4 border-bottom">
        <div>
          <h5 class="fw-bold mb-0">All Campus Accounts &amp; Assigned Roles</h5>
          <div class="text-muted small">All changes are saved immediately to Firebase Firestore.</div>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-modern mb-0">
          <thead>
            <tr><th>User</th><th>ID &amp; Department</th><th>Status</th><th>Current Role</th><th>Assign Role</th><th class="text-end">Delete</th></tr>
          </thead>
          <tbody>
            ${state.users
              .map((u) => {
                const isRoot = u.role === 'MAIN_ADMIN';
                const assignCol = isRoot
                  ? '<span class="text-muted small fst-italic">Primary Root Account</span>'
                  : `
                    <div class="d-flex align-items-center gap-2">
                      <select class="form-select form-select-sm" data-user-role-select="${esc(u.uid)}" style="width:126px;">
                        <option value="STUDENT" ${u.role === 'STUDENT' ? 'selected' : ''}>STUDENT</option>
                        <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                      </select>
                      <button type="button" class="btn btn-sm btn-outline-navy" data-save-user-role="${esc(u.uid)}">Save</button>
                    </div>
                  `;
                const deleteCol = isRoot
                  ? '<span class="text-muted small">&mdash;</span>'
                  : `<button type="button" class="btn btn-sm btn-outline-danger" data-delete-user="${esc(u.uid)}" title="Delete User"><i class="bi bi-trash3"></i></button>`;
                return `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="user-avatar" style="width:36px;height:36px;font-size:0.78rem;">${initials(u.name)}</div>
                        <div><div class="fw-semibold text-dark">${esc(u.name)}</div><div class="text-muted small">${esc(u.email)}</div></div>
                      </div>
                    </td>
                    <td>
                      <div class="small fw-medium">${esc(u.studentId || '—')}</div>
                      <div class="text-muted" style="font-size:0.76rem;">${esc(u.department || '—')}</div>
                    </td>
                    <td><span class="badge bg-success-subtle text-success border border-success-subtle fw-semibold"><i class="bi bi-google me-1"></i>Active</span></td>
                    <td>${roleBadge(u.role)}</td>
                    <td>${assignCol}</td>
                    <td class="text-end">${deleteCol}</td>
                  </tr>
                `;
              })
              .join('')}
            ${pendingInvites
              .map(
                (inv) => `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="user-avatar bg-secondary" style="width:36px;height:36px;font-size:0.78rem;">${initials(inv.name)}</div>
                        <div><div class="fw-semibold text-dark">${esc(inv.name)}</div><div class="text-muted small">${esc(inv.email)}</div></div>
                      </div>
                    </td>
                    <td>
                      <div class="small fw-medium">${esc(inv.studentId || '—')}</div>
                      <div class="text-muted" style="font-size:0.76rem;">${esc(inv.department || '—')}</div>
                    </td>
                    <td><span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-semibold">Awaiting Sign-In</span></td>
                    <td>${roleBadge(inv.role)}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <select class="form-select form-select-sm" data-invite-role-select="${esc(inv.id)}" style="width:126px;">
                          <option value="STUDENT" ${inv.role === 'STUDENT' ? 'selected' : ''}>STUDENT</option>
                          <option value="ADMIN" ${inv.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                        </select>
                        <button type="button" class="btn btn-sm btn-outline-navy" data-save-invite-role="${esc(inv.id)}">Save</button>
                      </div>
                    </td>
                    <td class="text-end">
                      <button type="button" class="btn btn-sm btn-outline-danger" data-delete-invite="${esc(inv.id)}" title="Delete ID">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return renderDashboardShell(
    'User & Role Management',
    'Main Admin control center to create user IDs and assign ADMIN or STUDENT roles',
    body
  );
}

function renderProfile(): string {
  const user = state.currentUser!;
  const body = `
    <div class="row g-4">
      <div class="col-lg-4">
        <div class="saas-card p-4 text-center">
          <div class="user-avatar mx-auto mb-3" style="width:72px;height:72px;font-size:1.5rem;border-radius:18px;">${initials(user.name)}</div>
          <h5 class="fw-bold mb-1">${esc(user.name)}</h5>
          <div class="text-muted small mb-2">${esc(user.email)}</div>
          <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-3">${esc(roleLabel(user.role))}</span>
          <hr class="my-3" />
          <div class="text-start small d-flex flex-column gap-2">
            <div class="d-flex justify-content-between"><span class="text-muted">Sign-In Method</span><span class="fw-semibold">Google Sign-In</span></div>
            <div class="d-flex justify-content-between"><span class="text-muted">Student / Staff ID</span><span class="fw-semibold">${esc(user.studentId || '—')}</span></div>
            <div class="d-flex justify-content-between"><span class="text-muted">Department</span><span class="fw-semibold">${esc(user.department || '—')}</span></div>
            <div class="d-flex justify-content-between"><span class="text-muted">Member Since</span><span class="fw-semibold">${esc(formatFirestoreDate(user.createdAt))}</span></div>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="saas-card p-4">
          <h5 class="fw-bold mb-1">Personal Information</h5>
          <p class="text-muted small mb-3">Update your display name, ID, or academic department. Saved permanently in Firebase.</p>
          <form id="profileUpdateForm">
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" id="profName" value="${esc(user.name)}" minlength="2" maxlength="100" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-control bg-light" value="${esc(user.email)}" readonly />
              </div>
            </div>
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label">Student / Staff ID</label>
                <input type="text" class="form-control" id="profSid" value="${esc(user.studentId)}" maxlength="50" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Department</label>
                <input type="text" class="form-control" id="profDept" value="${esc(user.department)}" maxlength="100" />
              </div>
            </div>
            <button type="submit" class="btn btn-navy">Save Profile Changes</button>
          </form>
        </div>
      </div>
    </div>
  `;
  return renderDashboardShell('Account Profile', 'Manage your personal information and Firebase account profile', body);
}

function renderModals(): string {
  return `
    <!-- Complaint Detail Modal -->
    <div class="modal fade" id="previewDetailModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-fullscreen-sm-down modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg" style="border-radius:16px;">
          <div class="modal-header border-bottom px-4 py-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-light text-dark border fw-semibold" id="mDetId"></span>
                <span id="mDetStatus"></span>
              </div>
              <h5 class="modal-title fw-bold" id="mDetTitle"></h5>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-3 mb-3">
              <div class="col-sm-4"><div class="text-muted small fw-semibold">Category</div><div class="fw-medium" id="mDetCat"></div></div>
              <div class="col-sm-4"><div class="text-muted small fw-semibold">Submitted</div><div class="small" id="mDetCreated"></div></div>
              <div class="col-sm-4"><div class="text-muted small fw-semibold">Updated</div><div class="small" id="mDetUpdated"></div></div>
            </div>
            <div class="mb-3"><div class="text-muted small fw-semibold mb-1">Description</div><div class="p-3 rounded-3 border bg-white" id="mDetDesc"></div></div>
            <div id="mDetProofSection" class="mb-3 d-none">
              <div class="text-muted small fw-semibold mb-2"><i class="bi bi-image me-1"></i>Attached Proof Image</div>
              <div class="p-2 rounded-3 border bg-light text-center">
                <img id="mDetProofImg" alt="Complaint Proof" class="img-fluid rounded-2" style="max-height: 300px; object-fit: contain;" />
              </div>
            </div>
            <div id="mDetProofEmpty" class="mb-3 text-muted small fst-italic">
              <i class="bi bi-image me-1"></i>No proof image attached.
            </div>
            <div><div class="text-muted small fw-semibold mb-1">Administration Remarks</div><div class="p-3 rounded-3 border bg-light" id="mDetRemarks"></div></div>
            <div class="mt-3">
              <div class="text-muted small fw-semibold mb-1"><i class="bi bi-envelope me-1"></i>Email Notifications</div>
              <div id="mDetNotifications" class="d-flex flex-column gap-2"></div>
            </div>
          </div>
          <div class="modal-footer border-top"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button></div>
        </div>
      </div>
    </div>

    <!-- Admin Update Status Modal -->
    <div class="modal fade" id="previewStatusModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <form id="statusUpdateForm" class="modal-content border-0 shadow-lg" style="border-radius:16px;">
          <input type="hidden" id="mStatId" />
          <div class="modal-header border-bottom"><h5 class="modal-title fw-bold">Update Resolution Status</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Status</label>
              <select class="form-select" id="mStatSelect">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Administrator Remarks</label>
              <textarea class="form-control" id="mStatRemarks" rows="4" maxlength="1000"></textarea>
            </div>
            <div id="mStatNotifyPanel" class="p-3 rounded-3 border bg-light d-none">
              <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                <span class="small fw-bold text-dark"><i class="bi bi-envelope-fill text-primary me-1"></i>Student Email Notification</span>
                <span id="mStatGmailState" class="small"></span>
              </div>
              <div class="small text-muted mb-2">Recipient: <strong class="text-dark" id="mStatNotifyRecipient"></strong></div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="mStatNotifyCheck" checked />
                <label class="form-check-label small" for="mStatNotifyCheck">
                  Confirm sending email notification via Gmail when saving this status update
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top">
            <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-navy">Save Status</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Admin Retry Email Notification Confirmation Modal -->
    <div class="modal fade" id="previewRetryNotifModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <form id="retryNotifConfirmForm" class="modal-content border-0 shadow-lg" style="border-radius:16px;">
          <input type="hidden" id="mRetryNotifId" />
          <div class="modal-header border-bottom">
            <h5 class="modal-title fw-bold"><i class="bi bi-envelope-fill text-primary me-2"></i>Confirm Email Notification</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="small mb-2">Send a Gmail status notification email to the student below?</p>
            <div class="p-3 rounded-3 border bg-light small">
              <div class="mb-1"><strong>To:</strong> <span id="mRetryNotifTo"></span></div>
              <div class="mb-1"><strong>Complaint:</strong> <span id="mRetryNotifRef"></span></div>
              <div><strong>Subject:</strong> <span id="mRetryNotifSubject"></span></div>
            </div>
          </div>
          <div class="modal-footer border-top">
            <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-navy"><i class="bi bi-send-fill me-1"></i>Confirm &amp; Send Email</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Admin Delete Modal -->
    <div class="modal fade" id="previewDeleteModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <form id="deleteConfirmForm" class="modal-content border-0 shadow-lg" style="border-radius:16px;">
          <input type="hidden" id="mDelId" />
          <div class="modal-header border-bottom"><h5 class="modal-title fw-bold text-danger">Delete Complaint</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body"><p class="mb-1">Delete complaint <strong id="mDelCode"></strong>?</p><p class="small text-muted mb-0" id="mDelTitle"></p></div>
          <div class="modal-footer border-top">
            <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-danger">Delete Permanently</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Team Member Spotlight Modal -->
    <div class="modal fade" id="teamMemberModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-sm-down">
        <div class="modal-content border-0 shadow-lg" style="border-radius:18px; overflow:hidden;">
          <div class="modal-header border-bottom px-4 py-3">
            <div>
              <div class="small text-primary fw-semibold" id="tmRole"></div>
              <h5 class="modal-title fw-bold mb-0" id="tmName"></h5>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-4 align-items-center">
              <div class="col-md-5">
                <div class="team-photo-frame rounded-3">
                  <img id="tmPhoto" alt="" class="team-photo-img" referrerpolicy="no-referrer" />
                </div>
              </div>
              <div class="col-md-7">
                <div class="small text-muted fw-semibold mb-1">Overview &amp; Bio</div>
                <p class="text-dark mb-3" id="tmBio" style="line-height: 1.65;"></p>
                <div class="small text-muted fw-semibold mb-1">Role Responsibility</div>
                <p class="small text-muted mb-3" id="tmRoleSummary" style="line-height: 1.6;"></p>
                <div class="small text-muted fw-semibold mb-2">Core Contributions</div>
                <ul class="small text-muted ps-3 mb-3 d-flex flex-column gap-1" id="tmContribs"></ul>
                <div class="d-flex flex-wrap align-items-center gap-2" id="tmSocials"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachEvents(): void {
  document.querySelectorAll<HTMLElement>('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-nav') as PageKey;
      const offcanvasEl = document.getElementById('mobileSidebar');
      if (offcanvasEl && window.bootstrap) {
        window.bootstrap.Offcanvas.getInstance(offcanvasEl)?.hide();
      }
      navigate(target);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-google-signin]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (state.authBusy) return;
      state.authBusy = true;
      state.flash = null;
      render();
      try {
        await signInWithGoogleFirebase();
      } catch (err) {
        state.flash = { type: 'danger', text: readableError(err, 'Google Sign-In was cancelled or failed.') };
      } finally {
        state.authBusy = false;
        render();
      }
    });
  });

  const signOut = async () => {
    await signOutFirebase();
    state.flash = { type: 'info', text: 'You have been signed out securely.' };
    state.page = 'login';
    render();
  };
  document.getElementById('btnSignOut')?.addEventListener('click', signOut);
  document.getElementById('btnSignOutMobile')?.addEventListener('click', signOut);

  document.getElementById('mainAdminCreateUserForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentUser || !isMainAdmin(state.currentUser)) return;
    const name = (document.getElementById('maNewName') as HTMLInputElement).value.trim();
    const email = (document.getElementById('maNewEmail') as HTMLInputElement).value.trim().toLowerCase();
    const role = (document.getElementById('maNewRole') as HTMLSelectElement).value as 'ADMIN' | 'STUDENT';
    const sid = (document.getElementById('maNewSid') as HTMLInputElement).value.trim();
    const dept = (document.getElementById('maNewDept') as HTMLInputElement).value.trim();

    if (name.length < 2 || !email.includes('@') || (role !== 'ADMIN' && role !== 'STUDENT')) {
      state.flash = { type: 'danger', text: 'Enter a valid name, email address, and role (ADMIN or STUDENT).' };
      render();
      return;
    }

    try {
      const existingUser = state.users.find((u) => u.email.toLowerCase() === email);
      if (existingUser) {
        if (existingUser.role === 'MAIN_ADMIN') {
          state.flash = { type: 'warning', text: 'Cannot modify the Primary Main Admin account.' };
          render();
          return;
        }
        await updateUserRoleInFirestore(existingUser.uid, role);
        state.flash = { type: 'success', text: `Updated ${existingUser.name} (${email}) to ${role} in Firebase.` };
        render();
        return;
      }

      const existingInvite = state.roleInvites.find((i) => i.email.toLowerCase() === email);
      if (existingInvite) {
        await updateInviteRoleInFirestore(existingInvite.id, role);
        state.flash = { type: 'success', text: `Updated pre-created ID ${email} to ${role} in Firebase.` };
        render();
        return;
      }

      await createRoleInviteInFirestore({
        name,
        email,
        role,
        studentId: sid,
        department: dept,
        createdByUid: state.currentUser.uid,
      });
      state.flash = {
        type: 'success',
        text: `Saved ${role} ID for ${name} (${email}) in Firebase. Role applies automatically when they sign in with Google.`,
      };
      render();
    } catch (err) {
      state.flash = { type: 'danger', text: readableError(err, 'Failed to save user ID in Firestore.') };
      render();
    }
  });

  document.querySelectorAll<HTMLElement>('[data-save-user-role]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const uid = btn.getAttribute('data-save-user-role') || '';
      const select = document.querySelector<HTMLSelectElement>(`[data-user-role-select="${uid}"]`);
      const target = state.users.find((u) => u.uid === uid);
      if (!target || !select || target.role === 'MAIN_ADMIN') return;
      const newRole = select.value as 'ADMIN' | 'STUDENT';
      if (newRole !== 'ADMIN' && newRole !== 'STUDENT') return;
      try {
        await updateUserRoleInFirestore(uid, newRole);
        state.flash = { type: 'success', text: `Saved role ${newRole} for ${target.name} in Firebase.` };
        render();
      } catch (err) {
        state.flash = { type: 'danger', text: readableError(err, 'Failed to update user role.') };
        render();
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-save-invite-role]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const inviteId = btn.getAttribute('data-save-invite-role') || '';
      const select = document.querySelector<HTMLSelectElement>(`[data-invite-role-select="${inviteId}"]`);
      const target = state.roleInvites.find((i) => i.id === inviteId);
      if (!target || !select) return;
      const newRole = select.value as 'ADMIN' | 'STUDENT';
      if (newRole !== 'ADMIN' && newRole !== 'STUDENT') return;
      try {
        await updateInviteRoleInFirestore(inviteId, newRole);
        state.flash = { type: 'success', text: `Saved role ${newRole} for ${target.email} in Firebase.` };
        render();
      } catch (err) {
        state.flash = { type: 'danger', text: readableError(err, 'Failed to update invite role.') };
        render();
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-delete-user]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const uid = btn.getAttribute('data-delete-user') || '';
      const target = state.users.find((u) => u.uid === uid);
      if (!target || target.role === 'MAIN_ADMIN') return;
      try {
        await deleteUserInFirestore(uid);
        state.flash = { type: 'info', text: `Deleted account ${target.email} from Firebase.` };
        render();
      } catch (err) {
        state.flash = { type: 'danger', text: readableError(err, 'Failed to delete user.') };
        render();
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-delete-invite]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const inviteId = btn.getAttribute('data-delete-invite') || '';
      const target = state.roleInvites.find((i) => i.id === inviteId);
      if (!target) return;
      try {
        await deleteInviteInFirestore(inviteId);
        state.flash = { type: 'info', text: `Removed pre-created ID ${target.email} from Firebase.` };
        render();
      } catch (err) {
        state.flash = { type: 'danger', text: readableError(err, 'Failed to delete pre-created ID.') };
        render();
      }
    });
  });

  const proofFileEl = document.getElementById('cProofImage') as HTMLInputElement | null;
  proofFileEl?.addEventListener('change', async () => {
    const errEl = document.getElementById('cProofError')!;
    const wrapEl = document.getElementById('cProofPreviewWrap')!;
    const imgEl = document.getElementById('cProofPreviewImg') as HTMLImageElement;
    const nameEl = document.getElementById('cProofFileName')!;

    errEl.classList.add('d-none');
    const file = proofFileEl.files?.[0];
    if (!file) {
      pendingUploadDataUrl = '';
      wrapEl.classList.add('d-none');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      proofFileEl.value = '';
      pendingUploadDataUrl = '';
      wrapEl.classList.add('d-none');
      errEl.textContent = 'Only JPG, PNG, WEBP, or GIF images are allowed.';
      errEl.classList.remove('d-none');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      proofFileEl.value = '';
      pendingUploadDataUrl = '';
      wrapEl.classList.add('d-none');
      errEl.textContent = 'Image size must not exceed 5 MB.';
      errEl.classList.remove('d-none');
      return;
    }

    try {
      const compressed = await compressProofImage(file);
      pendingUploadDataUrl = compressed;
      imgEl.src = compressed;
      nameEl.textContent = `${file.name} (optimized ${Math.round((compressed.length * 0.75) / 1024)} KB)`;
      wrapEl.classList.remove('d-none');
    } catch (err) {
      proofFileEl.value = '';
      pendingUploadDataUrl = '';
      wrapEl.classList.add('d-none');
      errEl.textContent = readableError(err, 'Failed to process proof image.');
      errEl.classList.remove('d-none');
    }
  });

  document.getElementById('submitComplaintForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentUser) return;
    const title = (document.getElementById('cTitle') as HTMLInputElement).value.trim();
    const category = (document.getElementById('cCategory') as HTMLSelectElement).value;
    const desc = (document.getElementById('cDescription') as HTMLTextAreaElement).value.trim();
    if (title.length < 5 || !category || desc.length < 15) {
      state.flash = { type: 'danger', text: 'Please enter a title (min 5 chars), category, and description (min 15 chars).' };
      render();
      return;
    }
    if (!pendingUploadDataUrl) {
      state.flash = { type: 'danger', text: 'Please attach a proof image before submitting your complaint.' };
      render();
      return;
    }

    const submitBtn = document.getElementById('btnSubmitComplaint') as HTMLButtonElement | null;
    if (submitBtn) submitBtn.disabled = true;

    try {
      await createComplaintInFirestore({
        user: state.currentUser,
        title,
        category,
        description: desc,
        proofImage: pendingUploadDataUrl,
      });
      pendingUploadDataUrl = '';
      navigate('my-complaints', {
        type: 'success',
        text: 'Your complaint and proof image have been saved to Firebase and are pending review.',
      });
    } catch (err) {
      if (submitBtn) submitBtn.disabled = false;
      state.flash = { type: 'danger', text: readableError(err, 'Failed to submit complaint.') };
      render();
    }
  });

  const openComplaintDetailModal = (id: string) => {
    const c = state.complaints.find((x) => x.id === id);
    if (!c) return;
    document.getElementById('mDetId')!.textContent = c.refCode;
    document.getElementById('mDetStatus')!.innerHTML = statusBadge(c.status);
    document.getElementById('mDetTitle')!.textContent = c.title;
    document.getElementById('mDetCat')!.textContent = c.category;
    document.getElementById('mDetCreated')!.textContent = formatFirestoreDate(c.createdAt);
    document.getElementById('mDetUpdated')!.textContent = formatFirestoreDate(c.updatedAt);
    document.getElementById('mDetDesc')!.textContent = c.description;
    document.getElementById('mDetRemarks')!.textContent = c.adminRemarks || 'No administrative remarks yet.';

    const proofSec = document.getElementById('mDetProofSection')!;
    const proofEmpty = document.getElementById('mDetProofEmpty')!;
    const proofImg = document.getElementById('mDetProofImg') as HTMLImageElement;
    if (c.proofImage) {
      proofImg.src = c.proofImage;
      proofSec.classList.remove('d-none');
      proofEmpty.classList.add('d-none');
    } else {
      proofImg.removeAttribute('src');
      proofSec.classList.add('d-none');
      proofEmpty.classList.remove('d-none');
    }

    const notifContainer = document.getElementById('mDetNotifications')!;
    const relatedNotifs = state.emailNotifications.filter((n) => n.complaintId === c.id);
    if (relatedNotifs.length === 0) {
      notifContainer.innerHTML = '<div class="small text-muted fst-italic">No email notifications triggered yet.</div>';
    } else {
      notifContainer.innerHTML = relatedNotifs
        .map(
          (n) => `
            <div class="p-2 rounded-3 border bg-white d-flex flex-wrap align-items-center justify-content-between gap-2 small">
              <div>
                <span class="fw-semibold">${esc(n.triggeredStatus)}</span> &bull;
                <span class="text-muted">${esc(n.recipientEmail)}</span> &bull;
                <span class="text-muted">${esc(formatFirestoreDate(n.createdAt))}</span>
              </div>
              <div>${notifDeliveryBadge(n.deliveryStatus)}</div>
            </div>
          `
        )
        .join('');
    }

    window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('previewDetailModal')!).show();
  };

  const updateStudentDashboardSearchUI = () => {
    if (!state.currentUser) return;
    const tbody = document.getElementById('studentDashTableBody');
    const mobileList = document.getElementById('studentDashMobileList');
    const metaEl = document.getElementById('studentDashResultMeta');
    const clearBtn = document.getElementById('btnClearStudentDashSearch');
    const searchInput = document.getElementById('studentDashSearchInput') as HTMLInputElement | null;
    if (!metaEl || !searchInput) return;

    const { mine, q, hasQuery, matching, rows } = getStudentDashboardDisplayData(state.currentUser.uid);
    if (tbody) {
      tbody.innerHTML = renderStudentDashboardRows(rows, mine.length, q);
    }
    if (mobileList) {
      mobileList.innerHTML = renderStudentDashboardMobileCards(rows, mine.length, q);
    }
    metaEl.innerHTML = renderStudentDashboardMeta(mine.length, matching.length, hasQuery);
    if (clearBtn) {
      clearBtn.classList.toggle('d-none', !hasQuery);
    }
    searchInput.classList.toggle('border-end-0', hasQuery);
  };

  const dashSearchInput = document.getElementById('studentDashSearchInput') as HTMLInputElement | null;
  dashSearchInput?.addEventListener('input', () => {
    state.studentSearch = dashSearchInput.value;
    updateStudentDashboardSearchUI();
  });

  document.getElementById('studentDashSearchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (dashSearchInput) {
      state.studentSearch = dashSearchInput.value;
      updateStudentDashboardSearchUI();
    }
  });

  document.getElementById('btnClearStudentDashSearch')?.addEventListener('click', () => {
    state.studentSearch = '';
    if (dashSearchInput) {
      dashSearchInput.value = '';
      dashSearchInput.focus();
    }
    updateStudentDashboardSearchUI();
  });

  document.getElementById('studentDashTableBody')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-open-detail]');
    if (!btn) return;
    const id = btn.getAttribute('data-open-detail') || '';
    if (id) openComplaintDetailModal(id);
  });

  document.getElementById('studentDashMobileList')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-open-detail]');
    if (!btn) return;
    const id = btn.getAttribute('data-open-detail') || '';
    if (id) openComplaintDetailModal(id);
  });

  document.getElementById('studentFilterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.studentSearch = (document.getElementById('studentSearchInput') as HTMLInputElement).value;
    state.studentStatusFilter = (document.getElementById('studentStatusSelect') as HTMLSelectElement).value;
    render();
  });

  document.getElementById('btnResetStudentFilter')?.addEventListener('click', () => {
    state.studentSearch = '';
    state.studentStatusFilter = 'ALL';
    render();
  });

  document.getElementById('adminFilterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.adminSearch = (document.getElementById('adminSearchInput') as HTMLInputElement).value;
    state.adminStatusFilter = (document.getElementById('adminStatusSelect') as HTMLSelectElement).value;
    render();
  });

  document.getElementById('btnResetAdminFilter')?.addEventListener('click', () => {
    state.adminSearch = '';
    state.adminStatusFilter = 'ALL';
    render();
  });

  document.querySelectorAll<HTMLElement>('[data-open-detail]').forEach((btn) => {
    if (btn.closest('#studentDashTableBody') || btn.closest('#studentDashMobileList')) return;
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open-detail') || '';
      openComplaintDetailModal(id);
    });
  });

  const syncStatusNotifyPanel = () => {
    const selectEl = document.getElementById('mStatSelect') as HTMLSelectElement | null;
    const panelEl = document.getElementById('mStatNotifyPanel');
    const gmailStateEl = document.getElementById('mStatGmailState');
    if (!selectEl || !panelEl || !gmailStateEl) return;
    const status = selectEl.value as Status;
    if (status === 'In Progress' || status === 'Resolved') {
      panelEl.classList.remove('d-none');
      gmailStateEl.innerHTML = hasGmailAccessToken()
        ? '<span class="badge bg-success-subtle text-success">Gmail Ready</span>'
        : '<span class="badge bg-warning-subtle text-warning-emphasis">Will ask Google permission</span>';
    } else {
      panelEl.classList.add('d-none');
    }
  };

  document.getElementById('mStatSelect')?.addEventListener('change', syncStatusNotifyPanel);

  document.querySelectorAll<HTMLElement>('[data-open-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open-status') || '';
      const c = state.complaints.find((x) => x.id === id);
      if (!c) return;
      (document.getElementById('mStatId') as HTMLInputElement).value = c.id;
      (document.getElementById('mStatSelect') as HTMLSelectElement).value = c.status;
      (document.getElementById('mStatRemarks') as HTMLTextAreaElement).value = c.adminRemarks || '';
      (document.getElementById('mStatNotifyRecipient') as HTMLElement).textContent = `${c.studentName} (${c.studentEmail})`;
      (document.getElementById('mStatNotifyCheck') as HTMLInputElement).checked = true;
      syncStatusNotifyPanel();
      window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('previewStatusModal')!).show();
    });
  });

  document.getElementById('statusUpdateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (document.getElementById('mStatId') as HTMLInputElement).value;
    const status = (document.getElementById('mStatSelect') as HTMLSelectElement).value as Status;
    const remarks = (document.getElementById('mStatRemarks') as HTMLTextAreaElement).value.trim();
    const notifyChecked = (document.getElementById('mStatNotifyCheck') as HTMLInputElement).checked;
    const complaint = state.complaints.find((x) => x.id === id);
    window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('previewStatusModal')!).hide();
    try {
      await updateComplaintStatusInFirestore(id, status, remarks);

      if ((status === 'Resolved' || status === 'In Progress') && notifyChecked && complaint && state.currentUser) {
        const notif = await triggerComplaintStatusEmailNotification({
          complaint,
          newStatus: status,
          adminRemarks: remarks,
          triggeredByUid: state.currentUser.uid,
          promptAuthIfNeeded: true,
        });
        if (notif?.deliveryStatus === 'SENT') {
          state.flash = {
            type: 'success',
            text: `Complaint updated to ${status} and email notification sent to ${complaint.studentEmail}.`,
          };
        } else {
          state.flash = {
            type: 'warning',
            text: `Complaint updated to ${status}, but email could not be delivered (${notif?.errorMessage || 'Authorization required'}). You can retry from the Email Notification Log.`,
          };
        }
      } else {
        state.flash = { type: 'success', text: 'Complaint status and remarks saved permanently in Firebase.' };
      }
      render();
    } catch (err) {
      state.flash = { type: 'danger', text: readableError(err, 'Failed to update complaint status.') };
      render();
    }
  });

  document.getElementById('btnConnectGmail')?.addEventListener('click', async () => {
    try {
      await requestGmailSendAccess();
      state.flash = { type: 'success', text: 'Gmail sending authorized for this session.' };
      render();
    } catch (err) {
      state.flash = { type: 'danger', text: readableError(err, 'Failed to authorize Gmail sending.') };
      render();
    }
  });

  document.querySelectorAll<HTMLElement>('[data-open-retry-notif]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const notifId = btn.getAttribute('data-open-retry-notif') || '';
      const notif = state.emailNotifications.find((n) => n.id === notifId);
      if (!notif) return;
      (document.getElementById('mRetryNotifId') as HTMLInputElement).value = notif.id;
      document.getElementById('mRetryNotifTo')!.textContent = `${notif.studentName} <${notif.recipientEmail}>`;
      document.getElementById('mRetryNotifRef')!.textContent = `${notif.refCode} (${notif.triggeredStatus})`;
      document.getElementById('mRetryNotifSubject')!.textContent = notif.subject;
      window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('previewRetryNotifModal')!).show();
    });
  });

  document.getElementById('retryNotifConfirmForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const notifId = (document.getElementById('mRetryNotifId') as HTMLInputElement).value;
    const notif = state.emailNotifications.find((n) => n.id === notifId);
    window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('previewRetryNotifModal')!).hide();
    if (!notif) return;
    const complaint = state.complaints.find((c) => c.id === notif.complaintId);
    try {
      const outcome = await retryEmailNotificationInFirestore(notif, complaint);
      if (outcome === 'SENT') {
        state.flash = { type: 'success', text: `Email notification successfully sent to ${notif.recipientEmail}.` };
      } else {
        state.flash = { type: 'danger', text: `Failed to send email to ${notif.recipientEmail}. Check Gmail permissions.` };
      }
      render();
    } catch (err) {
      state.flash = { type: 'danger', text: readableError(err, 'Unable to send Gmail notification.') };
      render();
    }
  });

  document.querySelectorAll<HTMLElement>('[data-open-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open-delete') || '';
      const c = state.complaints.find((x) => x.id === id);
      if (!c) return;
      (document.getElementById('mDelId') as HTMLInputElement).value = c.id;
      document.getElementById('mDelCode')!.textContent = c.refCode;
      document.getElementById('mDelTitle')!.textContent = c.title;
      window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('previewDeleteModal')!).show();
    });
  });

  document.getElementById('deleteConfirmForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (document.getElementById('mDelId') as HTMLInputElement).value;
    window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('previewDeleteModal')!).hide();
    try {
      await deleteComplaintInFirestore(id);
      state.flash = { type: 'info', text: 'Complaint deleted from Firebase.' };
      render();
    } catch (err) {
      state.flash = { type: 'danger', text: readableError(err, 'Failed to delete complaint.') };
      render();
    }
  });

  document.getElementById('profileUpdateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentUser) return;
    const name = (document.getElementById('profName') as HTMLInputElement).value.trim();
    const sid = (document.getElementById('profSid') as HTMLInputElement).value.trim();
    const dept = (document.getElementById('profDept') as HTMLInputElement).value.trim();
    if (name.length < 2) {
      state.flash = { type: 'danger', text: 'Full name must be at least 2 characters.' };
      render();
      return;
    }
    try {
      await updateOwnProfileInFirestore(state.currentUser.uid, name, sid, dept);
      state.flash = { type: 'success', text: 'Your profile changes have been saved to Firebase.' };
      render();
    } catch (err) {
      state.flash = { type: 'danger', text: readableError(err, 'Failed to update profile.') };
      render();
    }
  });

  document.querySelectorAll<HTMLElement>('[data-team-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-team-filter') as TeamRoleFilter;
      state.teamFilter = next || 'all';
      render();
    });
  });

  document.querySelectorAll<HTMLImageElement>('[data-team-img]').forEach((img) => {
    img.addEventListener('error', () => {
      const id = img.getAttribute('data-team-img');
      img.style.display = 'none';
      const fallback = id ? document.querySelector(`[data-team-fallback="${id}"]`) : null;
      fallback?.classList.add('is-visible');
    });
  });

  document.querySelectorAll<HTMLElement>('[data-open-member]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open-member');
      const member = TEAM_MEMBERS.find((m) => m.id === id);
      if (!member) return;
      document.getElementById('tmRole')!.textContent = `${member.order} · ${member.roleTitle}`;
      document.getElementById('tmName')!.textContent = member.name;
      const photoEl = document.getElementById('tmPhoto') as HTMLImageElement;
      photoEl.src = member.photo;
      photoEl.alt = `${member.name} — ${member.roleTitle}`;
      document.getElementById('tmBio')!.textContent = member.bio;
      document.getElementById('tmRoleSummary')!.textContent = member.roleSummary;
      document.getElementById('tmContribs')!.innerHTML = member.contributions
        .map((c) => `<li>${esc(c)}</li>`)
        .join('');
      document.getElementById('tmSocials')!.innerHTML = member.socials
        .map(
          (s) => `
            <a href="${esc(s.href)}"
               class="btn btn-sm btn-light border d-inline-flex align-items-center gap-2 text-nowrap"
               ${s.external ? 'target="_blank" rel="noopener noreferrer"' : ''}>
              <i class="bi ${esc(s.icon)}"></i><span>${esc(s.label)}</span>
            </a>
          `
        )
        .join('');
      window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('teamMemberModal')!).show();
    });
  });
}

let lastAnimatedRouteKey = '';

function render(): void {
  const root = document.getElementById('root');
  if (!root) return;

  const routeKey = `${state.authReady}:${Boolean(state.currentUser)}:${state.page}`;
  const shouldAnimatePage = routeKey !== lastAnimatedRouteKey;
  lastAnimatedRouteKey = routeKey;
  root.classList.toggle('qr-page-enter', shouldAnimatePage);

  if (!state.authReady) {
    root.innerHTML = `
      ${renderPreviewStrip()}
      <div class="d-flex align-items-center justify-content-center" style="min-height: 75vh;">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <div class="text-muted small fw-semibold">Connecting to QuickResolve Firebase...</div>
        </div>
      </div>
    `;
    return;
  }

  let content = '';
  switch (state.page) {
    case 'landing':
      content = renderLanding();
      break;
    case 'login':
      content = renderAuthScreen(false);
      break;
    case 'register':
      content = renderAuthScreen(true);
      break;
    case 'team':
      content = renderTeamPage();
      break;
    case 'terms':
      content = renderTermsPage();
      break;
    case 'privacy':
      content = renderPrivacyPage();
      break;
    case 'student-dashboard':
      content = state.currentUser ? renderStudentDashboard() : renderAuthScreen(false);
      break;
    case 'submit-complaint':
      content = state.currentUser ? renderSubmitComplaint() : renderAuthScreen(false);
      break;
    case 'my-complaints':
      content = state.currentUser ? renderMyComplaints() : renderAuthScreen(false);
      break;
    case 'admin-dashboard':
      content = state.currentUser ? renderAdminDashboard() : renderAuthScreen(false);
      break;
    case 'manage-complaints':
      content = state.currentUser ? renderManageComplaints() : renderAuthScreen(false);
      break;
    case 'manage-students':
      content = state.currentUser ? renderManageStudents() : renderAuthScreen(false);
      break;
    case 'manage-users':
      content = state.currentUser ? renderManageUsers() : renderAuthScreen(false);
      break;
    case 'profile':
      content = state.currentUser ? renderProfile() : renderAuthScreen(false);
      break;
  }

  root.innerHTML = renderPreviewStrip() + content + renderModals();
  attachEvents();
}

function initViewportDeviceDetector(): void {
  const applyDeviceTraits = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const hasTouch = coarsePointer || navigator.maxTouchPoints > 0;
    const isMobile = w < 768;
    const isTablet = !isMobile && (w < 1200 || (hasTouch && w <= 1366));
    const device = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
    const orientation = w >= h ? 'landscape' : 'portrait';

    const rootEl = document.documentElement;
    rootEl.setAttribute('data-device', device);
    rootEl.setAttribute('data-orientation', orientation);
    rootEl.setAttribute('data-touch', hasTouch ? 'true' : 'false');
    rootEl.style.setProperty('--qr-vh', `${h * 0.01}px`);
  };

  applyDeviceTraits();
  window.addEventListener('resize', applyDeviceTraits, { passive: true });
  window.addEventListener('orientationchange', applyDeviceTraits, { passive: true });
}

initViewportDeviceDetector();
render();
initFirebaseSessionSync();
