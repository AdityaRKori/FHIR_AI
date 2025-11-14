import { GoogleGenAI, Type } from "@google/genai";
import type { Patient, Observation, Condition } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function formatVitalsForPrompt(observations: Observation[]): string {
  const vitals: string[] = [];
  const seenVitals = new Set<string>();

  observations.slice(0, 5).forEach(obs => {
    const name = obs.code.text || obs.code.coding?.[0]?.display || 'Unknown Vital';
    if(seenVitals.has(name) || name === 'Unknown Vital') return;
    
    if (obs.valueQuantity) {
      vitals.push(`- ${name}: ${obs.valueQuantity.value.toFixed(2)} ${obs.valueQuantity.unit} (on ${new Date(obs.effectiveDateTime!).toLocaleDateString()})`);
      seenVitals.add(name);
    } else if (obs.component) {
      const components = obs.component.map(c => {
        const componentName = c.code.text || c.code.coding?.[0]?.display;
        if (c.valueQuantity) {
          return `${componentName}: ${c.valueQuantity.value.toFixed(2)} ${c.valueQuantity.unit}`;
        }
        return '';
      }).filter(Boolean).join(', ');
      if (components) {
        vitals.push(`- ${name}: ${components} (on ${new Date(obs.effectiveDateTime!).toLocaleDateString()})`);
        seenVitals.add(name);
      }
    }
  });

  return vitals.length > 0 ? vitals.join('\n') : 'No recent vitals available.';
}

