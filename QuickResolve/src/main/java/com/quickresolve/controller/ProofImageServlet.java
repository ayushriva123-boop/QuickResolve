package com.quickresolve.controller;

import com.quickresolve.dao.ComplaintDAO;
import com.quickresolve.model.Complaint;
import com.quickresolve.model.User;
import com.quickresolve.util.FileUploadUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Streams uploaded complaint proof images securely to the owning student or an administrator.
 */
@WebServlet("/complaint-proof")
public class ProofImageServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(ProofImageServlet.class.getName());
    private final ComplaintDAO complaintDAO = new ComplaintDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User currentUser = (User) request.getSession().getAttribute("user");
        if (currentUser == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String idParam = request.getParameter("id");
        int complaintId;
        try {
            complaintId = Integer.parseInt(idParam);
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        try {
            Complaint complaint = complaintDAO.findById(complaintId);
            if (complaint == null || !complaint.isHasProofImage()) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND);
                return;
            }

            if (!currentUser.isAdmin() && complaint.getUserId() != currentUser.getId()) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN);
                return;
            }

            Path imagePath = FileUploadUtil.resolveExistingProofFile(complaint.getProofImage());
            if (imagePath == null) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND);
                return;
            }

            response.setContentType(FileUploadUtil.detectContentType(imagePath));
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setContentLengthLong(Files.size(imagePath));
            Files.copy(imagePath, response.getOutputStream());
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Database error serving proof image.", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
