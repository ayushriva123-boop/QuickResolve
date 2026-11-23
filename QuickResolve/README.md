# QuickResolve – Student Complaint Management System

QuickResolve is a complete Java EE (Jakarta EE 10) web application built with **Java 17**, **Servlets**, **JSP**, **JSTL**, **JDBC**, **MySQL 8**, and **Bootstrap 5**. Students can register, log in, submit complaints with **image proof**, and track resolution progress; administrators can review proof attachments, filter/search complaints, and update statuses.

---

## 1. Prerequisites

- **JDK 17** (`java -version`)
- **Apache Maven 3.8+** (`mvn -version`)
- **MySQL 8.0+** (port `3306`)
- **Apache Tomcat 10.1** (Jakarta EE 10)
- **Visual Studio Code** (*Extension Pack for Java*)

---

## 2. Database Setup (MySQL 8)

Run `database.sql` to create `quickresolve_db`, `users`, `complaints` (with `proof_image`), indexes, and initial accounts:

```bash
mysql -u root -p < database.sql
```

---

## 3. Environment Configuration

| Variable | Default (if unset) | Description |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/quickresolve_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` | MySQL JDBC URL |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | `""` | MySQL password |
| `QUICKRESOLVE_UPLOAD_DIR` | `~/quickresolve-uploads` | Folder where complaint proof images are stored |
| `GOOGLE_CLIENT_ID` | *(optional)* | Google OAuth 2.0 Web Client ID for "Sign in with Google" |
| `GOOGLE_CLIENT_SECRET` | *(optional)* | Google OAuth 2.0 Client Secret for token verification |
| `APP_URL` | *(optional)* | Public base URL (for OAuth redirect URI on cloud/reverse-proxy hosts) |

> **Google Cloud Console Authorized Redirect URI:**
> `http://localhost:8080/QuickResolve/auth/google/callback` (or `<APP_URL>/auth/google/callback` in production)

---

## 4. Build & Deploy

```bash
cd QuickResolve
mvn clean package
```

Copy `QuickResolve/target/QuickResolve.war` into `<TOMCAT_HOME>/webapps/`, start Tomcat, and visit:

```
http://localhost:8080/QuickResolve/
```

---

## 5. Testing Credentials

| Role | Email | Password |
|---|---|---|
| **Main Admin** *(Creates IDs & Assigns Roles)* | `mainadmin@quickresolve.edu` | `Admin@123` |
| **Administrator** | `admin@quickresolve.edu` | `Admin@123` |
| **Student (Demo)** | `student@quickresolve.edu` | `Student@123` |
