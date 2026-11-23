package com.quickresolve.controller;

import com.google.gson.Gson;
import com.quickresolve.dao.ComplaintDAO;
import com.quickresolve.dao.UserDAO;
import com.quickresolve.model.Complaint;
import com.quickresolve.model.User;
import com.quickresolve.util.FileUploadUtil;
import com.quickresolve.util.ValidationUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

@WebServlet("/admin/*")
public class AdminServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(AdminServlet.class.getName());
    private static final Gson GSON = new Gson();
    private final ComplaintDAO complaintDAO = new ComplaintDAO();
    private final UserDAO userDAO = new UserDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        if (path == null || path.equals("/") || path.equals("/dashboard")) {
            showDashboard(request, response);
        } else if (path.equals("/complaints")) {
            showManageComplaints(request, response);
        } else if (path.equals("/students")) {
            showStudents(request, response);
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
        if ("/update-status".equals(path)) {
            handleUpdateStatus(request, response);
        } else if ("/delete-complaint".equals(path)) {
            handleDeleteComplaint(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    private void showDashboard(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Integer> stats = complaintDAO.getAdminStats();
            int studentCount = userDAO.countStudents();
            Map<String, Integer> categoryBreakdown = complaintDAO.getCategoryBreakdown();
            List<Complaint> recentComplaints = complaintDAO.findRecentAll(6);

            request.setAttribute("stats", stats);
            request.setAttribute("studentCount", studentCount);
            request.setAttribute("categoryBreakdown", categoryBreakdown);
            request.setAttribute("recentComplaints", recentComplaints);
            request.setAttribute("activeNav", "dashboard");
            request.getRequestDispatcher("/WEB-INF/views/admin-dashboard.jsp").forward(request, response);
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error loading admin dashboard.", e);
            request.setAttribute("errorMessage", "Unable to load admin dashboard metrics.");
            request.getRequestDispatcher("/WEB-INF/views/admin-dashboard.jsp").forward(request, response);
        }
    }

    private void showManageComplaints(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String search = ValidationUtil.trimOrNull(request.getParameter("search"));
        String status = ValidationUtil.trimOrNull(request.getParameter("status"));

        try {
            List<Complaint> complaints = complaintDAO.findAll(search, status);
            request.setAttribute("complaints", complaints);
            request.setAttribute("searchQuery", search != null ? search : "");
            request.setAttribute("statusFilter", status != null ? status : "ALL");
            request.setAttribute("statuses", ValidationUtil.STATUSES);
            request.setAttribute("activeNav", "complaints");
            request.getRequestDispatcher("/WEB-INF/views/manage-complaints.jsp").forward(request, response);
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error loading complaints for management.", e);
            request.setAttribute("errorMessage", "Unable to load complaints list.");
            request.getRequestDispatcher("/WEB-INF/views/manage-complaints.jsp").forward(request, response);
        }
    }

    private void showStudents(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            List<User> students = userDAO.getAllStudentsWithStats();
            request.setAttribute("students", students);
            request.setAttribute("activeNav", "students");
            request.getRequestDispatcher("/WEB-INF/views/manage-students.jsp").forward(request, response);
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error loading registered students.", e);
            request.setAttribute("errorMessage", "Unable to load registered students.");
            request.getRequestDispatcher("/WEB-INF/views/manage-students.jsp").forward(request, response);
        }
    }

    private void handleUpdateStatus(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String idParam = request.getParameter("complaintId");
        String status = ValidationUtil.trimOrNull(request.getParameter("status"));
        String adminRemarks = ValidationUtil.trimOrNull(request.getParameter("adminRemarks"));
        String ctx = request.getContextPath();

        if (!ValidationUtil.isValidStatus(status)) {
            response.sendRedirect(ctx + "/admin/complaints?error=invalid_status");
            return;
        }

        try {
            int complaintId = Integer.parseInt(idParam);
            boolean updated = complaintDAO.updateStatusAndRemarks(complaintId, status, adminRemarks);
            if (updated) {
                LOGGER.info("Admin updated complaint status: id=" + complaintId + ", status=" + status);
                response.sendRedirect(ctx + "/admin/complaints?success=updated");
            } else {
                response.sendRedirect(ctx + "/admin/complaints?error=not_found");
            }
        } catch (NumberFormatException e) {
            response.sendRedirect(ctx + "/admin/complaints?error=invalid_id");
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error updating complaint status.", e);
            response.sendRedirect(ctx + "/admin/complaints?error=db_error");
        }
    }

    private void handleDeleteComplaint(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String idParam = request.getParameter("complaintId");
        String ctx = request.getContextPath();

        try {
            int complaintId = Integer.parseInt(idParam);
            Complaint existing = complaintDAO.findById(complaintId);
            boolean deleted = complaintDAO.deleteComplaint(complaintId);
            if (deleted) {
                if (existing != null && existing.isHasProofImage()) {
                    FileUploadUtil.deleteProofFileQuietly(existing.getProofImage());
                }
                LOGGER.info("Admin deleted complaint: id=" + complaintId);
                response.sendRedirect(ctx + "/admin/complaints?success=deleted");
            } else {
                response.sendRedirect(ctx + "/admin/complaints?error=not_found");
            }
        } catch (NumberFormatException e) {
            response.sendRedirect(ctx + "/admin/complaints?error=invalid_id");
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error deleting complaint.", e);
            response.sendRedirect(ctx + "/admin/complaints?error=db_error");
        }
    }

    private void getComplaintDetailJson(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        response.setContentType("application/json; charset=UTF-8");
        String idParam = request.getParameter("id");

        Map<String, Object> payload = new HashMap<>();
        try {
            int complaintId = Integer.parseInt(idParam);
            Complaint complaint = complaintDAO.findById(complaintId);
            if (complaint == null) {
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
