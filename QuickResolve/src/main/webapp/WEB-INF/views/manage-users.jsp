<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>User &amp; Role Management – QuickResolve</title>
    <jsp:include page="/WEB-INF/views/includes/head-assets.jsp" />
</head>
<body>

<div class="app-shell">
    <jsp:include page="/WEB-INF/views/includes/sidebar.jsp" />

    <div class="app-main">
        <jsp:include page="/WEB-INF/views/includes/topbar.jsp">
            <jsp:param name="pageTitle" value="User & Role Management" />
            <jsp:param name="pageSubtitle" value="Main Admin control center to create user IDs and assign ADMIN or STUDENT roles" />
        </jsp:include>

        <main class="app-content">
            <c:if test="${param.success == 'created'}">
                <div class="alert alert-success alert-dismissible fade show small" role="alert">
                    <i class="bi bi-check-circle-fill me-1"></i> New user account created and role assigned successfully.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>
            <c:if test="${param.success == 'role_updated'}">
                <div class="alert alert-success alert-dismissible fade show small" role="alert">
                    <i class="bi bi-check-circle-fill me-1"></i> User role updated successfully.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>
            <c:if test="${param.success == 'deleted'}">
                <div class="alert alert-info alert-dismissible fade show small" role="alert">
                    <i class="bi bi-trash3-fill me-1"></i> User account deleted successfully.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger alert-dismissible fade show small" role="alert">
                    <i class="bi bi-exclamation-circle-fill me-1"></i> <c:out value="${errorMessage}" />
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>
            <c:if test="${not empty param.error}">
                <div class="alert alert-danger alert-dismissible fade show small" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>
                    <c:choose>
                        <c:when test="${param.error == 'self_modify'}">You cannot change or delete your own Main Admin account.</c:when>
                        <c:when test="${param.error == 'invalid_role'}">Role must be ADMIN or STUDENT.</c:when>
                        <c:when test="${param.error == 'protected_or_missing'}">Target account was not found or is a protected Main Admin account.</c:when>
                        <c:otherwise>Unable to complete the requested user management action.</c:otherwise>
                    </c:choose>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>

            <%-- Summary Metrics --%>
            <div class="row g-3 g-md-4 mb-4">
                <div class="col-6 col-lg-3">
                    <div class="stat-card">
                        <div class="stat-label mb-2">Total Accounts</div>
                        <div class="stat-value tabular-nums"><c:out value="${roleCounts.total}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stat-card">
                        <div class="stat-label mb-2 text-primary">Assigned Admins</div>
                        <div class="stat-value tabular-nums text-primary"><c:out value="${roleCounts.admins}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stat-card">
                        <div class="stat-label mb-2 text-success">Students</div>
                        <div class="stat-value tabular-nums text-success"><c:out value="${roleCounts.students}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="stat-card">
                        <div class="stat-label mb-2">Google Sign-In</div>
                        <div class="stat-value tabular-nums"><c:out value="${roleCounts.googleUsers}" default="0" /></div>
                    </div>
                </div>
            </div>

            <%-- Create New User ID & Assign Role Form --%>
            <div class="saas-card p-4 mb-4">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                    <div>
                        <h5 class="fw-bold mb-0"><i class="bi bi-person-plus-fill text-primary me-2"></i>Create User ID &amp; Assign Role</h5>
                        <div class="text-muted small">Create accounts for campus administrators or students and assign their access role immediately.</div>
                    </div>
                    <span class="badge badge-role-main px-3 py-2 rounded-pill fw-semibold">Main Admin Exclusive</span>
                </div>

                <form action="${pageContext.request.contextPath}/main-admin/create-user" method="post" class="row g-3 needs-validation" novalidate>
                    <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}" />

                    <div class="col-md-4">
                        <label for="newName" class="form-label">Full Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="newName" name="name"
                               value="<c:out value='${enteredName}' />"
                               placeholder="e.g. Prof. Rajesh Verma" minlength="2" maxlength="100" required />
                    </div>
                    <div class="col-md-4">
                        <label for="newEmail" class="form-label">Email Address <span class="text-danger">*</span></label>
                        <input type="email" class="form-control" id="newEmail" name="email"
                               value="<c:out value='${enteredEmail}' />"
                               placeholder="name@quickresolve.edu" maxlength="150" required />
                    </div>
                    <div class="col-md-4">
                        <label for="newPassword" class="form-label">Initial Password <span class="text-danger">*</span></label>
                        <input type="password" class="form-control" id="newPassword" name="password"
                               placeholder="Min 6 characters" minlength="6" maxlength="72" required />
                    </div>

                    <div class="col-md-3">
                        <label for="newRole" class="form-label">Assign Role <span class="text-danger">*</span></label>
                        <select class="form-select" id="newRole" name="role" required>
                            <option value="STUDENT" ${enteredRole == 'ADMIN' ? '' : 'selected'}>STUDENT</option>
                            <option value="ADMIN" ${enteredRole == 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label for="newStudentId" class="form-label">Student / Staff ID</label>
                        <input type="text" class="form-control" id="newStudentId" name="studentId"
                               value="<c:out value='${enteredStudentId}' />"
                               placeholder="e.g. ADM-102 or CS2026-05" maxlength="50" />
                    </div>
                    <div class="col-md-4">
                        <label for="newDepartment" class="form-label">Department</label>
                        <input type="text" class="form-control" id="newDepartment" name="department"
                               value="<c:out value='${enteredDepartment}' />"
                               placeholder="e.g. Hostel Affairs / Computer Science" maxlength="100" />
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button type="submit" class="btn btn-navy w-100">
                            <i class="bi bi-check2-circle me-1"></i> Create ID
                        </button>
                    </div>
                </form>
            </div>

            <%-- Directory of All Users with Role Assignment --%>
            <div class="saas-card overflow-hidden">
                <div class="d-flex align-items-center justify-content-between p-4 border-bottom">
                    <div>
                        <h5 class="fw-bold mb-0">All Campus Accounts &amp; Roles</h5>
                        <div class="text-muted small">Reassign ADMIN or STUDENT roles at any time. Google Sign-In users also inherit their assigned role here.</div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-modern mb-0">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>ID &amp; Department</th>
                                <th>Sign-In Method</th>
                                <th>Current Role</th>
                                <th>Assign Role</th>
                                <th class="text-end">Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            <c:forEach var="u" items="${users}">
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-2">
                                            <div class="user-avatar" style="width:36px;height:36px;font-size:0.78rem;">
                                                <c:out value="${u.initials}" />
                                            </div>
                                            <div>
                                                <div class="fw-semibold text-dark"><c:out value="${u.name}" /></div>
                                                <div class="text-muted small"><c:out value="${u.email}" /></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="small fw-medium"><c:out value="${not empty u.studentId ? u.studentId : '—'}" /></div>
                                        <div class="text-muted" style="font-size:0.76rem;"><c:out value="${not empty u.department ? u.department : '—'}" /></div>
                                    </td>
                                    <td>
                                        <c:choose>
                                            <c:when test="${u.authProvider == 'GOOGLE'}">
                                                <span class="badge bg-light text-dark border fw-semibold">
                                                    <i class="bi bi-google text-danger me-1"></i>Google
                                                </span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="badge bg-light text-secondary border fw-semibold">
                                                    <i class="bi bi-key me-1"></i>Password
                                                </span>
                                            </c:otherwise>
                                        </c:choose>
                                    </td>
                                    <td>
                                        <c:choose>
                                            <c:when test="${u.mainAdmin}">
                                                <span class="badge-status badge-role-main">MAIN ADMIN</span>
                                            </c:when>
                                            <c:when test="${u.role == 'ADMIN'}">
                                                <span class="badge-status badge-role-admin">ADMIN</span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="badge-status badge-role-student">STUDENT</span>
                                            </c:otherwise>
                                        </c:choose>
                                    </td>
                                    <td>
                                        <c:choose>
                                            <c:when test="${u.mainAdmin}">
                                                <span class="text-muted small fst-italic">Primary Root Account</span>
                                            </c:when>
                                            <c:otherwise>
                                                <form action="${pageContext.request.contextPath}/main-admin/assign-role" method="post" class="d-flex align-items-center gap-2">
                                                    <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}" />
                                                    <input type="hidden" name="userId" value="${u.id}" />
                                                    <select name="role" class="form-select form-select-sm" style="width: 126px;" aria-label="Role for ${u.name}">
                                                        <option value="STUDENT" ${u.role == 'STUDENT' ? 'selected' : ''}>STUDENT</option>
                                                        <option value="ADMIN" ${u.role == 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                                                    </select>
                                                    <button type="submit" class="btn btn-sm btn-outline-navy">Save</button>
                                                </form>
                                            </c:otherwise>
                                        </c:choose>
                                    </td>
                                    <td class="text-end">
                                        <c:choose>
                                            <c:when test="${u.mainAdmin}">
                                                <span class="text-muted small">&mdash;</span>
                                            </c:when>
                                            <c:otherwise>
                                                <form action="${pageContext.request.contextPath}/main-admin/delete-user" method="post" class="d-inline">
                                                    <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}" />
                                                    <input type="hidden" name="userId" value="${u.id}" />
                                                    <button type="submit" class="btn btn-sm btn-outline-danger" title="Delete User">
                                                        <i class="bi bi-trash3"></i>
                                                    </button>
                                                </form>
                                            </c:otherwise>
                                        </c:choose>
                                    </td>
                                </tr>
                            </c:forEach>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</div>

<jsp:include page="/WEB-INF/views/includes/scripts.jsp" />
</body>
</html>
