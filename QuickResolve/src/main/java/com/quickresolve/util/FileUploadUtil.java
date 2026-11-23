package com.quickresolve.util;

import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Handles secure complaint proof image validation, storage, and path resolution.
 */
public final class FileUploadUtil {

    public static final long MAX_IMAGE_BYTES = 5L * 1024L * 1024L; // 5 MB

    private static final Map<String, String> ALLOWED_CONTENT_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private FileUploadUtil() {
    }

    public static Path getUploadDirectory() throws IOException {
        String configured = System.getProperty("quickresolve.upload.dir");
        if (configured == null || configured.trim().isEmpty()) {
            configured = System.getenv("QUICKRESOLVE_UPLOAD_DIR");
        }
        Path dir = (configured != null && !configured.trim().isEmpty())
                ? Paths.get(configured.trim())
                : Paths.get(System.getProperty("user.home"), "quickresolve-uploads");

        Path normalized = dir.toAbsolutePath().normalize();
        if (!Files.exists(normalized)) {
            Files.createDirectories(normalized);
        }
        return normalized;
    }

    /**
     * Validates an uploaded image Part (size, MIME type, and file header magic bytes)
     * and writes it using a generated UUID filename.
     */
    public static String saveProofImage(Part filePart) throws IOException {
        if (filePart == null || filePart.getSize() <= 0) {
            throw new IllegalArgumentException("Please attach a proof image for your complaint.");
        }
        if (filePart.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Proof image size must not exceed 5 MB.");
        }

        String contentType = filePart.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("Unsupported file type. Please upload JPG, PNG, WEBP, or GIF.");
        }
        String normalizedType = contentType.toLowerCase(Locale.ROOT).split(";")[0].trim();
        String extension = ALLOWED_CONTENT_TYPES.get(normalizedType);
        if (extension == null) {
            throw new IllegalArgumentException("Only JPG, PNG, WEBP, or GIF proof images are allowed.");
        }

        byte[] header = new byte[12];
        try (InputStream probe = filePart.getInputStream()) {
            int read = probe.read(header);
            if (!matchesImageMagicBytes(header, read)) {
                throw new IllegalArgumentException("Uploaded file is not a valid image.");
            }
        }

        Path uploadDir = getUploadDirectory();
        String safeFileName = UUID.randomUUID() + extension;
        Path targetPath = uploadDir.resolve(safeFileName).normalize();
        if (!targetPath.startsWith(uploadDir)) {
            throw new SecurityException("Invalid upload path.");
        }

        try (InputStream dataStream = filePart.getInputStream()) {
            Files.copy(dataStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }
        return safeFileName;
    }

    public static Path resolveExistingProofFile(String storedFilename) throws IOException {
        if (storedFilename == null || storedFilename.trim().isEmpty()) {
            return null;
        }
        // Only allow plain UUID-style filename characters
        if (!storedFilename.matches("^[a-zA-Z0-9._-]+$")) {
            return null;
        }
        Path uploadDir = getUploadDirectory();
        Path filePath = uploadDir.resolve(storedFilename).normalize();
        if (!filePath.startsWith(uploadDir) || !Files.isRegularFile(filePath)) {
            return null;
        }
        return filePath;
    }

    public static void deleteProofFileQuietly(String storedFilename) {
        try {
            Path p = resolveExistingProofFile(storedFilename);
            if (p != null) {
                Files.deleteIfExists(p);
            }
        } catch (IOException ignored) {
        }
    }

    public static String detectContentType(Path filePath) {
        String name = filePath.getFileName().toString().toLowerCase(Locale.ROOT);
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".webp")) return "image/webp";
        if (name.endsWith(".gif")) return "image/gif";
        return "image/jpeg";
    }

    private static boolean matchesImageMagicBytes(byte[] b, int len) {
        if (len < 4) return false;
        // JPEG: FF D8 FF
        if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return true;
        }
        // PNG: 89 50 4E 47
        if ((b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) {
            return true;
        }
        // GIF87a / GIF89a
        if (b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8') {
            return true;
        }
        // WEBP: RIFF....WEBP
        return len >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
    }
}
