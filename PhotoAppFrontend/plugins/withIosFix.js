const { withPodfile } = require('@expo/config-plugins');

module.exports = function withIosFix(config) {
  return withPodfile(config, (config) => {
    const targetCode = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`;

    const podfileContents = config.modResults.contents;

    // Eğer kod daha önce eklenmişse tekrar ekleme (çakışmayı önle)
    if (podfileContents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
      return config;
    }

    // Expo'nun mevcut 'post_install' bloğunu bul ve kodumuzu içine enjekte et
    if (podfileContents.includes('post_install do |installer|')) {
      config.modResults.contents = podfileContents.replace(
        'post_install do |installer|',
        `post_install do |installer|${targetCode}`
      );
    } else {
      // Eğer blok yoksa (nadir durum), yeni bir blok oluştur
      config.modResults.contents += `
        post_install do |installer|
          ${targetCode}
        end
      `;
    }

    return config;
  });
};