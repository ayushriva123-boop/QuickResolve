package com.quickresolve.controller;

import com.google.gson.Gson;
import com.quickresolve.dao.ComplaintDAO;
import com.quickresolve.model.Complaint;
import com.quickresolve.model.User;
import com.quickresolve.util.FileUploadUtil;
import com.quickresolve.util.ValidationUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

@WebServlet("/student/*")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,      // 1 MB
        maxFileSize = 5 * 1024 * 1024,        // 5 MB
        maxRequestSize = 6 * 1024 * 1024      // 6 MB
)
public class ComplaintServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(ComplaintServlet.class.getName());
    private static final Gson GSON = new Gson();
    private final ComplaintDAO complaintDAO = new ComplaintDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        if (path == null || path.equals("/") || path.equals("/dashboard")) {
            showDashboard(request, response);
        } else if (path.equals("/submit")) {
            showSubmitForm(request, response);
        } else if (path.equals("/complaints")) {
            showMyComplaints(request, response);
        } else if (path.equals("/complaint-detail")) {
            getComplaintDetailJson(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        if ("/submit".equals(path)) {
            handleSubmitComplaint(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    private void showDashboard(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User user = (User) request.getSession().getAttribute("user");
        try {
            Map<String, Integer> stats = complaintDAO.getStudentStats(user.getId());
            List<Complaint> recentComplaints = complaintDAO.findRecentByUserId(user.getId(), 5);
            request.setAttribute("stats", stats);
            request.setAttribute("recentComplaints", recentComplaints);
            request.setAttribute("activeNav", "dashboard");
            request.getRequestDispatcher("/WEB-INF/views/student-dashboard.jsp").forward(request, response);
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error loading student dashboard.", e);
            request.setAttribute("errorMessage", "Unable to load your dashboard data.");
            request.getRequestDispatcher("/WEB-INF/views/student-dashboard.jsp").forward(request, response);
        }
    }

    private void showSubmitForm(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setAttribute("categories", ValidationUtil.CATEGORIES);
        request.setAttribute("activeNav", "submit");
        request.getRequestDispatcher("/WEB-INF/views/submit-complaint.jsp").forward(request, response);
    }

    private void handleSubmitComplaint(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User user = (User) request.getSession().getAttribute("user");
        String title = ValidationUtil.trimOrNull(request.getParameter("title"));
        String category = ValidationUtil.trimOrNull(request.getParameter("category"));
        String description = ValidationUtil.trimOrNull(request.getParameter("description"));

        request.setAttribute("categories", ValidationUtil.CATEGORIES);
        request.setAttribute("activeNav", "submit");
        request.setAttribute("enteredTitle", title != null ? title : "");
        request.setAttribute("enteredCategory", category != null ? category : "");
        request.setAttribute("enteredDescription", description != null ? description : "");

        if (title == null || title.length() < 5 || title.length() > 200) {
            request.setAttribute("errorMessage", "Complaint title must be between 5 and 200 characters.");
            request.getRequestDispatcher("/WEB-INF/views/submit-complaint.jsp").forward(request, response);
            return;
        }
        if (category == null) {
            request.setAttribute("errorMessage", "Please select a complaint category.");
            request.getRequestDispatcher("/WEB-INF/views/submit-complaint.jsp").forward(request, response);
            return;
        }
        if (description == null || description.length() < 15 || description.length() > 4000) {
            request.setAttribute("errorMessage", "Description must be between 15 and 4000 characters.");
            request.getRequestDispatcher("/WEB-INF/views/submit-complaint.jsp").forward(request, response);
            return;
        }

        String savedProofImage;
        try {
            Part proofPart = request.getPart("proofImage");
            savedProofImage = FileUploadUtil.saveProofImage(proofPart);
        } catch (IllegalArgumentException | SecurityException e) {
            request.setAttribute("errorMessage", e.getMessage());
            request.getRequestDispatcher("/WEB-INF/views/submit-complaint.jsp").forward(request, response);
            return;
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Failed to process uploaded proof image.", e);
            request.setAttribute("errorMessage", "Proof image upload failed (max 5 MB JPG/PNG/WEBP/GIF).");
            request.getRequestDispatcher("/WEB-INF/views/submit-complaint.jsp").forward(request, response);
            return;
        }

        Complaint complaint = new Complaint();
        complaint.setUserId(user.getId());
        complaint.setTitle(title);
        complaint.setCategory(ValidationUtil.sanitizeCategory(category));
        complaint.setDescription(description);
        complaint.setProofImage(savedProofImage);

        try {
            int newId = complaintDAO.createComplaint(complaint);
            if (newId > 0) {
                LOGGER.info("Complaint created with proof image: id=" + newId + ", userId=" + user.getId());
                response.sendRedirect(request.getContextPath() + "/student/complaints?success=created");
            } else {
                FileUploadUtil.deleteProofFileQuietly(savedProofImage);
                request.setAttribute("errorMessage", "Could not save your complaint. Please try again.");
                request.getRequestDispatcher("/WEB-INF/views/submit-complaint.jsp").forward(request, response);
            }
        } catch (SQLException e) {
            FileUploadUtil.deleteProofFileQuietly(savedProofImage);
            LOGGER.log(Level.SEVERE, "Database error creating complaint.", e);
            request.setAttribute("errorMessage", "Database error while submitting complaint. Please try again.");
            request.getRequestDispatcher("/WEB-INF/views/submit-complaint.jsp").forward(request, response);
        }
    }

    private void showMyComplaints(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User user = (User) request.getSession().getAttribute("user");
        String search = ValidationUtil.trimOrNull(request.getParameter("search"));
        String status = ValidationUtil.trimOrNull(request.getParameter("status"));

        try {
            List<Complaint> complaints = complaintDAO.findByUserId(user.getId(), search, status);
            request.setAttribute("complaints", complaints);
            request.setAttribute("searchQuery", search != null ? search : "");
            request.setAttribute("statusFilter", status != null ? status : "ALL");
            request.setAttribute("statuses", ValidationUtil.STATUSES);
            request.setAttribute("activeNav", "complaints");
            request.getRequestDispatcher("/WEB-INF/views/my-complaints.jsp").forward(request, response);
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error loading student complaints.", e);
            request.setAttribute("errorMessage", "Unable to retrieve your complaint history.");
            request.getRequestDispatcher("/WEB-INF/views/my-complaints.jsp").forward(request, response);
        }
    }

    private void getComplaintDetailJson(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        response.setContentType("application/json; charset=UTF-8");
        User user = (User) request.getSession().getAttribute("user");
        String idParam = request.getParameter("id");

        Map<String, Object> payload = new HashMap<>();
        try {
            int complaintId = Integer.parseInt(idParam);
            Complaint complaint = complaintDAO.findById(complaintId);
            if (complaint == null || complaint.getUserId() != user.getId()) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                payload.put("error", "Complaint not found.");
            } else {
                payload.put("complaint", complaint);
                payload.put("formattedId", complaint.getFormattedId());
                if (complaint.isHasProofImage()) {
                    payload.put("proofUrl", request.getContextPath() + "/complaint-proof?id=" + complaint.getId());
                }
            }
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            payload.put("error", "Invalid complaint ID.");
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Database error fetching complaint detail.", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            payload.put("error", "Database error.");
        }

        try (PrintWriter out = response.getWriter()) {
            out.print(GSON.toJson(payload));
        }
    }
}
