import { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  commands?: string[];
  notes?: string[];
  warning?: string;
}

interface Section {
  id: string;
  title: string;
  steps: Step[];
}

const SECTIONS: Section[] = [
  {
    id: 'install',
    title: '1. Install Android Studio & SDK Tools',
    steps: [
      {
        number: 1,
        title: 'Download Android Studio',
        description: 'Download and install Android Studio Hedgehog (2023.1.1) or newer from the official Android developer site.',
        notes: [
          'Choose the version for your OS (Windows / macOS / Linux)',
          'During installation, accept all default settings',
          'Android Studio includes the Java Development Kit (JDK)',
        ],
      },
      {
        number: 2,
        title: 'Install NDK and CMake via SDK Manager',
        description: 'Open Android Studio → File → Project Structure → SDK Location. Then go to SDK Tools tab.',
        notes: [
          'Check "NDK (Side by side)" — install version 25.2.9519653 or newer',
          'Check "CMake" — install version 3.22.1',
          'Click Apply and wait for the download to complete',
        ],
      },
      {
        number: 3,
        title: 'Create a new Native C++ project',
        description: 'File → New → New Project → select "Native C++" template.',
        notes: [
          'Package name: com.helmetintercom.app',
          'Minimum SDK: API 29 (Android 10.0)',
          'Language: Java',
          'C++ Standard: C++17',
        ],
      },
    ],
  },
  {
    id: 'gradle',
    title: '2. Configure Gradle Dependencies',
    steps: [
      {
        number: 4,
        title: 'Replace app/build.gradle',
        description: 'Open app/build.gradle in Android Studio and replace its contents with the build.gradle file shown in the Files tab. This adds Oboe, ONNX Runtime, and configures NDK ABI filters.',
        notes: [
          'Oboe: com.google.oboe:oboe:1.8.1',
          'ONNX Runtime: com.microsoft.onnxruntime:onnxruntime-android:1.16.3',
          'ABI filters: arm64-v8a and armeabi-v7a only',
          'CMake path: src/main/cpp/CMakeLists.txt',
        ],
      },
      {
        number: 5,
        title: 'Sync Gradle',
        description: 'Click "Sync Now" in the yellow bar at the top of Android Studio, or go to File → Sync Project with Gradle Files.',
        notes: [
          'This will download Oboe and ONNX Runtime libraries',
          'May take 2–5 minutes on first sync',
          'Ensure you have a working internet connection',
        ],
        warning: 'If sync fails, check that Google Maven is accessible. Try File → Invalidate Caches and restart.',
      },
    ],
  },
  {
    id: 'copyfiles',
    title: '3. Copy Source Files into the Project',
    steps: [
      {
        number: 6,
        title: 'Copy C++ / NDK source files',
        description: 'In Android Studio file tree, expand app/src/main/cpp/. Copy the following files from the Files tab:',
        notes: [
          'CMakeLists.txt → app/src/main/cpp/CMakeLists.txt',
          'filters.h → app/src/main/cpp/filters.h',
          'simple_vad.h → app/src/main/cpp/simple_vad.h',
          'comfort_noise.h → app/src/main/cpp/comfort_noise.h',
          'audio_bridge.cpp → app/src/main/cpp/audio_bridge.cpp',
        ],
      },
      {
        number: 7,
        title: 'Copy Java source files',
        description: 'Navigate to app/src/main/java/com/helmetintercom/app/ and copy all Java files:',
        notes: [
          'AudioBridgeJNI.java — JNI bridge (must exactly match C++ extern "C" symbol names)',
          'AudioEngine.java — Java audio session + AEC/AGC setup',
          'IntercomService.java — ForegroundService with microphone type',
          'BluetoothAutoStartReceiver.java — auto-start on BT connect',
          'ProximityHelper.java — proximity sensor for helmet on/off',
          'GPSTracker.java — GPS speed for adaptive VAD',
          'MainActivity.java — main UI',
        ],
      },
      {
        number: 8,
        title: 'Copy resource files',
        description: 'Copy the res/ files into app/src/main/res/:',
        notes: [
          'layout/activity_main.xml',
          'values/strings.xml',
          'values/colors.xml',
          'values/themes.xml',
        ],
      },
      {
        number: 9,
        title: 'Replace AndroidManifest.xml',
        description: 'Replace the default AndroidManifest.xml in app/src/main/ with the one from the Files tab. It includes all required permissions for BT, audio, location, and foreground service.',
        warning: 'The foregroundServiceType="microphone" attribute is required for Android 14+. Without it the service will crash on API 34.',
      },
    ],
  },
  {
    id: 'onnx',
    title: '4. Integrate RNNoise ONNX Model',
    steps: [
      {
        number: 10,
        title: 'Download the RNNoise ONNX model',
        description: 'The RNNoise model must be converted to ONNX format and placed in the assets folder.',
        commands: [
          '# Option A: use a pre-converted model from GitHub',
          'git clone https://github.com/xiph/rnnoise',
          'pip install torch onnx',
          '# Then use the provided export script (see rnnoise/export_onnx.py)',
          '',
          '# Option B: download a community-converted model',
          '# Search "rnnoise.onnx" on Hugging Face or GitHub Releases',
        ],
        notes: [
          'Expected input: float32 tensor of shape [1, 480] (30ms @ 16kHz)',
          'Expected output: float32 tensor (noise gate mask)',
          'Place the file at: app/src/main/assets/rnnoise.onnx',
        ],
      },
      {
        number: 11,
        title: 'Load model in AudioEngine.java (optional integration)',
        description: 'The current codebase has the RNNoise model as a stub. To fully integrate, add this ONNX session loading code to AudioEngine.java:',
        commands: [
          '// In AudioEngine constructor:',
          'OrtEnvironment env = OrtEnvironment.getEnvironment();',
          'OrtSession.SessionOptions opts = new OrtSession.SessionOptions();',
          'byte[] modelBytes = loadAsset(context, "rnnoise.onnx");',
          'OrtSession session = env.createSession(modelBytes, opts);',
          '',
          '// Run inference (call for each 30ms frame):',
          'OnnxTensor input = OnnxTensor.createTensor(env, audioFrame);',
          'OrtSession.Result result = session.run(',
          '    Collections.singletonMap("input", input));',
          'float[] mask = (float[]) result.get(0).getValue();',
        ],
      },
    ],
  },
  {
    id: 'battery',
    title: '5. Battery Optimization & Background Execution',
    steps: [
      {
        number: 12,
        title: 'Whitelist app from battery optimization',
        description: 'For the IntercomService to keep running in the background reliably, the app must be excluded from battery optimization.',
        notes: [
          'Android Settings → Apps → Helmet Intercom → Battery → Unrestricted',
          'Or add this to your onboarding flow in MainActivity.java:',
        ],
        commands: [
          'Intent intent = new Intent();',
          'String pkg = getPackageName();',
          'PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);',
          'if (!pm.isIgnoringBatteryOptimizations(pkg)) {',
          '    intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);',
          '    intent.setData(Uri.parse("package:" + pkg));',
          '    startActivity(intent);',
          '}',
        ],
      },
      {
        number: 13,
        title: 'Add SCHEDULE_EXACT_ALARM permission (Android 12+)',
        description: 'If you need precise wake-up scheduling, also add to AndroidManifest.xml:',
        commands: [
          '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />',
          '<uses-permission android:name="android.permission.USE_EXACT_ALARM" />',
        ],
        notes: [
          'Not strictly required for the current implementation',
          'Only needed if you add timed reconnection logic',
        ],
      },
    ],
  },
  {
    id: 'build',
    title: '6. Build & Deploy the APK',
    steps: [
      {
        number: 14,
        title: 'Build debug APK',
        description: 'In Android Studio toolbar: Build → Build Bundle(s) / APK(s) → Build APK(s)',
        commands: [
          '# Or from command line in project root:',
          './gradlew assembleDebug',
          '',
          '# Output will be at:',
          'app/build/outputs/apk/debug/app-debug.apk',
        ],
        notes: [
          'First build takes longest due to C++ compilation',
          'Subsequent builds are faster due to incremental compilation',
        ],
      },
      {
        number: 15,
        title: 'Build release APK',
        description: 'For a signed release APK you need a keystore. Generate one then build:',
        commands: [
          '# Generate keystore',
          'keytool -genkey -v -keystore helmet_intercom.jks \\',
          '  -alias helmet -keyalg RSA -keysize 2048 -validity 10000',
          '',
          '# Add to app/build.gradle signingConfigs block,',
          '# then build:',
          './gradlew assembleRelease',
          '',
          '# Output:',
          'app/build/outputs/apk/release/app-release.apk',
        ],
        warning: 'Keep your keystore file safe. If lost, you cannot update the app on devices that have it installed.',
      },
      {
        number: 16,
        title: 'Install on device via ADB',
        description: 'Enable Developer Options and USB Debugging on your Android device, then:',
        commands: [
          '# Install debug build',
          'adb install app/build/outputs/apk/debug/app-debug.apk',
          '',
          '# Grant audio and location permissions automatically',
          'adb shell pm grant com.helmetintercom.app android.permission.RECORD_AUDIO',
          'adb shell pm grant com.helmetintercom.app android.permission.ACCESS_FINE_LOCATION',
          'adb shell pm grant com.helmetintercom.app android.permission.BLUETOOTH_CONNECT',
          '',
          '# View live logs',
          'adb logcat -s "HelmetIntercom" "AudioEngine" "IntercomService" "BTAutoStart"',
        ],
      },
    ],
  },
];

