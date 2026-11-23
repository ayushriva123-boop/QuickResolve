<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Manage Complaints – QuickResolve</title>
    <jsp:include page="/WEB-INF/views/includes/head-assets.jsp" />
</head>
<body>

<div class="app-shell">
    <jsp:include page="/WEB-INF/views/includes/sidebar.jsp" />

    <div class="app-main">
        <jsp:include page="/WEB-INF/views/includes/topbar.jsp">
            <jsp:param name="pageTitle" value="Manage Complaints" />
            <jsp:param name="pageSubtitle" value="Search, filter, inspect proof images, update resolution status, or remove entries" />
        </jsp:include>

        <main class="app-content">
            <%-- Feedback Alerts --%>
            <c:if test="${param.success == 'updated'}">
                <div class="alert alert-success alert-dismissible fade show small" role="alert">
                    <i class="bi bi-check-circle-fill me-1"></i> Complaint status and remarks updated successfully.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>
            <c:if test="${param.success == 'deleted'}">
                <div class="alert alert-info alert-dismissible fade show small" role="alert">
                    <i class="bi bi-trash3-fill me-1"></i> Complaint has been deleted.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>
            <c:if test="${not empty param.error}">
                <div class="alert alert-danger alert-dismissible fade show small" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i> Unable to complete action (<c:out value="${param.error}" />).
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </c:if>

            <%-- Search & Filter Controls --%>
            <div class="saas-card p-3 mb-4">
                <form action="${pageContext.request.contextPath}/admin/complaints" method="get" class="row g-2 align-items-center">
                    <div class="col-lg-6">
                        <div class="input-group">
                            <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                            <input type="text" class="form-control border-start-0" name="search"
                                   value="<c:out value='${searchQuery}' />"
                                   placeholder="Search ID, title, student name or email..." />
                        </div>
                    </div>
                    <div class="col-sm-6 col-lg-3">
                        <select name="status" class="form-select">
                            <option value="ALL" ${statusFilter == 'ALL' ? 'selected' : ''}>All Statuses</option>
                            <c:forEach var="st" items="${statuses}">
                                <option value="<c:out value='${st}' />" ${statusFilter == st ? 'selected' : ''}>
                                    <c:out value="${st}" />
                                </option>
                            </c:forEach>
                        </select>
                    </div>
                    <div class="col-lg-3 d-flex gap-2">
                        <button type="submit" class="btn btn-navy flex-grow-1">Filter</button>
                        <a href="${pageContext.request.contextPath}/admin/complaints" class="btn btn-light border">Reset</a>
                    </div>
                </form>
            </div>

            <%-- Complaints Table --%>
            <div class="saas-card overflow-hidden">
                <div class="table-responsive">
                    <table class="table table-modern mb-0">
                        <thead>
                            <tr>
                                <th>Ref</th>
                                <th>Complaint &amp; Category</th>
                                <th>Student</th>
                                <th>Proof</th>
                                <th>Status</th>
                                <th>Submitted</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <c:choose>
                                <c:when test="${empty complaints}">
                                    <tr>
                                        <td colspan="7" class="text-center py-5 text-muted">
                                            No complaints match your current search or filter criteria.
                                        </td>
                                    </tr>
                                </c:when>
                                <c:otherwise>
                                    <c:forEach var="c" items="${complaints}">
                                        <tr>
                                            <td class="fw-semibold text-muted"><c:out value="${c.formattedId}" /></td>
                                            <td style="max-width: 280px;">
                                                <div class="fw-semibold text-dark text-truncate"><c:out value="${c.title}" /></div>
                                                <div class="text-muted small"><c:out value="${c.category}" /></div>
                                            </td>
                                            <td>
                                                <div class="fw-medium small"><c:out value="${c.studentName}" /></div>
                                                <div class="text-muted" style="font-size:0.75rem;"><c:out value="${c.studentEmail}" /></div>
                                            </td>
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
                                            <td class="text-end text-nowrap">
                                                <button type="button" class="btn btn-sm btn-light border me-1" title="View Details &amp; Proof"
                                                        data-view-complaint="true"
                                                        data-detail-url="${pageContext.request.contextPath}/admin/complaint-detail?id=${c.id}">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-outline-primary me-1" title="Update Status &amp; Remarks"
                                                        data-bs-toggle="modal" data-bs-target="#updateStatusModal"
                                                        data-edit-status="true"
                                                        data-id="${c.id}"
                                                        data-code="<c:out value='${c.formattedId}' />"
                                                        data-title="<c:out value='${c.title}' />"
                                                        data-status="<c:out value='${c.status}' />"
                                                        data-remarks="<c:out value='${c.adminRemarks}' />">
                                                    <i class="bi bi-pencil-square"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-outline-danger" title="Delete Complaint"
                                                        data-bs-toggle="modal" data-bs-target="#deleteComplaintModal"
                                                        data-delete-complaint="true"
                                                        data-id="${c.id}"
                                                        data-code="<c:out value='${c.formattedId}' />"
                                                        data-title="<c:out value='${c.title}' />">
                                                    <i class="bi bi-trash3"></i>
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
        </main>
    </div>
</div>

<%-- Update Status & Remarks Modal --%>
<div class="modal fade" id="updateStatusModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <form action="${pageContext.request.contextPath}/admin/update-status" method="post" class="modal-content border-0 shadow-lg" style="border-radius:16px;">
            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}" />
            <input type="hidden" id="statusComplaintId" name="complaintId" value="" />
            <div class="modal-header border-bottom">
                <div>
                    <span class="badge bg-light text-dark border mb-1" id="statusComplaintCode">QR-0000</span>
                    <h5 class="modal-title fw-bold">Update Resolution Status</h5>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p class="small text-muted mb-3">Complaint: <strong class="text-dark" id="statusComplaintTitle"></strong></p>
                <div class="mb-3">
                    <label for="statusSelect" class="form-label">Status</label>
                    <select class="form-select" id="statusSelect" name="status" required>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
                <div class="mb-2">
                    <label for="adminRemarksInput" class="form-label">Administrator Remarks</label>
                    <textarea class="form-control" id="adminRemarksInput" name="adminRemarks" rows="4"
                              placeholder="Explain actions taken, assigned team, or resolution details visible to the student..."></textarea>
                </div>
            </div>
            <div class="modal-footer border-top">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-navy">Save Status</button>
            </div>
        </form>
    </div>
</div>

<%-- Delete Complaint Modal --%>
<div class="modal fade" id="deleteComplaintModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <form action="${pageContext.request.contextPath}/admin/delete-complaint" method="post" class="modal-content border-0 shadow-lg" style="border-radius:16px;">
            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}" />
            <input type="hidden" id="deleteComplaintId" name="complaintId" value="" />
            <div class="modal-header border-bottom">
                <h5 class="modal-title fw-bold text-danger"><i class="bi bi-exclamation-triangle-fill me-2"></i>Delete Complaint</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p class="mb-2">Are you sure you want to permanently delete complaint <strong id="deleteComplaintCode"></strong>?</p>
                <p class="small text-muted mb-0" id="deleteComplaintTitle"></p>
            </div>
            <div class="modal-footer border-top">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-danger">Delete Permanently</button>
            </div>
        </form>
    </div>
</div>

<jsp:include page="/WEB-INF/views/includes/complaint-detail-modal.jsp" />
<jsp:include page="/WEB-INF/views/includes/scripts.jsp" />
</body>
</html>
