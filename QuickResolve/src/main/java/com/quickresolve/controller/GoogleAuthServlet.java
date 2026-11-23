package com.quickresolve.controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.quickresolve.dao.UserDAO;
import com.quickresolve.model.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.SQLException;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Handles Google OAuth 2.0 Sign-In for QuickResolve (popup code flow + ID token verification).
 * Requires environment variables GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
 */
@WebServlet("/auth/google/*")
public class GoogleAuthServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(GoogleAuthServlet.class.getName());
    private static final Gson GSON = new Gson();
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final UserDAO userDAO = new UserDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        if ("/url".equals(path)) {
            handleGetAuthUrl(request, response);
        } else if ("/callback".equals(path) || "/callback/".equals(path)) {
            handleOAuthCallback(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        if ("/token".equals(path)) {
            handleIdTokenSignIn(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    private void handleGetAuthUrl(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        response.setContentType("application/json; charset=UTF-8");
        Map<String, Object> payload = new HashMap<>();

        String clientId = trimEnv("GOOGLE_CLIENT_ID");
        String clientSecret = trimEnv("GOOGLE_CLIENT_SECRET");
        if (clientId == null || clientSecret == null) {
            payload.put("configured", false);
            payload.put("message",
                    "Google Sign-In requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables on Tomcat.");
            writeJson(response, payload);
            return;
        }

        byte[] stateBytes = new byte[24];
        RANDOM.nextBytes(stateBytes);
        String state = Base64.getUrlEncoder().withoutPadding().encodeToString(stateBytes);
        String redirectUri = buildRedirectUri(request);

        HttpSession session = request.getSession(true);
        session.setAttribute("googleOAuthState", state);
        session.setAttribute("googleOAuthRedirectUri", redirectUri);

        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + urlEncode(clientId)
                + "&redirect_uri=" + urlEncode(redirectUri)
                + "&response_type=code"
                + "&scope=" + urlEncode("openid email profile")
                + "&prompt=" + urlEncode("select_account")
                + "&state=" + urlEncode(state);

        payload.put("configured", true);
        payload.put("url", authUrl);
        writeJson(response, payload);
    }

    private void handleOAuthCallback(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String oauthError = request.getParameter("error");
        if (oauthError != null && !oauthError.isBlank()) {
            renderPopupResult(response, false, "Google sign-in was cancelled or denied.", null);
            return;
        }

        String code = request.getParameter("code");
        String state = request.getParameter("state");
        HttpSession session = request.getSession(false);
        String expectedState = session != null ? (String) session.getAttribute("googleOAuthState") : null;
        String redirectUri = session != null ? (String) session.getAttribute("googleOAuthRedirectUri") : null;

        if (session != null) {
            session.removeAttribute("googleOAuthState");
            session.removeAttribute("googleOAuthRedirectUri");
        }

        if (code == null || code.isBlank() || expectedState == null || !expectedState.equals(state)) {
            renderPopupResult(response, false, "Invalid or expired Google OAuth session state.", null);
            return;
        }

        String clientId = trimEnv("GOOGLE_CLIENT_ID");
        String clientSecret = trimEnv("GOOGLE_CLIENT_SECRET");
        if (clientId == null || clientSecret == null) {
            renderPopupResult(response, false, "Server Google OAuth credentials are not configured.", null);
            return;
        }
        if (redirectUri == null || redirectUri.isBlank()) {
            redirectUri = buildRedirectUri(request);
        }

        try {
            // 1. Exchange authorization code for tokens
            String tokenForm = "code=" + urlEncode(code)
                    + "&client_id=" + urlEncode(clientId)
                    + "&client_secret=" + urlEncode(clientSecret)
                    + "&redirect_uri=" + urlEncode(redirectUri)
                    + "&grant_type=authorization_code";

            HttpRequest tokenReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(tokenForm))
                    .build();

            HttpResponse<String> tokenResp = HTTP.send(tokenReq, HttpResponse.BodyHandlers.ofString());
            if (tokenResp.statusCode() < 200 || tokenResp.statusCode() >= 300) {
                LOGGER.warning("Google token exchange failed: HTTP " + tokenResp.statusCode());
                renderPopupResult(response, false, "Google token verification failed.", null);
                return;
            }

            JsonObject tokenJson = JsonParser.parseString(tokenResp.body()).getAsJsonObject();
            String accessToken = getString(tokenJson, "access_token");
            if (accessToken == null) {
                renderPopupResult(response, false, "No access token received from Google.", null);
                return;
            }

            // 2. Fetch verified user profile from Google UserInfo endpoint
            HttpRequest profileReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();

            HttpResponse<String> profileResp = HTTP.send(profileReq, HttpResponse.BodyHandlers.ofString());
            if (profileResp.statusCode() != 200) {
                renderPopupResult(response, false, "Unable to fetch Google profile.", null);
                return;
            }

            JsonObject profile = JsonParser.parseString(profileResp.body()).getAsJsonObject();
            String sub = getString(profile, "sub");
            String email = getString(profile, "email");
            String name = getString(profile, "name");
            boolean verified = profile.has("email_verified") && profile.get("email_verified").getAsBoolean();

            if (sub == null || email == null || !verified) {
                renderPopupResult(response, false, "Your Google account must have a verified email address.", null);
                return;
            }

            User user = authenticateOrProvisionGoogleUser(sub, email, name);
            if (user == null) {
                renderPopupResult(response, false, "Unable to create or load your QuickResolve account.", null);
                return;
            }

            user.setPassword(null);
            HttpSession authSession = request.getSession(true);
            try {
                request.changeSessionId();
            } catch (IllegalStateException ignored) {
            }
            authSession.setAttribute("user", user);

            String redirectUrl = request.getContextPath() + getRoleDashboardPath(user);
            LOGGER.info("Google OAuth sign-in succeeded: userId=" + user.getId() + ", role=" + user.getRole());
            renderPopupResult(response, true, null, redirectUrl);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            renderPopupResult(response, false, "Google authentication interrupted.", null);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Google OAuth callback error.", e);
            renderPopupResult(response, false, "Unexpected error during Google sign-in.", null);
        }
    }

    private void handleIdTokenSignIn(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        response.setContentType("application/json; charset=UTF-8");
        Map<String, Object> payload = new HashMap<>();

        String clientId = trimEnv("GOOGLE_CLIENT_ID");
        String idToken = request.getParameter("credential");
        if (clientId == null) {
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            payload.put("error", "GOOGLE_CLIENT_ID is not configured on the server.");
            writeJson(response, payload);
            return;
        }
        if (idToken == null || idToken.isBlank()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            payload.put("error", "Missing Google credential token.");
            writeJson(response, payload);
            return;
        }

        try {
            HttpRequest verifyReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + urlEncode(idToken)))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> verifyResp = HTTP.send(verifyReq, HttpResponse.BodyHandlers.ofString());
            if (verifyResp.statusCode() != 200) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                payload.put("error", "Invalid Google ID token.");
                writeJson(response, payload);
                return;
            }

            JsonObject info = JsonParser.parseString(verifyResp.body()).getAsJsonObject();
            String aud = getString(info, "aud");
            String sub = getString(info, "sub");
            String email = getString(info, "email");
            String name = getString(info, "name");
            String emailVerified = getString(info, "email_verified");

            if (!clientId.equals(aud) || sub == null || email == null || !"true".equalsIgnoreCase(emailVerified)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                payload.put("error", "Google token audience or email verification check failed.");
                writeJson(response, payload);
                return;
            }

            User user = authenticateOrProvisionGoogleUser(sub, email, name);
            if (user == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                payload.put("error", "Failed to provision user account.");
                writeJson(response, payload);
                return;
            }

            user.setPassword(null);
            HttpSession authSession = request.getSession(true);
            try {
                request.changeSessionId();
            } catch (IllegalStateException ignored) {
            }
            authSession.setAttribute("user", user);

            payload.put("success", true);
            payload.put("redirectUrl", request.getContextPath() + getRoleDashboardPath(user));
            writeJson(response, payload);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            payload.put("error", "Google token verification interrupted.");
            writeJson(response, payload);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Google ID token sign-in error.", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            payload.put("error", "Failed to verify Google sign-in.");
            writeJson(response, payload);
        }
    }

    private User authenticateOrProvisionGoogleUser(String sub, String email, String name)
            throws SQLException {
        String normalizedEmail = email.trim().toLowerCase();
        User existing = userDAO.findByEmail(normalizedEmail);
        if (existing != null) {
            if (existing.getGoogleSub() == null || existing.getGoogleSub().isBlank()) {
                userDAO.linkGoogleAccount(existing.getId(), sub);
                existing.setGoogleSub(sub);
            }
            return existing;
        }
        String displayName = (name != null && !name.isBlank()) ? name.trim() : normalizedEmail.split("@")[0];
        return userDAO.createGoogleStudent(displayName, normalizedEmail, sub);
    }

    private String getRoleDashboardPath(User user) {
        if (user.isMainAdmin()) {
            return "/main-admin/users";
        }
        return user.isAdmin() ? "/admin/dashboard" : "/student/dashboard";
    }

    private String buildRedirectUri(HttpServletRequest request) {
        String appUrl = trimEnv("APP_URL");
        if (appUrl != null) {
            String base = appUrl.endsWith("/") ? appUrl.substring(0, appUrl.length() - 1) : appUrl;
            return base + request.getContextPath() + "/auth/google/callback";
        }
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        boolean defaultPort = ("http".equalsIgnoreCase(scheme) && port == 80)
                || ("https".equalsIgnoreCase(scheme) && port == 443);
        String portPart = defaultPort ? "" : ":" + port;
        return scheme + "://" + host + portPart + request.getContextPath() + "/auth/google/callback";
    }

    private void renderPopupResult(HttpServletResponse response, boolean success, String error, String redirectUrl)
            throws IOException {
        response.setContentType("text/html; charset=UTF-8");
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", success ? "GOOGLE_AUTH_SUCCESS" : "GOOGLE_AUTH_ERROR");
        if (redirectUrl != null) msg.put("redirectUrl", redirectUrl);
        if (error != null) msg.put("error", error);
        String jsonMsg = GSON.toJson(msg);
        String fallbackUrl = redirectUrl != null ? GSON.toJson(redirectUrl) : "null";

        try (PrintWriter out = response.getWriter()) {
            out.println("<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>Google Sign-In</title></head>");
            out.println("<body style='font-family:sans-serif;text-align:center;padding:3rem;color:#0F172A;'>");
            out.println(success ? "<p>Signing you into QuickResolve...</p>" : "<p style='color:#B91C1C;'>Authentication failed.</p>");
            out.println("<script>");
            out.println("(function(){");
            out.println("  var payload = " + jsonMsg + ";");
            out.println("  if (window.opener && !window.opener.closed) {");
            out.println("    window.opener.postMessage(payload, window.location.origin);");
            out.println("    window.close();");
            out.println("  } else if (" + fallbackUrl + ") {");
            out.println("    window.location.href = " + fallbackUrl + ";");
            out.println("  }");
            out.println("})();");
            out.println("</script></body></html>");
        }
    }

    private static void writeJson(HttpServletResponse response, Map<String, Object> payload) throws IOException {
        try (PrintWriter out = response.getWriter()) {
            out.print(GSON.toJson(payload));
        }
    }

    private static String trimEnv(String key) {
        String val = System.getenv(key);
        return (val != null && !val.trim().isEmpty()) ? val.trim() : null;
    }

    private static String getString(JsonObject obj, String key) {
        return (obj.has(key) && !obj.get(key).isJsonNull()) ? obj.get(key).getAsString() : null;
    }

    private static String urlEncode(String val) {
        return URLEncoder.encode(val, StandardCharsets.UTF_8);
    }
}
