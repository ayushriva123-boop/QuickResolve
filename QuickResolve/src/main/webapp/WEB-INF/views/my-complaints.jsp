<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>My Complaints – QuickResolve</title>
    <jsp:include page="/WEB-INF/views/includes/head-assets.jsp" />
</head>
<body>

<div class="app-shell">
    <jsp:include page="/WEB-INF/views/includes/sidebar.jsp" />

    <div class="app-main">
        <jsp:include page="/WEB-INF/views/includes/topbar.jsp">
            <jsp:param name="pageTitle" value="My Complaints" />
            <jsp:param name="pageSubtitle" value="Search, filter, and track every grievance you have submitted" />
        </jsp:include>

        <main class="app-content">
            <c:if test="${param.success == 'created'}">
                <div class="alert alert-success alert-dismissible fade show small" role="alert">
                    <i class="bi bi-check-circle-fill me-1"></i> Your complaint and proof image have been submitted for administrative review.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger small"><c:out value="${errorMessage}" /></div>
            </c:if>

            <%-- Search & Status Filter Bar --%>
            <div class="saas-card p-3 mb-4">
                <form action="${pageContext.request.contextPath}/student/complaints" method="get" class="row g-2 align-items-center">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                            <input type="text" class="form-control border-start-0" name="search"
                                   value="<c:out value='${searchQuery}' />"
                                   placeholder="Search by title, category, or keywords..." />
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select name="status" class="form-select">
                            <option value="ALL" ${statusFilter == 'ALL' ? 'selected' : ''}>All Statuses</option>
                            <c:forEach var="st" items="${statuses}">
                                <option value="<c:out value='${st}' />" ${statusFilter == st ? 'selected' : ''}>
                                    <c:out value="${st}" />
                                </option>
                            </c:forEach>
                        </select>
                    </div>
                    <div class="col-md-3 d-flex gap-2">
                        <button type="submit" class="btn btn-navy flex-grow-1">Apply Filter</button>
                        <a href="${pageContext.request.contextPath}/student/complaints" class="btn btn-light border">Reset</a>
                    </div>
                </form>
            </div>

            <%-- Complaints Table --%>
            <div class="saas-card overflow-hidden">
                <div class="d-flex align-items-center justify-content-between p-4 border-bottom">
                    <h5 class="fw-bold mb-0">Complaint History</h5>
                    <a href="${pageContext.request.contextPath}/student/submit" class="btn btn-sm btn-navy">
                        <i class="bi bi-plus-lg me-1"></i> New Complaint
                    </a>
                </div>

                <c:choose>
                    <c:when test="${empty complaints}">
                        <div class="text-center py-5 px-3">
                            <div class="icon-tile icon-tile-navy mx-auto mb-3"><i class="bi bi-search"></i></div>
                            <h6 class="fw-bold">No matching complaints found</h6>
                            <p class="text-muted small mb-3">Try clearing your filters or submit a new complaint.</p>
                            <a href="${pageContext.request.contextPath}/student/submit" class="btn btn-navy btn-sm">Submit Complaint</a>
                        </div>
                    </c:when>
                    <c:otherwise>
                        <div class="table-responsive">
                            <table class="table table-modern mb-0">
                                <thead>
                                    <tr>
                                        <th>Ref ID</th>
                                        <th>Title &amp; Description</th>
                                        <th>Category</th>
                                        <th>Proof</th>
                                        <th>Status</th>
                                        <th>Updated</th>
                                        <th class="text-end">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <c:forEach var="c" items="${complaints}">
                                        <tr>
                                            <td class="fw-semibold text-muted"><c:out value="${c.formattedId}" /></td>
                                            <td style="max-width: 320px;">
                                                <div class="fw-semibold text-dark text-truncate"><c:out value="${c.title}" /></div>
                                                <div class="text-muted small text-truncate"><c:out value="${c.description}" /></div>
                                            </td>
                                            <td><c:out value="${c.category}" /></td>
                                            <td>
                                                <c:choose>
                                                    <c:when test="${c.hasProofImage}">
                                                        <span class="badge bg-primary-subtle text-primary"><i class="bi bi-image me-1"></i>Image</span>
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
                                                <fmt:formatDate value="${c.updatedAt}" pattern="MMM dd, yyyy" />
                                            </td>
                                            <td class="text-end">
                                                <button type="button" class="btn btn-sm btn-outline-navy"
                                                        data-view-complaint="true"
                                                        data-detail-url="${pageContext.request.contextPath}/student/complaint-detail?id=${c.id}">
                                                    <i class="bi bi-eye me-1"></i>View
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
