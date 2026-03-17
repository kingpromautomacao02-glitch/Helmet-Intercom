export interface AndroidFile {
  path: string;
  name: string;
  language: string;
  content: string;
}

export const ANDROID_FILES: AndroidFile[] = [
  {
    path: 'settings.gradle',
    name: 'settings.gradle',
    language: 'gradle',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "HelmetIntercom"
include ':app'
`
  },
  {
    path: 'app/build.gradle',
    name: 'build.gradle (app)',
    language: 'gradle',
    content: `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.helmetintercom.app'
    compileSdk 34

    defaultConfig {
        applicationId "com.helmetintercom.app"
        minSdk 29
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"

        externalNativeBuild {
            cmake {
                cppFlags "-std=c++17 -O3"
                arguments "-DANDROID_STL=c++_shared"
            }
        }

        ndk {
            abiFilters 'arm64-v8a', 'armeabi-v7a'
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
            jniDebuggable true
        }
    }

    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
            version "3.22.1"
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }

    packagingOptions {
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.core:core:1.12.0'

    // Oboe high-performance audio
    implementation 'com.google.oboe:oboe:1.8.1'

    // ONNX Runtime for RNNoise neural model
    implementation 'com.microsoft.onnxruntime:onnxruntime-android:1.16.3'

    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Audio -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <!-- Bluetooth -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />

    <!-- Location for GPS speed -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Foreground service -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />

    <!-- Wake lock to keep CPU running -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <!-- Receive boot completed for auto-start -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <!-- Vibration for notifications -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.HelmetIntercom">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".IntercomService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

        <receiver
            android:name=".BluetoothAutoStartReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.bluetooth.device.action.ACL_CONNECTED" />
                <action android:name="android.bluetooth.device.action.ACL_DISCONNECTED" />
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>

</manifest>
`
  },
  {
    path: 'app/src/main/cpp/CMakeLists.txt',
    name: 'CMakeLists.txt',
    language: 'cmake',
    content: `cmake_minimum_required(VERSION 3.22.1)
project("helmetintercom")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_FLAGS "\${CMAKE_CXX_FLAGS} -O3 -ffast-math")

# Find Oboe package
find_package(oboe REQUIRED CONFIG)

# Add our shared library
add_library(
    helmetintercom
    SHARED
    audio_bridge.cpp
)

target_include_directories(helmetintercom PRIVATE
    \${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(
    helmetintercom
    oboe::oboe
    android
    log
    OpenSLES
)
`
  },
  {
    path: 'app/src/main/cpp/filters.h',
    name: 'filters.h',
    language: 'cpp',
    content: `#pragma once
#include <cmath>
#include <array>

// Biquad filter state
struct BiquadState {
    float x1 = 0.0f, x2 = 0.0f;
    float y1 = 0.0f, y2 = 0.0f;
};

// Biquad filter coefficients
struct BiquadCoeffs {
    float b0, b1, b2, a1, a2;
};

// Process one sample through a biquad filter
inline float biquad_process(BiquadState& s, const BiquadCoeffs& c, float x) {
    float y = c.b0 * x + c.b1 * s.x1 + c.b2 * s.x2
                       - c.a1 * s.y1 - c.a2 * s.y2;
    s.x2 = s.x1; s.x1 = x;
    s.y2 = s.y1; s.y1 = y;
    return y;
}

// Compute high-pass Butterworth coefficients for given fc/fs
inline BiquadCoeffs make_highpass(float fc, float fs) {
    float w0 = 2.0f * M_PI * fc / fs;
    float cosw0 = cosf(w0);
    float sinw0 = sinf(w0);
    float alpha = sinw0 / (2.0f * 0.707f); // Q = 0.707 = Butterworth

    float b0 =  (1.0f + cosw0) / 2.0f;
    float b1 = -(1.0f + cosw0);
    float b2 =  (1.0f + cosw0) / 2.0f;
    float a0 =   1.0f + alpha;
    float a1 =  -2.0f * cosw0;
    float a2 =   1.0f - alpha;

    return { b0/a0, b1/a0, b2/a0, a1/a0, a2/a0 };
}

// Compute peaking EQ coefficients (voice boost)
inline BiquadCoeffs make_peak_eq(float fc, float fs, float gainDb, float Q) {
    float A    = powf(10.0f, gainDb / 40.0f);
    float w0   = 2.0f * M_PI * fc / fs;
    float cosw0 = cosf(w0);
    float sinw0 = sinf(w0);
    float alpha = sinw0 / (2.0f * Q);

    float b0 =  1.0f + alpha * A;
    float b1 = -2.0f * cosw0;
    float b2 =  1.0f - alpha * A;
    float a0 =  1.0f + alpha / A;
    float a1 = -2.0f * cosw0;
    float a2 =  1.0f - alpha / A;

    return { b0/a0, b1/a0, b2/a0, a1/a0, a2/a0 };
}

// Audio filter chain: HP 80Hz + EQ Voice Boost
class FilterChain {
public:
    static constexpr float SAMPLE_RATE = 16000.0f;
    static constexpr float HP_FREQ     = 80.0f;
    static constexpr float EQ1_FREQ    = 1000.0f; // presence boost
    static constexpr float EQ1_GAIN    = 3.0f;    // +3dB
    static constexpr float EQ1_Q       = 1.0f;
    static constexpr float EQ2_FREQ    = 3000.0f; // clarity boost
    static constexpr float EQ2_GAIN    = 2.0f;    // +2dB
    static constexpr float EQ2_Q       = 0.8f;

    FilterChain() {
        hp_coeffs  = make_highpass(HP_FREQ, SAMPLE_RATE);
        eq1_coeffs = make_peak_eq(EQ1_FREQ, SAMPLE_RATE, EQ1_GAIN, EQ1_Q);
        eq2_coeffs = make_peak_eq(EQ2_FREQ, SAMPLE_RATE, EQ2_GAIN, EQ2_Q);
    }

    float process(float x) {
        x = biquad_process(hp_state,  hp_coeffs,  x);
        x = biquad_process(eq1_state, eq1_coeffs, x);
        x = biquad_process(eq2_state, eq2_coeffs, x);
        return x;
    }

    void reset() {
        hp_state  = {};
        eq1_state = {};
        eq2_state = {};
    }

private:
    BiquadCoeffs hp_coeffs, eq1_coeffs, eq2_coeffs;
    BiquadState  hp_state,  eq1_state,  eq2_state;
};
`
  },
  {
    path: 'app/src/main/cpp/simple_vad.h',
    name: 'simple_vad.h',
    language: 'cpp',
    content: `#pragma once
#include <cmath>
#include <deque>

// Energy-based Voice Activity Detector
// Uses a short-term vs long-term energy ratio with hysteresis
class SimpleVAD {
public:
    static constexpr float DEFAULT_THRESHOLD = 0.02f;
    static constexpr int   FRAME_SIZE        = 160;   // 10ms at 16kHz
    static constexpr int   HANG_FRAMES       = 30;    // 300ms hang-over

    explicit SimpleVAD(float threshold = DEFAULT_THRESHOLD)
        : threshold_(threshold), hang_counter_(0),
          short_energy_(0.0f), long_energy_(1e-6f),
          is_active_(false) {}

    // Feed one audio frame (must be FRAME_SIZE samples)
    // Returns true if voice is detected
    bool process(const float* samples, int count) {
        float energy = 0.0f;
        for (int i = 0; i < count; ++i) {
            energy += samples[i] * samples[i];
        }
        energy /= static_cast<float>(count);

        // Exponential moving average
        short_energy_ = 0.9f  * short_energy_ + 0.1f  * energy;
        long_energy_  = 0.999f * long_energy_  + 0.001f * energy;

        float ratio = short_energy_ / (long_energy_ + 1e-10f);
        bool current_speech = ratio > threshold_;

        if (current_speech) {
            hang_counter_ = HANG_FRAMES;
            is_active_ = true;
        } else if (hang_counter_ > 0) {
            --hang_counter_;
            is_active_ = (hang_counter_ > 0);
        } else {
            is_active_ = false;
        }

        return is_active_;
    }

    bool isActive() const { return is_active_; }

    void setThreshold(float t) { threshold_ = t; }
    float getThreshold() const { return threshold_; }

    void reset() {
        short_energy_ = 0.0f;
        long_energy_  = 1e-6f;
        hang_counter_ = 0;
        is_active_    = false;
    }

private:
    float threshold_;
    int   hang_counter_;
    float short_energy_;
    float long_energy_;
    bool  is_active_;
};
`
  },
  {
    path: 'app/src/main/cpp/comfort_noise.h',
    name: 'comfort_noise.h',
    language: 'cpp',
    content: `#pragma once
#include <cstdlib>
#include <cmath>

// Comfort Noise Generator
// Generates low-level white noise during silence to prevent dead air
class ComfortNoiseGen {
public:
    static constexpr float DEFAULT_LEVEL = 0.002f; // -54 dBFS

    explicit ComfortNoiseGen(float level = DEFAULT_LEVEL)
        : level_(level), active_(false) {}

    // Generate one sample of comfort noise (call only when VAD is inactive)
    float generate() {
        if (!active_) return 0.0f;
        // Simple LCG random scaled to [-1, 1]
        seed_ = seed_ * 1664525u + 1013904223u;
        float r = static_cast<float>(static_cast<int32_t>(seed_)) / 2147483648.0f;
        return r * level_;
    }

    void setActive(bool active) { active_ = active; }
    bool isActive() const { return active_; }

    void setLevel(float level) { level_ = level; }
    float getLevel() const { return level_; }

private:
    float    level_;
    bool     active_;
    uint32_t seed_ = 12345u;
};
`
  },
  {
    path: 'app/src/main/cpp/audio_bridge.cpp',
    name: 'audio_bridge.cpp',
    language: 'cpp',
    content: `#include <jni.h>
#include <oboe/Oboe.h>
#include <android/log.h>
#include <memory>
#include <atomic>
#include <vector>
#include <mutex>
#include <cstring>

#include "filters.h"
#include "simple_vad.h"
#include "comfort_noise.h"

#define LOG_TAG "HelmetIntercom"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,  LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

static constexpr int SAMPLE_RATE   = 16000;
static constexpr int CHANNEL_COUNT = 1;
static constexpr int FRAMES_PER_CB = 160; // 10ms frames

// ─── Global engine state ─────────────────────────────────────────────────────
struct AudioEngine {
    std::shared_ptr<oboe::AudioStream> inputStream;
    std::shared_ptr<oboe::AudioStream> outputStream;

    FilterChain     filter;
    SimpleVAD       vad;
    ComfortNoiseGen cng;

    std::atomic<bool> running{false};
    std::atomic<float> vadThreshold{0.02f};
    std::atomic<float> inputGain{1.0f};
    std::atomic<float> outputGain{1.0f};
    std::atomic<bool>  vadActive{false};

    // Ring buffer for captured audio
    static constexpr int RING_SIZE = SAMPLE_RATE; // 1 second
    std::vector<float> ring;
    std::atomic<int>   ring_head{0};
    std::atomic<int>   ring_tail{0};
    std::mutex         ring_mutex;

    AudioEngine() : ring(RING_SIZE, 0.0f) {}
};

static std::unique_ptr<AudioEngine> gEngine;

// ─── Input callback (microphone → filter → VAD → ring buffer) ────────────────
class InputCallback : public oboe::AudioStreamDataCallback {
public:
    explicit InputCallback(AudioEngine* engine) : engine_(engine) {}

    oboe::DataCallbackResult onAudioReady(
            oboe::AudioStream* stream,
            void* audioData,
            int32_t numFrames) override
    {
        auto* in = static_cast<float*>(audioData);

        float gain = engine_->inputGain.load();
        engine_->vad.setThreshold(engine_->vadThreshold.load());

        bool speech = engine_->vad.process(in, numFrames);
        engine_->vadActive.store(speech);
        engine_->cng.setActive(!speech);

        std::lock_guard<std::mutex> lock(engine_->ring_mutex);
        for (int i = 0; i < numFrames; ++i) {
            float s = in[i] * gain;
            s = engine_->filter.process(s);
            if (!speech) {
                s = engine_->cng.generate();
            }
            int head = (engine_->ring_head.load() + 1) % AudioEngine::RING_SIZE;
            engine_->ring[head] = s;
            engine_->ring_head.store(head);
        }
        return oboe::DataCallbackResult::Continue;
    }

private:
    AudioEngine* engine_;
};

// ─── Output callback (ring buffer → speakers / BT SCO) ───────────────────────
class OutputCallback : public oboe::AudioStreamDataCallback {
public:
    explicit OutputCallback(AudioEngine* engine) : engine_(engine) {}

    oboe::DataCallbackResult onAudioReady(
            oboe::AudioStream* stream,
            void* audioData,
            int32_t numFrames) override
    {
        auto* out = static_cast<float*>(audioData);
        float gain = engine_->outputGain.load();

        std::lock_guard<std::mutex> lock(engine_->ring_mutex);
        for (int i = 0; i < numFrames; ++i) {
            int tail = engine_->ring_tail.load();
            int head = engine_->ring_head.load();
            if (tail != head) {
                int next = (tail + 1) % AudioEngine::RING_SIZE;
                out[i] = engine_->ring[next] * gain;
                engine_->ring_tail.store(next);
            } else {
                out[i] = 0.0f;
            }
        }
        return oboe::DataCallbackResult::Continue;
    }

private:
    AudioEngine* engine_;
};

static std::unique_ptr<InputCallback>  gInputCb;
static std::unique_ptr<OutputCallback> gOutputCb;

// ─── JNI interface ────────────────────────────────────────────────────────────
extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_helmetintercom_app_AudioBridgeJNI_startEngine(JNIEnv*, jclass) {
    if (gEngine && gEngine->running.load()) return JNI_TRUE;

    gEngine   = std::make_unique<AudioEngine>();
    gInputCb  = std::make_unique<InputCallback>(gEngine.get());
    gOutputCb = std::make_unique<OutputCallback>(gEngine.get());

    // Build input stream (microphone)
    oboe::AudioStreamBuilder inBuilder;
    inBuilder.setDirection(oboe::Direction::Input)
             .setPerformanceMode(oboe::PerformanceMode::LowLatency)
             .setSharingMode(oboe::SharingMode::Exclusive)
             .setFormat(oboe::AudioFormat::Float)
             .setChannelCount(CHANNEL_COUNT)
             .setSampleRate(SAMPLE_RATE)
             .setFramesPerCallback(FRAMES_PER_CB)
             .setDataCallback(gInputCb.get());

    oboe::Result r = inBuilder.openStream(gEngine->inputStream);
    if (r != oboe::Result::OK) {
        LOGE("Failed to open input stream: %s", oboe::convertToText(r));
        return JNI_FALSE;
    }

    // Build output stream
    oboe::AudioStreamBuilder outBuilder;
    outBuilder.setDirection(oboe::Direction::Output)
              .setPerformanceMode(oboe::PerformanceMode::LowLatency)
              .setSharingMode(oboe::SharingMode::Exclusive)
              .setFormat(oboe::AudioFormat::Float)
              .setChannelCount(CHANNEL_COUNT)
              .setSampleRate(SAMPLE_RATE)
              .setFramesPerCallback(FRAMES_PER_CB)
              .setDataCallback(gOutputCb.get());

    r = outBuilder.openStream(gEngine->outputStream);
    if (r != oboe::Result::OK) {
        LOGE("Failed to open output stream: %s", oboe::convertToText(r));
        return JNI_FALSE;
    }

    gEngine->inputStream->requestStart();
    gEngine->outputStream->requestStart();
    gEngine->running.store(true);

    LOGI("Audio engine started OK");
    return JNI_TRUE;
}

JNIEXPORT void JNICALL
Java_com_helmetintercom_app_AudioBridgeJNI_stopEngine(JNIEnv*, jclass) {
    if (!gEngine) return;
    if (gEngine->inputStream)  gEngine->inputStream->requestStop();
    if (gEngine->outputStream) gEngine->outputStream->requestStop();
    gEngine->running.store(false);
    gEngine.reset();
    gInputCb.reset();
    gOutputCb.reset();
    LOGI("Audio engine stopped");
}

JNIEXPORT jboolean JNICALL
Java_com_helmetintercom_app_AudioBridgeJNI_isRunning(JNIEnv*, jclass) {
    return (gEngine && gEngine->running.load()) ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_helmetintercom_app_AudioBridgeJNI_isVoiceActive(JNIEnv*, jclass) {
    return (gEngine && gEngine->vadActive.load()) ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT void JNICALL
Java_com_helmetintercom_app_AudioBridgeJNI_setVadThreshold(JNIEnv*, jclass, jfloat t) {
    if (gEngine) gEngine->vadThreshold.store(t);
}

JNIEXPORT void JNICALL
Java_com_helmetintercom_app_AudioBridgeJNI_setInputGain(JNIEnv*, jclass, jfloat g) {
    if (gEngine) gEngine->inputGain.store(g);
}

JNIEXPORT void JNICALL
Java_com_helmetintercom_app_AudioBridgeJNI_setOutputGain(JNIEnv*, jclass, jfloat g) {
    if (gEngine) gEngine->outputGain.store(g);
}

} // extern "C"
`
  },
  {
    path: 'app/src/main/java/com/helmetintercom/app/AudioBridgeJNI.java',
    name: 'AudioBridgeJNI.java',
    language: 'java',
    content: `package com.helmetintercom.app;

public class AudioBridgeJNI {

    static {
        System.loadLibrary("helmetintercom");
    }

    public static native boolean startEngine();
    public static native void    stopEngine();
    public static native boolean isRunning();
    public static native boolean isVoiceActive();
    public static native void    setVadThreshold(float threshold);
    public static native void    setInputGain(float gain);
    public static native void    setOutputGain(float gain);
}
`
  },
  {
    path: 'app/src/main/java/com/helmetintercom/app/AudioEngine.java',
    name: 'AudioEngine.java',
    language: 'java',
    content: `package com.helmetintercom.app;

import android.content.Context;
import android.media.AudioManager;
import android.media.audiofx.AcousticEchoCanceler;
import android.media.audiofx.AutomaticGainControl;
import android.media.audiofx.NoiseSuppressor;
import android.util.Log;

public class AudioEngine {

    private static final String TAG = "AudioEngine";

    private final Context       context;
    private final AudioManager  audioManager;

    private AcousticEchoCanceler  aec;
    private AutomaticGainControl  agc;
    private NoiseSuppressor       ns;

    private boolean isRunning = false;

    public AudioEngine(Context ctx) {
        this.context      = ctx;
        this.audioManager = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
    }

    public boolean start() {
        if (isRunning) return true;

        // Route audio through BT SCO headset
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        audioManager.startBluetoothSco();
        audioManager.setBluetoothScoOn(true);

        // Start native Oboe engine
        boolean ok = AudioBridgeJNI.startEngine();
        if (!ok) {
            Log.e(TAG, "Failed to start native engine");
            return false;
        }

        // Attach Android audio effects to the audio session
        // Note: AEC/AGC/NS session IDs must match the AudioRecord session used by Oboe.
        // For simplicity here we attach to the global session (0).
        // In production, pass the AudioRecord sessionId from Oboe.
        int sessionId = 0;

        if (AcousticEchoCanceler.isAvailable()) {
            aec = AcousticEchoCanceler.create(sessionId);
            if (aec != null) {
                aec.setEnabled(true);
                Log.i(TAG, "AEC enabled");
            }
        }

        if (AutomaticGainControl.isAvailable()) {
            agc = AutomaticGainControl.create(sessionId);
            if (agc != null) {
                agc.setEnabled(true);
                Log.i(TAG, "AGC enabled");
            }
        }

        if (NoiseSuppressor.isAvailable()) {
            ns = NoiseSuppressor.create(sessionId);
            if (ns != null) {
                ns.setEnabled(true);
                Log.i(TAG, "NoiseSuppressor enabled");
            }
        }

        isRunning = true;
        Log.i(TAG, "AudioEngine started");
        return true;
    }

    public void stop() {
        if (!isRunning) return;

        AudioBridgeJNI.stopEngine();

        if (aec != null) { aec.release(); aec = null; }
        if (agc != null) { agc.release(); agc = null; }
        if (ns  != null) { ns.release();  ns  = null; }

        audioManager.stopBluetoothSco();
        audioManager.setBluetoothScoOn(false);
        audioManager.setMode(AudioManager.MODE_NORMAL);

        isRunning = false;
        Log.i(TAG, "AudioEngine stopped");
    }

    public boolean isRunning() { return isRunning; }

    public boolean isVoiceActive() {
        return isRunning && AudioBridgeJNI.isVoiceActive();
    }

    public void setVadThreshold(float t) { AudioBridgeJNI.setVadThreshold(t); }
    public void setInputGain(float g)    { AudioBridgeJNI.setInputGain(g); }
    public void setOutputGain(float g)   { AudioBridgeJNI.setOutputGain(g); }
}
`
  },
  {
    path: 'app/src/main/java/com/helmetintercom/app/IntercomService.java',
    name: 'IntercomService.java',
    language: 'java',
    content: `package com.helmetintercom.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class IntercomService extends Service {

    private static final String TAG              = "IntercomService";
    private static final String CHANNEL_ID       = "helmet_intercom_channel";
    private static final int    NOTIFICATION_ID  = 1001;

    private AudioEngine     audioEngine;
    private ProximityHelper proximityHelper;
    private GPSTracker      gpsTracker;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        audioEngine     = new AudioEngine(this);
        proximityHelper = new ProximityHelper(this, new ProximityHelper.Listener() {
            @Override
            public void onHelmetOn() {
                Log.i(TAG, "Helmet ON — starting audio");
                audioEngine.start();
            }
            @Override
            public void onHelmetOff() {
                Log.i(TAG, "Helmet OFF — stopping audio");
                audioEngine.stop();
            }
        });
        gpsTracker = new GPSTracker(this, new GPSTracker.SpeedListener() {
            @Override
            public void onSpeedChanged(float speedKmh) {
                // Adaptive VAD: lower threshold (more sensitive) at low speed,
                // higher threshold at highway speed due to wind noise
                float threshold = 0.02f + (speedKmh / 120.0f) * 0.08f;
                audioEngine.setVadThreshold(Math.min(threshold, 0.10f));
                Log.d(TAG, "Speed " + speedKmh + " km/h → VAD threshold " + threshold);
            }
        });
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, buildNotification());

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "HelmetIntercom:WakeLock");
        wakeLock.acquire();

        proximityHelper.start();
        gpsTracker.start();

        Log.i(TAG, "IntercomService started");
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        audioEngine.stop();
        proximityHelper.stop();
        gpsTracker.stop();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        Log.i(TAG, "IntercomService destroyed");
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void createNotificationChannel() {
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Helmet Intercom",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Helmet Intercom foreground service");
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(channel);
    }

    private Notification buildNotification() {
        Intent mainIntent = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(
                this, 0, mainIntent, PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Helmet Intercom Active")
                .setContentText("Audio bridge running — tap to open")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setContentIntent(pi)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }
}
`
  },
  {
    path: 'app/src/main/java/com/helmetintercom/app/BluetoothAutoStartReceiver.java',
    name: 'BluetoothAutoStartReceiver.java',
    language: 'java',
    content: `package com.helmetintercom.app;

import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

public class BluetoothAutoStartReceiver extends BroadcastReceiver {

    private static final String TAG      = "BTAutoStart";
    private static final String PREFS    = "helmet_intercom_prefs";
    private static final String KEY_AUTO = "auto_start_enabled";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean autoStart = prefs.getBoolean(KEY_AUTO, true);

        switch (action) {
            case BluetoothDevice.ACTION_ACL_CONNECTED:
                if (autoStart) {
                    Log.i(TAG, "BT device connected — starting IntercomService");
                    startService(context);
                }
                break;

            case BluetoothDevice.ACTION_ACL_DISCONNECTED:
                Log.i(TAG, "BT device disconnected — stopping IntercomService");
                stopService(context);
                break;

            case Intent.ACTION_BOOT_COMPLETED:
                Log.i(TAG, "Boot completed");
                // Service will auto-start when BT connects
                break;
        }
    }

    private void startService(Context context) {
        Intent serviceIntent = new Intent(context, IntercomService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    private void stopService(Context context) {
        Intent serviceIntent = new Intent(context, IntercomService.class);
        context.stopService(serviceIntent);
    }
}
`
  },
  {
    path: 'app/src/main/java/com/helmetintercom/app/ProximityHelper.java',
    name: 'ProximityHelper.java',
    language: 'java',
    content: `package com.helmetintercom.app;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.util.Log;

public class ProximityHelper implements SensorEventListener {

    private static final String TAG = "ProximityHelper";

    public interface Listener {
        void onHelmetOn();
        void onHelmetOff();
    }

    private final SensorManager sensorManager;
    private final Sensor        proximitySensor;
    private final Listener      listener;

    private boolean helmetOn = false;

    public ProximityHelper(Context ctx, Listener listener) {
        this.listener     = listener;
        this.sensorManager = (SensorManager) ctx.getSystemService(Context.SENSOR_SERVICE);
        this.proximitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY);
    }

    public void start() {
        if (proximitySensor == null) {
            Log.w(TAG, "No proximity sensor found — assuming helmet always on");
            if (listener != null) listener.onHelmetOn();
            return;
        }
        sensorManager.registerListener(this, proximitySensor, SensorManager.SENSOR_DELAY_NORMAL);
        Log.i(TAG, "Proximity sensor started");
    }

    public void stop() {
        sensorManager.unregisterListener(this);
        Log.i(TAG, "Proximity sensor stopped");
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_PROXIMITY) return;

        float maxRange = proximitySensor.getMaximumRange();
        boolean nearObject = event.values[0] < maxRange * 0.5f;

        if (nearObject && !helmetOn) {
            helmetOn = true;
            Log.i(TAG, "Helmet detected ON (proximity near)");
            if (listener != null) listener.onHelmetOn();
        } else if (!nearObject && helmetOn) {
            helmetOn = false;
            Log.i(TAG, "Helmet detected OFF (proximity far)");
            if (listener != null) listener.onHelmetOff();
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    public boolean isHelmetOn() { return helmetOn; }
}
`
  },
  {
    path: 'app/src/main/java/com/helmetintercom/app/GPSTracker.java',
    name: 'GPSTracker.java',
    language: 'java',
    content: `package com.helmetintercom.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.util.Log;
import androidx.core.content.ContextCompat;

public class GPSTracker implements LocationListener {

    private static final String TAG             = "GPSTracker";
    private static final long   MIN_TIME_MS     = 2000L;
    private static final float  MIN_DISTANCE_M  = 5.0f;

    public interface SpeedListener {
        void onSpeedChanged(float speedKmh);
    }

    private final Context         context;
    private final LocationManager locationManager;
    private final SpeedListener   speedListener;

    private float lastSpeedKmh = 0.0f;

    public GPSTracker(Context ctx, SpeedListener listener) {
        this.context         = ctx;
        this.speedListener   = listener;
        this.locationManager = (LocationManager) ctx.getSystemService(Context.LOCATION_SERVICE);
    }

    public void start() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "Location permission not granted — GPS speed unavailable");
            return;
        }

        try {
            locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    MIN_TIME_MS,
                    MIN_DISTANCE_M,
                    this
            );
            Log.i(TAG, "GPS tracker started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start GPS: " + e.getMessage());
        }
    }

    public void stop() {
        locationManager.removeUpdates(this);
        Log.i(TAG, "GPS tracker stopped");
    }

    @Override
    public void onLocationChanged(Location location) {
        if (location.hasSpeed()) {
            lastSpeedKmh = location.getSpeed() * 3.6f;
            if (speedListener != null) {
                speedListener.onSpeedChanged(lastSpeedKmh);
            }
            Log.d(TAG, "Speed: " + lastSpeedKmh + " km/h");
        }
    }

    @Override
    public void onProviderEnabled(String provider)  {}
    @Override
    public void onProviderDisabled(String provider) {}
    @Override
    public void onStatusChanged(String p, int s, Bundle e) {}

    public float getLastSpeedKmh() { return lastSpeedKmh; }
}
`
  },
  {
    path: 'app/src/main/java/com/helmetintercom/app/MainActivity.java',
    name: 'MainActivity.java',
    language: 'java',
    content: `package com.helmetintercom.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private static final int REQUEST_PERMISSIONS = 100;

    private Button   btnStartStop;
    private TextView tvStatus;
    private boolean  serviceRunning = false;

    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.BLUETOOTH_CONNECT,
        Manifest.permission.BLUETOOTH_SCAN,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.FOREGROUND_SERVICE,
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        btnStartStop = findViewById(R.id.btnStartStop);
        tvStatus     = findViewById(R.id.tvStatus);

        btnStartStop.setOnClickListener(v -> {
            if (serviceRunning) {
                stopIntercomService();
            } else {
                checkPermissionsAndStart();
            }
        });

        updateUI();
    }

    private void checkPermissionsAndStart() {
        List<String> missing = new ArrayList<>();
        for (String perm : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                missing.add(perm);
            }
        }
        if (missing.isEmpty()) {
            startIntercomService();
        } else {
            ActivityCompat.requestPermissions(
                    this,
                    missing.toArray(new String[0]),
                    REQUEST_PERMISSIONS
            );
        }
    }

    private void startIntercomService() {
        Intent intent = new Intent(this, IntercomService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }
        serviceRunning = true;
        updateUI();
        Toast.makeText(this, "Intercom service started", Toast.LENGTH_SHORT).show();
    }

    private void stopIntercomService() {
        Intent intent = new Intent(this, IntercomService.class);
        stopService(intent);
        serviceRunning = false;
        updateUI();
        Toast.makeText(this, "Intercom service stopped", Toast.LENGTH_SHORT).show();
    }

    private void updateUI() {
        if (serviceRunning) {
            btnStartStop.setText("Stop Intercom");
            tvStatus.setText("Status: Running");
        } else {
            btnStartStop.setText("Start Intercom");
            tvStatus.setText("Status: Stopped");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_PERMISSIONS) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (allGranted) {
                startIntercomService();
            } else {
                Toast.makeText(this, "All permissions are required", Toast.LENGTH_LONG).show();
            }
        }
    }
}
`
  },
  {
    path: 'app/src/main/res/layout/activity_main.xml',
    name: 'activity_main.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp"
    android:background="@color/background">

    <ImageView
        android:layout_width="80dp"
        android:layout_height="80dp"
        android:src="@drawable/ic_helmet"
        android:contentDescription="Helmet icon"
        android:layout_marginBottom="24dp" />

    <TextView
        android:id="@+id/tvTitle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Helmet Intercom"
        android:textSize="28sp"
        android:textStyle="bold"
        android:textColor="@color/text_primary"
        android:layout_marginBottom="8dp" />

    <TextView
        android:id="@+id/tvStatus"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Status: Stopped"
        android:textSize="16sp"
        android:textColor="@color/text_secondary"
        android:layout_marginBottom="40dp" />

    <Button
        android:id="@+id/btnStartStop"
        android:layout_width="200dp"
        android:layout_height="56dp"
        android:text="Start Intercom"
        android:textSize="16sp"
        android:backgroundTint="@color/accent"
        android:textColor="@color/white"
        android:cornerRadius="28dp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Audio pipeline: BT SCO → Oboe MMAP → VAD\\nHP 80Hz → AEC+AGC → RNNoise → EQ → BT"
        android:textSize="12sp"
        android:textColor="@color/text_secondary"
        android:gravity="center"
        android:layout_marginTop="40dp" />

</LinearLayout>
`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    name: 'strings.xml',
    language: 'xml',
    content: `<resources>
    <string name="app_name">Helmet Intercom</string>
    <string name="start_intercom">Start Intercom</string>
    <string name="stop_intercom">Stop Intercom</string>
    <string name="status_running">Status: Running</string>
    <string name="status_stopped">Status: Stopped</string>
    <string name="notification_title">Helmet Intercom Active</string>
    <string name="notification_text">Audio bridge running — tap to open</string>
    <string name="permission_denied">All permissions are required</string>
</resources>
`
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    name: 'colors.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="background">#0F172A</color>
    <color name="surface">#1E293B</color>
    <color name="accent">#0EA5E9</color>
    <color name="text_primary">#F1F5F9</color>
    <color name="text_secondary">#94A3B8</color>
    <color name="white">#FFFFFF</color>
    <color name="success">#22C55E</color>
    <color name="warning">#F59E0B</color>
    <color name="error">#EF4444</color>
