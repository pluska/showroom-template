import config from '@/config/config';

/**
 * Contenido de las páginas legales.
 *
 * El texto es la plantilla acordada para todos los showrooms; los datos de la
 * inmobiliaria salen de `config.company`, de modo que clonar el proyecto y
 * rellenar el config basta para tener los legales correctos. Ojo con `city`:
 * no todos los proyectos están en Lima (El Olimpo está en Tumbes), así que la
 * provincia nunca debe escribirse dentro del texto.
 */

export interface LegalSection {
  title: string;
  /** Párrafos de la sección. */
  body?: string[];
  /** Lista de viñetas que sigue a los párrafos. */
  bullets?: string[];
  /** Párrafos de cierre, después de las viñetas. */
  footer?: string[];
}

const companyName = config.company.realStateName;
const companyAddress = config.company.address;
const contactEmail = config.company.email;
const companyPhone = config.company.phone?.trim();

/**
 * Compone la dirección que encabeza los legales.
 *
 * Tres cuidados, aprendidos de los configs reales de los proyectos:
 *  - Muchas direcciones ya terminan en la provincia o en el país, así que sólo
 *    añadimos `city` / `country` cuando el texto no los menciona ya (si no,
 *    salía "…, San Miguel, Lima, Lima, Perú").
 *  - Varios proyectos arrastran el marcador de la plantilla ("Company Address")
 *    o lo tienen vacío. En ese caso NO inventamos un domicilio: caemos a la
 *    provincia y el país, que es información que sí conocemos.
 */
const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const PLACEHOLDER_ADDRESSES = ['', 'company address', 'building address', 'direccion'];

const city = config.company.city?.trim() || '';
const country = config.company.country?.trim() || '';
const hasRealAddress = !PLACEHOLDER_ADDRESSES.includes(normalize(companyAddress || ''));

const mentions = (haystack: string, needle: string) =>
  !needle || normalize(haystack).includes(normalize(needle));

const fullAddress = (() => {
  if (!hasRealAddress) return [city, country].filter(Boolean).join(', ');
  // Si la dirección ya llega hasta el país, está completa: añadirle la
  // provincia después la dejaría en "…, San Isidro, Perú, Lima".
  if (mentions(companyAddress, country)) return companyAddress;
  const parts = [companyAddress];
  if (!mentions(companyAddress, city)) parts.push(city);
  parts.push(country);
  return parts.filter(Boolean).join(', ');
})();

