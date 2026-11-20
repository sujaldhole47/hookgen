import { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  Trash2,
  LogOut,
  GripVertical,
  ImageIcon,
} from "lucide-react";
import API from "../api";
import VideoModal from "./VideoModal";

const COLUMNS = ["Scripting", "Filming", "Editing", "Published"];

export default function Dashboard({ user, onLogout }) {
  const [videos, setVideos] = useState([]);
  const [topic, setTopic] = useState("");
  const [includeVisuals, setIncludeVisuals] = useState(false);
  const [language, setLanguage] = useState("Hinglish");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  
const fetchVideos = async () => {
    try {
      const { data } = await API.get("/videos");
      setVideos(data);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    }
  };
  useEffect(() => {
    fetchVideos();
  }, []);

  

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);
    setError("");

    try {
      // 1. Generate Hooks, Script & B-Roll with Gemini AI
      const { data: aiData } = await API.post("/ai/generate", {
        topic,
        includeVisuals,
        language,
        tone: "Energetic & Fast-Paced",
      });

      // 2. Save the generated video to MongoDB
      const { data: savedVideo } = await API.post("/videos", {
        title: aiData.title || topic,
        topic,
        status: "Scripting",
        hooks: aiData.hooks || [],
        script: aiData.script || "",
        brollIdeas: aiData.brollIdeas || [],
        visuals: aiData.visuals || [],
      });

      setVideos((prev) => [savedVideo, ...prev]);
      setTopic("");
      setSelectedVideo(savedVideo); // Open modal immediately to preview
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "AI generation failed. Check your Gemini API key.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (videoId, newStatus) => {
    // Optimistic UI update
    setVideos((prev) =>
      prev.map((v) => (v._id === videoId ? { ...v, status: newStatus } : v)),
    );

    try {
      await API.put(`/videos/${videoId}`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchVideos(); // Revert on failure
    }
  };

  const handleDelete = async (e, videoId) => {
    e.stopPropagation();
    setVideos((prev) => prev.filter((v) => v._id !== videoId));
    try {
      await API.delete(`/videos/${videoId}`);
    } catch (err) {
      console.error("Failed to delete video:", err);
      fetchVideos();
    }
  };

  const handleVideoUpdate = (updatedVideo) => {
    setVideos((prev) =>
      prev.map((v) => (v._id === updatedVideo._id ? updatedVideo : v)),
    );
    setSelectedVideo(updatedVideo);
  };

  // Drag-and-Drop Handlers
  const onDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e, targetColumn) => {
    e.preventDefault();
    if (draggedId) {
      handleStatusChange(draggedId, targetColumn);
      setDraggedId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">HookGen</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:inline">
              Hi, <strong className="text-slate-200">{user.name}</strong>
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* AI Generator Bar */}
        <form
          onSubmit={handleGenerate}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a YouTube Short topic (e.g., Top 5 Bikes Under 2 Lakh in India)..."
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Hinglish">Hinglish</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>

            <button
              type="submit"
              disabled={generating || !topic.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
            >
              {generating ? (
                <>
                   {includeVisuals ? 'Generating Script & Images...' : 'Generating...'}<Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Short
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIncludeVisuals((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition cursor-pointer ${
                includeVisuals
                  ? "bg-pink-500/20 border-pink-500/50 text-pink-300"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>
                Visual Storyboard (5 AI Images): {includeVisuals ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
        </form>

        {/* 4-Column Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {COLUMNS.map((column) => {
            const colVideos = videos.filter((v) => v.status === column);

            return (
              <div
                key={column}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, column)}
                className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 lg:min-h-[420px] flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm text-slate-200">
                    {column}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {colVideos.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colVideos.map((video) => (
                    <div
                      key={video._id}
                      draggable
                      onDragStart={(e) => onDragStart(e, video._id)}
                      onClick={() => setSelectedVideo(video)}
                      className="group bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 cursor-pointer transition shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <GripVertical className="w-4 h-4 cursor-grab" />
                          <h3 className="text-sm font-medium text-slate-100 line-clamp-2">
                            {video.title}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, video._id)}
                          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1 cursor-pointer"
                          title="Delete video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {video.hooks?.[0] && (
                        <p className="text-xs text-slate-400 mt-2.5 line-clamp-2">
                          "{video.hooks[0]}"
                        </p>
                      )}
                    </div>
                  ))}

                  {colVideos.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-800/70 rounded-xl flex items-center justify-center text-xs text-slate-500">
                      Drop video here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Video Details Modal */}
      <VideoModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onUpdate={handleVideoUpdate}
      />
    </div>
  );
}