export const generateHealthSummary = async (patient: Patient, observations: Observation[], conditions: Condition[]): Promise<string> => {
  const patientName = patient.name?.[0]?.text || `${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}` || 'Unnamed Patient';
  const birthDate = patient.birthDate ? new Date(patient.birthDate) : null;
  const age = birthDate ? Math.floor((new Date().getTime() - birthDate.getTime()) / 3.15576e+10) : 'N/A';

  const prompt = `
    You are a medical assistant AI. Based on the following FHIR data for a patient, provide a concise and easy-to-understand health summary in a single paragraph. Highlight key conditions, recent abnormal vital signs, and potential risks. Do not provide medical advice, but summarize the clinical picture.

    - Patient Demographics: ${patientName}, ${age} years old, ${patient.gender || 'unknown'}.
    - Active Conditions:
      ${conditions.map(c => `- ${c.code?.text || c.code?.coding?.[0]?.display}`).join('\n') || 'No active conditions listed.'}
    - Recent Vitals:
      ${formatVitalsForPrompt(observations)}

    Health Summary:
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating health summary:", error);
    return "Could not generate AI summary at this time.";
  }
};

const regionalSummarySchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING, description: "A concise, engaging headline summarizing the main finding." },
        keyInsights: {
            type: Type.ARRAY,
            description: "A list of 2-3 most critical, actionable insights.",
            items: {
                type: Type.OBJECT,
                properties: {
                    insight: { type: Type.STRING, description: "The insight text. Use markdown `**number**` to bold important numbers." },
                    color: { type: Type.STRING, description: "A color for UI styling.", enum: ['indigo', 'emerald', 'amber', 'red'] }
                },
                required: ['insight', 'color']
            }
        },
        demographics: {
            type: Type.OBJECT,
            description: "Analysis of the demographic data.",
            properties: {
                summary: { type: Type.STRING, description: "A paragraph analyzing age and gender distributions. Use markdown `**number**` to bold important numbers." },
                ageDistributionChartData: {
                    type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.INTEGER } } }
                },
                genderDistributionChartData: {
                    type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.INTEGER } } }
                }
            },
            required: ['summary', 'ageDistributionChartData', 'genderDistributionChartData']
        },
        conditions: {
            type: Type.OBJECT,
            description: "Analysis of the top health conditions.",
            properties: {
                summary: { type: Type.STRING, description: "A paragraph analyzing the prevalent conditions. Use markdown `**number**` to bold important numbers." },
                table: {
                    type: Type.ARRAY,
                    description: "A table of the top conditions with their counts and an assessed risk level.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            count: { type: Type.INTEGER },
                            risk: { type: Type.STRING, description: "Risk level.", enum: ['High', 'Medium', 'Low'] }
                        },
                        required: ['name', 'count', 'risk']
                    }
                }
            },
             required: ['summary', 'table']
        },
        publicHealthFocus: {
            type: Type.OBJECT,
            description: "A summary of potential public health actions or areas of focus based on the analysis.",
            properties: {
                summary: { type: Type.STRING, description: "A paragraph outlining key public health considerations. Use markdown `**number**` to bold important numbers." },
            },
            required: ['summary']
        },
        comparativeAnalysis: {
            type: Type.OBJECT,
            description: "Comparison with the previous period.",
            properties: {
                summary: { type: Type.STRING, description: "A summary of key trends and changes from the previous period. Use markdown `**number**` to bold important numbers." },
                metrics: {
                    type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, currentValue: { type: Type.INTEGER }, previousValue: { type: Type.INTEGER }, changePercentage: {type: Type.NUMBER} } }
                },
                topConditionChanges: {
                    type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, currentCount: { type: Type.INTEGER }, previousCount: { type: Type.INTEGER } } }
                }
            }
        }
    },
    required: ['headline', 'keyInsights', 'demographics', 'conditions', 'publicHealthFocus']
};


export const generateRegionalSummary = async (currentPeriodData: any, previousPeriodData: any | null): Promise<any> => {
    const prompt = `
    You are a public health analyst AI. Analyze the following aggregated health data. The primary data is for the "Current Period", representing a snapshot. If "Previous Period" data is available, perform a comparative analysis. Provide a detailed, structured analysis in JSON format.
    Your analysis should include a headline, key insights, demographic breakdown, condition analysis, a public health focus, and a comparative analysis (if applicable).
    Categorize condition risk based on prevalence and common medical knowledge (e.g., chronic diseases like Hypertension or Diabetes are 'High' risk).
    **Use markdown's double asterisks (e.g., **15%** or **25 cases**) to bold any key numbers, percentages, or statistics in all summary and insight text fields.** This is crucial for UI highlighting.

    --- CURRENT PERIOD DATA ---
    - Time Period: ${currentPeriodData.timePeriodDescription}
    - Total Patients: ${currentPeriodData.totalPatients}
    - Gender Distribution: ${JSON.stringify(currentPeriodData.genderDistribution)}
    - Age Distribution: ${JSON.stringify(currentPeriodData.ageDistribution)}
    - Top 5 Conditions: ${currentPeriodData.topConditions.map((c: any) => `${c.name} (${c.count} cases)`).join(', ')}
    - Key Metrics: Total Encounters: ${currentPeriodData.totalEncounters}, Active Cases: ${currentPeriodData.activeCases}

    --- PREVIOUS PERIOD DATA ---
    ${previousPeriodData ? `
    - Time Period: ${previousPeriodData.timePeriodDescription}
    - Total Patients: ${previousPeriodData.totalPatients}
    - Gender Distribution: ${JSON.stringify(previousPeriodData.genderDistribution)}
    - Age Distribution: ${JSON.stringify(previousPeriodData.ageDistribution)}
    - Top 5 Conditions: ${previousPeriodData.topConditions.map((c: any) => `${c.name} (${c.count} cases)`).join(', ')}
    - Key Metrics: Total Encounters: ${previousPeriodData.totalEncounters}, Active Cases: ${previousPeriodData.activeCases}
    ` : "No previous period data available for comparison."}

    Based on this data, return a JSON object adhering to the schema.
    For \`demographics.ageDistributionChartData\`, format it as an array of objects like [{ "name": "0-18", "value": count }].
    For \`demographics.genderDistributionChartData\`, format it as an array of objects like [{ "name": "male", "value": count }].
    If previous data exists, populate the 'comparativeAnalysis' field. Calculate percentage changes for metrics. The formula is ((current - previous) / previous) * 100.
    `;

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: regionalSummarySchema
          }
        });
        return JSON.parse(response.text);
      } catch (error) {
        console.error("Error generating regional summary:", error);
        return { error: "Could not generate AI regional insights at this time." };
      }
};