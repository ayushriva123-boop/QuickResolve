<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>QuickResolve – Student Complaint Management System</title>
    <jsp:include page="/WEB-INF/views/includes/head-assets.jsp" />
</head>
<body>

    <%-- Top Navigation Bar --%>
    <nav class="navbar navbar-expand-lg landing-navbar sticky-top py-3">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark" href="${pageContext.request.contextPath}/">
                <img src="${pageContext.request.contextPath}/assets/images/logo.svg" alt="QuickResolve Logo" width="36" height="36" />
                <span class="fs-5">QuickResolve</span>
            </a>

            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#landingNav"
                    aria-controls="landingNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="landingNav">
                <ul class="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3">
                    <li class="nav-item"><a class="nav-link fw-medium" href="#features">Features</a></li>
                    <li class="nav-item"><a class="nav-link fw-medium" href="#how-it-works">How It Works</a></li>
                    <li class="nav-item"><a class="nav-link fw-medium" href="#roles">Portals</a></li>
                </ul>

                <div class="d-flex align-items-center gap-2">
                    <c:choose>
                        <c:when test="${not empty sessionScope.user}">
                            <a href="${pageContext.request.contextPath}${sessionScope.user.admin ? '/admin/dashboard' : '/student/dashboard'}"
                               class="btn btn-navy">
                                Go to Dashboard <i class="bi bi-arrow-right ms-1"></i>
                            </a>
                        </c:when>
                        <c:otherwise>
                            <a href="${pageContext.request.contextPath}/login" class="btn btn-outline-navy">Sign In</a>
                            <a href="${pageContext.request.contextPath}/register" class="btn btn-navy">Student Register</a>
                        </c:otherwise>
                    </c:choose>
                </div>
            </div>
        </div>
    </nav>

    <%-- Hero Section --%>
    <section class="hero-section py-5 py-lg-6">
        <div class="container hero-content py-4 py-lg-5">
            <div class="row align-items-center g-5">
                <div class="col-lg-6">
                    <div class="hero-eyebrow mb-4">
                        <i class="bi bi-shield-check"></i>
                        <span>Campus Grievance &amp; Resolution Platform</span>
                    </div>

                    <h1 class="display-4 fw-bold lh-sm mb-3">
                        Your Voice Matters. We Make It Happen.
                    </h1>

                    <p class="lead text-white-50 mb-4" style="max-width: 540px;">
                        Report campus issues, track resolutions, and help create a better campus experience.
                    </p>

                    <div class="d-flex flex-wrap gap-3 mb-4">
                        <a href="${pageContext.request.contextPath}/register" class="btn btn-light btn-lg fw-semibold px-4 text-primary">
                            <i class="bi bi-person-plus-fill me-2"></i>Submit a Complaint
                        </a>
                        <a href="${pageContext.request.contextPath}/login" class="btn btn-outline-light btn-lg fw-semibold px-4">
                            Sign In to Portal
                        </a>
                    </div>

                    <div class="d-flex flex-wrap gap-4 pt-2 text-white-50 small">
                        <span><i class="bi bi-check-circle-fill text-info me-1"></i>Real-time Status Tracking</span>
                        <span><i class="bi bi-check-circle-fill text-info me-1"></i>Role-Based Access Control</span>
                        <span><i class="bi bi-check-circle-fill text-info me-1"></i>Photo Proof Attachments</span>
                    </div>
                </div>

                <div class="col-lg-6">
                    <div class="hero-preview-card p-4">
                        <div class="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                            <div>
                                <div class="fw-bold text-dark">Live Resolution Tracker</div>
                                <div class="text-muted small">Transparent student-to-admin workflow</div>
                            </div>
                            <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold">
                                QuickResolve Portal
                            </span>
                        </div>

                        <div class="d-flex flex-column gap-3">
                            <div class="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3">
                                <div>
                                    <div class="fw-semibold text-dark small">North Hostel Block B Wi-Fi Outage</div>
                                    <div class="text-muted" style="font-size: 0.78rem;">IT &amp; Network &bull; QR-0001</div>
                                </div>
                                <span class="badge-status badge-status-progress">In Progress</span>
                            </div>

                            <div class="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3">
                                <div>
                                    <div class="fw-semibold text-dark small">Lecture Hall 204 Projector Repair</div>
                                    <div class="text-muted" style="font-size: 0.78rem;">Infrastructure &bull; QR-0002</div>
                                </div>
                                <span class="badge-status badge-status-pending">Pending</span>
                            </div>

                            <div class="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3">
                                <div>
                                    <div class="fw-semibold text-dark small">Extended Midterm Library Hours</div>
                                    <div class="text-muted" style="font-size: 0.78rem;">Library &amp; Labs &bull; QR-0003</div>
                                </div>
                                <span class="badge-status badge-status-resolved">Resolved</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <%-- Core Features --%>
    <section id="features" class="py-5 bg-white border-bottom">
        <div class="container py-4">
            <div class="text-center mb-5">
                <span class="text-primary fw-bold small text-uppercase">Platform Capabilities</span>
                <h2 class="fw-bold mt-2">Built for Transparency &amp; Speed</h2>
                <p class="text-muted mx-auto" style="max-width: 600px;">
                    Every campus concern is logged securely, prioritized accurately, and tracked through to resolution.
                </p>
            </div>

            <div class="row g-4">
                <div class="col-md-4">
                    <div class="feature-card">
                        <div class="icon-tile icon-tile-navy mb-3">
                            <i class="bi bi-lightning-charge-fill"></i>
                        </div>
                        <h5 class="fw-bold">Fast Structured Submission</h5>
                        <p class="text-muted mb-0">
                            Students submit categorized campus complaints in seconds with instant tracking reference IDs.
                        </p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="feature-card">
                        <div class="icon-tile icon-tile-navy mb-3">
                            <i class="bi bi-camera-fill"></i>
                        </div>
                        <h5 class="fw-bold">Verified Photo Proof</h5>
                        <p class="text-muted mb-0">
                            Students attach image evidence directly with each complaint so campus teams can verify and diagnose issues rapidly.
                        </p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="feature-card">
                        <div class="icon-tile icon-tile-navy mb-3">
                            <i class="bi bi-shield-lock-fill"></i>
                        </div>
                        <h5 class="fw-bold">Accountable Admin Workflow</h5>
                        <p class="text-muted mb-0">
                            Administrators inspect uploaded proof images, filter by status, post official remarks, and close resolved cases.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <%-- How It Works --%>
    <section id="how-it-works" class="py-5">
        <div class="container py-4">
            <div class="text-center mb-5">
                <span class="text-primary fw-bold small text-uppercase">Workflow</span>
                <h2 class="fw-bold mt-2">How QuickResolve Works</h2>
            </div>

            <div class="row g-4">
                <div class="col-md-4">
                    <div class="saas-card p-4 h-100">
                        <div class="fw-bold text-primary mb-2">Step 01</div>
                        <h5 class="fw-bold">Register &amp; Submit</h5>
                        <p class="text-muted mb-0">Create your student account, describe the campus issue, and attach a clear photo as proof.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="saas-card p-4 h-100">
                        <div class="fw-bold text-primary mb-2">Step 02</div>
                        <h5 class="fw-bold">Admin Review &amp; Action</h5>
                        <p class="text-muted mb-0">Campus administrators inspect the complaint and proof image, update status to In Progress, and leave remarks.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="saas-card p-4 h-100">
                        <div class="fw-bold text-primary mb-2">Step 03</div>
                        <h5 class="fw-bold">Track Until Resolved</h5>
                        <p class="text-muted mb-0">Monitor real-time status updates from your personal dashboard until the issue is marked Resolved.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <%-- Portals --%>
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
                            <li><i class="bi bi-check2 text-primary me-2"></i>Upload photo proof (JPG/PNG/WEBP) with every report</li>
                            <li><i class="bi bi-check2 text-primary me-2"></i>Searchable complaint history &amp; status badges</li>
                        </ul>
                        <a href="${pageContext.request.contextPath}/register" class="btn btn-navy">Create Student Account</a>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="saas-card p-4 h-100">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div class="icon-tile icon-tile-navy"><i class="bi bi-building-gear"></i></div>
                            <div>
                                <h4 class="fw-bold mb-0">Administrator Portal</h4>
                                <div class="text-muted small">Manage resolutions across campus</div>
                            </div>
                        </div>
                        <ul class="list-unstyled text-muted d-flex flex-column gap-2 mb-4">
                            <li><i class="bi bi-check2 text-primary me-2"></i>Campus-wide analytics &amp; category breakdown</li>
                            <li><i class="bi bi-check2 text-primary me-2"></i>Inspect uploaded complaint proof images securely</li>
                            <li><i class="bi bi-check2 text-primary me-2"></i>Status updates (Pending / In Progress / Resolved) + student directory</li>
                        </ul>
                        <a href="${pageContext.request.contextPath}/login" class="btn btn-outline-navy">Administrator Sign In</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer class="py-4 text-center text-muted small border-top bg-light">
        <div class="container">
            &copy; 2026 QuickResolve &mdash; Student Complaint Management System. Built with Java Servlets, JSP, JDBC &amp; MySQL.
        </div>
    </footer>

    <jsp:include page="/WEB-INF/views/includes/scripts.jsp" />
</body>
</html>
