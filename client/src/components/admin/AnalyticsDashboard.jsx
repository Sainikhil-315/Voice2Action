// src/components/admin/AnalyticsDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Building,
} from "lucide-react";
import { adminAPI, authoritiesAPI } from "../../utils/api";
import { formatNumber } from "../../utils/helpers";
import { ChartSkeleton } from "../common/Loader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState("30d");

  // Reload analytics data whenever timeRange changes
  useEffect(() => {
    loadAnalytics();
    // All charts and content will update because they use the analytics state
  }, [timeRange]);

  // Loads analytics data for the selected timeRange and updates all charts/content
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Parse number of days from timeRange (e.g., '30d' -> 30)
      const days = parseInt(timeRange);

      // Fetch analytics and authorities data in parallel
      const [analyticsResponse, authoritiesResponse] = await Promise.all([
        adminAPI.getAnalytics({ timeframe: days }),
        authoritiesAPI.getAll(), // Fetch all authorities
      ]);

      const data = analyticsResponse.data?.data || {};
      const authoritiesData = authoritiesResponse.data?.data?.authorities || [];

      // Issues over time (trends) - only keep 5 statuses
      const issuesOverTime = (data.trends || []).map((item) => {
        const date =
          item._id?.day !== undefined
            ? `${item._id?.year}-${String(item._id?.month).padStart(
                2,
                "0"
              )}-${String(item._id?.day).padStart(2, "0")}`
            : "";
        return {
          date,
          pending: item.pending || 0,
          verified: item.verified || 0,
          rejected: item.rejected || 0,
          in_progress: item.in_progress || 0,
          resolved: item.resolved || 0,
        };
      });

      // Category distribution (pie chart)
      const categoryDistribution = (data.categoryPerformance || []).map(
        (item) => ({
          name: item.category || item._id || "Unknown",
          value: item.total || 0,
        })
      );

      // Response time by category (bar chart)
      const responseTimeByCategory = (data.categoryPerformance || []).map(
        (item) => ({
          category: item.category || item._id || "Unknown",
          avgResponseTime: Math.round(item.avgResolutionTime || 0),
        })
      );

      // User engagement (line chart)
      const userEngagement = (data.userEngagement || []).map((item) => ({
        date: item.date,
        activeUsers: item.activeUsers || 0,
        newUsers: item.newUsers || 0,
      }));

      // Top reporters (table)
      const topReporters = (data.userMetrics?.topContributors || [])
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 10)
        .map((u) => ({
          name: u.name,
          role: u.role || "user",
          issueCount: u.issueCount || u.issues || 0,
          points: u.score || 0,
        }));

      // ✅ FIX: Authority performance (table) - Use real data
      const authorityPerformance = authoritiesData
        .filter((auth) => auth.status === "active") // Only active authorities
        .map((auth) => ({
          name: auth.name,
          department: auth.department,
          assigned: auth.performanceMetrics?.totalAssignedIssues || 0,
          resolved: auth.performanceMetrics?.resolvedIssues || 0,
          avgResponseTime: Math.round(
            auth.performanceMetrics?.averageResolutionTime || 0
          ),
          rating: auth.performanceMetrics?.rating || 0,
          responseRate: auth.performanceMetrics?.responseRate || 0,
        }))
        .sort((a, b) => b.resolved - a.resolved) // Sort by most resolved
        .slice(0, 10); // Top 10

      // Key metrics
      const totalIssues = issuesOverTime.reduce(
        (sum, d) =>
          sum +
          (d.pending + d.verified + d.rejected + d.in_progress + d.resolved),
        0
      );
      const resolvedIssues = issuesOverTime.reduce(
        (sum, d) => sum + d.resolved,
        0
      );
      const avgResponseTime = Math.round(
        (data.categoryPerformance || []).reduce(
          (sum, c) => sum + (c.avgResolutionTime || 0),
          0
        ) / ((data.categoryPerformance || []).length || 1)
      );

      const analytics = {
        totalIssues,
        resolvedIssues,
        avgResponseTime,
        issueGrowth: 0,
        resolutionGrowth: 0,
        responseTimeImprovement: 0,
        satisfactionScore: 0,
        satisfactionGrowth: 0,
        issuesOverTime,
        categoryDistribution,
        responseTimeByCategory,
        userEngagement,
        topReporters,
        authorityPerformance, // ✅ Now populated with real data
      };

      setAnalytics(analytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await adminAPI.exportData({
        format: "pdf",
        type: "analytics",
        period: timeRange,
      });
      // Handle download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analytics-report-${timeRange}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const categoryColors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive insights into civic issue reporting and resolution
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center space-x-3 text-black">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="form-select"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
                <option value="365d">Last year</option>
              </select>

              <button
                onClick={exportReport}
                className="btn btn-outline flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Total Issues</p>
                <p className="text-2xl font-bold text-black">
                  {formatNumber(analytics?.totalIssues || 0)}
                </p>
                <p className="text-sm text-green-600">
                  +{analytics?.issueGrowth || 0}% from last period
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">
                  Resolution Rate
                </p>
                <p className="text-2xl font-bold text-black">
                  {Math.round(
                    ((analytics?.resolvedIssues || 0) /
                      (analytics?.totalIssues || 1)) *
                      100
                  )}
                  %
                </p>
                <p className="text-sm text-green-600">
                  +{analytics?.resolutionGrowth || 0}% improvement
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">
                  Avg Response Time
                </p>
                <p className="text-2xl font-bold text-black">
                  {analytics?.avgResponseTime || 0}h
                </p>
                <p className="text-sm text-green-600">
                  -{analytics?.responseTimeImprovement || 0}h faster
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Issues Over Time */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-black">
                Issues Over Time
              </h2>
            </div>

            <div className="p-6">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={analytics?.issuesOverTime || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="issues"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-black">
                Issues by Category
              </h2>
            </div>

            <div className="p-6">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <RechartsPieChart>
                    <Pie
                      data={analytics?.categoryDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {(analytics?.categoryDistribution || []).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={categoryColors[index % categoryColors.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Response Time by Category */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-black">
                Response Time by Category
              </h2>
            </div>

            <div className="p-6">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics?.responseTimeByCategory || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgResponseTime" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* User Engagement */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-black">
                User Engagement
              </h2>
            </div>

            <div className="p-6">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={analytics?.userEngagement || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Active Users"
                    />
                    <Line
                      type="monotone"
                      dataKey="newUsers"
                      stroke="#ec4899"
                      strokeWidth={2}
                      name="New Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Reporters */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-black">
                Top Contributors
              </h2>
            </div>

            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Issues
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(analytics?.topReporters || []).map((reporter, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                        {reporter.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {reporter.issueCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {reporter.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Authority Performance */}
          {/* Authority Performance */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-black">
                Authority Performance
              </h2>
            </div>

            <div className="overflow-hidden">
              {analytics?.authorityPerformance &&
              analytics.authorityPerformance.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-black uppercase">
                        Authority
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-black uppercase">
                        Department
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-black uppercase">
                        Resolved
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-black uppercase">
                        Avg Time
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-black uppercase">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.authorityPerformance.map((authority, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-black">
                            {authority.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {authority.department?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          <div className="flex items-center">
                            <span className="font-medium">
                              {authority.resolved}
                            </span>
                            <span className="text-gray-500 ml-1">
                              / {authority.assigned}
                            </span>
                          </div>
                          {authority.assigned > 0 && (
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-green-600 h-1.5 rounded-full"
                                style={{
                                  width: `${Math.round(
                                    (authority.resolved / authority.assigned) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {authority.avgResponseTime > 0
                            ? `${authority.avgResponseTime}h`
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-black mr-1">
                              {authority.rating.toFixed(1)}
                            </span>
                            <span className="text-yellow-400">★</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    No authority performance data available
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Authorities need to resolve issues to appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