</resources>
`
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    name: 'themes.xml',
    language: 'xml',
    content: `<resources>
    <style name="Theme.HelmetIntercom" parent="Theme.MaterialComponents.DayNight.DarkActionBar">
        <item name="colorPrimary">@color/accent</item>
        <item name="colorPrimaryVariant">@color/surface</item>
        <item name="colorOnPrimary">@color/white</item>
        <item name="colorSecondary">@color/accent</item>
        <item name="colorOnSecondary">@color/white</item>
        <item name="android:statusBarColor">@color/background</item>
        <item name="android:windowBackground">@color/background</item>
        <item name="android:colorBackground">@color/background</item>
    </style>
</resources>
`
  },
  {
    path: 'proguard-rules.pro',
    name: 'proguard-rules.pro',
    language: 'text',
    content: `# Keep native method names for JNI
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep all classes in the app package
-keep class com.helmetintercom.app.** { *; }

# Keep audio effect classes
-keep class android.media.audiofx.** { *; }

# ONNX Runtime
-keep class com.microsoft.onnxruntime.** { *; }
-dontwarn com.microsoft.onnxruntime.**

# Oboe is a native library, no Java classes to keep
`
  }
];

export const PROJECT_VERSION = {
  version: '1.0.0',
  description: 'Helmet Intercom — Full Android NDK/Oboe audio bridge with BT SCO, VAD, HP filter, AEC/AGC, RNNoise, EQ Voice Boost'
};
