<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Student Registration – QuickResolve</title>
    <jsp:include page="/WEB-INF/views/includes/head-assets.jsp" />
</head>
<body>

<div class="auth-wrapper row g-0">
    <%-- Left Navy Brand Panel --%>
    <div class="col-lg-5 d-none d-lg-flex auth-brand-panel">
        <div>
            <a href="${pageContext.request.contextPath}/" class="d-inline-flex align-items-center gap-2 text-white text-decoration-none mb-5">
                <img src="${pageContext.request.contextPath}/assets/images/logo.svg" alt="QuickResolve" width="40" height="40" />
                <span class="fs-4 fw-bold">QuickResolve</span>
            </a>
            <h2 class="display-6 fw-bold mb-3">Join Your Campus Resolution Hub</h2>
            <p class="text-white-50 fs-6">
                Create a student account to file facility, IT, hostel, or academic complaints and follow every step until resolution.
            </p>
        </div>

        <div class="p-3 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10">
            <div class="small fw-semibold text-white mb-1"><i class="bi bi-camera-fill me-1"></i> Photo Proof Verification</div>
            <div class="small text-white-50">
                Attach clear images of campus issues directly when filing complaints for faster resolution.
            </div>
        </div>
    </div>

    <%-- Right Form Panel --%>
    <div class="col-lg-7 auth-form-panel">
        <div class="auth-card" style="max-width: 520px;">
            <div class="d-flex d-lg-none align-items-center gap-2 mb-4">
                <img src="${pageContext.request.contextPath}/assets/images/logo.svg" alt="QuickResolve" width="32" height="32" />
                <span class="fw-bold fs-5 text-dark">QuickResolve</span>
            </div>

            <h3 class="fw-bold mb-1">Student Registration</h3>
            <p class="text-muted small mb-4">Fill in your details to create your QuickResolve student account.</p>

            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger small py-2">
                    <i class="bi bi-x-circle-fill me-1"></i> <c:out value="${errorMessage}" />
                </div>
            </c:if>

            <form action="${pageContext.request.contextPath}/register" method="post" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="name" class="form-label">Full Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="name" name="name"
                           value="<c:out value='${enteredName}' />"
                           placeholder="e.g. Aarav Sharma" minlength="2" maxlength="100" required />
                    <div class="invalid-feedback">Please enter your full name (2–100 characters).</div>
                </div>

                <div class="mb-3">
                    <label for="email" class="form-label">College Email Address <span class="text-danger">*</span></label>
                    <input type="email" class="form-control" id="email" name="email"
                           value="<c:out value='${enteredEmail}' />"
                           placeholder="name@college.edu" maxlength="150" required />
                    <div class="invalid-feedback">Please enter a valid email address.</div>
                </div>

                <div class="row g-3 mb-3">
                    <div class="col-sm-6">
                        <label for="studentId" class="form-label">Student ID <span class="text-muted fw-normal">(Optional)</span></label>
                        <input type="text" class="form-control" id="studentId" name="studentId"
                               value="<c:out value='${enteredStudentId}' />"
                               placeholder="e.g. CS2026-041" maxlength="50" />
                    </div>
                    <div class="col-sm-6">
                        <label for="department" class="form-label">Department <span class="text-muted fw-normal">(Optional)</span></label>
                        <input type="text" class="form-control" id="department" name="department"
                               value="<c:out value='${enteredDepartment}' />"
                               placeholder="e.g. Computer Science" maxlength="100" />
                    </div>
                </div>

                <div class="row g-3 mb-4">
                    <div class="col-sm-6">
                        <label for="regPassword" class="form-label">Password <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="regPassword" name="password"
                                   placeholder="Min 6 characters" minlength="6" maxlength="72" required />
                            <button class="btn btn-outline-secondary" type="button" data-toggle-password="regPassword">
                                <i class="bi bi-eye"></i>
                            </button>
                            <div class="invalid-feedback">Minimum 6 characters required.</div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <label for="confirmPassword" class="form-label">Confirm Password <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="confirmPassword" name="confirmPassword"
                                   placeholder="Repeat password" minlength="6" maxlength="72" required />
                            <button class="btn btn-outline-secondary" type="button" data-toggle-password="confirmPassword">
                                <i class="bi bi-eye"></i>
                            </button>
                            <div class="invalid-feedback">Please confirm your password.</div>
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn btn-navy w-100 py-2 mb-2">
                    Create Student Account <i class="bi bi-check2-circle ms-1"></i>
                </button>
            </form>

            <div class="gsi-divider">or</div>

            <div id="googleAuthError" class="alert alert-warning small py-2 d-none" role="alert"></div>

            <button type="button" class="gsi-material-button mb-3" data-google-signin data-auth-url="${pageContext.request.contextPath}/auth/google/url">
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
                    <span class="gsi-material-button-contents">Continue with Google</span>
                </div>
            </button>

            <div class="text-center small text-muted">
                Already have an account? <a href="${pageContext.request.contextPath}/login" class="fw-semibold text-decoration-none">Sign in</a>
                &bull; <a href="${pageContext.request.contextPath}/" class="text-decoration-none text-muted">Home</a>
            </div>
        </div>
    </div>
</div>

<jsp:include page="/WEB-INF/views/includes/scripts.jsp" />
</body>
</html>
