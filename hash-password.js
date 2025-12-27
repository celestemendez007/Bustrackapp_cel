// Script simple para generar hash de contraseña con bcrypt
import bcrypt from 'bcrypt';

const password = '123456'; // Cambia esto por la contraseña que quieras
const hash = await bcrypt.hash(password, 10);

console.log('Contraseña:', password);
console.log('Hash generado:', hash);
console.log('\nUsa este hash en el UPDATE SQL:');
console.log(`UPDATE usuarios SET password = '${hash}', rol = 'admin' WHERE usuario = 'admin_celeste';`);





