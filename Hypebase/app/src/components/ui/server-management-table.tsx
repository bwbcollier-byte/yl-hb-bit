"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { X, Power, Pause, Play, RotateCcw, Pencil, Save, FolderOpen, Github, Terminal, Activity } from "lucide-react";
import { FaSpotify, FaDatabase, FaGlobe, FaServer, FaDeezer } from "react-icons/fa";

export interface Server {
  id: string;
  number: string;
  serviceName: string;
  osType: "windows" | "linux" | "ubuntu";
  serviceLocation: string;
  countryCode: "de" | "us" | "fr" | "jp";
  ip: string;
  dueDate: string;
  cpuPercentage: number;
  status: "active" | "paused" | "inactive";
  category?: string;
  platform?: string;
  toProcess?: number;
  processed?: number;
}

interface ServerManagementTableProps {
  title?: string;
  servers?: Server[];
  onStatusChange?: (serverId: string, newStatus: Server["status"]) => void;
  onEdit?: (updatedServer: Server) => void;
  onRun?: (serverId: string) => void;
  runningWorkflows?: Set<string>;
  activityLogs?: Record<string, string[]>;
  className?: string;
}

const defaultServers: Server[] = [
  {
    id: "1",
    number: "01",
    serviceName: "VPS-2 (Windows)",
    osType: "windows",
    serviceLocation: "Frankfurt, Germany",
    countryCode: "de",
    ip: "198.51.100.211",
    dueDate: "14 Oct 2027",
    cpuPercentage: 80,
    status: "active"
  },
  {
    id: "2", 
    number: "02",
    serviceName: "VPS-1 (Windows)",
    osType: "windows",
    serviceLocation: "Frankfurt, Germany", 
    countryCode: "de",
    ip: "203.0.113.158",
    dueDate: "14 Oct 2027",
    cpuPercentage: 90,
    status: "active"
  },
  {
    id: "3",
    number: "03", 
    serviceName: "VPS-1 (Ubuntu)",
    osType: "ubuntu",
    serviceLocation: "Paris, France",
    countryCode: "fr",
    ip: "192.0.2.37",
    dueDate: "27 Jun 2027",
    cpuPercentage: 50,
    status: "paused"
  },
  {
    id: "4",
    number: "04",
    serviceName: "Cloud Server (Ubuntu)",
    osType: "ubuntu",
    serviceLocation: "California, US West",
    countryCode: "us",
    ip: "198.51.100.23",
    dueDate: "30 May 2030",
    cpuPercentage: 95,
    status: "active"
  },
  {
    id: "5",
    number: "05",
    serviceName: "Dedicated Server (Windows)",
    osType: "windows",
    serviceLocation: "Virginia, US East",
    countryCode: "us",
    ip: "203.0.113.45",
    dueDate: "15 Dec 2026",
    cpuPercentage: 25,
    status: "inactive"
  }
];

