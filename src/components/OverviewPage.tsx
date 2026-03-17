import { Bluetooth, Cpu, Mic, Shield, Zap, Radio, Activity, Volume2, Map, Gauge } from 'lucide-react';

const PIPELINE_STEPS = [
  { label: 'BT SCO Input', icon: Bluetooth, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
  { label: 'Oboe MMAP', icon: Cpu, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { label: 'VAD', icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { label: 'HP Filter 80Hz', icon: Radio, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  { label: 'AEC + AGC', icon: Shield, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
  { label: 'RNNoise AI', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { label: 'EQ Voice Boost', icon: Volume2, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30' },
  { label: 'BT SCO Output', icon: Bluetooth, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
];

const FEATURES = [
  { icon: Bluetooth, title: 'Bluetooth SCO Audio', desc: 'Full-duplex audio routing through BT SCO headset for helmet communication' },
  { icon: Cpu, title: 'Oboe MMAP Low-latency', desc: 'Google Oboe with MMAP exclusive mode for sub-10ms audio latency on Android 10+' },
  { icon: Activity, title: 'Energy-based VAD', desc: 'Short vs long-term energy ratio VAD with 300ms hangover and hysteresis' },
  { icon: Radio, title: 'High-Pass Filter 80Hz', desc: 'Butterworth biquad filter removes motorcycle wind rumble below 80Hz' },
  { icon: Shield, title: 'AEC + AGC + NS', desc: 'Android built-in Acoustic Echo Canceler, Auto Gain Control, and Noise Suppressor' },
  { icon: Zap, title: 'RNNoise Neural Model', desc: 'ONNX Runtime inference of RNNoise for AI-powered noise reduction at runtime' },
  { icon: Volume2, title: 'EQ Voice Boost', desc: 'Dual peaking EQ: +3dB at 1kHz (presence) and +2dB at 3kHz (clarity)' },
  { icon: Map, title: 'GPS Adaptive VAD', desc: 'GPS speed-based adaptive VAD threshold: more sensitive at low speed, stronger at highway' },
  { icon: Gauge, title: 'Proximity Helmet Detection', desc: 'Proximity sensor detects when helmet is worn/removed and auto-starts/stops audio' },
];

const REMOVED_FEATURES = [
  'Push-to-talk (PTT) button',
  'Multi-party conference calling',
  'Music streaming passthrough',
  'FM radio integration',
  'OBD-II motorcycle diagnostics',
  'Custom wake word / voice commands',
  'Cloud speech-to-text transcription',
];

const REQUIREMENTS = [
  { label: 'Min Android SDK', value: 'API 29 (Android 10)' },
  { label: 'Target SDK', value: 'API 34 (Android 14)' },
  { label: 'ABI', value: 'arm64-v8a, armeabi-v7a' },
  { label: 'Audio latency', value: '~10ms (Oboe MMAP)' },
  { label: 'Sample rate', value: '16 kHz mono' },
  { label: 'Frame size', value: '160 samples (10ms)' },
  { label: 'NDK version', value: 'r25c+' },
  { label: 'CMake', value: '3.22.1+' },
];

export function OverviewPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs px-3 py-1.5 rounded-full font-medium">
          <Bluetooth className="w-3.5 h-3.5" />
          Android NDK · Oboe · ONNX Runtime
        </div>
        <h1 className="text-4xl font-bold text-slate-100 tracking-tight">
          Helmet Intercom
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A full-duplex Android audio bridge for motorcycle helmet communication. Routes audio through Bluetooth SCO with a complete AI-powered audio processing pipeline built in C++ using Google Oboe and RNNoise.
        </p>
      </div>

      {/* Audio Pipeline */}
      <section>
        <h2 className="text-xl font-semibold text-slate-200 mb-6">Audio Pipeline</h2>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${step.bg}`}>
                    <Icon className={`w-4 h-4 ${step.color}`} />
                    <span className={step.color}>{step.label}</span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <span className="text-slate-600 font-bold">→</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-slate-500 text-xs mt-4">
            Full-duplex pipeline running at 16kHz · 10ms frames · C++ NDK + Java audio effects
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-xl font-semibold text-slate-200 mb-6">Implemented Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center mb-3">
                  <Icon className="w-4.5 h-4.5 text-sky-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technical Requirements */}
      <section>
        <h2 className="text-xl font-semibold text-slate-200 mb-6">Technical Requirements</h2>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <tbody>
              {REQUIREMENTS.map((r, i) => (
                <tr key={i} className={`border-b border-slate-700/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-800/30'}`}>
                  <td className="px-5 py-3 text-sm text-slate-400 font-medium w-44">{r.label}</td>
                  <td className="px-5 py-3 text-sm text-slate-200 font-mono">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Removed Features */}
      <section>
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Explicitly Not Included</h2>
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
          <div className="flex flex-wrap gap-2">
            {REMOVED_FEATURES.map((f, i) => (
              <span key={i} className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full line-through">
                {f}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">
            These features were deliberately excluded to keep the codebase focused on the core audio pipeline.
          </p>
        </div>
      </section>

    </div>
  );
}
