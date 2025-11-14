import React from 'react';
import { LightBulbIcon, UsersIcon, ClipboardListIcon, BeakerIcon, TrendingUpIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AiInsightReportProps {
  data: any;
}

const colorClasses = {
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-100' },
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-100' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-100' },
  red: { text: 'text-red-600', bg: 'bg-red-100' },
};

const riskColorClasses = {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-amber-100 text-amber-800',
    Low: 'bg-emerald-100 text-emerald-800',
}

const GENDER_PIE_COLORS: { [key: string]: string } = {
  male: '#3b82f6',
  female: '#ec4899',
  other: '#f59e0b',
  unknown: '#a8a29e'
};

const Highlight: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-bold text-indigo-600">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
};


const InsightItem: React.FC<{ insight: string, color: keyof typeof colorClasses }> = ({ insight, color }) => {
    const selectedColor = colorClasses[color] || colorClasses.indigo;
    return (
        <li className="flex items-start">
            <div className={`flex-shrink-0 p-1 ${selectedColor.bg} rounded-full mr-3 mt-1`}>
                <LightBulbIcon className={`w-4 h-4 ${selectedColor.text}`} />
            </div>
            <p className="text-slate-700"><Highlight text={insight} /></p>
        </li>
    );
};

const MetricCard: React.FC<{ metric: any }> = ({ metric }) => {
    const isPositive = metric.changePercentage >= 0;
    const color = isPositive ? 'text-emerald-500' : 'text-red-500';
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">{metric.name}</p>
            <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-bold text-slate-800">{metric.currentValue}</p>
                <div className={`flex items-center text-sm font-semibold ${color}`}>
                    {isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                    <span>{Math.abs(metric.changePercentage).toFixed(1)}%</span>
                </div>
            </div>
             <p className="text-xs text-slate-400">vs {metric.previousValue} prior</p>
        </div>
    )
}

export const AiInsightReport: React.FC<AiInsightReportProps> = ({ data }) => {
  if (data.error) {
    return <p className="text-red-600 leading-relaxed font-medium">{data.error}</p>;
  }

  return (
    <div className="space-y-8">
      <h4 className="text-xl font-bold text-slate-800 text-center italic">
        "{data.headline}"
      </h4>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h5 className="flex items-center text-md font-semibold text-slate-700 mb-3">
            <LightBulbIcon className="w-5 h-5 mr-2 text-indigo-500"/>
            Key Insights
        </h5>
        <ul className="space-y-2">
            {data.keyInsights?.map((item: any, index: number) => (
                <InsightItem key={index} insight={item.insight} color={item.color} />
            ))}
        </ul>
      </div>

      {data.comparativeAnalysis && (
        <div>
            <h5 className="flex items-center text-lg font-semibold text-slate-700 mb-4">
                <TrendingUpIcon className="w-6 h-6 mr-2 text-emerald-500"/>
                Comparative Analysis
            </h5>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed"><Highlight text={data.comparativeAnalysis.summary} /></p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.comparativeAnalysis.metrics?.map((metric: any) => <MetricCard key={metric.name} metric={metric} />)}
                </div>
                <div>
                    <h6 className="font-semibold text-slate-600 mb-2 text-sm">Top Condition Trends</h6>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data.comparativeAnalysis.topConditionChanges} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                           <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                           <YAxis stroke="#94a3b8" fontSize={10} />
                           <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} />
                           <Legend wrapperStyle={{fontSize: "12px"}}/>
                           <Bar dataKey="previousCount" name="Previous Period" fill="#a8a29e" radius={[4, 4, 0, 0]} />
                           <Bar dataKey="currentCount" name="Current Period" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <h5 className="flex items-center text-lg font-semibold text-slate-700">
                <UsersIcon className="w-6 h-6 mr-2 text-sky-500"/>
                Demographic Analysis
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
                <Highlight text={data.demographics?.summary} />
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                    <h6 className="font-semibold text-slate-600 mb-2 text-center text-sm">Age Groups</h6>
                    <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={data.demographics.ageDistributionChartData} layout="vertical" margin={{left: -20}}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <Bar dataKey="value" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
                 <div>
                    <h6 className="font-semibold text-slate-600 mb-2 text-center text-sm">Gender</h6>
                    <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                            <Pie data={data.demographics.genderDistributionChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5}>
                                {data.demographics.genderDistributionChartData.map((entry: any) => (
                                    <Cell key={`cell-${entry.name}`} fill={GENDER_PIE_COLORS[entry.name.toLowerCase()] || GENDER_PIE_COLORS.unknown} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
        
        <div className="space-y-4">
             <h5 className="flex items-center text-lg font-semibold text-slate-700">
                <ClipboardListIcon className="w-6 h-6 mr-2 text-amber-500"/>
                Condition Analysis
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
                <Highlight text={data.conditions?.summary} />
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-4 py-2 rounded-l-lg">Condition</th>
                            <th scope="col" className="px-4 py-2 text-center">Cases</th>
                            <th scope="col" className="px-4 py-2 text-center rounded-r-lg">Risk Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.conditions?.table?.map((item: any, index: number) => (
                            <tr key={index} className="bg-white border-b border-slate-100">
                                <th scope="row" className="px-4 py-2 font-medium text-slate-900 whitespace-nowrap">
                                    {item.name}
                                </th>
                                <td className="px-4 py-2 text-center font-semibold text-slate-800">
                                    {item.count}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${riskColorClasses[item.risk as keyof typeof riskColorClasses] || 'bg-slate-100 text-slate-800'}`}>
                                      {item.risk}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
       <div className="space-y-4 pt-4 border-t border-slate-200">
            <h5 className="flex items-center text-lg font-semibold text-slate-700">
                <BeakerIcon className="w-6 h-6 mr-2 text-emerald-500"/>
                Public Health Focus
            </h5>
             <p className="text-sm text-slate-600 leading-relaxed">
                <Highlight text={data.publicHealthFocus?.summary} />
            </p>
        </div>
    </div>
  );
};
