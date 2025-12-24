
import { pool } from './src/db.js';
import bcrypt from 'bcrypt';

async function resetAdmin() {
    try {
        const userResult = await pool.query("SELECT * FROM usuarios WHERE usuario = 'admin'");

        const hashedPassword = await bcrypt.hash('admin123', 10);

        if (userResult.rows.length === 0) {
            console.log("Creating admin user...");
            await pool.query(
                "INSERT INTO usuarios (usuario, password, email, rol) VALUES (?, ?, ?, ?)",
                ['admin', hashedPassword, 'admin@bustracksv.com', 'admin']
            );
        } else {
            console.log("Updating admin user password...");
            await pool.query(
                "UPDATE usuarios SET password = ? WHERE usuario = 'admin'",
                [hashedPassword]
            );
        }

        console.log("Admin user reset successfully.");
        console.log("User: admin");
        console.log("Pass: admin123");

    } catch (e) {
        console.error(e);
    }
}

resetAdmin();
