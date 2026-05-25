"use client";

import { updateSetting } from "@/app/actions/settings";
import { useState } from "react";
import { Save } from "lucide-react";

export default function IdentityForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const data = {
      primaryColor: formData.get("primaryColor"),
      secondaryColor: formData.get("secondaryColor"),
      typography: formData.get("typography"),
      contactEmail: formData.get("contactEmail"),
      contactPhone: formData.get("contactPhone"),
      socialFacebook: formData.get("socialFacebook"),
      socialInstagram: formData.get("socialInstagram"),
    };

    try {
      await updateSetting("identity", data);
      setMessage("Configuración guardada exitosamente.");
    } catch (error: any) {
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`alert ${message.startsWith("Error") ? "alert-error" : "alert-success"} text-sm py-2`}>
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Colores y Tipografía</h3>
          
          <div className="form-control">
            <label className="label"><span className="label-text">Color Primario</span></label>
            <div className="flex gap-2">
              <input name="primaryColor" type="color" defaultValue={initialData.primaryColor} className="input p-1 w-16 h-12" />
              <input type="text" readOnly value={initialData.primaryColor} className="input input-bordered flex-1" />
            </div>
          </div>
          
          <div className="form-control">
            <label className="label"><span className="label-text">Color Secundario</span></label>
            <div className="flex gap-2">
              <input name="secondaryColor" type="color" defaultValue={initialData.secondaryColor} className="input p-1 w-16 h-12" />
              <input type="text" readOnly value={initialData.secondaryColor} className="input input-bordered flex-1" />
            </div>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Tipografía Principal</span></label>
            <select name="typography" defaultValue={initialData.typography} className="select select-bordered">
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Outfit">Outfit</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Información de Contacto y Redes</h3>
          
          <div className="form-control">
            <label className="label"><span className="label-text">Email de Contacto</span></label>
            <input name="contactEmail" type="email" defaultValue={initialData.contactEmail} placeholder="info@proyecto.com" className="input input-bordered" />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Teléfono Principal</span></label>
            <input name="contactPhone" type="text" defaultValue={initialData.contactPhone} placeholder="+1 234 567 890" className="input input-bordered" />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Facebook URL</span></label>
            <input name="socialFacebook" type="url" defaultValue={initialData.socialFacebook} placeholder="https://facebook.com/..." className="input input-bordered" />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Instagram URL</span></label>
            <input name="socialInstagram" type="url" defaultValue={initialData.socialInstagram} placeholder="https://instagram.com/..." className="input input-bordered" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}
