package com.quickresolve.dao;

import com.quickresolve.model.Complaint;
import com.quickresolve.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Data Access Object for Complaint CRUD, filtering, and statistics.
 */
public class ComplaintDAO {

    private static final String BASE_SELECT =
            "SELECT c.id, c.user_id, c.title, c.category, c.description, c.proof_image, c.status, c.admin_remarks, "
          + "c.created_at, c.updated_at, "
          + "u.name AS student_name, u.email AS student_email, u.student_id AS student_code, "
          + "u.department AS student_department "
          + "FROM complaints c "
          + "INNER JOIN users u ON c.user_id = u.id ";

    public int createComplaint(Complaint c) throws SQLException {
        String sql = "INSERT INTO complaints "
                   + "(user_id, title, category, description, proof_image, status) "
                   + "VALUES (?, ?, ?, ?, ?, 'Pending')";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, c.getUserId());
            ps.setString(2, c.getTitle().trim());
            ps.setString(3, c.getCategory().trim());
            ps.setString(4, c.getDescription().trim());
            if (c.getProofImage() != null && !c.getProofImage().trim().isEmpty()) {
                ps.setString(5, c.getProofImage().trim());
            } else {
                ps.setNull(5, Types.VARCHAR);
            }

            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) {
                        int generatedId = keys.getInt(1);
                        c.setId(generatedId);
                        return generatedId;
                    }
                }
            }
        }
        return -1;
    }

    public Complaint findById(int id) throws SQLException {
        String sql = BASE_SELECT + "WHERE c.id = ? LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public List<Complaint> findByUserId(int userId, String search, String status) throws SQLException {
        StringBuilder sql = new StringBuilder(BASE_SELECT);
        sql.append("WHERE c.user_id = ? ");

        List<Object> params = new ArrayList<>();
        params.add(userId);

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            sql.append("AND c.status = ? ");
            params.add(status.trim());
        }
        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (c.title LIKE ? OR c.description LIKE ? OR c.category LIKE ?) ");
            String pattern = "%" + search.trim() + "%";
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }
        sql.append("ORDER BY c.created_at DESC");

        List<Complaint> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            bindParameters(ps, params);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public List<Complaint> findRecentByUserId(int userId, int limit) throws SQLException {
        String sql = BASE_SELECT + "WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT ?";
        List<Complaint> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public List<Complaint> findAll(String search, String status) throws SQLException {
        StringBuilder sql = new StringBuilder(BASE_SELECT);
        sql.append("WHERE 1=1 ");

        List<Object> params = new ArrayList<>();
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            sql.append("AND c.status = ? ");
            params.add(status.trim());
        }
        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (c.title LIKE ? OR c.description LIKE ? OR c.category LIKE ? "
                     + "OR u.name LIKE ? OR u.email LIKE ? OR CAST(c.id AS CHAR) LIKE ?) ");
            String pattern = "%" + search.trim() + "%";
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }
        sql.append("ORDER BY c.created_at DESC");

        List<Complaint> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            bindParameters(ps, params);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public List<Complaint> findRecentAll(int limit) throws SQLException {
        String sql = BASE_SELECT + "ORDER BY c.created_at DESC LIMIT ?";
        List<Complaint> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public boolean updateStatusAndRemarks(int complaintId, String status, String adminRemarks) throws SQLException {
        String sql = "UPDATE complaints SET status = ?, admin_remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            if (adminRemarks != null && !adminRemarks.trim().isEmpty()) {
                ps.setString(2, adminRemarks.trim());
            } else {
                ps.setNull(2, Types.VARCHAR);
            }
            ps.setInt(3, complaintId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deleteComplaint(int complaintId) throws SQLException {
        String sql = "DELETE FROM complaints WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, complaintId);
            return ps.executeUpdate() > 0;
        }
    }

    public Map<String, Integer> getStudentStats(int userId) throws SQLException {
        String sql = "SELECT "
                   + "COUNT(*) AS total, "
                   + "COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) AS pending, "
                   + "COALESCE(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0) AS in_progress, "
                   + "COALESCE(SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END), 0) AS resolved "
                   + "FROM complaints WHERE user_id = ?";
        Map<String, Integer> stats = new HashMap<>();
        stats.put("total", 0);
        stats.put("pending", 0);
        stats.put("inProgress", 0);
        stats.put("resolved", 0);

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    stats.put("total", rs.getInt("total"));
                    stats.put("pending", rs.getInt("pending"));
                    stats.put("inProgress", rs.getInt("in_progress"));
                    stats.put("resolved", rs.getInt("resolved"));
                }
            }
        }
        return stats;
    }

    public Map<String, Integer> getAdminStats() throws SQLException {
        String sql = "SELECT "
                   + "COUNT(*) AS total, "
                   + "COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) AS pending, "
                   + "COALESCE(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0) AS in_progress, "
                   + "COALESCE(SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END), 0) AS resolved, "
                   + "COALESCE(SUM(CASE WHEN proof_image IS NOT NULL THEN 1 ELSE 0 END), 0) AS with_proof "
                   + "FROM complaints";
        Map<String, Integer> stats = new HashMap<>();
        stats.put("total", 0);
        stats.put("pending", 0);
        stats.put("inProgress", 0);
        stats.put("resolved", 0);
        stats.put("withProof", 0);

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                stats.put("total", rs.getInt("total"));
                stats.put("pending", rs.getInt("pending"));
                stats.put("inProgress", rs.getInt("in_progress"));
                stats.put("resolved", rs.getInt("resolved"));
                stats.put("withProof", rs.getInt("with_proof"));
            }
        }
        return stats;
    }

    public Map<String, Integer> getCategoryBreakdown() throws SQLException {
        String sql = "SELECT category, COUNT(*) AS cnt FROM complaints GROUP BY category ORDER BY cnt DESC";
        Map<String, Integer> map = new LinkedHashMap<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                map.put(rs.getString("category"), rs.getInt("cnt"));
            }
        }
        return map;
    }

    private void bindParameters(PreparedStatement ps, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            Object param = params.get(i);
            if (param instanceof Integer) {
                ps.setInt(i + 1, (Integer) param);
            } else {
                ps.setString(i + 1, param != null ? param.toString() : null);
            }
        }
    }

    private Complaint mapRow(ResultSet rs) throws SQLException {
        Complaint c = new Complaint();
        c.setId(rs.getInt("id"));
        c.setUserId(rs.getInt("user_id"));
        c.setTitle(rs.getString("title"));
        c.setCategory(rs.getString("category"));
        c.setDescription(rs.getString("description"));
        c.setProofImage(rs.getString("proof_image"));
        c.setStatus(rs.getString("status"));
        c.setAdminRemarks(rs.getString("admin_remarks"));
        c.setCreatedAt(rs.getTimestamp("created_at"));
        c.setUpdatedAt(rs.getTimestamp("updated_at"));
        c.setStudentName(rs.getString("student_name"));
        c.setStudentEmail(rs.getString("student_email"));
        c.setStudentCode(rs.getString("student_code"));
        c.setStudentDepartment(rs.getString("student_department"));
        return c;
    }
}
