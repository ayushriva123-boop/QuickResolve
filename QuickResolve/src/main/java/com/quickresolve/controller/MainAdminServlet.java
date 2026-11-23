package com.quickresolve.controller;

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
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Main Admin Controller: creates user IDs for Admin or Student accounts,
 * assigns/reassigns roles (ADMIN / STUDENT), and removes non-Main-Admin accounts.
 */
@WebServlet("/main-admin/*")
public class MainAdminServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(MainAdminServlet.class.getName());
    private final UserDAO userDAO = new UserDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        if (path == null || path.equals("/") || path.equals("/users") || path.equals("/dashboard")) {
            showManageUsers(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        if ("/create-user".equals(path)) {
            handleCreateUser(request, response);
        } else if ("/assign-role".equals(path)) {
            handleAssignRole(request, response);
        } else if ("/delete-user".equals(path)) {
            handleDeleteUser(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    private void showManageUsers(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            List<User> users = userDAO.getAllUsersWithStats();
            Map<String, Integer> roleCounts = userDAO.getUserRoleCounts();
            request.setAttribute("users", users);
            request.setAttribute("roleCounts", roleCounts);
            request.setAttribute("assignableRoles", ValidationUtil.ASSIGNABLE_ROLES);
            request.setAttribute("activeNav", "main-admin-users");
            request.getRequestDispatcher("/WEB-INF/views/manage-users.jsp").forward(request, response);
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error loading Main Admin user directory.", e);
            request.setAttribute("errorMessage", "Unable to load users from the database.");
            request.setAttribute("activeNav", "main-admin-users");
            request.getRequestDispatcher("/WEB-INF/views/manage-users.jsp").forward(request, response);
        }
    }

    private void handleCreateUser(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        User currentUser = (User) session.getAttribute("user");

        String name = ValidationUtil.trimOrNull(request.getParameter("name"));
        String email = ValidationUtil.trimOrNull(request.getParameter("email"));
        String password = request.getParameter("password");
        String role = ValidationUtil.trimOrNull(request.getParameter("role"));
        String studentId = ValidationUtil.trimOrNull(request.getParameter("studentId"));
        String department = ValidationUtil.trimOrNull(request.getParameter("department"));

        request.setAttribute("enteredName", name != null ? name : "");
        request.setAttribute("enteredEmail", email != null ? email : "");
        request.setAttribute("enteredRole", role != null ? role.toUpperCase() : "STUDENT");
        request.setAttribute("enteredStudentId", studentId != null ? studentId : "");
        request.setAttribute("enteredDepartment", department != null ? department : "");

        if (name == null || name.length() < 2 || name.length() > 100) {
            request.setAttribute("errorMessage", "Full name must be between 2 and 100 characters.");
            showManageUsers(request, response);
            return;
        }
        if (!ValidationUtil.isValidEmail(email)) {
            request.setAttribute("errorMessage", "Please enter a valid email address.");
            showManageUsers(request, response);
            return;
        }
        if (password == null || password.length() < 6 || password.length() > 72) {
            request.setAttribute("errorMessage", "Password must be between 6 and 72 characters.");
            showManageUsers(request, response);
            return;
        }
        if (!ValidationUtil.isAssignableRole(role)) {
            request.setAttribute("errorMessage", "Please select a valid role (ADMIN or STUDENT).");
            showManageUsers(request, response);
            return;
        }
        if (studentId != null && studentId.length() > 50) {
            request.setAttribute("errorMessage", "Student / Staff ID cannot exceed 50 characters.");
            showManageUsers(request, response);
            return;
        }
        if (department != null && department.length() > 100) {
            request.setAttribute("errorMessage", "Department cannot exceed 100 characters.");
            showManageUsers(request, response);
            return;
        }

        try {
            if (userDAO.emailExists(email)) {
                request.setAttribute("errorMessage", "An account with this email address already exists.");
                showManageUsers(request, response);
                return;
            }

            User newUser = new User();
            newUser.setName(name);
            newUser.setEmail(email.toLowerCase());
            newUser.setPassword(PasswordUtil.hashPassword(password));
            newUser.setRole(role.toUpperCase());
            newUser.setStudentId(studentId);
            newUser.setDepartment(department);

            boolean created = userDAO.createUserByMainAdmin(newUser, currentUser.getId());
            if (created) {
                LOGGER.info("Main Admin (" + currentUser.getId() + ") created user id=" + newUser.getId()
                        + " with role=" + newUser.getRole());
                response.sendRedirect(request.getContextPath() + "/main-admin/users?success=created");
            } else {
                request.setAttribute("errorMessage", "Failed to create user account.");
                showManageUsers(request, response);
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Database error creating user by Main Admin.", e);
            request.setAttribute("errorMessage", "Database error while creating user account.");
            showManageUsers(request, response);
        }
    }

    private void handleAssignRole(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        HttpSession session = request.getSession();
        User currentUser = (User) session.getAttribute("user");
        String ctx = request.getContextPath();

        String userIdParam = request.getParameter("userId");
        String newRole = ValidationUtil.trimOrNull(request.getParameter("role"));

        if (!ValidationUtil.isAssignableRole(newRole)) {
            response.sendRedirect(ctx + "/main-admin/users?error=invalid_role");
            return;
        }

        try {
            int targetUserId = Integer.parseInt(userIdParam);
            if (targetUserId == currentUser.getId()) {
                response.sendRedirect(ctx + "/main-admin/users?error=self_modify");
                return;
            }

            boolean updated = userDAO.updateUserRole(targetUserId, newRole.toUpperCase());
            if (updated) {
                LOGGER.info("Main Admin (" + currentUser.getId() + ") updated role for userId="
                        + targetUserId + " -> " + newRole.toUpperCase());
                response.sendRedirect(ctx + "/main-admin/users?success=role_updated");
            } else {
                response.sendRedirect(ctx + "/main-admin/users?error=protected_or_missing");
            }
        } catch (NumberFormatException e) {
            response.sendRedirect(ctx + "/main-admin/users?error=invalid_id");
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Database error updating user role.", e);
            response.sendRedirect(ctx + "/main-admin/users?error=db_error");
        }
    }

    private void handleDeleteUser(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        HttpSession session = request.getSession();
        User currentUser = (User) session.getAttribute("user");
        String ctx = request.getContextPath();

        String userIdParam = request.getParameter("userId");
        try {
            int targetUserId = Integer.parseInt(userIdParam);
            if (targetUserId == currentUser.getId()) {
                response.sendRedirect(ctx + "/main-admin/users?error=self_modify");
                return;
            }

            boolean deleted = userDAO.deleteNonMainAdminUser(targetUserId);
            if (deleted) {
                LOGGER.info("Main Admin (" + currentUser.getId() + ") deleted userId=" + targetUserId);
                response.sendRedirect(ctx + "/main-admin/users?success=deleted");
            } else {
                response.sendRedirect(ctx + "/main-admin/users?error=protected_or_missing");
            }
        } catch (NumberFormatException e) {
            response.sendRedirect(ctx + "/main-admin/users?error=invalid_id");
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Database error deleting user.", e);
            response.sendRedirect(ctx + "/main-admin/users?error=db_error");
        }
    }
}
