// src/components/user/IssueForm.jsx
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info,
  FileAudio,
  Image as ImageIcon,
  Video,
  Loader,
  ChevronDown,
  ChevronUp,
  Brain,
  Shield,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { issuesAPI } from "../../utils/api";
import { ISSUE_CATEGORIES, ISSUE_PRIORITY } from "../../utils/constants";
import LoadingButton from "../common/LoadingButton";
import LocationPicker from "./LocationPicker";
import VoiceRecorder from "./VoiceRecorder";
import toast from "react-hot-toast";

// Validation Error Modal Component
const ValidationErrorModal = ({ error, onClose, onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  const getScoreColor = (score) => {
    if (score >= 7) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 7) return "bg-green-100";
    if (score >= 5) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="bg-red-100 rounded-full p-2">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">
                  Validation Failed
                </h2>
                <p className="text-sm text-red-700 mt-1">
                  Your issue submission didn't pass our AI validation checks
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Primary Reason */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Main Issue</h3>
                <p className="text-red-800">{error.reason}</p>
              </div>
            </div>
          </div>

          {/* Validation Score */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Validation Score
              </span>
              <span
                className={`text-2xl font-bold ${getScoreColor(
                  error.validationScore / 10
                )}`}
              >
                {error.validationScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  error.validationScore >= 70
                    ? "bg-green-500"
                    : error.validationScore >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${error.validationScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Minimum required score: 60/100
            </p>
          </div>

          {/* Detailed Breakdown */}
          {error.details && (
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3 hover:text-gray-700 transition-colors"
              >
                <span>Detailed Validation Breakdown</span>
                {showDetails ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showDetails && (
                <div className="space-y-3">
                  {/* Title Quality */}
                  {error.details.titleQuality && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Title Quality
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreBg(
                            error.details.titleQuality.score
                          )} ${getScoreColor(
                            error.details.titleQuality.score
                          )}`}
                        >
                          {error.details.titleQuality.score}/10
                        </span>
                      </div>
                      {error.details.titleQuality.issue && (
                        <p className="text-sm text-red-600 flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{error.details.titleQuality.issue}</span>
                        </p>
                      )}
                      {error.details.titleQuality.isMeaningful ? (
                        <p className="text-sm text-green-600 flex items-center space-x-2 mt-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Title is meaningful</span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">
                          ✓ Use clear, descriptive titles (e.g., "Large pothole
                          on Main Street near school")
                        </p>
                      )}
                    </div>
                  )}

                  {/* Description Quality */}
                  {error.details.descriptionQuality && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Description Quality
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreBg(
                            error.details.descriptionQuality.score
                          )} ${getScoreColor(
                            error.details.descriptionQuality.score
                          )}`}
                        >
                          {error.details.descriptionQuality.score}/10
                        </span>
                      </div>
                      {error.details.descriptionQuality.issue && (
                        <p className="text-sm text-red-600 flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{error.details.descriptionQuality.issue}</span>
                        </p>
                      )}
                      {error.details.descriptionQuality.isMeaningful ? (
                        <p className="text-sm text-green-600 flex items-center space-x-2 mt-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Description is clear</span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">
                          ✓ Provide detailed explanation with at least 10
                          meaningful words
                        </p>
                      )}
                    </div>
                  )}

                  {/* Image Validation */}
                  {error.details.imageValidation && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Image Validation
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreBg(
                            error.details.imageValidation.score
                          )} ${getScoreColor(
                            error.details.imageValidation.score
                          )}`}
                        >
                          {error.details.imageValidation.score}/10
                        </span>
                      </div>
                      {error.details.imageValidation.issue && (
                        <p className="text-sm text-red-600 flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{error.details.imageValidation.issue}</span>
                        </p>
                      )}
                      <div className="space-y-1 mt-2 text-sm">
                        <p
                          className={
                            error.details.imageValidation.matchesDescription
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {error.details.imageValidation.matchesDescription
                            ? "✓"
                            : "✗"}{" "}
                          Image matches description
                        </p>
                        <p
                          className={
                            error.details.imageValidation.isAuthentic
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {error.details.imageValidation.isAuthentic
                            ? "✓"
                            : "✗"}{" "}
                          Image appears authentic
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Content Consistency */}
                  {error.details.contentConsistency && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Content Consistency
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreBg(
                            error.details.contentConsistency.score
                          )} ${getScoreColor(
                            error.details.contentConsistency.score
                          )}`}
                        >
                          {error.details.contentConsistency.score}/10
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          error.details.contentConsistency.isConsistent
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {error.details.contentConsistency.isConsistent
                          ? "✓"
                          : "✗"}{" "}
                        Title, description, and images are consistent
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fraud Check */}
          {error.fraudCheck && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security Checks
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Authenticity</span>
                  <span
                    className={
                      error.fraudCheck.isAuthentic
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {error.fraudCheck.isAuthentic ? "Passed" : "Failed"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Image Match</span>
                  <span
                    className={
                      error.fraudCheck.imageMatchesDescription
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {error.fraudCheck.imageMatchesDescription
                      ? "Passed"
                      : "Failed"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Location Verified</span>
                  <span
                    className={
                      error.fraudCheck.locationVerified
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {error.fraudCheck.locationVerified ? "Passed" : "Failed"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Spam Detection</span>
                  <span
                    className={
                      !error.fraudCheck.spamDetected
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {!error.fraudCheck.spamDetected ? "Passed" : "Detected"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Improvement Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Tips for Successful Submission
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Write a clear, descriptive title that explains the issue
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Provide detailed description with specific details about the
                  problem
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Upload clear, authentic photos showing the actual issue
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Ensure images match your written description</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Use proper grammar and avoid random text or characters
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Edit and Retry
          </button>
        </div>
      </div>
    </div>
  );
};

// AI Validation Progress Component
const AIValidationProgress = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: "Analyzing title...", icon: Brain },
    { label: "Checking description...", icon: FileAudio },
    { label: "Validating images...", icon: ImageIcon },
    { label: "Running fraud detection...", icon: Shield },
    { label: "Calculating priority...", icon: AlertTriangle },
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            AI Validation in Progress
          </h3>
          <p className="text-gray-600 text-sm">
            Our AI is analyzing your submission for authenticity and priority
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  isActive ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
                }`}
              >
                <div
                  className={`flex-shrink-0 ${isActive ? "animate-pulse" : ""}`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : isActive ? (
                    <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-blue-900"
                      : isCompleted
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const IssueForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [location, setLocation] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    visibility: "public",
  });
  const [errors, setErrors] = useState({});

  // File upload handler
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error(
          "Some files were rejected. Please check file size and format."
        );
        return;
      }

      if (files.length + acceptedFiles.length > 5) {
        toast.error("Maximum 5 files allowed");
        return;
      }

      const newFiles = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.split("/")[0],
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".webm", ".mov"],
      "audio/*": [".mp3", ".wav", ".ogg", ".m4a"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  });

  // Remove file
  const removeFile = (index) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    toast.loading("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss();
        setLocation({
          address: "Current Location",
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
        toast.success("Location detected!");
      },
      (error) => {
        toast.dismiss();
        toast.error("Unable to get your location. Please select manually.");
        setShowLocationPicker(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  // Handle voice recording
  const handleVoiceRecording = (audioBlob, duration) => {
    setVoiceRecording({
      blob: audioBlob,
      duration,
      url: URL.createObjectURL(audioBlob),
    });
    setIsRecording(false);
    toast.success(`Voice note recorded (${Math.round(duration)}s)`);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title || formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!location) {
      newErrors.location = "Please select a location";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      const submitData = new FormData();

      // Add form fields
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      // Add location
      submitData.append("location", JSON.stringify(location));

      // Add files
      files.forEach((fileObj) => {
        submitData.append("media", fileObj.file);
      });

      // Add voice recording
      if (voiceRecording) {
        submitData.append(
          "media",
          voiceRecording.blob,
          `voice-${Date.now()}.wav`
        );
      }

      const response = await issuesAPI.create(submitData);
      console.log(response);
      toast.success("Issue validated and reported successfully!");
      navigate(`/issues/${response.data.data.issue._id}`);
    } catch (error) {
      console.error("Error creating issue:", error);

      // Check if it's a validation error
      if (error.response?.data?.validationFailed) {
        setValidationError(error.response.data.validationDetails);
      } else {
        toast.error(
          error.response?.data?.message ||
            "Failed to report issue. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get file type icon
  const getFileIcon = (type) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "audio":
        return <FileAudio className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Report an Issue
            </h1>
            <p className="text-gray-600 mt-1">
              Help improve your community by reporting civic issues
            </p>
            <div className="mt-3 flex items-center space-x-2 text-sm text-blue-600">
              <Brain className="w-4 h-4" />
              <span>AI-powered validation for authentic reports</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Title *
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                type="text"
                className={`form-input w-full text-black ${
                  errors.title ? "border-red-500" : ""
                }`}
                placeholder="Brief description of the issue"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Example: "Large pothole on Main Street causing traffic hazard"
              </p>
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`form-select w-full text-black ${
                    errors.category ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Select a category</option>
                  {ISSUE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="form-select w-full text-black"
                >
                  {ISSUE_PRIORITY.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  AI will adjust based on analysis
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`form-textarea w-full text-black ${
                  errors.description ? "border-red-500" : ""
                }`}
                placeholder="Provide detailed information about the issue. Be specific about what you observed, when it occurred, and any safety concerns."
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.description}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Minimum 10 characters. Be clear and specific for better AI
                validation.
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="space-y-3">
                {location ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800">{location.address}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocation(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="btn btn-outline flex items-center"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Use Current Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(true)}
                      className="btn btn-outline flex items-center"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Select on Map
                    </button>
                  </div>
                )}
                {errors.location && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.location}
                  </p>
                )}
              </div>
            </div>

            {/* Voice Recording */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice Note (Optional)
              </label>
              <div className="space-y-3">
                {voiceRecording ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <FileAudio className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-blue-800">
                        Voice note ({Math.round(voiceRecording.duration)}s)
                      </span>
                      <audio controls className="ml-3 h-8">
                        <source src={voiceRecording.url} type="audio/wav" />
                      </audio>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(voiceRecording.url);
                        setVoiceRecording(null);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecording}
                    isRecording={isRecording}
                    onRecordingStart={() => setIsRecording(true)}
                    onRecordingStop={() => setIsRecording(false)}
                    buttonProps={{ type: "button" }}
                  />
                )}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos/Videos (Optional)
              </label>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary-400 bg-primary-50"
                    : "border-gray-300 hover:border-primary-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? "Drop files here..."
                    : "Drag & drop files here, or click to select"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Max 5 files, 10MB each (Images, Videos, Audio)
                </p>
              </div>

              {/* File Preview */}
              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {files.map((fileObj, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {fileObj.type === "image" ? (
                          <img
                            src={fileObj.preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center p-3">
                            {getFileIcon(fileObj.type)}
                            <span className="text-xs mt-1 text-gray-600 text-center truncate w-full px-2">
                              {fileObj.file.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility option */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleInputChange}
                className="form-select w-full text-black"
              >
                <option value="public">Public (visible to everyone)</option>
                <option value="private">
                  Private (only you and admins can see)
                </option>
              </select>
            </div> */}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn btn-outline"
                disabled={isLoading}
              >
                Cancel
              </button>
              <LoadingButton
                loading={isLoading}
                type="submit"
                className="btn btn-primary"
              >
                {isLoading ? "Validating..." : "Report Issue"}
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={(loc) => {
            let formattedLoc = loc;
            if (
              loc &&
              typeof loc.lat === "number" &&
              typeof loc.lng === "number"
            ) {
              formattedLoc = {
                address: loc.address || "Selected Location",
                coordinates: {
                  lat: loc.lat,
                  lng: loc.lng,
                },
              };
            }
            setLocation(formattedLoc);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {/* AI Validation Progress */}
      {isLoading && <AIValidationProgress />}

      {/* Validation Error Modal */}
      {validationError && (
        <ValidationErrorModal
          error={validationError}
          onClose={() => {
            setValidationError(null);
          }}
          onRetry={() => {
            setValidationError(null);
            // Scroll to top of form
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
};

export default IssueForm;