// Genera el hash bcrypt de una contraseña para sembrarla en la tabla `users`.
//
//   node scripts/hash-password.mjs 'la-contraseña'
//
// El hash resultante va a un archivo LOCAL (.users.local.sql), nunca a
// src/lib/db/insert-users.sql: ese sí se commitea. Ver la cabecera de ese
// archivo para el procedimiento completo.
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Uso: node scripts/hash-password.mjs 'la-contraseña'");
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 10));
