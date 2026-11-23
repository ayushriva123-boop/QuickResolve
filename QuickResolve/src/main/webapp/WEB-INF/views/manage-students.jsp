<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Registered Students – QuickResolve</title>
    <jsp:include page="/WEB-INF/views/includes/head-assets.jsp" />
</head>
<body>

<div class="app-shell">
    <jsp:include page="/WEB-INF/views/includes/sidebar.jsp" />

    <div class="app-main">
        <jsp:include page="/WEB-INF/views/includes/topbar.jsp">
            <jsp:param name="pageTitle" value="Registered Students" />
            <jsp:param name="pageSubtitle" value="Directory of student accounts and their grievance activity" />
        </jsp:include>

        <main class="app-content">
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger small"><c:out value="${errorMessage}" /></div>
            </c:if>

            <div class="saas-card overflow-hidden">
                <div class="d-flex align-items-center justify-content-between p-4 border-bottom">
                    <div>
                        <h5 class="fw-bold mb-0">Student Accounts</h5>
                        <div class="text-muted small">All registered students in QuickResolve</div>
                    </div>
                    <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold">
                        Total: <c:out value="${students.size()}" default="0" />
                    </span>
                </div>

                <div class="table-responsive">
                    <table class="table table-modern mb-0">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Student ID</th>
                                <th>Department</th>
                                <th>Total Complaints</th>
                                <th>Open Cases</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            <c:choose>
                                <c:when test="${empty students}">
                                    <tr>
                                        <td colspan="6" class="text-center py-5 text-muted">No students registered yet.</td>
                                    </tr>
                                </c:when>
                                <c:otherwise>
                                    <c:forEach var="s" items="${students}">
                                        <tr>
                                            <td>
                                                <div class="d-flex align-items-center gap-2">
                                                    <div class="user-avatar" style="width:34px;height:34px;font-size:0.78rem;">
                                                        <c:out value="${s.initials}" />
                                                    </div>
                                                    <div>
                                                        <div class="fw-semibold text-dark"><c:out value="${s.name}" /></div>
                                                        <div class="text-muted small"><c:out value="${s.email}" /></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><c:out value="${not empty s.studentId ? s.studentId : '—'}" /></td>
                                            <td><c:out value="${not empty s.department ? s.department : '—'}" /></td>
                                            <td class="fw-semibold tabular-nums"><c:out value="${s.totalComplaints}" /></td>
                                            <td>
                                                <c:choose>
                                                    <c:when test="${s.openComplaints > 0}">
                                                        <span class="badge-status badge-status-pending"><c:out value="${s.openComplaints}" /> Open</span>
                                                    </c:when>
                                                    <c:otherwise>
                                                        <span class="badge-status badge-status-resolved">0 Open</span>
                                                    </c:otherwise>
                                                </c:choose>
                                            </td>
                                            <td class="text-muted small">
                                                <fmt:formatDate value="${s.createdAt}" pattern="MMM dd, yyyy" />
                                            </td>
                                        </tr>
                                    </c:forEach>
                                </c:otherwise>
                            </c:choose>
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