export const privacyPolicySections: LegalSection[] = [
  {
    title: '1. Introducción',
    body: [
      `${companyName}, ubicada en ${fullAddress}, es responsable de la protección de los datos personales que recopilamos de nuestros usuarios, clientes y visitantes. Esta Política de Privacidad tiene como objetivo informarle sobre cómo recopilamos, utilizamos y protegemos su información personal de acuerdo con la legislación vigente en ${config.company.country}.`,
    ],
  },
  {
    title: '2. Información que Recopilamos',
    body: [
      'Recopilamos información personal de nuestros usuarios y clientes a través de diversos canales, tales como nuestro sitio web, correos electrónicos, formularios de contacto y comunicaciones telefónicas. La información que recopilamos puede incluir:',
    ],
    bullets: [
      'Nombre completo',
      'Número de teléfono',
      'Dirección de correo electrónico',
      'Dirección de residencia',
      'Información relacionada con transacciones y servicios solicitados',
      'Datos de navegación en nuestro sitio web',
    ],
  },
  {
    title: '3. Finalidad del Tratamiento de los Datos Personales',
    body: ['Los datos personales que recopilamos son utilizados para los siguientes fines:'],
    bullets: [
      'Brindar información sobre nuestros servicios inmobiliarios.',
      'Procesar consultas, solicitudes y contratos.',
      'Enviar notificaciones relacionadas con nuestros productos y servicios.',
      'Realizar gestiones administrativas y operativas para el cumplimiento de los servicios contratados.',
      'Mejorar la experiencia de usuario en nuestro sitio web y servicios de atención al cliente.',
      'Cumplir con obligaciones legales y reglamentarias.',
    ],
  },
  {
    title: '4. Consentimiento',
    body: [
      'Al proporcionarnos sus datos personales, usted nos otorga su consentimiento expreso para el tratamiento de los mismos con los fines mencionados anteriormente. Puede revocar su consentimiento en cualquier momento, siguiendo los procedimientos establecidos en la sección de «Derechos de los Usuarios».',
    ],
  },
  {
    title: '5. Seguridad de los Datos',
    body: [
      `${companyName} implementa medidas de seguridad técnicas y organizativas adecuadas para proteger sus datos personales contra acceso no autorizado, pérdida, alteración o divulgación. No obstante, ningún sistema de seguridad es 100% infalible, por lo que no podemos garantizar la seguridad absoluta de la información transmitida a través de internet.`,
    ],
  },
  {
    title: '6. Transferencia de Datos Personales',
    body: [
      `${companyName} no venderá, alquilará ni cederá sus datos personales a terceros sin su consentimiento, salvo cuando sea necesario para la prestación de los servicios solicitados o cuando lo exija la ley. En caso de que se transfiera información a terceros, nos aseguraremos de que dichos terceros implementen medidas de seguridad apropiadas.`,
    ],
  },
  {
    title: '7. Derechos de los Usuarios',
    body: [
      `Usted tiene el derecho de acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales en cualquier momento. Estos derechos pueden ser ejercidos enviando una solicitud a la siguiente dirección de correo electrónico: ${contactEmail}`,
    ],
  },
  {
    title: '8. Retención de Datos Personales',
    body: [
      'Conservaremos sus datos personales únicamente durante el tiempo necesario para cumplir con los fines establecidos en esta política, o hasta que usted solicite su eliminación, conforme a la legislación vigente.',
    ],
  },
  {
    title: '9. Uso de Cookies',
    body: [
      'Nuestro sitio web utiliza cookies para mejorar su experiencia de navegación, analizar el tráfico y personalizar el contenido. Las cookies son pequeños archivos que se almacenan en su dispositivo. Puede configurar su navegador para rechazar las cookies, aunque esto podría afectar la funcionalidad de nuestro sitio web.',
    ],
  },
  {
    title: '10. Enlaces a Otros Sitios Web',
    body: [
      'Nuestro sitio web puede contener enlaces a otros sitios web de terceros. No somos responsables de la política de privacidad de estos sitios. Le recomendamos que lea las políticas de privacidad de los sitios que visita.',
    ],
  },
  {
    title: '11. Modificaciones a la Política de Privacidad',
    body: [
      `${companyName} se reserva el derecho de modificar esta Política de Privacidad en cualquier momento. Cualquier cambio será publicado en nuestro sitio web y entrará en vigencia de inmediato. Le recomendamos que consulte esta política periódicamente.`,
    ],
  },
  {
    title: '12. Contacto',
    body: [
      'Si tiene alguna pregunta o inquietud sobre nuestra Política de Privacidad, no dude en contactarnos a través de los siguientes medios:',
    ],
    // El teléfono sólo aparece si el proyecto tiene uno configurado.
    bullets: [
      `Correo electrónico: ${contactEmail}`,
      ...(companyPhone ? [`Teléfono: ${companyPhone}`] : []),
    ],
  },
  {
    title: '13. Aceptación de la Política de Privacidad',
    body: [
      'Al utilizar nuestros servicios o acceder a nuestro sitio web, usted acepta los términos y condiciones de esta Política de Privacidad.',
    ],
  },
];

/**
 * Términos y condiciones de uso del showroom. Como el resto del archivo, los
 * datos de la inmobiliaria salen de `config.company`: el texto no menciona
 * ninguna empresa, dirección ni provincia en duro.
 */
