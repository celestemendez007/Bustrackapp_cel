// Archivo de configuración de ejemplo
// Copia este archivo como .env y ajusta los valores según tu entorno

export const config = {
  // Configuración de la base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'bustracksv',
    user: process.env.DB_USER || 'bustracksv_user',
    password: process.env.DB_PASSWORD || 'bustracksv_password'
  },
  
  // Configuración del servidor
  server: {
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  // JWT Secret
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion'
  },
  
  // Configuración de PgAdmin (opcional)
  pgadmin: {
    email: process.env.PGADMIN_EMAIL || 'admin@bustracksv.com',
    password: process.env.PGADMIN_PASSWORD || 'admin123',
    port: process.env.PGADMIN_PORT || 5050
  }
};

// Variables de entorno necesarias (crear archivo .env con estos valores):
/*
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bustracksv
DB_USER=bustracksv_user
DB_PASSWORD=bustracksv_password
PORT=4000
NODE_ENV=development
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion
PGADMIN_EMAIL=admin@bustracksv.com
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5050
*/
