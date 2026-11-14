package com.loyacreativelab.scope;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.SurfaceTexture;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.Settings;
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
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "LoyaScopeNative";
    private static final int PERMISSION_REQ_CODE = 1001;
    private static final String ACTION_USB_PERMISSION = "com.loyacreativelab.scope.USB_PERMISSION";
    private static final String TARGET_URL = "https://loyacreativelab.com/scope";

    private WebView mWebView;
    private TextureView mUvcTextureView;
    private Surface mPreviewSurface;
    private ICameraHelper mCameraHelper;
    private UsbManager mUsbManager;

    // Native Camera2 fallback so WebView NEVER needs getUserMedia!
    private CameraDevice mCamera2Device;
    private CameraCaptureSession mCamera2Session;
    private int mCurrentLensFacing = CameraCharacteristics.LENS_FACING_BACK;

    private final AtomicBoolean mIsUvcStreaming = new AtomicBoolean(false);
    private final AtomicBoolean mIsCamera2Streaming = new AtomicBoolean(false);
    private final AtomicReference<String> mActiveCameraName = new AtomicReference<>("Cámara USB-C / Interna");
    private final AtomicReference<byte[]> mLatestJpegFrame = new AtomicReference<>(null);

    private final Handler mMainHandler = new Handler(Looper.getMainLooper());
    private Runnable mFrameGrabRunnable;

    private final BroadcastReceiver mUsbPermissionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (ACTION_USB_PERMISSION.equals(action)) {
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
                if (granted && device != null) {
                    Log.d(TAG, "Explicit USB permission granted for: " + device.getDeviceName());
                    closeCamera2();
                    if (mCameraHelper != null) {
                        mCameraHelper.selectDevice(device);
                    }
                } else {
                    Toast.makeText(MainActivity.this, "Permiso USB denegado por el usuario", Toast.LENGTH_SHORT).show();
                }
            } else if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                if (device != null) {
                    requestUsbPermissionExplicitly(device);
                }
            } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
                mIsUvcStreaming.set(false);
                notifyWebState();
                openNativeCamera2(mCurrentLensFacing);
            }
        }
    };

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        mUsbManager = (UsbManager) getSystemService(Context.USB_SERVICE);

        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        filter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        filter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(mUsbPermissionReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(mUsbPermissionReceiver, filter);
        }

        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.BLACK);

        // 1. Hardware TextureView in background to receive USB-C UVC or Camera2 Surface stream
        mUvcTextureView = new TextureView(this);
        FrameLayout.LayoutParams tvParams = new FrameLayout.LayoutParams(1280, 720, Gravity.CENTER);
        mUvcTextureView.setLayoutParams(tvParams);
        mUvcTextureView.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
            @Override
            public void onSurfaceTextureAvailable(@NonNull SurfaceTexture surfaceTexture, int width, int height) {
                surfaceTexture.setDefaultBufferSize(1280, 720);
                mPreviewSurface = new Surface(surfaceTexture);
                if (mCameraHelper != null && mIsUvcStreaming.get()) {
                    mCameraHelper.addSurface(mPreviewSurface, false);
                } else {
                    scanAndConnectUsbOrCamera2();
                }
            }

            @Override
            public void onSurfaceTextureSizeChanged(@NonNull SurfaceTexture surfaceTexture, int width, int height) {}

            @Override
            public boolean onSurfaceTextureDestroyed(@NonNull SurfaceTexture surfaceTexture) {
                if (mCameraHelper != null && mPreviewSurface != null) {
                    mCameraHelper.removeSurface(mPreviewSurface);
                }
                closeCamera2();
                if (mPreviewSurface != null) {
                    mPreviewSurface.release();
                    mPreviewSurface = null;
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
        mWebView.setBackgroundColor(Color.BLACK);

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        mWebView.addJavascriptInterface(new LoyaScopeJsBridge(), "LoyaScopeAndroid");

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
                notifyWebState();
            }
        });

        rootLayout.addView(mWebView);
        setContentView(rootLayout);

        initUvcCameraHelper();
        startFrameGrabLoop();
        requestNeededPermissions();

        mWebView.loadUrl(TARGET_URL);
    }

    private void requestUsbPermissionExplicitly(UsbDevice device) {
        if (mUsbManager == null || device == null) return;
        if (mUsbManager.hasPermission(device)) {
            closeCamera2();
            if (mCameraHelper != null) {
                mCameraHelper.selectDevice(device);
            }
            return;
        }
        Intent explicitIntent = new Intent(ACTION_USB_PERMISSION);
        explicitIntent.setPackage(getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        PendingIntent permissionIntent = PendingIntent.getBroadcast(this, 0, explicitIntent, flags);
        mUsbManager.requestPermission(device, permissionIntent);
    }

    private void scanAndConnectUsbOrCamera2() {
        // 1. Check UsbManager directly for any connected USB-C device
        if (mUsbManager != null) {
            HashMap<String, UsbDevice> deviceMap = mUsbManager.getDeviceList();
            if (deviceMap != null && !deviceMap.isEmpty()) {
                UsbDevice firstUsb = deviceMap.values().iterator().next();
                Toast.makeText(this, "Dispositivo USB-C detectado: conectando...", Toast.LENGTH_SHORT).show();
                requestUsbPermissionExplicitly(firstUsb);
                return;
            }
        }
        // 2. Check UVC CameraHelper list
        if (mCameraHelper != null) {
            List<UsbDevice> uvcList = mCameraHelper.getDeviceList();
            if (uvcList != null && !uvcList.isEmpty()) {
                requestUsbPermissionExplicitly(uvcList.get(0));
                return;
            }
        }
        // 3. Fallback to Native Camera2 so the viewfinder ALWAYS streams live video without WebView getUserMedia
        openNativeCamera2(mCurrentLensFacing);
    }

    @SuppressLint("MissingPermission")
    private void openNativeCamera2(int lensFacing) {
        if (mIsUvcStreaming.get()) return;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        if (mPreviewSurface == null) return;

        closeCamera2();

        try {
            CameraManager manager = (CameraManager) getSystemService(Context.CAMERA_SERVICE);
            if (manager == null) return;

            String targetCamId = null;
            String[] idList = manager.getCameraIdList();

            // Prefer EXTERNAL camera if Android HAL exposes USB-C camera via Camera2!
            for (String id : idList) {
                CameraCharacteristics chars = manager.getCameraCharacteristics(id);
                Integer facing = chars.get(CameraCharacteristics.LENS_FACING);
                if (facing != null && facing == CameraCharacteristics.LENS_FACING_EXTERNAL) {
                    targetCamId = id;
                    mActiveCameraName.set("USB-C Externa");
                    break;
                }
            }

            if (targetCamId == null) {
                for (String id : idList) {
                    CameraCharacteristics chars = manager.getCameraCharacteristics(id);
                    Integer facing = chars.get(CameraCharacteristics.LENS_FACING);
                    if (facing != null && facing == lensFacing) {
                        targetCamId = id;
                        mActiveCameraName.set(lensFacing == CameraCharacteristics.LENS_FACING_FRONT ? "Cámara Frontal" : "Cámara Trasera");
                        break;
                    }
                }
            }

            if (targetCamId == null && idList.length > 0) {
                targetCamId = idList[0];
                mActiveCameraName.set("Cámara");
            }

            if (targetCamId == null) return;

            manager.openCamera(targetCamId, new CameraDevice.StateCallback() {
                @Override
                public void onOpened(@NonNull CameraDevice camera) {
                    mCamera2Device = camera;
                    try {
                        if (mPreviewSurface == null) return;
                        final CaptureRequest.Builder builder = camera.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
                        builder.addTarget(mPreviewSurface);
                        camera.createCaptureSession(
                                Collections.singletonList(mPreviewSurface),
                                new CameraCaptureSession.StateCallback() {
                                    @Override
                                    public void onConfigured(@NonNull CameraCaptureSession session) {
                                        if (mCamera2Device == null) return;
                                        mCamera2Session = session;
                                        try {
                                            builder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
                                            session.setRepeatingRequest(builder.build(), null, mMainHandler);
                                            mIsCamera2Streaming.set(true);
                                            notifyWebState();
                                        } catch (CameraAccessException e) {
                                            Log.e(TAG, "Camera2 repeating request error", e);
                                        }
                                    }

                                    @Override
                                    public void onConfigureFailed(@NonNull CameraCaptureSession session) {}
                                },
                                mMainHandler
                        );
                    } catch (Exception e) {
                        Log.e(TAG, "Camera2 session error", e);
                    }
                }

                @Override
                public void onDisconnected(@NonNull CameraDevice camera) {
                    closeCamera2();
                }

                @Override
                public void onError(@NonNull CameraDevice camera, int error) {
                    closeCamera2();
                }
            }, mMainHandler);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open Camera2", e);
        }
    }

    private void closeCamera2() {
        mIsCamera2Streaming.set(false);
        if (mCamera2Session != null) {
            try {
                mCamera2Session.close();
            } catch (Exception ignored) {}
            mCamera2Session = null;
        }
        if (mCamera2Device != null) {
            try {
                mCamera2Device.close();
            } catch (Exception ignored) {}
            mCamera2Device = null;
        }
    }

    private void initUvcCameraHelper() {
        try {
            mCameraHelper = new CameraHelper();
            mCameraHelper.setStateCallback(new ICameraHelper.StateCallback() {
                @Override
                public void onAttach(UsbDevice device) {
                    Log.d(TAG, "UVC onAttach: " + device.getDeviceName());
                    requestUsbPermissionExplicitly(device);
                }

                @Override
                public void onDeviceOpen(UsbDevice device, boolean isFirstOpen) {
                    Log.d(TAG, "UVC onDeviceOpen: " + device.getDeviceName());
                    closeCamera2();
                    mCameraHelper.openCamera();
                }

                @Override
                public void onCameraOpen(UsbDevice device) {
                    Log.d(TAG, "UVC onCameraOpen: " + device.getDeviceName());
                    closeCamera2();
                    mCameraHelper.startPreview();
                    if (mPreviewSurface != null) {
                        mCameraHelper.addSurface(mPreviewSurface, false);
                    }
                    String label = device.getProductName() != null && !device.getProductName().isEmpty()
                            ? device.getProductName()
                            : "USB-C UVC";
                    mActiveCameraName.set(label);
                    mIsUvcStreaming.set(true);
                    notifyWebState();
                }

                @Override
                public void onCameraClose(UsbDevice device) {
                    mIsUvcStreaming.set(false);
                    notifyWebState();
                }

                @Override
                public void onDeviceClose(UsbDevice device) {
                    mIsUvcStreaming.set(false);
                    notifyWebState();
                }

                @Override
                public void onDetach(UsbDevice device) {
                    mIsUvcStreaming.set(false);
                    notifyWebState();
                    openNativeCamera2(mCurrentLensFacing);
                }

                @Override
                public void onCancel(UsbDevice device) {
                    mIsUvcStreaming.set(false);
                    notifyWebState();
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
                if ((mIsUvcStreaming.get() || mIsCamera2Streaming.get())
                        && mUvcTextureView != null && mUvcTextureView.isAvailable()) {
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
                mMainHandler.postDelayed(this, 33);
            }
        };
        mMainHandler.post(mFrameGrabRunnable);
    }

    private void notifyWebState() {
        runOnUiThread(() -> {
            if (mWebView == null) return;
            boolean connected = mIsUvcStreaming.get() || mIsCamera2Streaming.get();
            String safeName = mActiveCameraName.get().replace("'", "\\'");
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
            return mIsUvcStreaming.get() || mIsCamera2Streaming.get();
        }

        @JavascriptInterface
        public String getUsbCameraName() {
            return mActiveCameraName.get();
        }

        @JavascriptInterface
        public void rescanUsbCamera() {
            runOnUiThread(() -> scanAndConnectUsbOrCamera2());
        }

        @JavascriptInterface
        public void switchCamera() {
            runOnUiThread(() -> {
                // If USB camera is available and not currently active, switch to USB
                if (!mIsUvcStreaming.get() && mUsbManager != null && !mUsbManager.getDeviceList().isEmpty()) {
                    UsbDevice dev = mUsbManager.getDeviceList().values().iterator().next();
                    requestUsbPermissionExplicitly(dev);
                    return;
                }
                // Otherwise toggle between Back and Front Camera2
                if (mIsUvcStreaming.get() && mCameraHelper != null) {
                    mCameraHelper.closeCamera();
                    mIsUvcStreaming.set(false);
                }
                mCurrentLensFacing = (mCurrentLensFacing == CameraCharacteristics.LENS_FACING_BACK)
                        ? CameraCharacteristics.LENS_FACING_FRONT
                        : CameraCharacteristics.LENS_FACING_BACK;
                openNativeCamera2(mCurrentLensFacing);
            });
        }

        @JavascriptInterface
        public void openAppSettings() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                Uri uri = Uri.fromParts("package", getPackageName(), null);
                intent.setData(uri);
                startActivity(intent);
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
                        (isVideo ? "Video guardado" : "Foto guardada") + " en Carrete (DCIM/LoyaScope)",
                        Toast.LENGTH_SHORT
                ).show());
                return true;
            } catch (Exception e) {
                Log.e(TAG, "Error saving to gallery", e);
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
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQ_CODE) {
            scanAndConnectUsbOrCamera2();
        }
    }

    @Override
    protected void onDestroy() {
        try {
            unregisterReceiver(mUsbPermissionReceiver);
        } catch (Exception ignored) {}
        mMainHandler.removeCallbacksAndMessages(null);
        closeCamera2();
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
