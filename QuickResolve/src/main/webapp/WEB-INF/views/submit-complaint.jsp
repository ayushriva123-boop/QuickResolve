<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Submit Complaint – QuickResolve</title>
    <jsp:include page="/WEB-INF/views/includes/head-assets.jsp" />
</head>
<body>

<div class="app-shell">
    <jsp:include page="/WEB-INF/views/includes/sidebar.jsp" />

    <div class="app-main">
        <jsp:include page="/WEB-INF/views/includes/topbar.jsp">
            <jsp:param name="pageTitle" value="Submit a Complaint" />
            <jsp:param name="pageSubtitle" value="Describe the campus issue and attach a clear photo as proof" />
        </jsp:include>

        <main class="app-content">
            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="saas-card p-4">
                        <h5 class="fw-bold mb-1">Complaint Details &amp; Proof</h5>
                        <p class="text-muted small mb-4">All fields marked with <span class="text-danger">*</span> are required.</p>

                        <c:if test="${not empty errorMessage}">
                            <div class="alert alert-danger small">
                                <i class="bi bi-exclamation-circle-fill me-1"></i> <c:out value="${errorMessage}" />
                            </div>
                        </c:if>

                        <form action="${pageContext.request.contextPath}/student/submit?csrfToken=${sessionScope.csrfToken}"
                              method="post" enctype="multipart/form-data" class="needs-validation" novalidate>

                            <div class="mb-3">
                                <label for="title" class="form-label">Complaint Title <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="title" name="title"
                                       value="<c:out value='${enteredTitle}' />"
                                       placeholder="e.g. Broken AC unit in Computer Lab 3" minlength="5" maxlength="200" required />
                                <div class="invalid-feedback">Please provide a descriptive title (5–200 characters).</div>
                            </div>

                            <div class="mb-3">
                                <label for="category" class="form-label">Category <span class="text-danger">*</span></label>
                                <select class="form-select" id="category" name="category" required>
                                    <option value="">Select a category...</option>
                                    <c:forEach var="cat" items="${categories}">
                                        <option value="<c:out value='${cat}' />" ${enteredCategory == cat ? 'selected' : ''}>
                                            <c:out value="${cat}" />
                                        </option>
                                    </c:forEach>
                                </select>
                                <div class="invalid-feedback">Please select a category.</div>
                            </div>

                            <div class="mb-3">
                                <label for="description" class="form-label">Detailed Description <span class="text-danger">*</span></label>
                                <textarea class="form-control" id="description" name="description" rows="5"
                                          placeholder="Include exact location (building/room/hostel), when the issue started, and how it affects students..."
                                          minlength="15" maxlength="4000" required><c:out value="${enteredDescription}" /></textarea>
                                <div class="invalid-feedback">Please describe the issue in at least 15 characters.</div>
                            </div>

                            <%-- Mandatory Proof Image Upload --%>
                            <div class="mb-4 p-3 rounded-3 border bg-light">
                                <label for="proofImage" class="form-label d-flex align-items-center gap-2">
                                    <i class="bi bi-camera-fill text-primary"></i>
                                    <span>Upload Proof Image <span class="text-danger">*</span></span>
                                </label>
                                <input type="file" class="form-control" id="proofImage" name="proofImage"
                                       accept="image/jpeg,image/png,image/webp,image/gif" required />
                                <div class="form-text">
                                    Attach a photo showing the campus issue (JPG, PNG, WEBP, or GIF &bull; max 5 MB).
                                </div>
                                <div class="invalid-feedback">Please attach a proof image before submitting.</div>
                                <div id="proofClientError" class="alert alert-danger py-2 px-3 small mt-2 mb-0 d-none"></div>

                                <div id="proofPreviewWrapper" class="mt-3 p-3 bg-white rounded-3 border text-center d-none">
                                    <div class="small fw-semibold text-muted mb-2">
                                        Selected Proof: <span id="proofFileName" class="text-dark"></span>
                                    </div>
                                    <img id="proofPreviewImg" alt="Proof Preview" class="img-fluid rounded-2" style="max-height: 240px; object-fit: contain;" />
                                </div>
                            </div>

                            <div class="d-flex flex-wrap gap-2">
                                <button type="submit" class="btn btn-navy px-4">
                                    <i class="bi bi-send-fill me-2"></i>Submit Complaint
                                </button>
                                <a href="${pageContext.request.contextPath}/student/dashboard" class="btn btn-light border px-4">
                                    Cancel
                                </a>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="saas-card p-4 mb-3">
                        <h6 class="fw-bold mb-3"><i class="bi bi-lightbulb text-warning me-2"></i>Tips for Faster Resolution</h6>
                        <ul class="small text-muted d-flex flex-column gap-2 ps-3 mb-0">
                            <li>Specify the exact building, floor, lab, or hostel room number.</li>
                            <li>Attach a clear, well-lit photo so maintenance or IT teams can verify the issue immediately.</li>
                            <li>Choose the closest category so it reaches the right campus department.</li>
                        </ul>
                    </div>

                    <div class="saas-card p-4">
                        <h6 class="fw-bold mb-2"><i class="bi bi-shield-check text-primary me-2"></i>Privacy &amp; Security</h6>
                        <p class="small text-muted mb-0">
                            Your complaint and uploaded proof image are only visible to you and authorized QuickResolve campus administrators.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>

<jsp:include page="/WEB-INF/views/includes/scripts.jsp" />
</body>
</html>
