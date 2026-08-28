import { Resend } from 'resend';
import ContactEmail from '@/components/emails/ContactEmail';
import { NextResponse } from 'next/server';
import config from '@/config/config';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { 
        nombres, 
        apellido, 
        email, 
        celular, 
        documentType, 
        documentNumber, 
        contactPreference, 
        horario,
        project,
        mensaje
    } = body;

    const targetEmail = config.resend.supportEmail;

    // 1. Intentar con Resend si la API Key está presente
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = config.resend.fromNoReply;
        
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [targetEmail],
          subject: `Nueva Solicitud: ${nombres || ''} ${apellido || ''}`.trim() || `Nueva consulta — ${config.appName}`,
          react: ContactEmail({
            nombres,
            apellido,
            email,
            celular,
            documentType,
            documentNumber,
            contactPreference,
            horario,
            project: project || config.company.buildingName || config.appName,
            mensaje
          }),
        });

        if (!error && data) {
          return NextResponse.json({ success: true, data });
        }
        console.warn('Resend retorno error, intentando mailer PHP:', error);
      } catch (rErr) {
        console.warn('Error ejecutando Resend, intentando mailer PHP:', rErr);
      }
    }

    // 2. Intentar con el Mailer PHP si está disponible
    if (config.mailerUrl) {
      try {
        const phpRes = await fetch(config.mailerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (phpRes.ok) {
          const result = await phpRes.json().catch(() => ({}));
          return NextResponse.json({ success: true, mailer: result });
        }
      } catch (phpErr) {
        console.error('Error enviando a mailer PHP:', phpErr);
      }
    }

    return NextResponse.json({ success: true, message: "Datos procesados" });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
