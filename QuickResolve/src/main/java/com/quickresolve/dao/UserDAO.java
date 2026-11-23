package com.quickresolve.dao;

import com.quickresolve.model.User;
import com.quickresolve.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Data Access Object for User persistence, Main Admin ID creation, role assignment, and Google Sign-In.
 */
public class UserDAO {

    private static final String BASE_COLUMNS =
            "id, name, email, password, role, auth_provider, google_sub, student_id, department, created_by, created_at";

    public User findByEmail(String email) throws SQLException {
        String sql = "SELECT " + BASE_COLUMNS + " FROM users WHERE email = ? LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs, true);
                }
            }
        }
        return null;
    }

    public User findById(int id) throws SQLException {
        String sql = "SELECT " + BASE_COLUMNS + " FROM users WHERE id = ? LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs, true);
                }
            }
        }
        return null;
    }

    public boolean emailExists(String email) throws SQLException {
        String sql = "SELECT 1 FROM users WHERE email = ? LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    public boolean registerStudent(User user) throws SQLException {
        String sql = "INSERT INTO users (name, email, password, role, auth_provider, student_id, department) "
                   + "VALUES (?, ?, ?, 'STUDENT', 'LOCAL', ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, user.getName().trim());
            ps.setString(2, user.getEmail().trim().toLowerCase());
            ps.setString(3, user.getPassword());
            ps.setString(4, user.getStudentId());
            ps.setString(5, user.getDepartment());

            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) {
                        user.setId(keys.getInt(1));
                    }
                }
                user.setRole("STUDENT");
                user.setAuthProvider("LOCAL");
                return true;
            }
            return false;
        }
    }

    /**
     * Used by MAIN_ADMIN to create a user ID with an assigned role (ADMIN or STUDENT).
     */
    public boolean createUserByMainAdmin(User user, int mainAdminId) throws SQLException {
        String sql = "INSERT INTO users (name, email, password, role, auth_provider, student_id, department, created_by) "
                   + "VALUES (?, ?, ?, ?, 'LOCAL', ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, user.getName().trim());
            ps.setString(2, user.getEmail().trim().toLowerCase());
            ps.setString(3, user.getPassword());
            ps.setString(4, user.getRole().toUpperCase());
            ps.setString(5, user.getStudentId());
            ps.setString(6, user.getDepartment());
            ps.setInt(7, mainAdminId);

            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) {
                        user.setId(keys.getInt(1));
                    }
                }
                user.setAuthProvider("LOCAL");
                user.setCreatedBy(mainAdminId);
                return true;
            }
            return false;
        }
    }

    /**
     * Auto-provisions a new STUDENT account when signing in with Google for the first time.
     */
    public User createGoogleStudent(String name, String email, String googleSub) throws SQLException {
        String sql = "INSERT INTO users (name, email, password, role, auth_provider, google_sub) "
                   + "VALUES (?, ?, NULL, 'STUDENT', 'GOOGLE', ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, name.trim());
            ps.setString(2, email.trim().toLowerCase());
            ps.setString(3, googleSub);

            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) {
                        return findById(keys.getInt(1));
                    }
                }
            }
        }
        return null;
    }

    public boolean linkGoogleAccount(int userId, String googleSub) throws SQLException {
        String sql = "UPDATE users SET google_sub = ?, auth_provider = 'GOOGLE' WHERE id = ? AND google_sub IS NULL";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, googleSub);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Assigns ADMIN or STUDENT role to a non-MAIN_ADMIN account.
     */
    public boolean updateUserRole(int userId, String newRole) throws SQLException {
        String sql = "UPDATE users SET role = ? WHERE id = ? AND role <> 'MAIN_ADMIN'";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newRole.toUpperCase());
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deleteNonMainAdminUser(int userId) throws SQLException {
        String sql = "DELETE FROM users WHERE id = ? AND role <> 'MAIN_ADMIN'";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean updateProfile(int userId, String name, String studentId, String department) throws SQLException {
        String sql = "UPDATE users SET name = ?, student_id = ?, department = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, name.trim());
            ps.setString(2, studentId);
            ps.setString(3, department);
            ps.setInt(4, userId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean updatePassword(int userId, String newHashedPassword) throws SQLException {
        String sql = "UPDATE users SET password = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newHashedPassword);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    public List<User> getAllUsersWithStats() throws SQLException {
        String sql = "SELECT u.id, u.name, u.email, u.role, u.auth_provider, u.google_sub, "
                   + "u.student_id, u.department, u.created_by, u.created_at, "
                   + "COUNT(c.id) AS total_complaints, "
                   + "COALESCE(SUM(CASE WHEN c.status <> 'Resolved' THEN 1 ELSE 0 END), 0) AS open_complaints "
                   + "FROM users u "
                   + "LEFT JOIN complaints c ON u.id = c.user_id "
                   + "GROUP BY u.id, u.name, u.email, u.role, u.auth_provider, u.google_sub, "
                   + "u.student_id, u.department, u.created_by, u.created_at "
                   + "ORDER BY FIELD(u.role, 'MAIN_ADMIN', 'ADMIN', 'STUDENT'), u.created_at DESC";
        List<User> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                User u = mapRow(rs, false);
                u.setTotalComplaints(rs.getInt("total_complaints"));
                u.setOpenComplaints(rs.getInt("open_complaints"));
                list.add(u);
            }
        }
        return list;
    }

    public List<User> getAllStudentsWithStats() throws SQLException {
        String sql = "SELECT u.id, u.name, u.email, u.role, u.auth_provider, u.google_sub, "
                   + "u.student_id, u.department, u.created_by, u.created_at, "
                   + "COUNT(c.id) AS total_complaints, "
                   + "COALESCE(SUM(CASE WHEN c.status <> 'Resolved' THEN 1 ELSE 0 END), 0) AS open_complaints "
                   + "FROM users u "
                   + "LEFT JOIN complaints c ON u.id = c.user_id "
                   + "WHERE u.role = 'STUDENT' "
                   + "GROUP BY u.id, u.name, u.email, u.role, u.auth_provider, u.google_sub, "
                   + "u.student_id, u.department, u.created_by, u.created_at "
                   + "ORDER BY u.created_at DESC";
        List<User> students = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                User u = mapRow(rs, false);
                u.setTotalComplaints(rs.getInt("total_complaints"));
                u.setOpenComplaints(rs.getInt("open_complaints"));
                students.add(u);
            }
        }
        return students;
    }

    public int countStudents() throws SQLException {
        String sql = "SELECT COUNT(*) FROM users WHERE role = 'STUDENT'";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return rs.getInt(1);
            }
        }
        return 0;
    }

    public Map<String, Integer> getUserRoleCounts() throws SQLException {
        String sql = "SELECT "
                   + "COUNT(*) AS total, "
                   + "COALESCE(SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END), 0) AS admins, "
                   + "COALESCE(SUM(CASE WHEN role = 'STUDENT' THEN 1 ELSE 0 END), 0) AS students, "
                   + "COALESCE(SUM(CASE WHEN auth_provider = 'GOOGLE' THEN 1 ELSE 0 END), 0) AS google_users "
                   + "FROM users";
        Map<String, Integer> counts = new HashMap<>();
        counts.put("total", 0);
        counts.put("admins", 0);
        counts.put("students", 0);
        counts.put("googleUsers", 0);

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                counts.put("total", rs.getInt("total"));
                counts.put("admins", rs.getInt("admins"));
                counts.put("students", rs.getInt("students"));
                counts.put("googleUsers", rs.getInt("google_users"));
            }
        }
        return counts;
    }

    private User mapRow(ResultSet rs, boolean includePassword) throws SQLException {
        User user = new User();
        user.setId(rs.getInt("id"));
        user.setName(rs.getString("name"));
        user.setEmail(rs.getString("email"));
        if (includePassword) {
            user.setPassword(rs.getString("password"));
        }
        user.setRole(rs.getString("role"));
        user.setAuthProvider(rs.getString("auth_provider"));
        user.setGoogleSub(rs.getString("google_sub"));
        user.setStudentId(rs.getString("student_id"));
        user.setDepartment(rs.getString("department"));
        int createdBy = rs.getInt("created_by");
        user.setCreatedBy(rs.wasNull() ? null : createdBy);
        user.setCreatedAt(rs.getTimestamp("created_at"));
        return user;
    }
}
