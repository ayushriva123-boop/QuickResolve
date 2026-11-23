package com.quickresolve.util;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Central input validation and allowlist helper for forms and servlets.
 */
public final class ValidationUtil {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    public static final List<String> CATEGORIES = Collections.unmodifiableList(Arrays.asList(
            "Hostel & Accommodation",
            "IT & Network",
            "Academics & Faculty",
            "Library & Labs",
            "Canteen & Hygiene",
            "Infrastructure & Maintenance",
            "Transport",
            "Administration",
            "Other"
    ));

    public static final List<String> STATUSES = Collections.unmodifiableList(Arrays.asList(
            "Pending",
            "In Progress",
            "Resolved"
    ));

    public static final List<String> ASSIGNABLE_ROLES = Collections.unmodifiableList(Arrays.asList(
            "STUDENT",
            "ADMIN"
    ));

    private ValidationUtil() {
    }

    public static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email.trim()).matches() && email.length() <= 150;
    }

    public static boolean isValidStatus(String status) {
        return status != null && STATUSES.contains(status);
    }

    public static boolean isAssignableRole(String role) {
        return role != null && ASSIGNABLE_ROLES.contains(role.trim().toUpperCase());
    }

    public static String sanitizeCategory(String category) {
        if (category == null) {
            return "Other";
        }
        String trimmed = category.trim();
        for (String allowed : CATEGORIES) {
            if (allowed.equalsIgnoreCase(trimmed)) {
                return allowed;
            }
        }
        return "Other";
    }
}
