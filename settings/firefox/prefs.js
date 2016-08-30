// Firefox Preferences
//
// https://raw.githubusercontent.com/mozilla/gecko-dev/inbound/modules/libpref/src/init/all.js
// https://raw.githubusercontent.com/mozilla/gecko-dev/inbound/browser/metro/profile/metro.js
// https://raw.githubusercontent.com/mozilla/gecko-dev/inbound/mobile/android/app/mobile.js
// https://raw.githubusercontent.com/mozilla/gecko-dev/inbound/b2g/app/b2g.js

//
// Features
//

// Audio Codecs
user_pref("media.ogg.enabled", true);
user_pref("media.opus.enabled", true);
user_pref("media.wave.enabled", true);
user_pref("media.apple.mp3.enabled", true);
user_pref("media.apple.mp4.enabled", true);

// Video Codecs
user_pref("media.raw.enabled", true);
user_pref("media.webm.enabled", true);

user_pref("media.use-blank-decoder", false);

// MediaSource
user_pref("media.mediasource.enabled", true);
user_pref("media.mediasource.allow_init_moov", true);
user_pref("media.mediasource.ignore_codec", true);
user_pref("media.mediasource.webm.enabled", true);
user_pref("media.mediasource.mp4.enabled", true);
user_pref("media.mediasource.youtubeonly", false);
user_pref("media.eme.enabled", true);

// Fragmented MP4
user_pref("media.fragmented-mp4.enabled", true);
user_pref("media.fragmented-mp4.exposed", true);
user_pref("media.fragmented-mp4.use-blank-decoder", true);
user_pref("media.fragmented-mp4.ffmpeg.enabled", true);
user_pref("media.fragmented-mp4.gmp.enabled", true);

// GMP
//user_pref("media.gmp-gmpopenh264.version", 1.1);
//user_pref("media.gmp-manager.log", false);

// Tracks
user_pref("media.track.enabled", true);

// WebVTT
user_pref("media.webvtt.enabled", true);
user_pref("media.webvtt.regions.enabled", true);

// WebRTC
user_pref("media.navigator.enabled", true);
user_pref("media.navigator.permission.disabled", true);
user_pref("media.peerconnection.enabled", true);
user_pref("media.peerconnection.video.h264_enabled", true);
user_pref("media.peerconnection.aec_enabled", true);
user_pref("media.getusermedia.aec_enabled", true);
user_pref("media.peerconnection.agc_enabled", false);
user_pref("media.getusermedia.agc_enabled", false);
user_pref("media.peerconnection.noise_enabled", false);
user_pref("media.peerconnection.identity.enabled", true);
user_pref("media.peerconnection.default_iceservers", '[{"url": "stun:23.21.150.121"}]');
user_pref("media.peerconnection.use_document_iceservers", true);
user_pref("media.webrtc.debug.log_file", "");

// WebSocket
user_pref("network.websocket.enabled", true);
user_pref("network.websocket.allowInsecureFromHTTPS", true);
user_pref("network.websocket.delay-failed-reconnects", false);

// DOM Server Sent Events
user_pref("dom.server-events.enabled", true);
user_pref("dom.server-events.default-reconnection-time", 5000);

// JAR
user_pref("network.jar.open-unsafe-types", true);

// SPDY
user_pref("network.http.spdy.enabled.v2", true);
user_pref("network.http.spdy.enabled.v3", true);
user_pref("network.http.spdy.enabled.v3-1", true);
user_pref("network.http.spdy.enabled.http2draft", true);

// ICC
user_pref("gfx.color_management.enablev4", true);
user_pref("gfx.color_management.mode", 1); // 0=off, 1=full, 2=tagged images only
user_pref("gfx.color_management.display_profile", "");
user_pref("gfx.color_management.rendering_intent", 0);

// Canvas
user_pref("gfx.canvas.azure.backends", "skia"); // cg, direct2d, skia, cairo
user_pref("gfx.canvas.azure.accelerated", true);
user_pref("canvas.hitregions.enabled", true);
user_pref("canvas.path.enabled", true);
user_pref("canvas.focusring.enabled", true);
user_pref("canvas.customfocusring.enabled", true);
user_pref("canvas.filters.enabled", true);
user_pref("canvas.capturestream.enabled", true);

// PushLayer/PopLayer
user_pref("gfx.content.use-native-pushlayer", true);

// Layers
user_pref("layers.acceleration.force-enabled", true);

// WebGL
user_pref("webgl.disabled", false);
user_pref("webgl.force-enabled", false);
user_pref("webgl.disable-angle", false);
user_pref("webgl.bypass-shader-validation", false);
user_pref("webgl.shader_validator", true);
user_pref("webgl.can-lose-context-in-foreground", true);
user_pref("webgl.lose-context-on-heap-minimize", false);
user_pref("webgl.lose-context-on-memory-pressure", false);
user_pref("webgl.force-layers-readback", false);
user_pref("webgl.prefer-16bpp", false);
user_pref("webgl.verbose", false);
user_pref("webgl.disable-angle", false);
user_pref("webgl.msaa-force", false);
user_pref("webgl.prefer-native-gl", false);
user_pref("gfx.prefer-mesa-llvmpipe", false);
user_pref("gl.multithreaded", true);

