import React, { useEffect, useState } from "react";
import {
  LogOut,
  CheckCircle,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Clock,
  User,
  Image as ImageIcon,
  X,
  Filter,
  TrendingUp,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { authoritiesAPI } from "../../utils/api";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const authorityIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const issueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Map component to update view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const AuthorityDashboard = ({ authority, token, onLogout }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
  });

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fetch issues
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    const fetchIssues = async () => {
      setLoading(true);
      try {
        // Replace with your actual API call
        const response = await authoritiesAPI.getAssignedIssues(
          authority.id,
          token
        );
        const issuesList = response.data.data?.issues || [];
        setIssues(issuesList);

        // Calculate stats
        const statsCalc = {
          total: issuesList.length,
          assigned: issuesList.filter((i) => i.status === "assigned").length,
          inProgress: issuesList.filter((i) => i.status === "in_progress")
            .length,
          resolved: issuesList.filter((i) => i.status === "resolved").length,
        };
        setStats(statsCalc);
      } catch (err) {
        console.error("Failed to load issues:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, [authority, token]);

  // Get route to issue location
  const getRouteToIssue = async (issue) => {
    if (!userLocation) {
      alert("Please enable location access to get directions");
      return;
    }

    setLoadingRoute(true);
    try {
      const { lat: destLat, lng: destLng } = issue.location.coordinates;
      const { lat: startLat, lng: startLng } = userLocation;

      // Using OSRM for routing
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates.map((coord) => [
          coord[1],
          coord[0],
        ]);
        setRoute({
          coordinates,
          distance: (data.routes[0].distance / 1000).toFixed(2), // km
          duration: Math.round(data.routes[0].duration / 60), // minutes
        });
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      alert("Failed to get directions");
    } finally {
      setLoadingRoute(false);
    }
  };

  // Open in Google Maps
  const openInGoogleMaps = (issue) => {
    const { lat, lng } = issue.location.coordinates;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  // Handle issue status update
  const handleStatusUpdate = async (issueId, newStatus) => {
    setResolving(issueId);
    try {
      console.log("Authority, issueId", authority.id, issueId);
      const response = await authoritiesAPI.updateIssueStatus(
        authority.id,
        issueId,
        {}
      );
      if (!response.ok) throw new Error("Failed to update status");

      setIssues((issues) =>
        issues.map((i) => (i._id === issueId ? { ...i, status: newStatus } : i))
      );

      // Update stats
      setStats((prev) => {
        const updated = { ...prev };
        if (newStatus === "in_progress") {
          updated.assigned--;
          updated.inProgress++;
        } else if (newStatus === "resolved") {
          updated.inProgress--;
          updated.resolved++;
        }
        return updated;
      });

      alert(
        `Issue marked as ${
          newStatus === "in_progress" ? "In Progress" : "Resolved"
        }!`
      );
    } catch (err) {
      console.error("Failed to update issue:", err);
      alert("Failed to update issue status");
    } finally {
      setResolving(null);
    }
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (filterStatus === "all") return true;
    return issue.status === filterStatus;
  });

  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "text-blue-600 bg-blue-100";
      case "in_progress":
        return "text-purple-600 bg-purple-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                {authority.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {authority.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {authority.department?.replace("_", " ") || authority.email}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Issues</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.assigned}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.inProgress}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Resolved</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.resolved}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {["all", "assigned", "in_progress", "resolved"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filterStatus === status
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Issues Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Issues Found
            </h3>
            <p className="text-gray-500">
              {filterStatus === "all"
                ? "No issues have been assigned to you yet."
                : `No ${filterStatus.replace("_", " ")} issues at the moment.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredIssues.map((issue) => (
              <div
                key={issue._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border overflow-hidden"
              >
                {/* Issue Header */}
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex-1 pr-4">
                      {issue.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getPriorityColor(
                        issue.priority
                      )}`}
                    >
                      {issue.priority?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {issue.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        issue.status
                      )}`}
                    >
                      {issue.status?.replace("_", " ")}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {issue.category?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Issue Details */}
                <div className="p-6 space-y-4">
                  {/* Location */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Location
                      </p>
                      <p className="text-sm text-gray-600">
                        {issue.location?.address || "No address provided"}
                      </p>
                      {userLocation && issue.location?.coordinates && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍{" "}
                          {calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            issue.location.coordinates.lat,
                            issue.location.coordinates.lng
                          )}{" "}
                          km away
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Reported by
                      </p>
                      <p className="text-sm text-gray-600">
                        {issue.reporter?.name || "Anonymous"}
                      </p>
                      {issue.reporter?.email && (
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <Mail className="w-3 h-3 mr-1" />
                          {issue.reporter.email}
                        </p>
                      )}
                      {issue.reporter?.phone && (
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {issue.reporter.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Reported on
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(issue.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Media */}
                  {issue.media && issue.media.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <ImageIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Attachments
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {issue.media.slice(0, 3).map((media, idx) => (
                            <img
                              key={idx}
                              src={media.url}
                              alt={`Evidence ${idx + 1}`}
                              className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(media.url, "_blank")}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-6 pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setSelectedIssue(issue);
                        getRouteToIssue(issue);
                      }}
                      className="flex items-center justify-center px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </button>
                    <button
                      onClick={() => openInGoogleMaps(issue)}
                      className="flex items-center justify-center px-4 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors font-medium"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Open Maps
                    </button>
                  </div>

                  {issue.status !== "resolved" && (
                    <div className="grid grid-cols-2 gap-3">
                      {(issue.status === "assigned" ||
                        issue.status === "in_progress") && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(issue._id, "in_progress")
                          }
                          disabled={
                            issue.status === "in_progress"
                          }
                          className="flex items-center justify-center px-4 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors font-medium disabled:opacity-50"
                        >
                          {resolving === issue._id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Clock className="w-4 h-4 mr-2" />
                          )}
                          {issue.status === "in_progress"
                            ? "Working on it"
                            : "Start Work"}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleStatusUpdate(issue._id, "resolved")
                        }
                        disabled={resolving === issue._id}
                        className={`flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-colors font-medium disabled:opacity-50 col-span-1`}
                      >
                        {resolving === issue._id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Mark Resolved
                      </button>
                    </div>
                  )}

                  {issue.status === "resolved" && (
                    <div className="flex items-center justify-center px-4 py-3 rounded-lg bg-green-50 text-green-600 font-medium">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Issue Resolved
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedIssue.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedIssue.location?.address}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedIssue(null);
                  setRoute(null);
                }}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {route && (
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Distance</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {route.distance} km
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Est. Time</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {route.duration} min
                    </p>
                  </div>
                </div>
              )}

              {loadingRoute && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">
                    Calculating route...
                  </span>
                </div>
              )}

              <div
                className="rounded-xl overflow-hidden border-2 border-gray-200"
                style={{ height: "400px" }}
              >
                <MapContainer
                  center={
                    selectedIssue.location?.coordinates
                      ? [
                          selectedIssue.location.coordinates.lat,
                          selectedIssue.location.coordinates.lng,
                        ]
                      : [0, 0]
                  }
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  {/* User location marker */}
                  {userLocation && (
                    <Marker
                      position={[userLocation.lat, userLocation.lng]}
                      icon={authorityIcon}
                    >
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}

                  {/* Issue location marker */}
                  {selectedIssue.location?.coordinates && (
                    <Marker
                      position={[
                        selectedIssue.location.coordinates.lat,
                        selectedIssue.location.coordinates.lng,
                      ]}
                      icon={issueIcon}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-bold">{selectedIssue.title}</p>
                          <p className="text-sm text-gray-600">
                            {selectedIssue.location.address}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Route polyline */}
                  {route && (
                    <Polyline
                      positions={route.coordinates}
                      color="#3b82f6"
                      weight={4}
                      opacity={0.7}
                    />
                  )}

                  <MapUpdater
                    center={
                      selectedIssue.location?.coordinates
                        ? [
                            selectedIssue.location.coordinates.lat,
                            selectedIssue.location.coordinates.lng,
                          ]
                        : null
                    }
                    zoom={13}
                  />
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorityDashboard;
