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

@WebServlet("/login")
public class LoginServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(LoginServlet.class.getName());
    private final UserDAO userDAO = new UserDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("user") != null) {
            User existing = (User) session.getAttribute("user");
            redirectByRole(existing, request, response);
            return;
        }
        request.getRequestDispatcher("/login.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String email = ValidationUtil.trimOrNull(request.getParameter("email"));
        String password = request.getParameter("password");

        if (email == null || ValidationUtil.isBlank(password)) {
            request.setAttribute("errorMessage", "Please enter both email address and password.");
            request.setAttribute("enteredEmail", email != null ? email : "");
            request.getRequestDispatcher("/login.jsp").forward(request, response);
            return;
        }

        try {
            User user = userDAO.findByEmail(email);
            if (user == null) {
                request.setAttribute("errorMessage", "Invalid email address or password.");
                request.setAttribute("enteredEmail", email);
                request.getRequestDispatcher("/login.jsp").forward(request, response);
                return;
            }
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                request.setAttribute("errorMessage",
                        "This account was created via Google Sign-In. Please click 'Sign in with Google' below.");
                request.setAttribute("enteredEmail", email);
                request.getRequestDispatcher("/login.jsp").forward(request, response);
                return;
            }
            if (!PasswordUtil.verifyPassword(password, user.getPassword())) {
                request.setAttribute("errorMessage", "Invalid email address or password.");
                request.setAttribute("enteredEmail", email);
                request.getRequestDispatcher("/login.jsp").forward(request, response);
                return;
            }

            // Clear password hash before storing User in HttpSession
            user.setPassword(null);

            HttpSession session = request.getSession(true);
            try {
                request.changeSessionId();
            } catch (IllegalStateException ignored) {
                // Fallback if session was just created
            }
            session.setAttribute("user", user);

            LOGGER.info("User logged in successfully: userId=" + user.getId() + ", role=" + user.getRole());
            redirectByRole(user, request, response);
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Database error during login.", e);
            request.setAttribute("errorMessage", "Unable to connect to the database. Please verify MySQL is running.");
            request.setAttribute("enteredEmail", email);
            request.getRequestDispatcher("/login.jsp").forward(request, response);
        }
    }

    private void redirectByRole(User user, HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String ctx = request.getContextPath();
        if (user.isMainAdmin()) {
            response.sendRedirect(ctx + "/main-admin/users");
        } else if (user.isAdmin()) {
            response.sendRedirect(ctx + "/admin/dashboard");
        } else {
            response.sendRedirect(ctx + "/student/dashboard");
        }
    }
}
