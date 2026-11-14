package com.loyacreativelab.scope;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.SurfaceTexture;
import android.hardware.usb.UsbDevice;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.view.Gravity;
import android.view.Surface;
import android.view.TextureView;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.herohan.uvcapp.CameraHelper;
import com.herohan.uvcapp.ICameraHelper;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "LoyaScopeNative";
    private static final int PERMISSION_REQ_CODE = 1001;
    private static final String TARGET_URL = "https://loyacreativelab.com/scope";

    private WebView mWebView;
    private TextureView mUvcTextureView;
    private Surface mUvcSurface;
    private ICameraHelper mCameraHelper;

    private final AtomicBoolean mIsUvcStreaming = new AtomicBoolean(false);
    private final AtomicReference<String> mUvcDeviceName = new AtomicReference<>("");
    private final AtomicReference<byte[]> mLatestJpegFrame = new AtomicReference<>(null);

    private final Handler mMainHandler = new Handler(Looper.getMainLooper());
    private Runnable mFrameGrabRunnable;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        requestNeededPermissions();

        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.parseColor("#050608"));

        // 1. Hardware TextureView in background to receive USB-C UVC Surface stream
        mUvcTextureView = new TextureView(this);
        FrameLayout.LayoutParams tvParams = new FrameLayout.LayoutParams(1280, 720, Gravity.CENTER);
        mUvcTextureView.setLayoutParams(tvParams);
        mUvcTextureView.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
            @Override
            public void onSurfaceTextureAvailable(@NonNull SurfaceTexture surfaceTexture, int width, int height) {
                mUvcSurface = new Surface(surfaceTexture);
                if (mCameraHelper != null) {
                    mCameraHelper.addSurface(mUvcSurface, false);
                }
            }

            @Override
            public void onSurfaceTextureSizeChanged(@NonNull SurfaceTexture surfaceTexture, int width, int height) {}

            @Override
            public boolean onSurfaceTextureDestroyed(@NonNull SurfaceTexture surfaceTexture) {
                if (mCameraHelper != null && mUvcSurface != null) {
                    mCameraHelper.removeSurface(mUvcSurface);
                }
                if (mUvcSurface != null) {
                    mUvcSurface.release();
                    mUvcSurface = null;
                }
                return true;
            }

            @Override
            public void onSurfaceTextureUpdated(@NonNull SurfaceTexture surfaceTexture) {}
        });
        rootLayout.addView(mUvcTextureView);

        // 2. Full-screen WebView on top
        mWebView = new WebView(this);
        mWebView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        mWebView.setBackgroundColor(Color.parseColor("#050608"));

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        mWebView.addJavascriptInterface(new LoyaScopeJsBridge(), "LoyaScopeAndroid");

        // Grant WebRTC Camera & Microphone permissions inside the APK WebView!
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    try {
                        request.grant(request.getResources());
                    } catch (Exception e) {
                        Log.e(TAG, "Permission grant error", e);
                    }
                });
            }
        });

        // Intercept /__uvc_frame.jpg to stream high-speed in-memory JPEG frames from USB-C UVC camera
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri != null && uri.getPath() != null && uri.getPath().endsWith("/__uvc_frame.jpg")) {
                    byte[] jpeg = mLatestJpegFrame.get();
                    if (jpeg != null && jpeg.length > 0) {
                        Map<String, String> headers = new HashMap<>();
                        headers.put("Access-Control-Allow-Origin", "*");
                        headers.put("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
                        return new WebResourceResponse(
                                "image/jpeg",
                                "UTF-8",
                                200,
                                "OK",
                                headers,
                                new ByteArrayInputStream(jpeg)
                        );
                    } else {
                        return new WebResourceResponse("text/plain", "UTF-8", 204, "No Content", null, new ByteArrayInputStream(new byte[0]));
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                notifyWebUsbState();
            }
        });

        rootLayout.addView(mWebView);
        setContentView(rootLayout);

        initUvcCameraHelper();
        startFrameGrabLoop();

        mWebView.loadUrl(TARGET_URL);
    }

    private void initUvcCameraHelper() {
        try {
            mCameraHelper = new CameraHelper();
            mCameraHelper.setStateCallback(new ICameraHelper.StateCallback() {
                @Override
                public void onAttach(UsbDevice device) {
                    Log.d(TAG, "USB Device attached: " + device.getDeviceName());
                    mCameraHelper.selectDevice(device);
                }

                @Override
                public void onDeviceOpen(UsbDevice device, boolean isFirstOpen) {
                    Log.d(TAG, "USB Device opened: " + device.getDeviceName());
                    mCameraHelper.openCamera();
                }

                @Override
                public void onCameraOpen(UsbDevice device) {
                    Log.d(TAG, "UVC Camera open: " + device.getDeviceName());
                    mCameraHelper.startPreview();
                    if (mUvcSurface != null) {
                        mCameraHelper.addSurface(mUvcSurface, false);
                    }
                    String label = device.getProductName() != null
                            ? device.getProductName()
                            : "Cámara USB-C UVC (" + device.getVendorId() + ":" + device.getProductId() + ")";
                    mUvcDeviceName.set(label);
                    mIsUvcStreaming.set(true);
                    notifyWebUsbState();
                }

                @Override
                public void onCameraClose(UsbDevice device) {
                    mIsUvcStreaming.set(false);
                    notifyWebUsbState();
                }

                @Override
                public void onDeviceClose(UsbDevice device) {
                    mIsUvcStreaming.set(false);
                    notifyWebUsbState();
                }

                @Override
                public void onDetach(UsbDevice device) {
                    mIsUvcStreaming.set(false);
                    mUvcDeviceName.set("");
                    notifyWebUsbState();
                }

                @Override
                public void onCancel(UsbDevice device) {
                    mIsUvcStreaming.set(false);
                    notifyWebUsbState();
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Failed to init UVC CameraHelper", e);
        }
    }

    private void startFrameGrabLoop() {
        mFrameGrabRunnable = new Runnable() {
            @Override
            public void run() {
                if (mIsUvcStreaming.get() && mUvcTextureView != null && mUvcTextureView.isAvailable()) {
                    try {
                        Bitmap bmp = mUvcTextureView.getBitmap();
                        if (bmp != null) {
                            ByteArrayOutputStream baos = new ByteArrayOutputStream();
                            bmp.compress(Bitmap.CompressFormat.JPEG, 85, baos);
                            mLatestJpegFrame.set(baos.toByteArray());
                            bmp.recycle();
                        }
                    } catch (Exception ignored) {}
                }
                mMainHandler.postDelayed(this, 33); // ~30 FPS
            }
        };
        mMainHandler.post(mFrameGrabRunnable);
    }

    private void notifyWebUsbState() {
        runOnUiThread(() -> {
            if (mWebView == null) return;
            boolean connected = mIsUvcStreaming.get();
            String safeName = mUvcDeviceName.get().replace("'", "\\'");
            String js = "if (window.onLoyaNativeUsbUpdate) { window.onLoyaNativeUsbUpdate("
                    + connected + ", '" + safeName + "'); }";
            mWebView.evaluateJavascript(js, null);
        });
    }

    public class LoyaScopeJsBridge {
        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }

        @JavascriptInterface
        public boolean isUsbCameraConnected() {
            return mIsUvcStreaming.get();
        }

        @JavascriptInterface
        public String getUsbCameraName() {
            return mUvcDeviceName.get();
        }

        @JavascriptInterface
        public void rescanUsbCamera() {
            runOnUiThread(() -> {
                if (mCameraHelper != null) {
                    List<UsbDevice> list = mCameraHelper.getDeviceList();
                    if (list != null && !list.isEmpty()) {
                        mCameraHelper.selectDevice(list.get(0));
                        Toast.makeText(MainActivity.this, "Conectando cámara USB-C...", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(MainActivity.this, "No se detectó cámara en el puerto USB-C (verifica OTG)", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public boolean saveToGallery(String base64Data, String filename, String mimeType) {
            try {
                String cleanBase64 = base64Data;
                int commaIndex = cleanBase64.indexOf(',');
                if (commaIndex != -1) {
                    cleanBase64 = cleanBase64.substring(commaIndex + 1);
                }
                byte[] bytes = Base64.decode(cleanBase64, Base64.DEFAULT);
                boolean isVideo = mimeType != null && mimeType.startsWith("video");

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver resolver = getContentResolver();
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DCIM + "/LoyaScope");

                    Uri collection = isVideo
                            ? MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                            : MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);

                    Uri itemUri = resolver.insert(collection, values);
                    if (itemUri != null) {
                        try (OutputStream os = resolver.openOutputStream(itemUri)) {
                            if (os != null) {
                                os.write(bytes);
                                os.flush();
                            }
                        }
                    }
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM), "LoyaScope");
                    if (!dir.exists()) {
                        dir.mkdirs();
                    }
                    File outFile = new File(dir, filename);
                    try (FileOutputStream fos = new FileOutputStream(outFile)) {
                        fos.write(bytes);
                        fos.flush();
                    }
                    MediaScannerConnection.scanFile(
                            MainActivity.this,
                            new String[]{outFile.getAbsolutePath()},
                            new String[]{mimeType},
                            null
                    );
                }

                runOnUiThread(() -> Toast.makeText(
                        MainActivity.this,
                        (isVideo ? "Video guardado" : "Foto guardada") + " en Galería (DCIM/LoyaScope)",
                        Toast.LENGTH_SHORT
                ).show());
                return true;
            } catch (Exception e) {
                Log.e(TAG, "Error saving to gallery", e);
                runOnUiThread(() -> Toast.makeText(
                        MainActivity.this,
                        "Error al guardar en galería: " + e.getMessage(),
                        Toast.LENGTH_LONG
                ).show());
                return false;
            }
        }
    }

    private void requestNeededPermissions() {
        List<String> perms = new ArrayList<>();
        perms.add(Manifest.permission.CAMERA);
        perms.add(Manifest.permission.RECORD_AUDIO);
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            perms.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            perms.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        }

        List<String> toRequest = new ArrayList<>();
        for (String p : perms) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                toRequest.add(p);
            }
        }
        if (!toRequest.isEmpty()) {
            ActivityCompat.requestPermissions(this, toRequest.toArray(new String[0]), PERMISSION_REQ_CODE);
        }
    }

    @Override
    protected void onDestroy() {
        mMainHandler.removeCallbacksAndMessages(null);
        if (mCameraHelper != null) {
            try {
                mCameraHelper.release();
            } catch (Exception ignored) {}
            mCameraHelper = null;
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
