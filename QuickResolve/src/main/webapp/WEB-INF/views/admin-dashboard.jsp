<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Admin Dashboard – QuickResolve</title>
    <jsp:include page="/WEB-INF/views/includes/head-assets.jsp" />
</head>
<body>

<div class="app-shell">
    <jsp:include page="/WEB-INF/views/includes/sidebar.jsp" />

    <div class="app-main">
        <jsp:include page="/WEB-INF/views/includes/topbar.jsp">
            <jsp:param name="pageTitle" value="Administrator Dashboard" />
            <jsp:param name="pageSubtitle" value="Campus-wide grievance telemetry, proof verification &amp; resolution metrics" />
        </jsp:include>

        <main class="app-content">
            <c:if test="${param.error == 'unauthorized'}">
                <div class="alert alert-info alert-dismissible fade show small" role="alert">
                    Redirected to Administrator Dashboard.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger small"><c:out value="${errorMessage}" /></div>
            </c:if>

            <%-- KPI Stat Cards --%>
            <div class="row g-3 g-md-4 mb-4">
                <div class="col-6 col-lg-4 col-xl-2">
                    <div class="stat-card">
                        <div class="stat-label mb-2">Total Complaints</div>
                        <div class="stat-value tabular-nums"><c:out value="${stats.total}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-lg-4 col-xl-2">
                    <div class="stat-card">
                        <div class="stat-label mb-2 text-warning-emphasis">Pending</div>
                        <div class="stat-value tabular-nums text-warning-emphasis"><c:out value="${stats.pending}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-lg-4 col-xl-2">
                    <div class="stat-card">
                        <div class="stat-label mb-2 text-primary">In Progress</div>
                        <div class="stat-value tabular-nums text-primary"><c:out value="${stats.inProgress}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-lg-4 col-xl-2">
                    <div class="stat-card">
                        <div class="stat-label mb-2 text-success">Resolved</div>
                        <div class="stat-value tabular-nums text-success"><c:out value="${stats.resolved}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-lg-4 col-xl-2">
                    <div class="stat-card">
                        <div class="stat-label mb-2">With Proof</div>
                        <div class="stat-value tabular-nums"><c:out value="${stats.withProof}" default="0" /></div>
                    </div>
                </div>
                <div class="col-6 col-lg-4 col-xl-2">
                    <div class="stat-card">
                        <div class="stat-label mb-2">Students</div>
                        <div class="stat-value tabular-nums"><c:out value="${studentCount}" default="0" /></div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <%-- Recent Complaints --%>
                <div class="col-xl-8">
                    <div class="saas-card overflow-hidden h-100">
                        <div class="d-flex align-items-center justify-content-between p-4 border-bottom">
                            <div>
                                <h5 class="fw-bold mb-0">Latest Student Submissions</h5>
                                <div class="text-muted small">Click Details to inspect proof images or jump to Manage Complaints</div>
                            </div>
                            <a href="${pageContext.request.contextPath}/admin/complaints" class="btn btn-sm btn-navy">
                                Manage All
                            </a>
                        </div>

                        <div class="table-responsive">
                            <table class="table table-modern mb-0">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Complaint</th>
                                        <th>Student</th>
                                        <th>Proof</th>
                                        <th>Status</th>
                                        <th class="text-end">View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <c:choose>
                                        <c:when test="${empty recentComplaints}">
                                            <tr>
                                                <td colspan="6" class="text-center py-4 text-muted">No complaints recorded yet.</td>
                                            </tr>
                                        </c:when>
                                        <c:otherwise>
                                            <c:forEach var="c" items="${recentComplaints}">
                                                <tr>
                                                    <td class="fw-semibold text-muted"><c:out value="${c.formattedId}" /></td>
                                                    <td>
                                                        <div class="fw-semibold text-dark"><c:out value="${c.title}" /></div>
                                                        <div class="text-muted small"><c:out value="${c.category}" /></div>
                                                    </td>
                                                    <td>
                                                        <div class="small fw-medium"><c:out value="${c.studentName}" /></div>
                                                        <div class="text-muted" style="font-size:0.75rem;"><c:out value="${c.studentEmail}" /></div>
                                                    </td>
                                                    <td>
                                                        <c:choose>
                                                            <c:when test="${c.hasProofImage}">
                                                                <span class="badge bg-primary-subtle text-primary"><i class="bi bi-image me-1"></i>Proof</span>
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
                                                    <td class="text-end">
                                                        <button type="button" class="btn btn-sm btn-light border"
                                                                data-view-complaint="true"
                                                                data-detail-url="${pageContext.request.contextPath}/admin/complaint-detail?id=${c.id}">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            </c:forEach>
                                        </c:otherwise>
                                    </c:choose>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <%-- Category Breakdown --%>
                <div class="col-xl-4">
                    <div class="saas-card p-4 h-100">
                        <h5 class="fw-bold mb-1">By Category</h5>
                        <p class="text-muted small mb-4">Distribution across campus departments</p>

                        <c:choose>
                            <c:when test="${empty categoryBreakdown}">
                                <div class="text-muted small">No category data available yet.</div>
                            </c:when>
                            <c:otherwise>
                                <div class="d-flex flex-column gap-3">
                                    <c:forEach var="entry" items="${categoryBreakdown}">
                                        <div>
                                            <div class="d-flex justify-content-between small mb-1">
                                                <span class="fw-semibold text-dark"><c:out value="${entry.key}" /></span>
                                                <span class="text-muted tabular-nums"><c:out value="${entry.value}" /></span>
                                            </div>
                                            <div class="progress" style="height: 8px; border-radius: 999px;">
                                                <c:set var="pct" value="${stats.total > 0 ? (entry.value * 100 / stats.total) : 0}" />
                                                <div class="progress-bar bg-primary" role="progressbar" style="width: ${pct}%;"></div>
                                            </div>
                                        </div>
                                    </c:forEach>
                                </div>
                            </c:otherwise>
                        </c:choose>

                        <hr class="my-4" />
                        <div class="d-grid gap-2">
                            <a href="${pageContext.request.contextPath}/admin/complaints?status=Pending" class="btn btn-outline-navy btn-sm">
                                Review Pending Complaints
                            </a>
                            <a href="${pageContext.request.contextPath}/admin/students" class="btn btn-light border btn-sm">
                                View Registered Students
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>

<jsp:include page="/WEB-INF/views/includes/complaint-detail-modal.jsp" />
<jsp:include page="/WEB-INF/views/includes/scripts.jsp" />
</body>
</html>
