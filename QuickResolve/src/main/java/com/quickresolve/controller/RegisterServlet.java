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
import java.util.logging.Level;
import java.util.logging.Logger;

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(RegisterServlet.class.getName());
    private final UserDAO userDAO = new UserDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("user") != null) {
            User existing = (User) session.getAttribute("user");
            String dest = existing.isMainAdmin() ? "/main-admin/users"
                    : (existing.isAdmin() ? "/admin/dashboard" : "/student/dashboard");
            response.sendRedirect(request.getContextPath() + dest);
            return;
        }
        request.getRequestDispatcher("/register.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String name = ValidationUtil.trimOrNull(request.getParameter("name"));
        String email = ValidationUtil.trimOrNull(request.getParameter("email"));
        String studentId = ValidationUtil.trimOrNull(request.getParameter("studentId"));
        String department = ValidationUtil.trimOrNull(request.getParameter("department"));
        String password = request.getParameter("password");
        String confirmPassword = request.getParameter("confirmPassword");

        preserveFormFields(request, name, email, studentId, department);

        if (name == null || name.length() < 2 || name.length() > 100) {
            request.setAttribute("errorMessage", "Full name must be between 2 and 100 characters.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
            return;
        }
        if (!ValidationUtil.isValidEmail(email)) {
            request.setAttribute("errorMessage", "Please enter a valid email address.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
            return;
        }
        if (password == null || password.length() < 6 || password.length() > 72) {
            request.setAttribute("errorMessage", "Password must be between 6 and 72 characters.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
            return;
        }
        if (!password.equals(confirmPassword)) {
            request.setAttribute("errorMessage", "Password and Confirm Password do not match.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
            return;
        }
        if (studentId != null && studentId.length() > 50) {
            request.setAttribute("errorMessage", "Student ID cannot exceed 50 characters.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
            return;
        }
        if (department != null && department.length() > 100) {
            request.setAttribute("errorMessage", "Department cannot exceed 100 characters.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
            return;
        }

        try {
            if (userDAO.emailExists(email)) {
                request.setAttribute("errorMessage", "An account with this email address already exists.");
                request.getRequestDispatcher("/register.jsp").forward(request, response);
                return;
            }

            User student = new User();
            student.setName(name);
            student.setEmail(email.toLowerCase());
            student.setPassword(PasswordUtil.hashPassword(password));
            student.setStudentId(studentId);
            student.setDepartment(department);

            boolean created = userDAO.registerStudent(student);
            if (created) {
                LOGGER.info("New student registered: userId=" + student.getId());
                response.sendRedirect(request.getContextPath() + "/login?registered=true");
            } else {
                request.setAttribute("errorMessage", "Registration failed. Please try again.");
                request.getRequestDispatcher("/register.jsp").forward(request, response);
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Database error during student registration.", e);
            request.setAttribute("errorMessage", "Database error occurred. Please check your MySQL connection.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
        }
    }

    private void preserveFormFields(HttpServletRequest request, String name, String email,
                                    String studentId, String department) {
        request.setAttribute("enteredName", name != null ? name : "");
        request.setAttribute("enteredEmail", email != null ? email : "");
        request.setAttribute("enteredStudentId", studentId != null ? studentId : "");
        request.setAttribute("enteredDepartment", department != null ? department : "");
    }
}
