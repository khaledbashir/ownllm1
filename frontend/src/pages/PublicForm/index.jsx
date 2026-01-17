import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FullScreenLoader } from "@/components/Preloader";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import paths from "@/utils/paths";
import { API_BASE } from "@/utils/constants";

export default function PublicForm() {
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchForm() {
      try {
        const res = await fetch(`${API_BASE}/forms/${uuid}`);
        if (!res.ok) throw new Error("Form not found or unavailable");
        const data = await res.json();

        if (data.success) {
          setForm(data.form);
          const parsedFields =
            typeof data.form.fields === "string"
              ? JSON.parse(data.form.fields)
              : data.form.fields || [];
          setFields(parsedFields);

          // Initialize form data
          const initialData = {};
          parsedFields.forEach((field) => {
            initialData[field.id] = "";
          });
          setFormData(initialData);
        } else {
          setError(data.error);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchForm();
  }, [uuid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/forms/${uuid}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: formData }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.error || "Submission failed");
      }
    } catch (e) {
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  if (loading && !form) return <FullScreenLoader />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full text-center">
          <WarningCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Unavailable</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-slate-400 mb-6">
            Your response has been recorded.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-400 hover:text-blue-300"
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-slate-700/50 p-8 border-b border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-slate-400">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  value={formData[field.id]}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                />
              ) : field.type === "select" ? (
                <select
                  required={field.required}
                  value={formData[field.id]}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an option...</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "radio" ? (
                <div className="space-y-2">
                  {(field.options || []).map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        required={field.required}
                        checked={formData[field.id] === opt}
                        onChange={(e) =>
                          handleInputChange(field.id, e.target.value)
                        }
                        className="bg-slate-900 border-slate-700 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : field.type === "checkbox" ? (
                <div className="space-y-2">
                  {/* Simplification: Checkbox as multiselect if options exist, or boolean if no options */}
                  {field.options && field.options.length > 0 ? (
                    field.options.map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={opt}
                          checked={(formData[field.id] || []).includes(opt)}
                          onChange={(e) => {
                            const current = formData[field.id] || [];
                            if (e.target.checked) {
                              handleInputChange(field.id, [...current, opt]);
                            } else {
                              handleInputChange(
                                field.id,
                                current.filter((v) => v !== opt)
                              );
                            }
                          }}
                          className="bg-slate-900 border-slate-700 rounded text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-slate-300">{opt}</span>
                      </label>
                    ))
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData[field.id]}
                        onChange={(e) =>
                          handleInputChange(field.id, e.target.checked)
                        }
                        required={field.required}
                        className="bg-slate-900 border-slate-700 rounded text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300">{field.label}</span>
                    </label>
                  )}
                </div>
              ) : (
                <input
                  type={field.type || "text"}
                  required={field.required}
                  value={formData[field.id]}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          ))}

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
