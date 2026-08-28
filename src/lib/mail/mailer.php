<?php
// ============================================================================
// MAILER SCRIPT (PHP) - URBANIZACIÓN EL OLIMPO DE TUMBES
// ============================================================================
// Este script recibe peticiones POST en formato JSON desde los formularios
// del showroom virtual (contacto, consulta de unidad, solicitud de info) y
// envía un correo formateado a la bandeja de marketing del proyecto.
// ============================================================================

// Configuración de CORS para permitir solicitudes desde cualquier origen del frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Manejar la petición de preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Solo permitir solicitudes POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método no permitido. Solo se acepta POST."]);
    exit;
}

// Obtener y decodificar el cuerpo de la petición JSON
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "JSON inválido o cuerpo vacío."]);
    exit;
}

// 1. Destinatario principal configurado
// PLANTILLA — RELLENAR. Deben coincidir con `config.resend` del front:
// $TO es el buzón que recibe los formularios; $FROM_ADDRESS tiene que
// pertenecer al dominio desde el que sirve este PHP o el servidor lo rechaza.
$TO            = "RELLENAR@dominio.com";
$FROM_NAME     = "RELLENAR Nombre del proyecto";
$FROM_ADDRESS  = "noreply@RELLENAR-dominio.com";

$to = $TO;

// 2. Extraer y validar el email del prospecto para Reply-To
$senderEmail = null;
foreach ($data as $key => $value) {
    if (is_string($value) && (stripos($key, 'email') !== false || stripos($key, 'correo') !== false)) {
        $clean = filter_var(trim($value), FILTER_VALIDATE_EMAIL);
        if ($clean) {
            $senderEmail = $clean;
            break;
        }
    }
}

// 3. Extraer nombre del prospecto para el Asunto si está presente
$prospectName = "";
if (!empty($data['name'])) {
    $prospectName = trim($data['name']);
} elseif (!empty($data['nombres'])) {
    $prospectName = trim($data['nombres']) . (!empty($data['apellido']) ? ' ' . trim($data['apellido']) : '');
} elseif (!empty($data['nombreCompleto'])) {
    $prospectName = trim($data['nombreCompleto']);
}

// Asunto del correo
$subject = "Nueva Consulta: Urbanización El Olimpo de Tumbes" . ($prospectName ? " - " . $prospectName : "");
// Sanitizar asunto para evitar inyecciones de cabeceras
$subject = str_replace(array("\r", "\n"), '', $subject);

// 4. Construir cuerpo del mensaje (Texto plano estructurado)
$message = "=======================================================\n";
$message .= " NUEVA CONSULTA - URBANIZACIÓN EL OLIMPO DE TUMBES\n";
$message .= "=======================================================\n\n";
$message .= "Has recibido una nueva solicitud desde el showroom virtual.\n\n";
$message .= "DETALLES DEL CONTACTO:\n";
$message .= "-------------------------------------------------------\n";

// Mapeo de etiquetas legibles en español
$labelMap = [
    'nombres'           => 'Nombres',
    'apellido'          => 'Apellidos',
    'name'              => 'Nombre Completo',
    'nombreCompleto'    => 'Nombre Completo',
    'email'             => 'Correo Electrónico',
    'correo'            => 'Correo Electrónico',
    'celular'           => 'Teléfono / WhatsApp',
    'phone'             => 'Teléfono / WhatsApp',
    'whatsapp'          => 'WhatsApp',
    'documentType'      => 'Tipo de Documento',
    'documentNumber'    => 'N° de Documento',
    'project'           => 'Proyecto',
    'proyecto'          => 'Proyecto',
    'unitId'            => 'ID de Lote/Unidad',
    'unidad'            => 'Lote / Unidad',
    'floorId'           => 'Piso / Manzana',
    'piso'              => 'Piso / Manzana',
    'contactPreference' => 'Medio de Contacto Preferido',
    'horario'           => 'Horario de Preferencia',
    'cuandoComprar'     => '¿Cuándo desea comprar?',
    'creditoAprobado'   => '¿Cuenta con crédito aprobado?',
    'mensaje'           => 'Mensaje / Consulta',
    'message'           => 'Mensaje / Consulta',
    'address'           => 'Mensaje / Dirección',
    'terms'             => 'Aceptó Términos y Políticas',
    'auth'              => 'Autorizó Fines Comerciales'
];

foreach ($data as $key => $value) {
    if ($value === null || $value === '') continue;

    $label = isset($labelMap[$key]) ? $labelMap[$key] : ucfirst(preg_replace('/(?<!\ )[A-Z]/', ' $0', $key));

    if (is_array($value)) {
        $valStr = implode(", ", $value);
    } elseif (is_bool($value)) {
        $valStr = $value ? 'Sí' : 'No';
    } else {
        $valStr = (string)$value;
    }

    $message .= sprintf("%-28s: %s\n", $label, trim($valStr));
}

$message .= "-------------------------------------------------------\n";
$message .= "Fecha y hora de recepción : " . date("d/m/Y H:i:s") . " (Hora del servidor)\n";
$message .= "IP de origen               : " . ($_SERVER['REMOTE_ADDR'] ?? 'Desconocida') . "\n";
$message .= "=======================================================\n";

// 5. Configurar Cabeceras de Correo
$replyTo = $senderEmail ? $senderEmail : $FROM_ADDRESS;
$cleanReplyTo = str_replace(array("\r", "\n"), '', $replyTo);

$headers = "From: $FROM_NAME <$FROM_ADDRESS>\r\n" .
           "Reply-To: " . $cleanReplyTo . "\r\n" .
           "MIME-Version: 1.0\r\n" .
           "Content-Type: text/plain; charset=UTF-8\r\n" .
           "X-Mailer: PHP/" . phpversion();

// 6. Enviar Correo
if (@mail($to, $subject, $message, $headers)) {
    echo json_encode([
        "status"  => "success",
        "message" => "Correo enviado exitosamente a " . $to
    ]);
} else {
    // Si la función mail() de PHP falla en el servidor
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Fallo el envío de correo. Verifica la configuración de sendmail/SMTP del servidor PHP."
    ]);
}
?>
