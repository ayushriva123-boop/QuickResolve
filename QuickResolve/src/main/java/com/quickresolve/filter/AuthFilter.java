package com.quickresolve.filter;

import com.quickresolve.model.User;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Enforces UTF-8 encoding, CSRF token initialization/validation,
 * session authentication, and role-based route protection (MAIN_ADMIN, ADMIN, STUDENT).
 */
@WebFilter("/*")
public class AuthFilter implements Filter {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");

        // Security headers
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        String contextPath = request.getContextPath();
        String uri = request.getRequestURI();
        String path = uri.substring(contextPath.length());

        // Static assets do not require session or auth checks
        if (path.startsWith("/assets/") || path.equals("/favicon.ico")) {
            chain.doFilter(request, response);
            return;
        }

        // Ensure a CSRF token exists in session for forms
        HttpSession session = request.getSession(true);
        if (session.getAttribute("csrfToken") == null) {
            byte[] bytes = new byte[24];
            RANDOM.nextBytes(bytes);
            session.setAttribute("csrfToken", HexFormat.of().formatHex(bytes));
        }

        boolean isMainAdminRoute = path.startsWith("/main-admin/");
        boolean isStudentRoute = path.startsWith("/student/");
        boolean isAdminRoute = path.startsWith("/admin/");
        boolean isProfileRoute = path.equals("/profile");
        boolean isProofRoute = path.equals("/complaint-proof");
        boolean isProtectedRoute = isMainAdminRoute || isStudentRoute || isAdminRoute || isProfileRoute || isProofRoute;

        if (isProtectedRoute) {
            // Prevent browser caching of authenticated pages after logout
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.setDateHeader("Expires", 0);

            User currentUser = (User) session.getAttribute("user");
            if (currentUser == null) {
                response.sendRedirect(contextPath + "/login?error=auth");
                return;
            }

            // Role-based access control
            if (isMainAdminRoute && !currentUser.isMainAdmin()) {
                String fallback = currentUser.isAdmin() ? "/admin/dashboard?error=unauthorized" : "/student/dashboard?error=unauthorized";
                response.sendRedirect(contextPath + fallback);
                return;
            }
            if (isAdminRoute && !currentUser.isAdmin()) {
                response.sendRedirect(contextPath + "/student/dashboard?error=unauthorized");
                return;
            }
            if (isStudentRoute && !currentUser.isStudent()) {
                response.sendRedirect(contextPath + "/admin/dashboard?error=unauthorized");
                return;
            }

            // CSRF validation on state-changing POST requests to protected routes
            if ("POST".equalsIgnoreCase(request.getMethod())) {
                String sessionToken = (String) session.getAttribute("csrfToken");
                String paramToken = request.getParameter("csrfToken");
                String headerToken = request.getHeader("X-CSRF-Token");
                String submittedToken = (paramToken != null && !paramToken.isEmpty()) ? paramToken : headerToken;

                if (sessionToken == null || !sessionToken.equals(submittedToken)) {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid or missing security token.");
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }
}