export const termsAndConditionsSections: LegalSection[] = [
  {
    title: '1. Aceptación de los Términos',
    body: [
      `El presente documento regula el acceso y uso del sitio web de ${config.company.buildingName}, operado por ${companyName}, con domicilio en ${fullAddress}. Al navegar por este sitio, usar el showroom virtual o enviarnos sus datos a través de cualquiera de nuestros formularios, usted declara haber leído y aceptado estos Términos y Condiciones. Si no está de acuerdo con ellos, le pedimos abstenerse de utilizar el sitio.`,
    ],
  },
  {
    title: '2. Objeto del Sitio Web',
    body: [
      `Este sitio tiene una finalidad exclusivamente informativa y comercial: dar a conocer el proyecto ${config.company.buildingName} y permitir que los interesados soliciten información o coordinen una cita con un asesor. El sitio no constituye un canal de venta en línea ni permite formalizar la compra, reserva o separación de una unidad inmobiliaria.`,
    ],
  },
  {
    title: '3. Uso Permitido',
    body: ['Al utilizar este sitio web, usted se compromete a:'],
    bullets: [
      'Proporcionar información veraz, exacta y actualizada en los formularios de contacto.',
      'No utilizar el sitio con fines ilícitos o contrarios a la buena fe.',
      'No intentar acceder sin autorización a áreas restringidas, sistemas o bases de datos del sitio.',
      'No introducir código malicioso ni realizar acciones que puedan dañar, sobrecargar o deteriorar el funcionamiento del sitio.',
      'No extraer, reproducir o reutilizar de forma sistemática los contenidos del sitio sin autorización escrita.',
    ],
  },
  {
    title: '4. Propiedad Intelectual',
    body: [
      `Todos los contenidos de este sitio —incluyendo textos, planos, renders, imágenes, videos, recorridos virtuales, logotipos, marcas y el diseño del sitio— son propiedad de ${companyName} o de terceros que han autorizado su uso, y están protegidos por la legislación peruana sobre derechos de autor y propiedad industrial. Queda prohibida su reproducción, distribución, comunicación pública o transformación total o parcial sin autorización previa y por escrito de su titular.`,
    ],
  },
  {
    title: '5. Carácter Referencial de la Información',
    body: [
      'La información publicada en este sitio tiene carácter estrictamente referencial y no constituye una oferta contractual. En particular:',
    ],
    bullets: [
      'Los renders, imágenes, recorridos virtuales y maquetas son representaciones artísticas con fines ilustrativos; pueden diferir del inmueble terminado.',
      'Las áreas, metrajes, distribuciones y acabados son referenciales y están sujetos a las tolerancias constructivas y a las modificaciones que apruebe la entidad competente.',
      'El mobiliario, la decoración y el equipamiento mostrados no están incluidos en la venta, salvo que se indique expresamente por escrito.',
      'Los avances de obra publicados reflejan el estado a la fecha de su publicación y no constituyen un compromiso de plazo de entrega.',
    ],
    footer: [
      'Las condiciones definitivas de cada unidad serán únicamente las que consten en el contrato de compraventa y sus anexos, documentos que prevalecen sobre cualquier información contenida en este sitio.',
    ],
  },
  {
    title: '6. Precios y Disponibilidad',
    body: [
      'Los precios y la disponibilidad de las unidades son referenciales, pueden variar sin previo aviso y no obligan a la empresa hasta que se suscriba el documento contractual correspondiente. La disponibilidad mostrada en el sitio puede no reflejar en tiempo real las unidades ya separadas o vendidas.',
    ],
  },
  {
    title: '7. Formularios de Contacto y Citas',
    body: [
      `Los formularios de este sitio y la agenda de citas están destinados a canalizar consultas comerciales. Al enviarlos, usted autoriza a ${companyName} a contactarlo por los medios que haya indicado. Nos reservamos el derecho de no atender solicitudes que contengan datos manifiestamente falsos, incompletos o que resulten abusivas.`,
    ],
  },
  {
    title: '8. Protección de Datos Personales',
    body: [
      'El tratamiento de los datos personales que usted nos facilite se rige por nuestra Política de Privacidad, que forma parte integrante de estos Términos y Condiciones y que le recomendamos leer antes de enviarnos cualquier información.',
    ],
  },
  {
    title: '9. Enlaces a Sitios de Terceros',
    body: [
      'Este sitio puede contener enlaces a páginas de terceros, incluidas redes sociales y plataformas de recorridos virtuales. No controlamos dichos sitios ni respondemos por sus contenidos, políticas o prácticas. El acceso a ellos se realiza bajo su exclusiva responsabilidad.',
    ],
  },
  {
    title: '10. Disponibilidad del Servicio y Limitación de Responsabilidad',
    body: [
      `${companyName} procura mantener el sitio operativo y su información actualizada, pero no garantiza su disponibilidad ininterrumpida ni la ausencia de errores. En la medida permitida por la ley, no seremos responsables por daños derivados de la imposibilidad de acceder al sitio, de interrupciones del servicio, ni de decisiones adoptadas por el usuario basándose exclusivamente en la información referencial aquí publicada.`,
    ],
  },
  {
    title: '11. Modificaciones a los Términos',
    body: [
      `${companyName} se reserva el derecho de modificar en cualquier momento estos Términos y Condiciones, así como los contenidos y servicios del sitio. Las modificaciones entrarán en vigencia desde su publicación. Le recomendamos revisar esta página periódicamente.`,
    ],
  },
  {
    title: '12. Legislación Aplicable y Jurisdicción',
    body: [
      `Estos Términos y Condiciones se rigen por las leyes de la República del ${config.company.country === 'Perú' ? 'Perú' : config.company.country}. Cualquier controversia derivada de su interpretación o ejecución se someterá a los jueces y tribunales competentes, sin perjuicio de los derechos que la normativa de protección al consumidor reconoce al usuario.`,
    ],
  },
  {
    title: '13. Contacto',
    body: [
      'Para cualquier consulta relacionada con estos Términos y Condiciones puede escribirnos a:',
    ],
    bullets: [
      `Correo electrónico: ${contactEmail}`,
      ...(companyPhone ? [`Teléfono: ${companyPhone}`] : []),
    ],
  },
];
