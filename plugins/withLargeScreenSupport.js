const {
  withAndroidManifest,
  withAndroidStyles,
  withGradleProperties,
} = require('@expo/config-plugins');

const withPlayStoreOptimizations = (config) => {
  // 1. Android Manifest optimizations:
  // - Large screen support & resizability (Tablets, Foldables, Chromebooks)
  // - Orientation unlocking
  // - Picture-in-Picture (PiP) support
  // - Window compatibility properties for Android 12L / 13 / 14 / 15
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Ensure supports-screens allows all screen sizes and resizing
    androidManifest['supports-screens'] = [
      {
        $: {
          'android:anyDensity': 'true',
          'android:smallScreens': 'true',
          'android:normalScreens': 'true',
          'android:largeScreens': 'true',
          'android:xlargeScreens': 'true',
          'android:resizeable': 'true',
        },
      },
    ];

    // Declare optional hardware features so app runs seamlessly on Tablets and Chromebooks
    if (!androidManifest['uses-feature']) {
      androidManifest['uses-feature'] = [];
    }
    const optionalFeatures = [
      'android.hardware.screen.portrait',
      'android.hardware.screen.landscape',
      'android.hardware.camera',
      'android.hardware.camera.autofocus',
      'android.hardware.microphone',
      'android.hardware.touchscreen',
    ];
    optionalFeatures.forEach((feat) => {
      const existing = androidManifest['uses-feature'].find(
        (f) => f.$ && f.$['android:name'] === feat
      );
      if (!existing) {
        androidManifest['uses-feature'].push({
          $: {
            'android:name': feat,
            'android:required': 'false',
          },
        });
      }
    });

    // Configure application & activities
    if (androidManifest.application && androidManifest.application[0]) {
      const app = androidManifest.application[0];
      app.$ = app.$ || {};
      app.$['android:resizeableActivity'] = 'true';
      app.$['android:allowBackup'] = 'true';

      // Large screen window compatibility properties
      if (!app.property) {
        app.property = [];
      }
      const appProperties = [
        {
          name: 'android.window.PROPERTY_COMPAT_ALLOW_IGNORING_ORIENTATION_CONSTRAINTS',
          value: 'true',
        },
        {
          name: 'android.window.PROPERTY_COMPAT_ALLOW_RESIZEABLE_ACTIVITY_OVERRIDES',
          value: 'true',
        },
        {
          name: 'android.window.PROPERTY_COMPAT_ALLOW_MIN_ASPECT_RATIO_OVERRIDE',
          value: 'true',
        },
      ];

      appProperties.forEach((prop) => {
        const found = app.property.find((p) => p.$ && p.$['android:name'] === prop.name);
        if (!found) {
          app.property.push({
            $: {
              'android:name': prop.name,
              'android:value': prop.value,
            },
          });
        }
      });

      // Activity-level optimizations: PiP, resizability, configChanges, orientation
      if (app.activity && Array.isArray(app.activity)) {
        app.activity.forEach((activity) => {
          activity.$ = activity.$ || {};
          activity.$['android:resizeableActivity'] = 'true';
          activity.$['android:supportsPictureInPicture'] = 'true';
          activity.$['android:windowSoftInputMode'] = 'adjustResize';

          // Ensure orientation is unspecified so large screen devices / tablets can freely rotate
          if (
            activity.$['android:screenOrientation'] === 'portrait' ||
            activity.$['android:screenOrientation'] === 'landscape'
          ) {
            activity.$['android:screenOrientation'] = 'unspecified';
          }

          // Ensure all responsive configuration changes are handled
          const baseConfig =
            'keyboard|keyboardHidden|orientation|screenSize|smallestScreenSize|screenLayout|uiMode';
          activity.$['android:configChanges'] = baseConfig;
        });
      }
    }

    return config;
  });

  // 2. Android Styles: Modern Edge-to-Edge compliance (Android 15+ compatible, zero deprecated APIs)
  config = withAndroidStyles(config, async (config) => {
    const styles = config.modResults.resources.style;
    if (styles && Array.isArray(styles)) {
      const appTheme = styles.find(
        (s) => s.$ && (s.$.name === 'AppTheme' || s.$.name === 'Theme.App.SplashScreen')
      );

      if (appTheme && Array.isArray(appTheme.item)) {
        // Remove deprecated translucent status/nav attributes if present
        appTheme.item = appTheme.item.filter(
          (item) =>
            item.$ &&
            item.$.name !== 'android:windowTranslucentStatus' &&
            item.$.name !== 'android:windowTranslucentNavigation'
        );

        // Define edge-to-edge items
        const edgeToEdgeItems = [
          { name: 'android:windowOptOutEdgeToEdgeEnforcement', value: 'false' },
          { name: 'android:navigationBarColor', value: '@android:color/transparent' },
          { name: 'android:statusBarColor', value: '@android:color/transparent' },
          { name: 'android:windowLightStatusBar', value: 'true' },
          { name: 'android:windowLightNavigationBar', value: 'true' },
          { name: 'android:enforceNavigationBarContrast', value: 'false' },
          { name: 'android:enforceStatusBarContrast', value: 'false' },
          { name: 'android:windowLayoutInDisplayCutoutMode', value: 'shortEdges' },
        ];

        edgeToEdgeItems.forEach((edgeItem) => {
          const idx = appTheme.item.findIndex(
            (it) => it.$ && it.$.name === edgeItem.name
          );
          if (idx >= 0) {
            appTheme.item[idx]._ = edgeItem.value;
          } else {
            appTheme.item.push({
              $: { name: edgeItem.name },
              _: edgeItem.value,
            });
          }
        });
      }
    }
    return config;
  });

  // 3. Gradle Properties: R8 Full Mode, resource optimizations, AAPT2, Dex optimizations
  config = withGradleProperties(config, (config) => {
    const properties = config.modResults;

    const setOrAddProperty = (key, value) => {
      const index = properties.findIndex(
        (item) => item.type === 'property' && item.key === key
      );
      if (index >= 0) {
        properties[index].value = value;
      } else {
        properties.push({
          type: 'property',
          key,
          value,
        });
      }
    };

    // Standard R8 Compatibility Mode & Bytecode optimizations (prevents SurfaceControl/SplashScreen NPE on Android 12+)
    setOrAddProperty('android.enableR8.fullMode', 'false');
    setOrAddProperty('android.enableDexingArtifactTransform', 'true');
    setOrAddProperty('android.enableResourceOptimizations', 'true');
    setOrAddProperty('android.enableAapt2Jni', 'true');
    setOrAddProperty('android.bundle.enableUncompressedNativeLibs', 'false');
    setOrAddProperty('android.useAndroidX', 'true');
    setOrAddProperty('android.enableJetifier', 'true');

    return config;
  });

  return config;
};

module.exports = withPlayStoreOptimizations;
