package com.quickresolve.controller;

import com.quickresolve.dao.ComplaintDAO;
import com.quickresolve.dao.UserDAO;
import com.quickresolve.model.User;
import com.quickresolve.util.PasswordUtil;
import com.quickresolve.util.ValidationUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

@WebServlet("/profile")
public class ProfileServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(ProfileServlet.class.getName());
    private final UserDAO userDAO = new UserDAO();
    private final ComplaintDAO complaintDAO = new ComplaintDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        loadProfileView(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        User sessionUser = (User) session.getAttribute("user");
        String action = request.getParameter("action");

        if ("updateProfile".equals(action)) {
            String name = ValidationUtil.trimOrNull(request.getParameter("name"));
            String studentId = ValidationUtil.trimOrNull(request.getParameter("studentId"));
            String department = ValidationUtil.trimOrNull(request.getParameter("department"));

            if (name == null || name.length() < 2 || name.length() > 100) {
                request.setAttribute("errorMessage", "Full name must be between 2 and 100 characters.");
                loadProfileView(request, response);
                return;
            }

            try {
                boolean updated = userDAO.updateProfile(sessionUser.getId(), name, studentId, department);
                if (updated) {
                    sessionUser.setName(name);
                    sessionUser.setStudentId(studentId);
                    sessionUser.setDepartment(department);
                    session.setAttribute("user", sessionUser);
                    request.setAttribute("successMessage", "Your profile information has been updated.");
                } else {
                    request.setAttribute("errorMessage", "Unable to update profile.");
                }
            } catch (SQLException e) {
                LOGGER.log(Level.SEVERE, "Database error updating profile.", e);
                request.setAttribute("errorMessage", "Database error while updating profile.");
            }
        } else if ("changePassword".equals(action)) {
            String currentPassword = request.getParameter("currentPassword");
            String newPassword = request.getParameter("newPassword");
            String confirmPassword = request.getParameter("confirmPassword");

            if (ValidationUtil.isBlank(newPassword)) {
                request.setAttribute("errorMessage", "Please enter a new password.");
                loadProfileView(request, response);
                return;
            }
            if (newPassword.length() < 6 || newPassword.length() > 72) {
                request.setAttribute("errorMessage", "New password must be between 6 and 72 characters.");
                loadProfileView(request, response);
                return;
            }
            if (!newPassword.equals(confirmPassword)) {
                request.setAttribute("errorMessage", "New password and confirmation do not match.");
                loadProfileView(request, response);
                return;
            }

            try {
                User dbUser = userDAO.findById(sessionUser.getId());
                if (dbUser == null) {
                    request.setAttribute("errorMessage", "User account not found.");
                    loadProfileView(request, response);
                    return;
                }
                boolean hasLocalPassword = dbUser.getPassword() != null && !dbUser.getPassword().isEmpty();
                if (hasLocalPassword && (ValidationUtil.isBlank(currentPassword)
                        || !PasswordUtil.verifyPassword(currentPassword, dbUser.getPassword()))) {
                    request.setAttribute("errorMessage", "Current password is incorrect.");
                    loadProfileView(request, response);
                    return;
                }

                String newHash = PasswordUtil.hashPassword(newPassword);
                if (userDAO.updatePassword(sessionUser.getId(), newHash)) {
                    request.setAttribute("successMessage", hasLocalPassword
                            ? "Your password has been updated securely."
                            : "Local password set! You can now sign in with email/password or Google.");
                } else {
                    request.setAttribute("errorMessage", "Failed to update password.");
                }
            } catch (SQLException e) {
                LOGGER.log(Level.SEVERE, "Database error updating password.", e);
                request.setAttribute("errorMessage", "Database error while updating password.");
            }
        }

        loadProfileView(request, response);
    }

    private void loadProfileView(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User sessionUser = (User) request.getSession().getAttribute("user");
        try {
            User freshUser = userDAO.findById(sessionUser.getId());
            if (freshUser != null) {
                boolean hasLocalPassword = freshUser.getPassword() != null && !freshUser.getPassword().isEmpty();
                request.setAttribute("hasLocalPassword", hasLocalPassword);
                freshUser.setPassword(null);
                request.getSession().setAttribute("user", freshUser);
            }
            Map<String, Integer> stats = sessionUser.isAdmin()
                    ? complaintDAO.getAdminStats()
                    : complaintDAO.getStudentStats(sessionUser.getId());
            request.setAttribute("stats", stats);
        } catch (SQLException e) {
            LOGGER.log(Level.WARNING, "Unable to refresh profile stats.", e);
        }
        request.setAttribute("activeNav", "profile");
        request.getRequestDispatcher("/WEB-INF/views/profile.jsp").forward(request, response);
    }
}
