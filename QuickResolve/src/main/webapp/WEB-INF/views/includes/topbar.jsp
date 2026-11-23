<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<header class="app-topbar">
    <div class="d-flex align-items-center gap-3">
        <button class="btn btn-outline-secondary d-lg-none btn-sm" type="button"
                data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar" aria-controls="mobileSidebar">
            <i class="bi bi-list fs-5"></i>
        </button>
        <div>
            <h1 class="h5 mb-0 fw-bold text-dark">
                <c:out value="${param.pageTitle}" />
            </h1>
            <c:if test="${not empty param.pageSubtitle}">
                <div class="text-muted small d-none d-sm-block">
                    <c:out value="${param.pageSubtitle}" />
                </div>
            </c:if>
        </div>
    </div>

    <div class="d-flex align-items-center gap-3">
        <c:if test="${sessionScope.user.student}">
            <a href="${pageContext.request.contextPath}/student/submit"
               class="btn btn-navy btn-sm d-none d-md-inline-flex align-items-center gap-1">
                <i class="bi bi-plus-lg"></i>
                <span>New Complaint</span>
            </a>
        </c:if>
        <a href="${pageContext.request.contextPath}/profile" class="d-flex align-items-center gap-2 text-decoration-none text-dark">
            <div class="user-avatar">
                <c:out value="${sessionScope.user.initials}" />
            </div>
            <div class="d-none d-sm-block text-start">
                <div class="fw-semibold small lh-sm"><c:out value="${sessionScope.user.name}" /></div>
                <div class="text-muted" style="font-size: 0.72rem;"><c:out value="${sessionScope.user.email}" /></div>
            </div>
        </a>
    </div>
</header>
