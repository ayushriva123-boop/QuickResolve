<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>My Profile – QuickResolve</title>
    <jsp:include page="/WEB-INF/views/includes/head-assets.jsp" />
</head>
<body>

<div class="app-shell">
    <jsp:include page="/WEB-INF/views/includes/sidebar.jsp" />

    <div class="app-main">
        <jsp:include page="/WEB-INF/views/includes/topbar.jsp">
            <jsp:param name="pageTitle" value="Account Profile" />
            <jsp:param name="pageSubtitle" value="Manage your personal information and security settings" />
        </jsp:include>

        <main class="app-content">
            <c:if test="${not empty successMessage}">
                <div class="alert alert-success alert-dismissible fade show small" role="alert">
                    <i class="bi bi-check-circle-fill me-1"></i> <c:out value="${successMessage}" />
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger alert-dismissible fade show small" role="alert">
                    <i class="bi bi-exclamation-circle-fill me-1"></i> <c:out value="${errorMessage}" />
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>

            <div class="row g-4">
                <%-- Left Account Summary Card --%>
                <div class="col-lg-4">
                    <div class="saas-card p-4 text-center">
                        <div class="user-avatar mx-auto mb-3" style="width:72px;height:72px;font-size:1.5rem;border-radius:18px;">
                            <c:out value="${sessionScope.user.initials}" />
                        </div>
                        <h5 class="fw-bold mb-1"><c:out value="${sessionScope.user.name}" /></h5>
                        <div class="text-muted small mb-2"><c:out value="${sessionScope.user.email}" /></div>
                        <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-3">
                            <c:out value="${sessionScope.user.roleLabel}" />
                        </span>

                        <hr class="my-3" />

                        <div class="text-start small d-flex flex-column gap-2">
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Sign-In Method</span>
                                <span class="fw-semibold"><c:out value="${sessionScope.user.authProvider == 'GOOGLE' ? 'Google Sign-In' : 'Email & Password'}" /></span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Student / Staff ID</span>
                                <span class="fw-semibold"><c:out value="${not empty sessionScope.user.studentId ? sessionScope.user.studentId : '—'}" /></span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Department</span>
                                <span class="fw-semibold"><c:out value="${not empty sessionScope.user.department ? sessionScope.user.department : '—'}" /></span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Member Since</span>
                                <span class="fw-semibold">
                                    <fmt:formatDate value="${sessionScope.user.createdAt}" pattern="MMM dd, yyyy" />
                                </span>
                            </div>
                            <c:if test="${not empty stats}">
                                <div class="d-flex justify-content-between">
                                    <span class="text-muted">${sessionScope.user.admin ? 'Total System Complaints' : 'My Complaints'}</span>
                                    <span class="fw-bold text-primary"><c:out value="${stats.total}" default="0" /></span>
                                </div>
                            </c:if>
                        </div>
                    </div>
                </div>

                <%-- Right Edit Forms --%>
                <div class="col-lg-8">
                    <div class="saas-card p-4 mb-4">
                        <h5 class="fw-bold mb-1">Personal Information</h5>
                        <p class="text-muted small mb-3">Update your display name, ID, or academic department.</p>

                        <form action="${pageContext.request.contextPath}/profile" method="post" class="needs-validation" novalidate>
                            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}" />
                            <input type="hidden" name="action" value="updateProfile" />

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label for="profileName" class="form-label">Full Name <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="profileName" name="name"
                                           value="<c:out value='${sessionScope.user.name}' />" minlength="2" maxlength="100" required />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Email Address</label>
                                    <input type="email" class="form-control bg-light" value="<c:out value='${sessionScope.user.email}' />" readonly />
                                </div>
                            </div>

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label for="profileStudentId" class="form-label">Student / Staff ID</label>
                                    <input type="text" class="form-control" id="profileStudentId" name="studentId"
                                           value="<c:out value='${sessionScope.user.studentId}' />" maxlength="50" />
                                </div>
                                <div class="col-md-6">
                                    <label for="profileDept" class="form-label">Department</label>
                                    <input type="text" class="form-control" id="profileDept" name="department"
                                           value="<c:out value='${sessionScope.user.department}' />" maxlength="100" />
                                </div>
                            </div>

                            <button type="submit" class="btn btn-navy">Save Profile Changes</button>
                        </form>
                    </div>

                    <div class="saas-card p-4">
                        <h5 class="fw-bold mb-1">${hasLocalPassword ? 'Change Password' : 'Set Local Password'}</h5>
                        <p class="text-muted small mb-3">
                            <c:choose>
                                <c:when test="${hasLocalPassword}">Passwords are encrypted with BCrypt before storage.</c:when>
                                <c:otherwise>Your account currently uses Google Sign-In. You can optionally set a local password below.</c:otherwise>
                            </c:choose>
                        </p>

                        <form action="${pageContext.request.contextPath}/profile" method="post" class="needs-validation" novalidate>
                            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}" />
                            <input type="hidden" name="action" value="changePassword" />

                            <c:if test="${hasLocalPassword}">
                                <div class="mb-3">
                                    <label for="currentPassword" class="form-label">Current Password</label>
                                    <input type="password" class="form-control" id="currentPassword" name="currentPassword" required />
                                </div>
                            </c:if>
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label for="newPassword" class="form-label">New Password</label>
                                    <input type="password" class="form-control" id="newPassword" name="newPassword" minlength="6" maxlength="72" required />
                                </div>
                                <div class="col-md-6">
                                    <label for="confirmNewPassword" class="form-label">Confirm New Password</label>
                                    <input type="password" class="form-control" id="confirmNewPassword" name="confirmPassword" minlength="6" maxlength="72" required />
                                </div>
                            </div>

                            <button type="submit" class="btn btn-outline-navy">${hasLocalPassword ? 'Update Password' : 'Set Password'}</button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>

<jsp:include page="/WEB-INF/views/includes/scripts.jsp" />
</body>
</html>
