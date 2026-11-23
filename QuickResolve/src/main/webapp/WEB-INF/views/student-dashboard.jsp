<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Student Dashboard – QuickResolve</title>
    <jsp:include page="/WEB-INF/views/includes/head-assets.jsp" />
</head>
<body>

<div class="app-shell">
    <jsp:include page="/WEB-INF/views/includes/sidebar.jsp" />

    <div class="app-main">
        <jsp:include page="/WEB-INF/views/includes/topbar.jsp">
            <jsp:param name="pageTitle" value="Student Dashboard" />
            <jsp:param name="pageSubtitle" value="Overview of your campus complaints and resolution progress" />
        </jsp:include>

        <main class="app-content">
            <c:if test="${param.error == 'unauthorized'}">
                <div class="alert alert-warning alert-dismissible fade show small" role="alert">
                    <i class="bi bi-shield-exclamation me-1"></i> Administrator permissions are required for that section.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger small"><c:out value="${errorMessage}" /></div>
            </c:if>

            <%-- Welcome Banner --%>
            <div class="saas-card p-4 mb-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
                 style="background: linear-gradient(120deg, #0B1F4D 0%, #1B3F91 100%); color: #fff;">
                <div>
                    <h4 class="fw-bold mb-1">Welcome back, <c:out value="${sessionScope.user.name}" />!</h4>
                    <p class="text-white-50 mb-0 small">
                        Track your submitted complaints or report a new campus issue with photo proof.
                    </p>
                </div>
                <div class="d-flex gap-2 flex-shrink-0">
                    <a href="${pageContext.request.contextPath}/student/submit" class="btn btn-light fw-semibold text-primary">
                        <i class="bi bi-plus-circle-fill me-1"></i> Submit Complaint
                    </a>
                    <a href="${pageContext.request.contextPath}/student/complaints" class="btn btn-outline-light fw-semibold">
                        View All
                    </a>
                </div>
            </div>

            <%-- Statistic Cards --%>
            <div class="row g-3 g-md-4 mb-4">
                <div class="col-6 col-xl-3">
                    <div class="stat-card">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="stat-label">Total Submitted</span>
                            <span class="icon-tile icon-tile-navy" style="width:38px;height:38px;font-size:1.1rem;">
                                <i class="bi bi-folder2-open"></i>
                            </span>
                        </div>
                        <div class="stat-value tabular-nums"><c:out value="${stats.total}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-xl-3">
                    <div class="stat-card">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="stat-label">Pending</span>
                            <span class="icon-tile" style="width:38px;height:38px;font-size:1.1rem;background:#FEF3C7;color:#B45309;">
                                <i class="bi bi-hourglass-split"></i>
                            </span>
                        </div>
                        <div class="stat-value tabular-nums"><c:out value="${stats.pending}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-xl-3">
                    <div class="stat-card">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="stat-label">In Progress</span>
                            <span class="icon-tile" style="width:38px;height:38px;font-size:1.1rem;background:#DBEAFE;color:#1D4ED8;">
                                <i class="bi bi-arrow-repeat"></i>
                            </span>
                        </div>
                        <div class="stat-value tabular-nums"><c:out value="${stats.inProgress}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-xl-3">
                    <div class="stat-card">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="stat-label">Resolved</span>
                            <span class="icon-tile" style="width:38px;height:38px;font-size:1.1rem;background:#D1FAE5;color:#047857;">
                                <i class="bi bi-check2-circle"></i>
                            </span>
                        </div>
                        <div class="stat-value tabular-nums"><c:out value="${stats.resolved}" default="0" /></div>
                    </div>
                </div>
            </div>

            <%-- Recent Complaints Table --%>
            <div class="saas-card overflow-hidden">
                <div class="d-flex align-items-center justify-content-between p-4 border-bottom">
                    <div>
                        <h5 class="fw-bold mb-0">Recent Complaints</h5>
                        <div class="text-muted small">Your latest 5 submitted campus grievances</div>
                    </div>
                    <a href="${pageContext.request.contextPath}/student/complaints" class="btn btn-sm btn-outline-navy">
                        Full History
                    </a>
                </div>

                <c:choose>
                    <c:when test="${empty recentComplaints}">
                        <div class="text-center py-5 px-3">
                            <div class="icon-tile icon-tile-navy mx-auto mb-3"><i class="bi bi-inbox"></i></div>
                            <h6 class="fw-bold">No complaints submitted yet</h6>
                            <p class="text-muted small mb-3">Have an issue on campus? Report it with photo proof so our team can help.</p>
                            <a href="${pageContext.request.contextPath}/student/submit" class="btn btn-navy btn-sm">
                                Submit Your First Complaint
                            </a>
                        </div>
                    </c:when>
                    <c:otherwise>
                        <div class="table-responsive">
                            <table class="table table-modern mb-0">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Proof</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                        <th class="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <c:forEach var="c" items="${recentComplaints}">
                                        <tr>
                                            <td class="fw-semibold text-muted"><c:out value="${c.formattedId}" /></td>
                                            <td class="fw-semibold text-dark"><c:out value="${c.title}" /></td>
                                            <td><c:out value="${c.category}" /></td>
                                            <td>
                                                <c:choose>
                                                    <c:when test="${c.hasProofImage}">
                                                        <span class="badge bg-primary-subtle text-primary"><i class="bi bi-image me-1"></i>Attached</span>
                                                    </c:when>
                                                    <c:otherwise><span class="text-muted small">&mdash;</span></c:otherwise>
                                                </c:choose>
                                            </td>
                                            <td>
                                                <c:choose>
                                                    <c:when test="${c.status == 'Resolved'}"><span class="badge-status badge-status-resolved">Resolved</span></c:when>
                                                    <c:when test="${c.status == 'In Progress'}"><span class="badge-status badge-status-progress">In Progress</span></c:when>
                                                    <c:otherwise><span class="badge-status badge-status-pending">Pending</span></c:otherwise>
                                                </c:choose>
                                            </td>
                                            <td class="text-muted small">
                                                <fmt:formatDate value="${c.createdAt}" pattern="MMM dd, yyyy" />
                                            </td>
                                            <td class="text-end">
                                                <button type="button" class="btn btn-sm btn-light border"
                                                        data-view-complaint="true"
                                                        data-detail-url="${pageContext.request.contextPath}/student/complaint-detail?id=${c.id}">
                                                    <i class="bi bi-eye me-1"></i>Details
                                                </button>
                                            </td>
                                        </tr>
                                    </c:forEach>
                                </tbody>
                            </table>
                        </div>
                    </c:otherwise>
                </c:choose>
            </div>
        </main>
    </div>
</div>

<jsp:include page="/WEB-INF/views/includes/complaint-detail-modal.jsp" />
<jsp:include page="/WEB-INF/views/includes/scripts.jsp" />
</body>
</html>
