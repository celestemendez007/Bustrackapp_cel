import { testConnection } from './src/db.js';

console.log('🧪 Probando conexión SQLite...\n');

testConnection()
  .then((result) => {
    if (result) {
      console.log('\n✅ ¡SQLite está funcionando correctamente!');
      process.exit(0);
    } else {
      console.log('\n❌ Error al conectar con SQLite');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });



