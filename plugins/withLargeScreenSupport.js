const { withAndroidManifest, withGradleProperties } = require('@expo/config-plugins');

const withPlayStoreOptimizations = (config) => {
  // 1. Android Manifest optimizations: Large screen support, resizability, orientation unlocking
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

    // Set resizeableActivity="true" on application
    if (androidManifest.application && androidManifest.application[0]) {
      const app = androidManifest.application[0];
      app.$ = app.$ || {};
      app.$['android:resizeableActivity'] = 'true';

      // Set resizeableActivity="true" and remove fixed orientation locks on activities
      if (app.activity && Array.isArray(app.activity)) {
        app.activity.forEach((activity) => {
          activity.$ = activity.$ || {};
          activity.$['android:resizeableActivity'] = 'true';
          if (
            activity.$['android:screenOrientation'] === 'portrait' ||
            activity.$['android:screenOrientation'] === 'landscape'
          ) {
            activity.$['android:screenOrientation'] = 'unspecified';
          }
        });
      }
    }

    return config;
  });

  // 2. Gradle Properties: Enable R8 Full Mode for maximum bytecode shrinking and optimization
  config = withGradleProperties(config, (config) => {
    const properties = config.modResults;
    const r8Index = properties.findIndex(
      (item) => item.type === 'property' && item.key === 'android.enableR8.fullMode'
    );

    if (r8Index >= 0) {
      properties[r8Index].value = 'true';
    } else {
      properties.push({
        type: 'property',
        key: 'android.enableR8.fullMode',
        value: 'true',
      });
    }

    return config;
  });

  return config;
};

module.exports = withPlayStoreOptimizations;
