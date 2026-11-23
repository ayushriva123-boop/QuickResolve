<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<%-- Shared Complaint Detail Modal (populated safely via app.js textContent) --%>
<div class="modal fade" id="complaintDetailModal" tabindex="-1" aria-labelledby="complaintDetailModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
            <div class="modal-header border-bottom px-4 py-3">
                <div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge bg-light text-dark border fw-semibold" id="detailFormattedId">QR-0000</span>
                        <span class="badge-status badge-status-pending" id="detailStatusBadge">Pending</span>
                    </div>
                    <h5 class="modal-title fw-bold" id="complaintDetailModalLabel">
                        <span id="detailTitle">Complaint Details</span>
                    </h5>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
                <div class="row g-3 mb-3">
                    <div class="col-sm-4">
                        <div class="text-muted small fw-semibold">Category</div>
                        <div class="fw-medium" id="detailCategory">-</div>
                    </div>
                    <div class="col-sm-4">
                        <div class="text-muted small fw-semibold">Submitted On</div>
                        <div class="small" id="detailCreated">-</div>
                    </div>
                    <div class="col-sm-4">
                        <div class="text-muted small fw-semibold">Last Updated</div>
                        <div class="small" id="detailUpdated">-</div>
                    </div>
                </div>

                <c:if test="${sessionScope.user.admin}">
                    <div class="p-3 rounded-3 bg-light border mb-3" id="detailStudentRow">
                        <div class="text-muted small fw-semibold mb-1">Submitted By</div>
                        <div class="fw-semibold" id="detailStudentName">-</div>
                        <div class="text-muted small" id="detailStudentEmail">-</div>
                    </div>
                </c:if>

                <div class="mb-3">
                    <div class="text-muted small fw-semibold mb-1">Description</div>
                    <div class="p-3 rounded-3 border bg-white" style="white-space: pre-wrap;" id="detailDescription">-</div>
                </div>

                <div id="detailProofSection" class="mb-3 d-none">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="text-muted small fw-semibold"><i class="bi bi-image me-1"></i>Attached Proof Image</div>
                        <a id="detailProofLink" href="#" target="_blank" rel="noopener" class="small fw-semibold text-decoration-none">
                            Open Full Image <i class="bi bi-box-arrow-up-right ms-1"></i>
                        </a>
                    </div>
                    <div class="p-2 rounded-3 border bg-light text-center">
                        <img id="detailProofImg" alt="Complaint Proof" class="img-fluid rounded-2" style="max-height: 320px; object-fit: contain;" />
                    </div>
                </div>

                <div id="detailProofEmpty" class="mb-3 text-muted small fst-italic">
                    <i class="bi bi-image me-1"></i>No proof image attached to this complaint.
                </div>

                <div>
                    <div class="text-muted small fw-semibold mb-1">Administration Remarks</div>
                    <div class="p-3 rounded-3 border bg-light text-dark" style="white-space: pre-wrap;" id="detailRemarks">-</div>
                </div>
            </div>
            <div class="modal-footer border-top px-4 py-3">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
