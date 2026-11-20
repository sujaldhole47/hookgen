import {
  X,
  Copy,
  Check,
  Film,
  Sparkles,
  FileText,
  Pencil,
  Save,
  Clock,
  Loader2,
  MonitorPlay,
} from "lucide-react";
import Teleprompter from "./Teleprompter";
import { useState, useEffect } from "react";
import API from "../api";
import { ImageIcon, ExternalLink } from "lucide-react";

export default function VideoModal({ video, onClose, onUpdate }) {
  const [copiedField, setCopiedField] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    hooks: [],
    script: "",
    brollIdeas: "",
  });

  // Sync modal state whenever a different video is opened
  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title || "",
        hooks: video.hooks?.length ? [...video.hooks] : [""],
        script: video.script || "",
        brollIdeas: video.brollIdeas?.join("\n") || "",
      });
      setIsEditing(false);
    }
  }, [video]);

  if (!video) return null;

  // Live Speaking-Time Calculator (~2.5 words/sec for energetic Shorts)
  const activeScript = isEditing ? formData.script : video.script || "";
  const wordCount = activeScript.trim()
    ? activeScript.trim().split(/\s+/).length
    : 0;
  const estSeconds = Math.round(wordCount / 2.5);

  const timerColor =
    estSeconds > 55
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : estSeconds > 45
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

  const copyText = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleHookChange = (index, value) => {
    const updatedHooks = [...formData.hooks];
    updatedHooks[index] = value;
    setFormData({ ...formData, hooks: updatedHooks });
  };
  const openImageInNewTab = (dataUrl) => {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim() || video.title,
        hooks: formData.hooks.map((h) => h.trim()).filter(Boolean),
        script: formData.script,
        brollIdeas: formData.brollIdeas
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      };

      const { data: updatedVideo } = await API.put(
        `/videos/${video._id}`,
        payload,
      );
      onUpdate(updatedVideo);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save changes:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-800">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {video.status}
              </span>

              {/* Live Speaking-Time Badge */}
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${timerColor}`}
              >
                <Clock className="w-3.5 h-3.5" />
                {wordCount} words • ~{estSeconds}s
                {estSeconds > 55 && " (Too Long!)"}
              </span>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full mt-3 px-3 py-1.5 bg-slate-950 border border-indigo-500/50 rounded-lg text-lg font-bold text-slate-100 focus:outline-none"
              />
            ) : (
              <h2 className="text-xl font-bold mt-2 text-slate-100">
                {video.title}
              </h2>
            )}
            <p className="text-sm text-slate-400 mt-0.5">
              Topic: {video.topic}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Hooks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> High-Retention Hooks (First 3s)
              </h3>
              {!isEditing && (
                <button
                  onClick={() => copyText(video.hooks.join("\n"), "hooks")}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "hooks" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedField === "hooks" ? "Copied" : "Copy All"}
                </button>
              )}
              <button
                onClick={() => setShowTeleprompter(true)}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <MonitorPlay className="w-3.5 h-3.5" /> Teleprompter
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                {formData.hooks.map((hook, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={hook}
                    onChange={(e) => handleHookChange(idx, e.target.value)}
                    placeholder={`Hook #${idx + 1}`}
                    className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-200 focus:outline-none"
                  />
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {video.hooks?.map((hook, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200"
                  >
                    <span className="text-indigo-400 font-semibold mr-2">
                      #{idx + 1}
                    </span>
                    {hook}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Script */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Spoken Script
              </h3>
              {!isEditing && (
                <button
                  onClick={() => copyText(video.script, "script")}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "script" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedField === "script" ? "Copied" : "Copy Script"}
                </button>
              )}
            </div>

            {isEditing ? (
              <textarea
                rows={7}
                value={formData.script}
                onChange={(e) =>
                  setFormData({ ...formData, script: e.target.value })
                }
                className="w-full p-4 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-200 leading-relaxed focus:outline-none"
              />
            ) : (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                {video.script || "No script generated yet."}
              </div>
            )}
          </div>

          {/* B-Roll Ideas */}
          <div>
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
              <Film className="w-4 h-4" /> B-Roll & Visual Shots
            </h3>
            {isEditing ? (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">
                  One shot per line:
                </p>
                <textarea
                  rows={4}
                  value={formData.brollIdeas}
                  onChange={(e) =>
                    setFormData({ ...formData, brollIdeas: e.target.value })
                  }
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-300 focus:outline-none"
                />
              </div>
            ) : (
              <ul className="space-y-2">
                {video.brollIdeas?.map((shot, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300"
                  >
                    • {shot}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Visual Storyboard */}
          {video.visuals?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-pink-400 flex items-center gap-1.5 mb-3">
                <ImageIcon className="w-4 h-4" /> Visual Storyboard (
                {video.visuals.length} Shots)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {video.visuals.map((item, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="aspect-3/4 w-full overflow-hidden bg-slate-900">
                      <img
                        src={item.imageUrl}
                        alt={item.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="p-2 flex items-center justify-between gap-1">
                      <p className="text-[11px] font-medium text-slate-300 line-clamp-2">
                        {item.caption}
                      </p>
                      <button
                        type="button"
                        onClick={() => openImageInNewTab(item.imageUrl)}
                        className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                        title="Open full image"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {showTeleprompter && (
        <Teleprompter
          title={video.title}
          hook={video.hooks?.[0]}
          script={video.script}
          onClose={() => setShowTeleprompter(false)}
        />
      )}
    </div>
  );
}
