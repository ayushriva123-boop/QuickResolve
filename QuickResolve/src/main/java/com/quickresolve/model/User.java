package com.quickresolve.model;

import java.io.Serializable;
import java.sql.Timestamp;

/**
 * Represents a registered user (Main Admin, Admin, or Student) in QuickResolve.
 */
public class User implements Serializable {
    private static final long serialVersionUID = 1L;

    private int id;
    private String name;
    private String email;
    private String password;
    private String role; // "MAIN_ADMIN", "ADMIN", or "STUDENT"
    private String authProvider; // "LOCAL" or "GOOGLE"
    private String googleSub;
    private String studentId;
    private String department;
    private Integer createdBy;
    private Timestamp createdAt;

    // Aggregated stats for Admin / Main Admin directory
    private int totalComplaints;
    private int openComplaints;

    public User() {
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }

    public String getGoogleSub() {
        return googleSub;
    }

    public void setGoogleSub(String googleSub) {
        this.googleSub = googleSub;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Integer createdBy) {
        this.createdBy = createdBy;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public int getTotalComplaints() {
        return totalComplaints;
    }

    public void setTotalComplaints(int totalComplaints) {
        this.totalComplaints = totalComplaints;
    }

    public int getOpenComplaints() {
        return openComplaints;
    }

    public void setOpenComplaints(int openComplaints) {
        this.openComplaints = openComplaints;
    }

    public boolean isMainAdmin() {
        return "MAIN_ADMIN".equalsIgnoreCase(this.role);
    }

    /**
     * Both MAIN_ADMIN and ADMIN have administrative complaint-management privileges.
     */
    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(this.role) || "MAIN_ADMIN".equalsIgnoreCase(this.role);
    }

    public boolean isStudent() {
        return "STUDENT".equalsIgnoreCase(this.role);
    }

    public String getRoleLabel() {
        if ("MAIN_ADMIN".equalsIgnoreCase(role)) {
            return "MAIN ADMIN";
        }
        return role != null ? role.toUpperCase() : "STUDENT";
    }

    public String getInitials() {
        if (name == null || name.isBlank()) {
            return "QR";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }
}
