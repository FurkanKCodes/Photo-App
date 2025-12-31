const { withXcodeProject } = require('@expo/config-plugins');

module.exports = function withAllowNonModularIncludes(config) {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    
    // Tüm build konfigürasyonlarını (Debug/Release) gez
    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings) {
        // Bu ayar, "include of non-modular header" hatasını "YES" diyerek kabul eder ve hatayı çözer
        buildSettings.CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = 'YES';
      }
    }
    return config;
  });
};