export function ServerManagementTable({
  title = "Active Services",
  servers: initialServers = defaultServers,
  onStatusChange,
  onEdit,
  onRun,
  runningWorkflows = new Set(),
  activityLogs = {},
  className = ""
}: ServerManagementTableProps = {}) {
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [hoveredServer, setHoveredServer] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Server>>({});
  const [activeTab, setActiveTab] = useState<"current" | "recent">("current");
  const shouldReduceMotion = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setServers(initialServers);
  }, [initialServers]);

  const handleStatusChange = (serverId: string, newStatus: Server["status"]) => {
    if (onStatusChange) {
      onStatusChange(serverId, newStatus);
    }

    setServers(prev => prev.map(server => 
      server.id === serverId ? { ...server, status: newStatus } : server
    ));
  };

  const openServerModal = (server: Server) => {
    setSelectedServer(server);
  };

  const closeServerModal = () => {
    setSelectedServer(null);
    setIsEditing(false);
  };

  const handleEditSave = () => {
    if (selectedServer && onEdit) {
      const updated = { ...selectedServer, ...editForm } as Server;
      onEdit(updated);
      setSelectedServer(updated);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (selectedServer) {
      const updatedServer = servers.find(s => s.id === selectedServer.id);
      if (updatedServer) {
        setSelectedServer(updatedServer);
      }
    }
  }, [servers, selectedServer]);

  const getOSIcon = (osType: Server["osType"]) => {
    switch (osType) {
      case "windows":
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-1.5 border border-white/10">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path className="fill-white" d="M30,15H17c-0.6,0-1-0.4-1-1V3.3c0-0.5,0.4-0.9,0.8-1l13-2.3c0.3,0,0.6,0,0.8,0.2C30.9,0.4,31,0.7,31,1v13 C31,14.6,30.6,15,30,15z"/>
              <path className="fill-white" d="M13,15H1c-0.6,0-1-0.4-1-1V6c0-0.5,0.4-0.9,0.8-1l12-2c0.3,0,0.6,0,0.8,0.2C13.9,3.4,14,3.7,14,4v10 C14,14.6,13.6,15,13,15z"/>
              <path className="fill-white" d="M30,32c-0.1,0-0.1,0-0.2,0l-13-2.3c-0.5-0.1-0.8-0.5-0.8-1V18c0-0.6,0.4-1,1-1h13c0.6,0,1,0.4,1,1v13 c0,0.3-0.1,0.6-0.4,0.8C30.5,31.9,30.2,32,30,32z"/>
              <path className="fill-white" d="M13,29c-0.1,0-0.1,0-0.2,0l-12-2C0.4,26.9,0,26.5,0,26v-8c0-0.6,0.4-1,1-1h12c0.6,0,1,0.4,1,1v10 c0,0.3-0.1,0.6-0.4,0.8C13.5,28.9,13.2,29,13,29z"/>
            </svg>
          </div>
        );
      case "ubuntu":
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center p-1.5 border border-white/10">
            <svg width="16" height="16" viewBox="-5 0 32 32" fill="white">
              <path d="M16.469 9.375c-1.063-0.594-1.406-1.938-0.813-3 0.406-0.719 1.156-1.094 1.906-1.094 0.375 0 0.75 0.094 1.094 0.281 1.063 0.625 1.406 1.969 0.813 3-0.406 0.719-1.156 1.094-1.906 1.094-0.375 0-0.75-0.094-1.094-0.281zM21.938 15.594h-3.625c-0.125-1.688-0.969-3.188-2.25-4.156-0.219-0.156-0.438-0.313-0.688-0.469-0.813-0.438-1.75-0.688-2.75-0.688-1.031 0-1.969 0.25-2.813 0.719l-2-3.031c1.406-0.844 3.031-1.313 4.813-1.313 0.688 0 1.375 0.063 2.063 0.219-0.25 1.219 0.281 2.5 1.406 3.156 0.438 0.25 0.938 0.375 1.469 0.375 0.719 0 1.406-0.25 1.938-0.719 1.438 1.563 2.344 3.625 2.438 5.906zM7.125 8.438l2 3.031c-1.25 0.969-2.094 2.438-2.188 4.125-0.031 0.125-0.031 0.25-0.031 0.406 0 0.125 0 0.281 0.031 0.406 0.125 1.781 1.063 3.313 2.438 4.281l-1.906 3.094c-1.813-1.188-3.188-3-3.813-5.125 0.875-0.5 1.5-1.469 1.5-2.563s-0.625-2.094-1.563-2.594c0.594-2.063 1.844-3.844 3.531-5.063zM2.188 13.906c1.219 0 2.219 0.969 2.219 2.188s-1 2.219-2.219 2.219-2.188-1-2.188-2.219 0.969-2.188 2.188-2.188zM8.188 24.219l1.906-3.125c0.75 0.375 1.625 0.594 2.531 0.594 1 0 1.938-0.25 2.781-0.719 0.25-0.125 0.469-0.281 0.688-0.469 1.25-0.938 2.094-2.406 2.219-4.094h3.625c-0.094 2.375-1.094 4.531-2.656 6.125-0.469-0.344-1.063-0.531-1.656-0.531-0.531 0-1.031 0.125-1.469 0.375-1 0.594-1.531 1.656-1.469 2.719-0.688 0.156-1.375 0.25-2.063 0.25-1.625 0-3.125-0.406-4.438-1.125zM17.625 22.75c0.75 0 1.5 0.375 1.906 1.094 0.594 1.063 0.219 2.438-0.813 3.031-0.344 0.188-0.719 0.281-1.094 0.281-0.781 0-1.5-0.375-1.906-1.094-0.625-1.063-0.25-2.406 0.813-3.031 0.344-0.188 0.719-0.281 1.094-0.281z"/>
            </svg>
          </div>
        );
      case "linux":
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center border border-white/10">
            <div className="text-white text-xs font-mono font-bold">L</div>
          </div>
        );
    }
  };

  const getPlatformLogo = (serviceName: string) => {
    const nameStr = serviceName.toLowerCase();
    if (nameStr.includes("spotify")) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-white/10 shadow-lg">
          <FaSpotify size={18} className="text-[#1DB954]" />
        </div>
      );
    }
    if (nameStr.includes("musicbrainz") || nameStr.includes("database")) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-white/10 shadow-lg">
          <FaDatabase size={16} className="text-[#a855f7]" />
        </div>
      );
    }
    if (nameStr.includes("musicfetch")) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-white/10 shadow-lg">
          <FaGlobe size={18} className="text-[#3b82f6]" />
        </div>
      );
    }
    if (nameStr.includes("deezer")) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-white/10 shadow-lg">
          <FaDeezer size={18} className="text-[#a855f7]" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-white/10 shadow-lg">
        <FaServer size={16} className="text-white/70" />
      </div>
    );
  };

  const getCountryFlag = (countryCode: Server["countryCode"]) => {
    switch (countryCode) {
      case "de":
        return (
          <svg width="32" height="32" viewBox="0 0 130 120" fill="none" className="scale-125">
            <rect fill="#1E1D1D" width="130" height="39"/>
            <rect y="39" fill="#DC4437" width="130" height="42"/>
            <rect y="81" fill="#FCBE1F" width="130" height="39"/>
          </svg>
        );
      case "us":
        return (
          <svg width="32" height="32" viewBox="0 0 130 120" fill="none" className="scale-125">
            <rect y="0" fill="#DC4437" width="130" height="13.3"/>
            <rect y="26.7" fill="#DC4437" width="130" height="13.3"/>
            <rect y="80" fill="#DC4437" width="130" height="13.3"/>
            <rect y="106.7" fill="#DC4437" width="130" height="13.3"/>
            <rect y="53.3" fill="#DC4437" width="130" height="13.3"/>
            <rect y="13.3" fill="#FFFFFF" width="130" height="13.3"/>
            <rect y="40" fill="#FFFFFF" width="130" height="13.3"/>
            <rect y="93.3" fill="#FFFFFF" width="130" height="13.3"/>
            <rect y="66.7" fill="#FFFFFF" width="130" height="13.3"/>
            <rect y="0" fill="#2A66B7" width="70" height="66.7"/>
            <polygon fill="#FFFFFF" points="13.5,4 15.8,8.9 21,9.7 17.2,13.6 18.1,19 13.5,16.4 8.9,19 9.8,13.6 6,9.7 11.2,8.9"/>
            <polygon fill="#FFFFFF" points="34,4 36.3,8.9 41.5,9.7 37.8,13.6 38.6,19 34,16.4 29.4,19 30.2,13.6 26.5,9.7 31.7,8.9"/>
            <polygon fill="#FFFFFF" points="54.5,4 56.8,8.9 62,9.7 58.2,13.6 59.1,19 54.5,16.4 49.9,19 50.8,13.6 47,9.7 52.2,8.9"/>
            <polygon fill="#FFFFFF" points="24,24 26.3,28.9 31.5,29.7 27.8,33.6 28.6,39 24,36.4 19.4,39 20.2,33.6 16.5,29.7 21.7,28.9"/>
            <polygon fill="#FFFFFF" points="44.5,24 46.8,28.9 52,29.7 48.2,33.6 49.1,39 44.5,36.4 39.9,39 40.8,33.6 37,29.7 42.2,28.9"/>
            <polygon fill="#FFFFFF" points="13.5,45.2 15.8,50.1 21,50.9 17.2,54.7 18.1,60.2 13.5,57.6 8.9,60.2 9.8,54.7 6,50.9 11.2,50.1"/>
            <polygon fill="#FFFFFF" points="34,45.2 36.3,50.1 41.5,50.9 37.8,54.7 38.6,60.2 34,57.6 29.4,60.2 30.2,54.7 26.5,50.9 31.7,50.1"/>
            <polygon fill="#FFFFFF" points="54.5,45.2 56.8,50.1 62,50.9 58.2,54.7 59.1,60.2 54.5,57.6 49.9,60.2 50.8,54.7 47,50.9 52.2,50.1"/>
          </svg>
        );
      case "fr":
        return (
          <svg width="32" height="32" viewBox="0 0 90 60" fill="none" className="scale-150">
            <rect width="30" height="60" fill="#0055A4"/>
            <rect x="30" width="30" height="60" fill="#FFFFFF"/>
            <rect x="60" width="30" height="60" fill="#EF4135"/>
          </svg>
        );
      case "jp":
        return (
          <svg width="32" height="32" viewBox="0 0 90 60" fill="none" className="scale-150">
            <rect width="90" height="60" fill="#FFFFFF"/>
            <circle cx="45" cy="30" r="18" fill="#BC002D"/>
          </svg>
        );
    }
  };

  const getCPUBars = (percentage: number, status: Server["status"]) => {
    const filledBars = Math.round((percentage / 100) * 10);
    
    const getBarColor = (index: number) => {
      if (index >= filledBars) {
        return "bg-white/5 border border-white/10";
      }
      
      switch (status) {
        case "active":
          return "bg-[var(--color-brand-violet)]/80 shadow-[0_0_8px_rgba(138,43,226,0.5)]";
        case "paused":
          return "bg-yellow-500/80";
        case "inactive":
          return "bg-red-500/50";
        default:
          return "bg-[var(--color-brand-violet)]/80";
      }
    };
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-5 rounded-full transition-all duration-500 ${getBarColor(index)}`}
            />
          ))}
        </div>
        <span className="text-sm font-mono text-white font-medium min-w-[3rem]">
          {percentage}%
        </span>
      </div>
    );
  };

  const getStatusBadge = (status: Server["status"]) => {
    switch (status) {
      case "active":
        return (
          <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <span className="text-green-400 text-sm font-medium">Active</span>
          </div>
        );
      case "paused":
        return (
          <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
            <span className="text-yellow-400 text-sm font-medium">Paused</span>
          </div>
        );
      case "inactive":
        return (
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <span className="text-red-400 text-sm font-medium">Inactive</span>
          </div>
        );
    }
  };

  const getStatusGradient = (status: Server["status"]) => {
    switch (status) {
      case "active":
        return "from-green-500/10 to-transparent";
      case "paused": 
        return "from-yellow-500/10 to-transparent";
      case "inactive":
        return "from-red-500/10 to-transparent";
    }
  };

  return (
    <div className={`w-full ${className}`}>
        {/* Table */}
        <motion.div
          className="space-y-2"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
              }
            }
          }}
          initial="hidden"
          animate="visible"
        >
          {/* Headers */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-[var(--color-brand-muted)] uppercase tracking-wider">
            <div className="col-span-3 pl-4">Workflow Name</div>
            <div className="col-span-2">Platform / Location</div>
            <div className="col-span-2">Endpoint / Script</div>
            <div className="col-span-2">Next Run</div>
            <div className="col-span-2">Health</div>
            <div className="col-span-1 text-center">Status</div>
          </div>

          {/* Server Rows */}
          {servers.map((server) => (
            <motion.div
              key={server.id}
              variants={{
                hidden: { 
                  opacity: 0, 
                  x: -25,
                  scale: 0.95,
                  filter: "blur(4px)" 
                },
                visible: {
                  opacity: 1,
                  x: 0,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 28,
                    mass: 0.6,
                  },
                },
              }}
              className="relative cursor-pointer"
              onMouseEnter={() => setHoveredServer(server.id)}
              onMouseLeave={() => setHoveredServer(null)}
              onClick={() => openServerModal(server)}
            >
              <motion.div
                className="relative bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg p-4 overflow-hidden"
                whileHover={{
                  y: -1,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                }}
              >
                {/* Status gradient overlay */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-l ${getStatusGradient(server.status)} pointer-events-none`}
                  style={{ 
                    backgroundSize: "30% 100%", 
                    backgroundPosition: "right",
                    backgroundRepeat: "no-repeat"
                  }} 
                />
                
                {/* Grid Content */}
                <div className="relative grid grid-cols-12 gap-4 items-center">
                  {/* Service Name */}
                  <div className="col-span-3 flex items-center gap-3 pl-2">
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                      <div className="scale-75 origin-center">
                        {getPlatformLogo(server.serviceName)}
                      </div>
                    </div>
                    <span className="text-white font-medium truncate flex items-center pt-0.5">
                      {server.serviceName}
                    </span>
                  </div>

                  {/* Service Location / Platform */}
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-[#242424]/80 text-white">
                      {server.platform === "github_actions" ? (
                         <Github size={16} />
                      ) : (
                        <div className="w-full h-full scale-125">
                          {getCountryFlag(server.countryCode)}
                        </div>
                      )}
                    </div>
                    <span className="text-white truncate" title={server.platform === "github_actions" ? "GitHub Actions" : server.serviceLocation}>
                      {server.platform === "github_actions" ? "GitHub Actions" : server.serviceLocation}
                    </span>
                  </div>

                  {/* IP / Endpoint */}
                  <div className="col-span-2 pr-4">
                    <span className="text-white font-mono text-xs truncate block max-w-full">
                      {server.ip}
                    </span>
                  </div>

                  {/* Due Date */}
                  <div className="col-span-2">
                    <span className="text-white text-sm">
                      {server.dueDate}
                    </span>
                  </div>

                  {/* CPU / Health */}
                  <div className="col-span-2">
                    {getCPUBars(server.cpuPercentage, server.status)}
                  </div>

                  {/* Status */}
                  <div className="col-span-1 xl:pl-4">
                    {getStatusBadge(server.status)}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Server Management Overlay - Inside Card */}
        <AnimatePresence>
          {selectedServer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl flex flex-col z-50 p-8"
              onClick={closeServerModal}
            >
              <div 
                className="m-auto w-full max-w-3xl bg-[#1c1c1c] border border-white/10 rounded-lg overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Header with Actions */}
                <div className="relative bg-transparent p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getPlatformLogo(selectedServer.serviceName)}
                    {isEditing ? (
                      <div className="flex flex-col gap-2 w-64">
                        <input
                          type="text"
                          value={editForm.serviceName || ""}
                          onChange={(e) => setEditForm(prev => ({...prev, serviceName: e.target.value}))}
                          className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-white font-bold text-xl outline-none focus:border-[var(--color-brand-violet)]/50"
                          placeholder="Workflow Name"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editForm.serviceLocation || ""}
                            onChange={(e) => setEditForm(prev => ({...prev, serviceLocation: e.target.value}))}
                            className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-sm text-white/80 outline-none focus:border-[var(--color-brand-violet)]/50"
                            placeholder="Location / Platform"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {selectedServer.serviceName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-[#2B2B2B]">
                            {selectedServer.platform === "github_actions" ? (
                              <Github size={12} className="text-white" />
                            ) : (
                              <div className="w-full h-full scale-125">
                                {getCountryFlag(selectedServer.countryCode)}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-white/60">
                            {selectedServer.platform === "github_actions" ? "GitHub Actions" : selectedServer.serviceLocation}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons in Header - Minimal Icons */}
                  <div className="flex items-center gap-1.5">
                    {/* Start/Stop */}
                    {selectedServer.status === "active" ? (
                      <motion.button
                        className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors"
                        onClick={() => handleStatusChange(selectedServer.id, "inactive")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Stop"
                      >
                        <Power className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        className="w-10 h-10 flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg transition-colors"
                        onClick={() => {
                          if (onRun) {
                            onRun(selectedServer.id);
                          } else {
                            handleStatusChange(selectedServer.id, "active");
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={runningWorkflows.has(selectedServer.id)}
                        title="Start"
                      >
                        <Play className="w-4 h-4" />
                      </motion.button>
                    )}

                    {/* Pause/Resume */}
                    {selectedServer.status === "paused" ? (
                      <motion.button
                        className="w-10 h-10 flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
                        onClick={() => handleStatusChange(selectedServer.id, "active")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Resume"
                      >
                        <Play className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        className="w-10 h-10 flex items-center justify-center bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg transition-colors"
                        onClick={() => handleStatusChange(selectedServer.id, "paused")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Pause"
                      >
                        <Pause className="w-4 h-4" />
                      </motion.button>
                    )}

                    {/* Restart */}
                    <motion.button
                      className="w-10 h-10 flex items-center justify-center bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg transition-colors"
                      onClick={() => {
                        handleStatusChange(selectedServer.id, "inactive");
                        setTimeout(() => handleStatusChange(selectedServer.id, "active"), 1000);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Restart"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.button>

                    <div className="w-[1px] h-6 bg-white/10 mx-1" />

                    {/* Edit/Save Button */}
                    {isEditing ? (
                      <motion.button
                        className="w-10 h-10 flex items-center justify-center bg-[var(--color-brand-violet)]/20 hover:bg-[var(--color-brand-violet)]/30 text-[var(--color-brand-violet)] border border-[var(--color-brand-violet)]/30 rounded-lg transition-colors"
                        onClick={handleEditSave}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors"
                        onClick={() => {
                          setEditForm({
                            serviceName: selectedServer.serviceName,
                            serviceLocation: selectedServer.serviceLocation,
                            ip: selectedServer.ip,
                            category: selectedServer.category || ""
                          });
                          setIsEditing(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </motion.button>
                    )}

                    {/* Close Button */}
                    <motion.button
                      className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center border border-white/20 ml-2 text-white"
                      onClick={closeServerModal}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                  {/* Server Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Endpoint */}
                    <div className="bg-[#242424] rounded-lg p-4 border border-white/5 shadow-sm">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        ENDPOINT / SCRIPT
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.ip || ""}
                          onChange={(e) => setEditForm(prev => ({...prev, ip: e.target.value}))}
                          className="mt-2 w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-sm text-white font-mono outline-none focus:border-[var(--color-brand-violet)]/50"
                        />
                      ) : (
                        <div className="text-sm font-mono text-white font-medium mt-2 truncate">
                          {selectedServer.ip}
                        </div>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="bg-[#242424] rounded-lg p-4 border border-white/5 shadow-sm">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        NEXT RUN
                      </label>
                      <div className="text-sm font-medium text-white mt-2">
                        {selectedServer.dueDate}
                      </div>
                    </div>

                    {/* Status & Folder category mapping */}
                    <div className="bg-[#242424] rounded-lg p-4 border border-white/5 shadow-sm">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {isEditing ? "FOLDER CATEGORY" : "STATUS"}
                      </label>
                      <div className="mt-2 flex">
                        {isEditing ? (
                          <div className="flex items-center gap-2 w-full">
                            <FolderOpen size={14} className="text-white/40" />
                            <input
                              type="text"
                              value={editForm.category || ""}
                              onChange={(e) => setEditForm(prev => ({...prev, category: e.target.value}))}
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-[var(--color-brand-violet)]/50"
                              placeholder="e.g. DATABASE"
                            />
                          </div>
                        ) : (
                          getStatusBadge(selectedServer.status)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Secondary Data Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* CPU Usage / Health Score */}
                    <div className="bg-[#242424] rounded-lg p-5 border border-white/5 shadow-sm">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 block">
                        HEALTH SCORE / SUCCESS RATE
                      </label>
                      <div className="w-full flex items-center gap-3">
                        {getCPUBars(selectedServer.cpuPercentage, selectedServer.status)}
                      </div>
                    </div>

                    {/* To Process */}
                    <div className="bg-[#242424] rounded-lg p-5 border border-white/5 shadow-sm flex flex-col justify-center">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">
                        TO PROCESS
                      </label>
                      <div className="text-2xl font-bold text-white/90 font-mono">
                        {selectedServer.toProcess?.toLocaleString() ?? "0"}
                      </div>
                    </div>

                    {/* Processed */}
                    <div className="bg-[#242424] rounded-lg p-5 border border-white/5 shadow-sm flex flex-col justify-center">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">
                        PROCESSED
                      </label>
                      <div className="text-2xl font-bold text-[var(--color-brand-violet)] font-mono drop-shadow-[0_0_8px_rgba(138,43,226,0.3)]">
                        {selectedServer.processed?.toLocaleString() ?? "0"}
                      </div>
                    </div>
                  </div>

                  {/* Activity Tabs */}
                  <div className="bg-[#0f0f0f] rounded-lg border border-white/5 shadow-inner overflow-hidden flex flex-col">
                    {/* Terminal Header Tabs */}
                    <div className="bg-[#1b1b1b] border-b border-white/5 flex items-center">
                      <button 
                        onClick={() => setActiveTab("current")}
                        className={`px-4 py-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "current" ? "text-[var(--color-brand-violet)] bg-white/5 border-b-2 border-[var(--color-brand-violet)]" : "text-white/40 hover:text-white/60"}`}
                      >
                        <Activity size={12} />
                        Current Activity
                      </button>
                      <button 
                        onClick={() => setActiveTab("recent")}
                        className={`px-4 py-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "recent" ? "text-[var(--color-brand-violet)] bg-white/5 border-b-2 border-[var(--color-brand-violet)]" : "text-white/40 hover:text-white/60"}`}
                      >
                        <Terminal size={12} />
                        Recent Activity
                      </button>
                    </div>
                    {/* Terminal Body */}
                    <div className="font-mono text-xs space-y-2 max-h-48 overflow-y-auto p-4 pr-2">
                      {activeTab === "current" ? (
                        <>
                          <div className="flex gap-2">
                            <span className="text-white/30 shrink-0">{new Date().toLocaleTimeString()}</span>
                            <span className="text-[var(--color-brand-violet)]">Current Session Initialized</span>
                          </div>
                          {/* Live logs from activityLogs if available */}
                          {(activityLogs[selectedServer.id] && activityLogs[selectedServer.id].length > 0) ? (
                            activityLogs[selectedServer.id].map((log, i) => {
                              const isError = log.toLowerCase().includes('error');
                              const isSuccess = log.toLowerCase().includes('success') || log.toLowerCase().includes('completed');
                              const isWarning = log.toLowerCase().includes('warning') || log.toLowerCase().includes('poll');
                              return (
                                <div key={i} className="flex gap-2">
                                  <span className={isError ? 'text-red-400' : isSuccess ? 'text-[#38ef7d]' : isWarning ? 'text-[#f7b733]' : 'text-white/60'}>
                                    {log}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-white/20 italic">Awaiting trigger activity...</div>
                          )}
                          {(runningWorkflows.has(selectedServer.id) || selectedServer.status === "active") && (
                            <div className="flex gap-2 animate-pulse mt-4">
                              <span className="text-[#38ef7d] font-bold">{">"}  </span>
                              <span className="text-[#38ef7d]">_</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <span className="text-white/30 shrink-0">15:42:31</span>
                            <span className="text-[#38ef7d]">Workflow execution completed successfully</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-white/30 shrink-0">15:42:25</span>
                            <span className="text-[#00c6ff]">Data synchronization passed for 12 records</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-white/30 shrink-0">15:41:18</span>
                            <span className="text-[#f7b733]">Health check score logged: {selectedServer.cpuPercentage}%</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-white/30 shrink-0">15:40:05</span>
                            <span className="text-white/60">Starting task sequence from {selectedServer.ip}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-white/30 shrink-0">15:39:12</span>
                            <span className="text-white/60">Pipeline compilation initialized...</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
