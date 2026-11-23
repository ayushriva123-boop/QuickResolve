<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<%-- Desktop Fixed Sidebar --%>
<aside class="app-sidebar">
    <a href="${pageContext.request.contextPath}/" class="sidebar-brand">
        <img src="${pageContext.request.contextPath}/assets/images/logo.svg" alt="QuickResolve" width="34" height="34" />
        <div>
            <div class="fw-bold fs-6 lh-sm">QuickResolve</div>
            <div class="small text-white-50" style="font-size: 0.72rem;">Campus Grievance Portal</div>
        </div>
    </a>

    <div class="sidebar-section-label">
        <c:choose>
            <c:when test="${sessionScope.user.mainAdmin}">Main Administration</c:when>
            <c:when test="${sessionScope.user.admin}">Administration</c:when>
            <c:otherwise>Student Workspace</c:otherwise>
        </c:choose>
    </div>

    <ul class="sidebar-nav">
        <c:choose>
            <c:when test="${sessionScope.user.admin}">
                <c:if test="${sessionScope.user.mainAdmin}">
                    <li>
                        <a href="${pageContext.request.contextPath}/main-admin/users"
                           class="sidebar-link ${activeNav == 'main-admin-users' ? 'active' : ''}">
                            <i class="bi bi-person-badge-fill"></i>
                            <span>User &amp; Role Management</span>
                        </a>
                    </li>
                </c:if>
                <li>
                    <a href="${pageContext.request.contextPath}/admin/dashboard"
                       class="sidebar-link ${activeNav == 'dashboard' ? 'active' : ''}">
                        <i class="bi bi-grid-1x2-fill"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li>
                    <a href="${pageContext.request.contextPath}/admin/complaints"
                       class="sidebar-link ${activeNav == 'complaints' ? 'active' : ''}">
                        <i class="bi bi-kanban-fill"></i>
                        <span>Manage Complaints</span>
                    </a>
                </li>
                <li>
                    <a href="${pageContext.request.contextPath}/admin/students"
                       class="sidebar-link ${activeNav == 'students' ? 'active' : ''}">
                        <i class="bi bi-people-fill"></i>
                        <span>Registered Students</span>
                    </a>
                </li>
            </c:when>
            <c:otherwise>
                <li>
                    <a href="${pageContext.request.contextPath}/student/dashboard"
                       class="sidebar-link ${activeNav == 'dashboard' ? 'active' : ''}">
                        <i class="bi bi-grid-1x2-fill"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li>
                    <a href="${pageContext.request.contextPath}/student/submit"
                       class="sidebar-link ${activeNav == 'submit' ? 'active' : ''}">
                        <i class="bi bi-plus-circle-fill"></i>
                        <span>Submit Complaint</span>
                    </a>
                </li>
                <li>
                    <a href="${pageContext.request.contextPath}/student/complaints"
                       class="sidebar-link ${activeNav == 'complaints' ? 'active' : ''}">
                        <i class="bi bi-journal-text"></i>
                        <span>My Complaints</span>
                    </a>
                </li>
            </c:otherwise>
        </c:choose>

        <li class="mt-3 pt-2 border-top border-light border-opacity-10">
            <a href="${pageContext.request.contextPath}/profile"
               class="sidebar-link ${activeNav == 'profile' ? 'active' : ''}">
                <i class="bi bi-person-gear"></i>
                <span>My Profile</span>
            </a>
        </li>
    </ul>

    <div class="sidebar-footer">
        <div class="d-flex align-items-center gap-2 mb-3">
            <div class="user-avatar bg-primary">
                <c:out value="${sessionScope.user.initials}" />
            </div>
            <div class="min-w-0">
                <div class="fw-semibold text-white text-truncate small">
                    <c:out value="${sessionScope.user.name}" />
                </div>
                <div class="text-white-50 text-truncate" style="font-size: 0.74rem;">
                    <c:out value="${sessionScope.user.roleLabel}" />
                </div>
            </div>
        </div>
        <form action="${pageContext.request.contextPath}/logout" method="post">
            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}" />
            <button type="submit" class="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center gap-2">
                <i class="bi bi-box-arrow-right"></i>
                <span>Sign Out</span>
            </button>
        </form>
    </div>
</aside>

<%-- Mobile Offcanvas Drawer --%>
<div class="offcanvas offcanvas-start mobile-sidebar" tabindex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
    <div class="offcanvas-header border-bottom border-light border-opacity-10">
        <div class="d-flex align-items-center gap-2" id="mobileSidebarLabel">
            <img src="${pageContext.request.contextPath}/assets/images/logo.svg" alt="QuickResolve" width="30" height="30" />
            <span class="fw-bold">QuickResolve</span>
        </div>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body d-flex flex-column p-3">
        <ul class="list-unstyled flex-grow-1 mb-3">
            <c:choose>
                <c:when test="${sessionScope.user.admin}">
                    <c:if test="${sessionScope.user.mainAdmin}">
                        <li><a href="${pageContext.request.contextPath}/main-admin/users" class="sidebar-link ${activeNav == 'main-admin-users' ? 'active' : ''}"><i class="bi bi-person-badge-fill"></i><span>User &amp; Role Management</span></a></li>
                    </c:if>
                    <li><a href="${pageContext.request.contextPath}/admin/dashboard" class="sidebar-link ${activeNav == 'dashboard' ? 'active' : ''}"><i class="bi bi-grid-1x2-fill"></i><span>Dashboard</span></a></li>
                    <li><a href="${pageContext.request.contextPath}/admin/complaints" class="sidebar-link ${activeNav == 'complaints' ? 'active' : ''}"><i class="bi bi-kanban-fill"></i><span>Manage Complaints</span></a></li>
                    <li><a href="${pageContext.request.contextPath}/admin/students" class="sidebar-link ${activeNav == 'students' ? 'active' : ''}"><i class="bi bi-people-fill"></i><span>Registered Students</span></a></li>
                </c:when>
                <c:otherwise>
                    <li><a href="${pageContext.request.contextPath}/student/dashboard" class="sidebar-link ${activeNav == 'dashboard' ? 'active' : ''}"><i class="bi bi-grid-1x2-fill"></i><span>Dashboard</span></a></li>
                    <li><a href="${pageContext.request.contextPath}/student/submit" class="sidebar-link ${activeNav == 'submit' ? 'active' : ''}"><i class="bi bi-plus-circle-fill"></i><span>Submit Complaint</span></a></li>
                    <li><a href="${pageContext.request.contextPath}/student/complaints" class="sidebar-link ${activeNav == 'complaints' ? 'active' : ''}"><i class="bi bi-journal-text"></i><span>My Complaints</span></a></li>
                </c:otherwise>
            </c:choose>
            <li class="mt-2 pt-2 border-top border-light border-opacity-10">
                <a href="${pageContext.request.contextPath}/profile" class="sidebar-link ${activeNav == 'profile' ? 'active' : ''}"><i class="bi bi-person-gear"></i><span>My Profile</span></a>
            </li>
        </ul>
        <form action="${pageContext.request.contextPath}/logout" method="post">
            <input type="hidden" name="csrfToken" value="${sessionScope.csrfToken}" />
            <button type="submit" class="btn btn-outline-light btn-sm w-100">
                <i class="bi bi-box-arrow-right me-1"></i> Sign Out
            </button>
        </form>
    </div>
</div>