function CodeBlock({ lines }: { lines: string[] }) {
  const [copied, setCopied] = useState(false);
  const text = lines.join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group bg-slate-950 border border-slate-700 rounded-lg overflow-hidden mt-3">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500">code</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto">
        <code className="text-xs text-slate-300 font-mono leading-relaxed">
          {lines.map((line, i) => (
            <div key={i}>
              {line.startsWith('#') || line.startsWith('//')
                ? <span className="text-slate-600">{line}</span>
                : <span>{line}</span>}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function StepCard({ step }: { step: Step }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-sky-400">{step.number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-200 mb-1.5">{step.title}</h4>
          <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>

          {step.notes && step.notes.length > 0 && (
            <ul className="mt-3 space-y-1">
              {step.notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500/60 flex-shrink-0 mt-0.5" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}

          {step.commands && <CodeBlock lines={step.commands} />}

          {step.warning && (
            <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">{step.warning}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionAccordion({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-800/60 hover:bg-slate-800/80 transition-colors text-left"
      >
        <span className="text-base font-semibold text-slate-200">{section.title}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />}
      </button>
      {open && (
        <div className="p-5 space-y-4 bg-slate-900/40">
          {section.steps.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SetupPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-100">Setup Guide</h1>
        <p className="text-slate-400 leading-relaxed">
          Complete step-by-step instructions to build the Helmet Intercom APK in Android Studio. All source files are available in the <strong className="text-slate-300">Files</strong> tab above.
        </p>
      </div>

      {/* Quick requirements */}
      <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 flex flex-wrap gap-4">
        {[
          'Android Studio Hedgehog+',
          'NDK r25c+',
          'CMake 3.22.1',
          'Java 11',
          'Android 10+ device',
        ].map((req) => (
          <div key={req} className="flex items-center gap-1.5 text-sm text-sky-300">
            <CheckCircle className="w-4 h-4 text-sky-500" />
            {req}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <SectionAccordion key={section.id} section={section} />
        ))}
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-center">
        <p className="text-sm text-slate-400">
          All source files are available in the <strong className="text-slate-200">Files</strong> tab.
          Use the <strong className="text-slate-200">Copy</strong> button on each file to copy its contents,
          then paste into Android Studio.
        </p>
      </div>
    </div>
  );
}
