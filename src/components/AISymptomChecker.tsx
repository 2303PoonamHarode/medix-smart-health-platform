import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, Activity, Clock, ShieldAlert, Heart, User, ArrowRight, Loader2, Info } from 'lucide-react';
import { FamilyMember } from '../types';

interface AISymptomAnalysis {
  detectedSeverity: 'Low' | 'Medium' | 'High' | 'Critical';
  urgencyAdvice: string;
  possibleCauses: string[];
  recommendedSpecialist: string;
  suggestedHospitalCategory: string;
  crowdLevelPrediction: 'Low' | 'Medium' | 'High';
  estimatedQueueWaitingTimeMinutes: number;
}

export default function AISymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [patientAge, setPatientAge] = useState('30');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientHistory, setPatientHistory] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState('self');
  const [familyList, setFamilyList] = useState<FamilyMember[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISymptomAnalysis | null>(null);
  const [error, setError] = useState('');

  // Suggestions for swift click-indexing
  const fastSuggestions = [
    { text: 'Persistent heavy chest pain when breathing', label: 'Chest Pressure' },
    { text: '5-year-old child with a high 102°F fever and rash', label: 'Pediatric Fever' },
    { text: 'Sudden dizziness, blurred vision, and elevated blood pressure', label: 'Hypertension Spike' },
    { text: 'Minor throat congestion, tickly cough, no fever', label: 'Mild Cold' }
  ];

  const fetchFamily = async () => {
    try {
      const token = localStorage.getItem('hospital_token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('/api/family', { headers });
      if (res.ok) {
        const data = await res.json();
        setFamilyList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFamily();
  }, []);

  const handleFamilyChange = (val: string) => {
    setSelectedFamilyId(val);
    if (val === 'self') {
      setPatientAge('30');
      setPatientGender('Male');
      setPatientHistory('None');
    } else {
      const found = familyList.find(f => f.id === val);
      if (found) {
        setPatientAge(found.age.toString());
        setPatientGender(found.gender);
        setPatientHistory(`Allergies: ${found.allergies.join(', ') || 'None'}. History: ${found.chronicConditions.join(', ') || 'None'}`);
      }
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError('Please input your symptoms description first.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai/symptom-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          patientAge: parseInt(patientAge),
          patientGender,
          patientHistory
        })
      });

      if (!response.ok) {
        throw new Error('Symptom analyser returned failure');
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        setResult(data.analysis);
      } else {
        throw new Error('Analysis format incorrect');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing secure Gemini check. Re-trying soon.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColors = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', bar: 'bg-red-500' };
      case 'High':
        return { text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', bar: 'bg-orange-500' };
      case 'Medium':
        return { text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-500' };
      default:
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500' };
    }
  };

  const getCrowdColors = (crowd: string) => {
    switch (crowd) {
      case 'High': return 'text-red-400 bg-red-500/10';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-emerald-400 bg-emerald-500/10';
    }
  };

  return (
    <div className="space-y-6" id="symptom-checker-root">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-sky-400" />
            CareQuest AI Symptoms & Triage Analyzer
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Leverage clinical-grade Google Gemini AI to analyze symptoms on behalf of family members. Get hospital class matches, emergency crowd warnings, and predicted wait timelines.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-white/5 px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 self-start md:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Gemini Model Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-white/5 rounded-3xl p-5 md:p-6 space-y-5">
          <h3 className="text-xs font-mono font-extrabold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Patient Information
          </h3>

          <form onSubmit={handleAnalyze} className="space-y-4">
            
            {/* Select family profile */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-450 uppercase mb-1.5">Diagnosis Recipient</label>
              <select
                value={selectedFamilyId}
                onChange={(e) => handleFamilyChange(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="self">Checking for Myself (John Doe)</option>
                {familyList.map(member => (
                  <option key={member.id} value={member.id}>
                    Check for {member.name} ({member.relationship})
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-slate-500 mt-1">
                Link medical histories, blood Groups and pediatric allergies instantly.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-450 uppercase mb-1">Ages Index</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                  min="0"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-slate-450 uppercase mb-1">Gender Assigned</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Symptoms Description */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-450 uppercase mb-1.5">Describe Presenting Symptoms</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Detail symptoms (e.g., coughing, temperature spike, dull side abdominal pressure)..."
                rows={4}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-2xl p-3 text-xs focus:outline-none focus:border-sky-500/50 resize-none font-sans"
              />
            </div>

            {/* Suggestions */}
            <div>
              <label className="block text-[9.5px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">QUICK SAMPLE SYMPTOMS</label>
              <div className="flex flex-wrap gap-1.5">
                {fastSuggestions.map((s, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSymptoms(s.text)}
                    className="p-1 px-2 text-[10px] bg-slate-950 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white border border-white/5 transition-all text-left"
                  >
                    #{s.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/20 rounded-xl text-[10.5px] text-red-400 font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !symptoms.trim()}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-45 text-white font-extrabold text-xs uppercase tracking-widest font-mono rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-sky-600/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>COMMUNICATING CLINICAL NEURAL ENGINE...</span>
                </>
              ) : (
                <>
                  <span>ANALYZE DISPATCH METRICS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Triage Output */}
        <div className="lg:col-span-7 space-y-4">
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 glass border border-white/5 rounded-3xl space-y-4 animate-pulse">
              <div className="h-12 w-12 rounded-full border-4 border-t-sky-500 border-r-sky-500/20 border-b-sky-500/20 border-l-sky-500/20 animate-spin"></div>
              <p className="text-xs font-mono text-slate-400">Analyzing chemical and stress vectors, predicting occupancy rates...</p>
            </div>
          )}

          {!loading && !result && (
            <div className="border border-dashed border-white/10 rounded-3xl p-10 text-center text-slate-500 flex flex-col items-center justify-center min-h-[360px]">
              <BrainCircuit className="w-12 h-12 text-slate-600 stroke-[1.5]" />
              <h3 className="font-extrabold text-sm text-white font-display mt-4">Triage Console Inactive</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto">
                Fill the clinical description of symptoms on the left. CareQuest AI will compute urgency indices, match regional specialists and list waiting times instantly.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="bg-slate-900/35 border border-white/10 rounded-3xl p-6 space-y-6 animate-[fade-in_0.4s_ease-out]">
              
              {/* Severity Banner */}
              <div className={`p-4 rounded-2xl border ${getSeverityColors(result.detectedSeverity).bg} flex items-start gap-4`}>
                <div className={`p-2 rounded-xl bg-slate-950/80 ${getSeverityColors(result.detectedSeverity).text}`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400">EMERGENCY ASSIGNED SEVERITY:</span>
                    <strong className={`font-mono text-xs font-extrabold uppercase ${getSeverityColors(result.detectedSeverity).text}`}>
                      {result.detectedSeverity}
                    </strong>
                  </div>
                  <h4 className="text-xs font-semibold text-white leading-relaxed">{result.urgencyAdvice}</h4>
                </div>
              </div>

              {/* Grid detail rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Causes Card */}
                <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl space-y-2.5">
                  <span className="text-[9.5px] font-mono font-extrabold text-slate-450 uppercase tracking-widest block">AI-Inferred Possible Causes:</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {result.possibleCauses.map((cause, cIdx) => (
                      <li key={cIdx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Specialist match */}
                <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl space-y-2.5">
                  <span className="text-[9.5px] font-mono font-extrabold text-slate-450 uppercase tracking-widest block">Recommended Specialist match:</span>
                  <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-white">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <div>
                      <h5 className="text-xs font-bold font-sans">{result.recommendedSpecialist}</h5>
                      <p className="text-[9px] text-slate-500">Suite Medical Staff</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block">{result.suggestedHospitalCategory}</span>
                </div>

              </div>

              {/* Booking occupancy indexes */}
              <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 space-y-4">
                <span className="text-[10px] font-mono font-extrabold text-slate-450 uppercase tracking-widest flex items-center justify-between">
                  <span>LIVE queue & crowd metrics warning</span>
                  <span className="text-sky-400">REALTIME ESTIMATE</span>
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9.5px] text-slate-500">Live Crowd Conditions</span>
                    <strong className={`block text-xs font-mono font-extrabold px-2 py-0.5 rounded-md inline-block ${getCrowdColors(result.crowdLevelPrediction)}`}>
                      {result.crowdLevelPrediction} Demand
                    </strong>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[9.5px] text-slate-500">Simulated Queue Delay</span>
                    <strong className="block text-sm font-mono font-extrabold text-white">
                      ⏱ {result.estimatedQueueWaitingTimeMinutes} Min Wait
                    </strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>TRIAGE CLASSIFICATION LEVEL</span>
                    <span>{result.detectedSeverity === 'Low' ? '15% occupancy threshold' : '90% critical priority'}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getSeverityColors(result.detectedSeverity).bar}`} 
                      style={{ width: result.detectedSeverity === 'Low' ? '15%' : result.detectedSeverity === 'Medium' ? '45%' : result.detectedSeverity === 'High' ? '70%' : '98%' }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-white/5 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <p>
                  <strong>CareQuest Triage Alert:</strong> These insights are synthesized via machine learning predictions for informational guidelines. If you feel immediate danger, chest pressure or stroke indicators, trigger our <strong>SOS One-Click RED ambulance</strong>.
                </p>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
