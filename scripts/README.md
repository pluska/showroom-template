# `scripts/`

Utilidades del proyecto y **parches puntuales** de base de datos.

Las dos que vienen en la plantilla sirven igual en cualquier proyecto:

```bash
node scripts/hash-password.mjs 'la-contraseña'   # hash bcrypt para sembrar un usuario
npm run assets:bump                              # rompe la caché tras reemplazar un asset en R2
```

El resto de este directorio es de cada proyecto.

## La convención para el resto

Cada entrega del cliente que hay que aplicar sobre una base ya sembrada se
escribe como un `.sql` con nombre en imperativo (`update-unit-typologies.sql`,
`seed-amenities-db.sql`) y una cabecera que explique **qué entrega aplica y por
qué no basta con volver a sembrar**. Se ejecutan así:

```bash
wrangler d1 execute showroom-db --local  --file=./scripts/<archivo>.sql
wrangler d1 execute showroom-db --remote --file=./scripts/<archivo>.sql
```

Son parches **en sitio**: actualizan filas sin el borrado que hace el seed, que
es justamente lo que se necesita cuando el cliente ya está usando el panel.

Estos archivos son de un proyecto concreto y **no viajan a la plantilla**: si
buscas ejemplos de cómo quedaron escritos, están en el repositorio del último
proyecto entregado.

## Nunca

Un script que apunte al bucket o a la base de otro cliente. Las URLs de R2 se
construyen con `NEXT_PUBLIC_R2_PUBLIC_URL`, nunca se copian a mano.
