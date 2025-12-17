import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, TrendingUp, User, Star } from "lucide-react";
import { leaderboardAPI } from "../../utils/api";
import { formatNumber, formatRelativeTime } from "../../utils/helpers";
import { ISSUE_CATEGORIES } from "../../utils/constants";

const ContributorBoard = () => {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState("monthly");
  const [category, setCategory] = useState("all");
  const [stats, setStats] = useState({
    totalIssues: 0,
    resolvedIssues: 0,
    activeContributors: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe, category]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = category !== "all" ? { category } : {};

      let response;
      if (timeframe === "monthly") {
        response = await leaderboardAPI.getMonthly(params);
      } else {
        response = await leaderboardAPI.getYearly(params);
      }

      // Handle response structure
      const data = response.data?.data || response.data || {};

      // Extract leaderboard - normalize the data structure
      const lbData = data.leaderboard || [];

      // Transform data to consistent format
      const normalizedLeaderboard = lbData.map((entry, index) => ({
        id: entry.userId || entry._id || index,
        name: entry.name || "Unknown",
        avatar: entry.avatar || "",
        points: entry.points || entry.totalPoints || 0,
        issueCount: entry.issueCount || entry.totalContributions || 0,
        resolvedCount: entry.resolvedCount || entry.issuesResolved || 0,
        joinedAt: entry.joinedAt || null,
        monthlyGrowth: entry.monthlyGrowth || 0,
        title: entry.title || "Community Member",
      }));

      setLeaderboard(normalizedLeaderboard);

      // Extract stats
      const statsData = data.stats || {};
      setStats({
        totalIssues: statsData.totalIssues || 0,
        resolvedIssues: statsData.resolvedIssues || 0,
        activeContributors: statsData.activeContributors || 0,
      });
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      setError("Failed to load leaderboard. Please try again.");
      setLeaderboard([]);
      setStats({
        totalIssues: 0,
        resolvedIssues: 0,
        activeContributors: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">{rank}</span>
          </div>
        );
    }
  };

  const calculateResolutionRate = (resolved, total) => {
    if (total === 0) return 0;
    return Math.round((resolved / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 bg-white rounded-lg p-6 h-96"></div>
              <div className="bg-white rounded-lg p-6 h-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={loadLeaderboard}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
                Community Leaderboard
              </h1>
              <p className="text-gray-600 mt-1">
                Recognizing our top civic contributors
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black"
              >
                <option value="monthly">This Month</option>
                <option value="yearly">This Year</option>
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black"
              >
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
                  🏆 Top Contributors
                </h2>

                <div className="flex items-end justify-center space-x-8">
                  {/* 2nd Place */}
                  <div className="text-center">
                    <div className="relative mb-4">
                      {leaderboard[1].avatar ? (
                        <img
                          src={leaderboard[1].avatar}
                          alt={leaderboard[1].name}
                          className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-gray-400"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto border-4 border-gray-400">
                          <User className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute -top-2 -right-2">
                        <Medal className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                    <div className="bg-gray-100 px-4 py-8 rounded-lg">
                      <h3 className="font-bold text-lg text-gray-900">
                        {leaderboard[1].name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {formatNumber(leaderboard[1].points)} points
                      </p>
                      <p className="text-gray-500 text-xs">
                        {leaderboard[1].issueCount} issues
                      </p>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="text-center">
                    <div className="relative mb-4">
                      {leaderboard[0].avatar ? (
                        <img
                          src={leaderboard[0].avatar}
                          alt={leaderboard[0].name}
                          className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-yellow-400"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto border-4 border-yellow-400">
                          <User className="w-10 h-10 text-yellow-600" />
                        </div>
                      )}
                      <div className="absolute -top-3 -right-3">
                        <Trophy className="w-10 h-10 text-yellow-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-b from-yellow-50 to-yellow-100 px-6 py-10 rounded-lg">
                      <h3 className="font-bold text-xl text-gray-900">
                        {leaderboard[0].name}
                      </h3>
                      <p className="text-yellow-700 text-lg font-semibold">
                        {formatNumber(leaderboard[0].points)} points
                      </p>
                      <p className="text-gray-600 text-sm">
                        {leaderboard[0].issueCount} issues
                      </p>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="text-center">
                    <div className="relative mb-4">
                      {leaderboard[2].avatar ? (
                        <img
                          src={leaderboard[2].avatar}
                          alt={leaderboard[2].name}
                          className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-amber-600"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto border-4 border-amber-600">
                          <User className="w-8 h-8 text-amber-600" />
                        </div>
                      )}
                      <div className="absolute -top-2 -right-2">
                        <Award className="w-8 h-8 text-amber-600" />
                      </div>
                    </div>
                    <div className="bg-amber-50 px-4 py-8 rounded-lg">
                      <h3 className="font-bold text-lg text-gray-900">
                        {leaderboard[2].name}
                      </h3>
                      <p className="text-amber-700 font-semibold">
                        {formatNumber(leaderboard[2].points)} points
                      </p>
                      <p className="text-gray-500 text-xs">
                        {leaderboard[2].issueCount} issues
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {timeframe === "monthly" ? "Monthly" : "Yearly"} Rankings
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contributor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Issues
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Resolved
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Join Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.map((contributor, index) => (
                      <tr key={contributor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRankIcon(index + 1)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {contributor.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={contributor.avatar}
                                alt={contributor.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-600" />
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {contributor.name}
                                </div>
                                {index < 3 && (
                                  <Star className="w-4 h-4 text-yellow-400 ml-2" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {contributor.title}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {formatNumber(contributor.points)}
                          </div>
                          {contributor.monthlyGrowth > 0 && (
                            <div className="text-xs text-green-600">
                              +{formatNumber(contributor.monthlyGrowth)} this
                              month
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contributor.issueCount}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contributor.resolvedCount}
                          <span className="text-xs text-gray-400 ml-1">
                            (
                            {calculateResolutionRate(
                              contributor.resolvedCount,
                              contributor.issueCount
                            )}
                            %)
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contributor.joinedAt
                            ? formatRelativeTime(contributor.joinedAt)
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {leaderboard.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No contributors yet
                  </h3>
                  <p className="text-gray-600">
                    Be the first to report an issue and earn points!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Impact Stats */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Community Impact</h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {formatNumber(stats.totalIssues)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Issues Reported
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {formatNumber(stats.resolvedIssues)}
                  </div>
                  <div className="text-sm text-gray-600">Issues Resolved</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {formatNumber(stats.activeContributors)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Active Contributors
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Resolution Rate</span>
                    <span className="font-semibold text-green-600">
                      {calculateResolutionRate(
                        stats.resolvedIssues,
                        stats.totalIssues
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${calculateResolutionRate(
                          stats.resolvedIssues,
                          stats.totalIssues
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* How Points Work - Redesigned */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Earning Points</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-3">
                <div className="group flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Report Issue</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">+2</span>
                </div>
                
                <div className="group flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl hover:from-green-100 hover:to-emerald-200 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Issue Resolved</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">+5</span>
                </div>
                
                <div className="group flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-100 rounded-xl hover:from-purple-100 hover:to-pink-200 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Add Comment</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">+1</span>
                </div>
                
                <div className="group flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-100 rounded-xl hover:from-amber-100 hover:to-orange-200 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Receive Upvote</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">+1</span>
                </div>
                
                <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    💡 <span className="font-semibold">Pro Tip:</span> Consistent contributions and quality issue reports earn you more points and help your community thrive!
                  </p>
                </div>
              </div>
            </div>

            {/* Achievement Levels - Redesigned */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Achievement Tiers</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-3">
                <div className="group flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-sm">N</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900">Newcomer</div>
                    <div className="text-xs text-gray-500">0-9 points • Just getting started</div>
                  </div>
                </div>
                
                <div className="group flex items-center gap-4 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-200">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-sm">C</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900">Contributor</div>
                    <div className="text-xs text-gray-500">10-49 points • Making an impact</div>
                  </div>
                </div>
                
                <div className="group flex items-center gap-4 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all duration-200">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900">Champion</div>
                    <div className="text-xs text-gray-500">50-99 points • Community leader</div>
                  </div>
                </div>
                
                <div className="group flex items-center gap-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-100 rounded-xl hover:from-yellow-100 hover:to-amber-200 transition-all duration-200">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-300 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900">Hero</div>
                    <div className="text-xs text-gray-500">100+ points • Elite status ⭐</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorBoard;