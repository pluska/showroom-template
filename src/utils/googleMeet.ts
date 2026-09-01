interface GoogleMeetEventData {
  summary: string;
  description?: string;
  startDate: Date;
  durationMinutes?: number;
  prospectEmail: string;
  prospectName: string;
  sellerEmail: string;
  sellerName: string;
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Credenciales de Google no configuradas en las variables de entorno (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)."
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error al obtener access token de Google:", errorText);
    throw new Error(`Error de autenticación con Google: ${response.statusText}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

export async function createGoogleMeetEvent(data: GoogleMeetEventData): Promise<string> {
  const accessToken = await getAccessToken();

  const startDateTime = new Date(data.startDate);
  const duration = data.durationMinutes || 30;
  const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

  const eventBody = {
    summary: data.summary,
    description: data.description || "",
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: "America/Lima",
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: "America/Lima",
    },
    attendees: [
      { email: data.prospectEmail.trim().toLowerCase(), displayName: data.prospectName },
      { email: data.sellerEmail.trim().toLowerCase(), displayName: data.sellerName },
    ],
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error al crear el evento de Google Calendar:", errorText);
    throw new Error(`Error de Google Calendar API: ${response.statusText} - ${errorText}`);
  }

  const eventResult = await response.json() as {
    conferenceData?: {
      entryPoints?: Array<{
        entryPointType: string;
        uri: string;
      }>;
    };
  };

  const meetEntryPoint = eventResult.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === "video"
  );

  if (!meetEntryPoint || !meetEntryPoint.uri) {
    throw new Error("No se pudo generar el enlace de Google Meet para este evento.");
  }

  return meetEntryPoint.uri;
}