// WebGL Extensions
user_pref("webgl.enable-privileged-extensions", true);
user_pref("webgl.enable-draft-extensions", true);
user_pref("webgl.enable-prototype-webgl2", true);

// Image
user_pref("image.high_quality_downscaling.enabled", false);
user_pref("image.high_quality_downscaling.min_factor", 1000);

// DOM
user_pref("dom.image.picture.enabled", true);
user_pref("dom.image.srcset.enabled", true);
user_pref("dom.datastore.enabled", true);
user_pref("dom.experimental_forms", true);
user_pref("dom.icc.enabled", true);
user_pref("dom.fetch.enabled", true);
user_pref("dom.identity.enabled", true);
user_pref("dom.imagecapture.enabled", true);
user_pref("dom.vr.enabled", true);

// PDF.js
user_pref("pdfjs.firstRun", false);
user_pref("pdfjs.enableWebGL", true);
user_pref("pdfjs.previousHandler.alwaysAskBeforeHandling", true);
user_pref("pdfjs.previousHandler.preferredAction", 4);

// Flash
user_pref("shumway.disabled", true);
user_pref("dom.ipc.plugins.flash.disable-protected-mode", true);
user_pref("dom.ipc.plugins.flash.subprocess.crashreporter.enabled", true);

// WebSpeech
user_pref("media.webspeech.recognition.enable", true);

// WebAudio
user_pref("media.webaudio.enabled", true);
user_pref("media.audio_data.enabled", true);

// ArchiveReader
user_pref("dom.archivereader.enabled", true);

// IndexDB
user_pref("dom.indexedDB.experimental", true);


//
// Behaviour Settings
//

// Startup
user_pref("startup.homepage_welcome_url", "about:blank");
user_pref("browser.startup.homepage", "about:blank");
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("toolkit.startup.max_resumed_crashes", -1);
user_pref("browser.firstrun.show.localepicker", false);
user_pref("browser.firstrun.show.uidiscovery", false);
user_pref("extensions.showMismatchUI", false); // compatibility check

// Performance
user_pref("dom.max_script_run_time", 0);
user_pref("dom.max_chrome_script_run_time", 0);
user_pref("dom.max_child_script_run_time", 0);
user_pref("browser.sessionhistory.max_entries", 0); // keep 0 pages in history
user_pref("browser.sessionhistory.max_total_viewers", 0); // do not store any pages in memory
//user_pref("network.http.use-cache", false);

// Memory
user_pref("memory.ghost_window_timeout_seconds", 60);
user_pref("memory.free_dirty_pages", false);
user_pref("memory.dump_reports_on_oom", false);

// Debugging
user_pref("browser.dom.window.dump.enabled", true);
user_pref("view_source.wrap_long_lines", true);
user_pref("html5.offmainthread", true);

// Shutdown
user_pref("browser.warnOnQuit", false);
user_pref("browser.tabs.warnOnClose", false);
user_pref("browser.tabs.warnOnCloseOtherTabs", false);
user_pref("dom.allow_scripts_to_close_windows", true);

// Updates
user_pref("app.update.enabled", false);
user_pref("app.update.staging.enabled", false);
user_pref("browser.search.update", false);
user_pref("browser.safebrowsing.enabled", false); // phishing sites update
user_pref("browser.safebrowsing.malware.enabled", false); // malware blacklist
user_pref("extensions.update.enabled", false);
user_pref("extensions.blocklist.enabled", false); // blocklist
user_pref("extensions.getAddons.cache.enabled", false); // metadata update
user_pref("lightweightThemes.update.enabled", false); // persona update
user_pref("plugins.update.url", "");
user_pref("toolkit.telemetry.enabled", false);

// Security & Permissions
user_pref("general.warnOnAboutConfig", false);
user_pref("security.fileuri.strict_origin_policy", false);
user_pref("security.warn_submit_insecure", false);
user_pref("security.ssl.enable_false_start", true);
user_pref("browser.ssl_override_behavior", 1);
//user_pref("security.default_personal_cert", "Select Automatically");

// IPC / E10s
user_pref("browser.displayedE10SPrompt", -1);
user_pref("browser.tabs.remote.autostart", false);
user_pref("browser.tabs.remote.desktopbehavior", true);
user_pref('browser.tabs.remote.autostart', false);
user_pref('browser.tabs.remote.autostart.1', false);
user_pref('browser.tabs.remote.autostart.2', false);
user_pref("accessibility.ipc_architecture.enabled", false);
user_pref("dom.ipc.plugins.flash.subprocess.crashreporter.enabled", false);

