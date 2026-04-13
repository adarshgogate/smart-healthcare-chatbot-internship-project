
## 📘 PostgreSQL Connection & Usage Commands

### 1. Start PostgreSQL Server
Windows (Command Prompt, Admin):
```bash
pg_ctl -D "C:\PostgresData" start
```
Linux/Mac:
```bash
sudo service postgresql start
cd cd ```
or
```bash
brew services start postgresql
```

---

### 2. Connect to PostgreSQL
```bash
psql -U postgres -d healthcare_db
```
Enter the password when prompted.  
Prompt changes to:
```
healthcare_db=#
```

---

### 3. Verify Database
List all databases:
```sql
\l
```

---

### 4. Verify Tables
Inside `healthcare_db`:
```sql
\dt
```

---

### 5. Inspect Table Schema
```sql
\d patients
\d doctors
\d appointments
\d users
```

---

### 6. Run Queries
Check data:
```sql
SELECT * FROM patients;
SELECT * FROM doctors;
SELECT * FROM appointments;
```

---

### 7. Exit psql
```sql
\q
```

---

## ✅ Documentation Notes
- Always start PostgreSQL before running Flask (`python app.py`).
- Use `\l` to confirm the database exists.
- Use `\dt` to confirm tables exist.
- Use `\d <table>` to check schema.
- Use `SELECT` queries to validate data.
- Exit with `\q`.

