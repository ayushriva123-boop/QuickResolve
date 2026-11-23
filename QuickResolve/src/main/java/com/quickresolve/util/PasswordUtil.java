package com.quickresolve.util;

import org.mindrot.jbcrypt.BCrypt;

/**
 * Utility for secure password hashing and verification using BCrypt.
 */
public final class PasswordUtil {
    private static final int BCRYPT_COST = 12;

    private PasswordUtil() {
    }

    public static String hashPassword(String plainPassword) {
        if (plainPassword == null || plainPassword.isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty.");
        }
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(BCRYPT_COST));
    }

    public static boolean verifyPassword(String plainPassword, String storedHash) {
        if (plainPassword == null || storedHash == null || storedHash.isEmpty()) {
            return false;
        }
        // jBCrypt 0.4 expects $2a$ revision prefix
        String normalizedHash = storedHash;
        if (storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
            normalizedHash = "$2a$" + storedHash.substring(4);
        }
        try {
            return BCrypt.checkpw(plainPassword, normalizedHash);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
