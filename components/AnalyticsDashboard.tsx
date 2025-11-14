import React, { useMemo, useState, useEffect } from 'react';
import type { ProcessedData } from '../services/fhirService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DashboardCard } from './DashboardCard';
import { generateRegionalSummary } from '../services/geminiService';
import { UsersIcon, CheckCircleIcon, TrendingUpIcon, CalendarIcon, SparklesIcon } from './icons/Icons';
import { AiInsightReport } from './AiInsightReport';
import { DateRange } from './Header';

interface AnalyticsDashboardProps {
  data: ProcessedData;
  comparativeData: ProcessedData | null;
  isOverallView: boolean;
  dateRange: DateRange;
}

const GENDER_COLORS: { [key: string]: string } = {
  male: '#3b82f6', // blue-500
  female: '#ec4899', // pink-500
  other: '#f59e0b', // amber-500
  unknown: '#a8a29e' // stone-400
};

const CONDITION_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];


const getAge = (birthDate: string | undefined) => {
    if (!birthDate) return null;
    return Math.floor((new Date().getTime() - new Date(birthDate).getTime()) / 3.15576e+10);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white border border-slate-300 rounded-lg shadow-lg">
        <p className="font-bold text-slate-800">{label}</p>
        {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }} className="font-medium">{`${p.name}: ${p.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const processAnalytics = (d: ProcessedData) => {
    if (!d) return null;
    const patientsWithAge = d.patients.map(p => ({...p, age: getAge(p.birthDate)})).filter(p => p.age !== null);
    
    const genderData = patientsWithAge.reduce((acc, p) => {
        const gender = p.gender || 'unknown';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const ageGroupData = patientsWithAge.reduce((acc, p) => {
        if(p.age! <= 18) acc['0-18']++;
        else if(p.age! <= 40) acc['19-40']++;
        else if(p.age! <= 60) acc['41-60']++;
        else acc['60+']++;
        return acc;
    }, {'0-18': 0, '19-40': 0, '41-60': 0, '60+': 0});
    
    const conditionCounts = d.conditions.reduce((acc, c) => {
        const name = c.code?.text || c.code?.coding?.[0]?.display || 'Unknown';
        if (name !== 'Unknown') {
          acc[name] = (acc[name] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    
    const topConditions = Object.entries(conditionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({name, count}));
        
    const encountersByDate = d.encounters.reduce((acc, e) => {
        const date = e.period?.start?.split('T')[0];
        if(date) {
            acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    
    const sortedEncounters = Object.entries(encountersByDate)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, count]) => ({date, count}));

    return {
        totalPatients: d.patients.length,
        totalEncounters: d.encounters.length,
        resolvedCases: d.conditions.filter(c => c.clinicalStatus?.coding?.[0]?.code === 'resolved').length,
        activeCases: d.conditions.filter(c => c.clinicalStatus?.coding?.[0]?.code === 'active').length,
        genderData: Object.entries(genderData).map(([name, value]) => ({name, value})),
        ageGroupData: Object.entries(ageGroupData).map(([name, value]) => ({name, patients: value})),
        topConditions,
        encounterTrend: sortedEncounters
    };
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data, comparativeData, isOverallView, dateRange }) => {
    const [aiSummary, setAiSummary] = useState<any>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);

    const analytics = useMemo(() => processAnalytics(data), [data]);
    const prevAnalytics = useMemo(() => processAnalytics(comparativeData), [comparativeData]);

    useEffect(() => {
        const getSummary = async () => {
            if (!analytics || analytics.totalPatients < 5) {
                setAiSummary({ error: "Not enough data for the selected period to generate meaningful insights." });
                setIsSummaryLoading(false);
                return;
            }
            setIsSummaryLoading(true);
            
            const formatForAI = (stats: any, periodDesc: string) => ({
                totalPatients: stats.totalPatients,
                totalEncounters: stats.totalEncounters,
                activeCases: stats.activeCases,
                genderDistribution: stats.genderData.reduce((acc: any, g: any) => { acc[g.name] = g.value; return acc; }, {}),
                ageDistribution: stats.ageGroupData.reduce((acc: any, g: any) => { acc[g.name] = g.patients; return acc; }, {}),
                topConditions: stats.topConditions,
                timePeriodDescription: periodDesc,
            });

            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const periodDesc = isOverallView ? "overall" : `${months[dateRange.start.month - 1]} ${dateRange.start.year} to ${months[dateRange.end.month - 1]} ${dateRange.end.year}`;
            
            const currentPeriodData = formatForAI(analytics, periodDesc);
            const previousPeriodData = prevAnalytics && prevAnalytics.totalPatients > 0 ? formatForAI(prevAnalytics, "previous period") : null;
            
            const result = await generateRegionalSummary(currentPeriodData, previousPeriodData);
            setAiSummary(result);
            setIsSummaryLoading(false);
        };
        getSummary();
    }, [analytics, prevAnalytics, isOverallView, dateRange]);

    if (!analytics) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard title="Total Patients" value={analytics.totalPatients} icon={UsersIcon} color="indigo" />
                <DashboardCard title={isOverallView ? "Total Encounters" : "Encounters This Period"} value={analytics.totalEncounters} icon={CalendarIcon} color="sky" />
                <DashboardCard title="Active Cases" value={analytics.activeCases} icon={TrendingUpIcon} color="amber" />
                <DashboardCard title="Resolved Cases" value={analytics.resolvedCases} icon={CheckCircleIcon} color="emerald" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                 <h3 className="flex items-center text-lg font-semibold text-slate-700 mb-4">
                    <SparklesIcon className="w-6 h-6 mr-2 text-indigo-500" />
                    AI Regional Health Insights
                </h3>
                {isSummaryLoading ? (
                  <div className="flex items-center space-x-2 text-slate-500">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing data...</span>
                  </div>
                ) : (
                  aiSummary && <AiInsightReport data={aiSummary} />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Encounter Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.encounterTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="count" name="Encounters" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} dot={{r: 4, fill: '#4f46e5'}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Gender Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={analytics.genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                return ( <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold"> {`${(percent * 100).toFixed(0)}%`} </text> );
                            }}>
                                {analytics.genderData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={GENDER_COLORS[entry.name.toLowerCase()] || GENDER_COLORS.unknown} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Patients by Age Group</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.ageGroupData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff"/>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12}/>
                            <YAxis stroke="#94a3b8" fontSize={12}/>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="patients" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Top 5 Diagnosed Conditions</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.topConditions} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff"/>
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} stroke="#94a3b8"/>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="count" name="Cases">
                                {analytics.topConditions.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CONDITION_COLORS[index % CONDITION_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
